const Saidas = require('../models/Saidas');
const { Sequelize, Op } = require('sequelize');
const axios = require('axios');

const USUARIO_SERVICE_URL = process.env.USUARIO_SERVICE_URL || 'http://localhost:3000/usuarios';
const CREDOR_SERVICE_URL = process.env.CREDOR_SERVICE_URL || 'http://localhost:3000/credores';

const getSaidas = async (req, res) => {
    try {
        const saidas = await Saidas.findAll();

        if (!saidas || saidas.length === 0) {
            return res.status(200).json({ result: [] });
        }

        const idUsuario = saidas[0].id_usuario;
        const token = req.headers.authorization;

        if (!token) {
            return res.status(401).json({ msg: "Token de autenticação não fornecido." });
        }

        const response = await axios.get(`${CREDOR_SERVICE_URL}/credoresUsu/${idUsuario}`, {
            headers: { Authorization: token }
        });

        const credores = response.data?.result || [];

        const credorMap = {};
        credores.forEach((credor) => {
            credorMap[credor.id] = credor;
        });

        const formattedSaidas = saidas.map((saida) => {
            const credor = credorMap[saida.id_credor] || {};
            return {
                id: saida.id,
                id_usuario: saida.id_usuario,
                descricao: saida.descricao,
                id_credor: saida.id_credor,
                credor_descricao: credor.descricao || "",
                pago: saida.pago,
                tipo_pagamento: saida.tipo_pagamento,
                categoria: saida.categoria,
                total_parcela: saida.total_parcela,
                parcela_atual: saida.parcela_atual,
                data_vencimento: saida.data_vencimento?.toISOString() || "",
                valor: saida.valor
            };
        });

        res.status(200).json({ result: formattedSaidas });

    } catch (error) {
        console.error('Erro ao buscar todas as saidas realizadas: ', error.message);
        res.status(500).json({ msg: "Erro ao buscar todas as saidas realizadas", error: error.message });
    }
};

// CRIANDO SAIDA
const postSaidas = async (req, res) => {
    const {
        data_vencimento, pago, descricao, tipo_pagamento, valor,
        categoria, total_parcela, parcela_atual, gasto_fixo,
        id_usuario, id_credor
    } = req.body;

    if (!descricao || !tipo_pagamento || !valor || !id_usuario) {
        return res.status(400).json({ msg: "Há campos obrigatórios que não estão preenchidos." });
    }

    try {
        const response = await axios.get(`${USUARIO_SERVICE_URL}/${id_usuario}`, {
            headers: {
                Authorization: req.headers.authorization
            }
        });

        if (!response.data) {
            return res.status(400).json({ msg: 'Usuário não cadastrado no banco de dados.' });
        }
    } catch (error) {
        console.error("Erro ao buscar usuário:", error.response?.status, error.response?.data || error.message);
        return res.status(error.response?.status || 500).json({ msg: "Erro ao buscar usuário.", error: error.response?.data || error.message });
    }

    if (id_credor) {
        try {
            const credorResponse = await axios.get(`${CREDOR_SERVICE_URL}/detalhes/${id_credor}`, {
                headers: { Authorization: req.headers.authorization }
            });

            const credorArray = credorResponse.data.result;

            if (!credorArray || !credorArray.length) {
                return res.status(400).json({ msg: 'Credor não encontrado.' });
            }

            const credor = credorArray[0];

            if (credor.id_usuario !== Number(id_usuario)) {
                return res.status(400).json({ msg: 'Credor não pertence ao usuário.' });
            }
        } catch (error) {
            if (error.response?.status === 404) {
                return res.status(400).json({ msg: 'Credor não cadastrado no banco de dados.' });
            }
            console.error("Erro ao verificar credor:", error.message);
            return res.status(error.response?.status || 500).json({ msg: "Erro ao verificar credor.", error: error.message });
        }
    }

    const saidaData = {
        pago,
        descricao,
        tipo_pagamento,
        valor,
        categoria,
        total_parcela,
        parcela_atual,
        gasto_fixo,
        id_usuario,
        id_credor,
    };

    if (data_vencimento) {
        const formattedDate = new Date(data_vencimento.split('/').reverse().join('-'));
        if (isNaN(formattedDate)) {
            return res.status(400).json({ msg: "Data de vencimento inválida." });
        }
        saidaData.data_vencimento = formattedDate;
    }

    try {
        let parcelas = [];

        if (gasto_fixo) {
            let vencimento = new Date(saidaData.data_vencimento);
            let ano = vencimento.getFullYear();
            let mes = vencimento.getMonth();

            while (mes < 12) {
                const parcelaData = { ...saidaData };
                parcelaData.data_vencimento = new Date(ano, mes, vencimento.getDate());
                if (mes !== vencimento.getMonth()) {
                    parcelaData.pago = false;
                }
                parcelas.push(parcelaData);
                mes++;
            }
        } else if (!total_parcela || total_parcela === 0) {
            const parcelaData = { ...saidaData };
            parcelaData.parcela_atual = null;
            parcelas.push(parcelaData);
        } else {
            let parcelaInicio = parcela_atual || 1;
            let totalFaltante = total_parcela - (parcelaInicio - 1);

            for (let i = 0; i < totalFaltante; i++) {
                const parcelaData = { ...saidaData };
                parcelaData.valor = valor / total_parcela;
                let vencimento = new Date(saidaData.data_vencimento);
                vencimento.setMonth(vencimento.getMonth() + i);
                parcelaData.data_vencimento = vencimento;
                parcelaData.parcela_atual = parcelaInicio + i;
                parcelas.push(parcelaData);
            }
        }

        const newSaidas = await Saidas.bulkCreate(parcelas);
        res.status(201).json({ msg: "Saídas registradas com sucesso.", saidas: newSaidas });
    } catch (error) {
        console.log("Ocorreu um erro ao registrar as saídas.", error);
        res.status(500).json({ msg: "Ocorreu um erro ao registrar as saídas.", error });
    }
};

// EDITANDO SAIDAS
const putSaidas = async (req, res) => {
    const { id } = req.params;
    const {
        data_vencimento, pago, descricao, tipo_pagamento, valor,
        categoria, total_parcela, parcela_atual, gasto_fixo,
        id_usuario, id_credor
    } = req.body;

    try {
        const saidas = await Saidas.findOne({ where: { id } });
        if (!saidas) {
            return res.status(404).json({ msg: "Saída não encontrada." });
        }

        try {
            const response = await axios.get(`${USUARIO_SERVICE_URL}/${id_usuario}`, {
                headers: {
                    Authorization: req.headers.authorization
                }
            });

            if (!response.data) {
                return res.status(400).json({ msg: 'Usuário não cadastrado no banco de dados.' });
            }
        } catch (error) {
            console.error("Erro ao buscar usuário:", error.response?.status, error.response?.data || error.message);
            return res.status(error.response?.status || 500).json({ msg: "Erro ao buscar usuário.", error: error.response?.data || error.message });
        }

        if (id_credor) {
            try {
                const credorResponse = await axios.get(`${CREDOR_SERVICE_URL}/detalhes/${id_credor}`, {
                    headers: { Authorization: req.headers.authorization }
                });

                const credorArray = credorResponse.data.result;

                if (!credorArray || !credorArray.length) {
                    return res.status(400).json({ msg: 'Credor não encontrado.' });
                }

                const credor = credorArray[0];

                if (credor.id_usuario !== Number(id_usuario)) {
                    return res.status(400).json({ msg: 'Credor não pertence ao usuário.' });
                }
            } catch (error) {
                if (error.response?.status === 404) {
                    return res.status(400).json({ msg: 'Credor não cadastrado no banco de dados.' });
                }
                console.error("Erro ao verificar credor:", error.message);
                return res.status(error.response?.status || 500).json({ msg: "Erro ao verificar credor.", error: error.message });
            }
        }

        const updates = {};
        if (data_vencimento) {
            updates.data_vencimento = new Date(data_vencimento.split('/').reverse().join('-'));
        }
        if (pago !== undefined) updates.pago = pago;
        if (descricao) updates.descricao = descricao;
        if (tipo_pagamento) updates.tipo_pagamento = tipo_pagamento;
        if (valor !== undefined) updates.valor = valor;
        if (categoria) updates.categoria = categoria;
        if (total_parcela !== undefined) updates.total_parcela = total_parcela;
        if (parcela_atual !== undefined) updates.parcela_atual = parcela_atual;
        if (gasto_fixo !== undefined) updates.gasto_fixo = gasto_fixo;
        if (id_usuario !== null) updates.id_usuario = id_usuario;
        if (id_credor !== undefined) updates.id_credor = id_credor;

        await saidas.update(updates);

        res.status(200).json({ msg: "Saída atualizada com sucesso.", saidas });
    } catch (error) {
        console.error("Erro ao atualizar a saída:", error);
        res.status(500).json({ msg: "Erro ao atualizar a saída.", error });
    }
};

// SAIDAS POR USUARIO
const getSaidasPorUsu = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ msg: "ID do usuário não fornecido." });
    }

    try {
        const saidas = await Saidas.findAll({
            where: { id_usuario: id },
        });

        const formattedSaidas = await Promise.all(saidas.map(async (saida) => {
            let credor_descricao = "";

            try {
                const response = await axios.get(`${CREDOR_SERVICE_URL}/${saida.id_credor}`);
                credor_descricao = response.data.descricao || "";
            } catch (error) {
                console.error(`Erro ao buscar credor ${saida.id_credor}:`, error.message);
            }

            return {
                id: saida.id,
                id_usuario: saida.id_usuario,
                descricao: saida.descricao,
                id_credor: saida.id_credor,
                credor_descricao,
                pago: saida.pago,
                tipo_pagamento: saida.tipo_pagamento,
                categoria: saida.categoria,
                total_parcela: saida.total_parcela,
                parcela_atual: saida.parcela_atual,
                data_vencimento: saida.data_vencimento.toISOString(),
                valor: saida.valor,
                gasto_fixo: saida.gasto_fixo
            };
        }));

        return res.json(formattedSaidas);

    } catch (error) {
        console.error('Erro ao buscar saídas:', error);
        return res.status(500).json({ msg: "Erro interno do servidor." });
    }
};


//SAIDAS POR CREDORES
const getSaidasPorCredores = async (req, res) => {
    const { periodo, id_usuario } = req.params;

    if (!periodo || !id_usuario) {
        return res.status(400).json({ msg: "Período ou ID do usuário não fornecidos." });
    }

    try {
        const [mes, ano] = periodo.split('-');
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        const resultado = await Saidas.findAll({
            attributes: [
                'id_credor',
                [Sequelize.fn('SUM', Sequelize.col('valor')), 'total_valor']
            ],
            where: {
                id_usuario,
                data_vencimento: {
                    [Op.gte]: inicioMes,
                    [Op.lte]: fimMes,
                },
            },
            group: ['id_credor'],
        });

        const resultadoComDescricoes = await Promise.all(resultado.map(async (item) => {
            let nome_credor = "";

            try {
                const response = await axios.get(`${CREDOR_SERVICE_URL}/detalhes/${item.id_credor}`);
                nome_credor = response.data.descricao || "";
            } catch (error) {
                console.error(`Erro ao buscar credor ${item.id_credor}:`, error.message);
            }

            return {
                id_credor: item.id_credor,
                nome_credor,
                total_valor: item.get('total_valor'),
            };
        }));

        res.status(200).json({ result: resultadoComDescricoes });

    } catch (error) {
        console.error('Erro ao buscar saídas por credor: ', error);
        res.status(500).json({ msg: "Erro ao buscar saídas por credor.", error });
    }
};

// SAIDAS POR USUARIO E MES
const getSaidasPorMes = async (req, res) => {
    const { periodo, id } = req.params;

    if (!periodo || !id) {
        return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
    }

    try {
        const [ano, mes] = periodo.split('-');
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        // Busca as saidas sem incluir Credores (modelo removido)
        const saidas = await Saidas.findAll({
            where: {
                id_usuario: id,
                data_vencimento: {
                    [Op.gte]: inicioMes,
                    [Op.lte]: fimMes,
                },
            },
        });

        // Para cada saída, busca a descrição do credor via microserviço
        const formattedSaidas = await Promise.all(saidas.map(async (saida) => {
            let credor_descricao = "";

            try {
                const response = await axios.get(`${CREDOR_SERVICE_URL}/${saida.id_credor}`);
                credor_descricao = response.data.descricao || "";
            } catch (error) {
                console.error(`Erro ao buscar credor ${saida.id_credor}:`, error.message);
            }

            return {
                id: saida.id,
                id_usuario: saida.id_usuario,
                descricao: saida.descricao,
                id_credor: saida.id_credor,
                credor_descricao,
                pago: saida.pago,
                tipo_pagamento: saida.tipo_pagamento,
                categoria: saida.categoria,
                total_parcela: saida.total_parcela,
                parcela_atual: saida.parcela_atual,
                data_vencimento: saida.data_vencimento.toISOString(),
                valor: saida.valor,
            };
        }));

        res.status(200).json({ result: formattedSaidas });

    } catch (error) {
        console.error('Erro ao buscar todas as saídas realizadas: ', error);
        res.status(500).json({ msg: "Erro ao buscar todas as saídas realizadas.", error });
    }
};


// SAIDAS POR CATEGORIA
const getSaidasCategoria = async (req, res) => {
    const { periodo, id } = req.params;

    if (!periodo || !id) {
        return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
    }

    try {
        const [ano, mes] = periodo.split('-');  // Ajustei para ano-mes para ficar padrão
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        // Busca as saídas direto, sem incluir credores
        const saidas = await Saidas.findAll({
            where: {
                id_usuario: id,
                data_vencimento: {
                    [Op.gte]: inicioMes,
                    [Op.lte]: fimMes,
                },
            },
        });

        const totaisPorCategoria = saidas.reduce((acc, saida) => {
            const categoria = saida.categoria || "Outros";
            const valor = parseFloat(saida.valor) || 0;

            if (!acc[categoria]) {
                acc[categoria] = 0;
            }

            acc[categoria] += valor;

            return acc;
        }, {});

        const resultadoFinal = Object.entries(totaisPorCategoria)
            .map(([categoria, total]) => ({
                categoria,
                total: parseFloat(total.toFixed(2)),
            }))
            .sort((a, b) => b.total - a.total);

        res.status(200).json({ result: resultadoFinal });

    } catch (error) {
        console.error('Erro ao buscar todas as saídas realizadas: ', error);
        res.status(500).json({ msg: "Erro ao buscar todas as saídas realizadas.", error });
    }
};


const getTotSaidaAno = async (req, res) => {
    const { ano, id } = req.params;

    if (!ano || !id) {
        return res.status(400).json({ msg: "Ano ou ID do usuário não fornecido." });
    }

    try {
        const inicioAno = new Date(Date.UTC(ano, 0, 1));
        const fimAno = new Date(Date.UTC(ano, 11, 31, 23, 59, 59, 999));

        const saidas = await Saidas.findAll({
            where: {
                id_usuario: id,
                data_vencimento: {
                    [Op.gte]: inicioAno,
                    [Op.lte]: fimAno,
                },
            },
            attributes: ["valor", "data_vencimento"],
        });

        const totaisPorMes = Array(12).fill(0);

        saidas.forEach((saida) => {
            const mes = new Date(saida.data_vencimento).getUTCMonth();
            totaisPorMes[mes] += parseFloat(saida.valor) || 0;
        });

        const resultadoFinal = totaisPorMes.map((total, index) => ({
            mes: index + 1,
            total: total.toFixed(2),
        }));

        res.status(200).json({ result: resultadoFinal });

    } catch (error) {
        console.error("Erro ao buscar as saídas por mês: ", error);
        res.status(500).json({ msg: "Erro ao buscar as saídas por mês.", error });
    }
};

// SAIDAS FIXAS POR USUARIO E MES
const getSaidasFixasPorMes = async (req, res) => {
    const { periodo, id } = req.params;

    if (!periodo || !id) {
        return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
    }

    const [ano, mes] = periodo.split("-");
    if (!ano || !mes || mes < 1 || mes > 12) {
        return res.status(400).json({ msg: "Período inválido. Use o formato YYYY-MM (ex.: 2025-03)." });
    }

    try {
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        const saidas = await Saidas.findAll({
            where: {
                id_usuario: id,
                data_vencimento: { [Op.between]: [inicioMes, fimMes] },
                [Op.or]: [
                    { gasto_fixo: true },
                    { total_parcela: { [Op.gt]: 1 } }
                ]
            }
        });

        const idsCredores = [
            ...new Set(saidas.map(s => s.id_credor).filter(Boolean))
        ];

        const credorMap = {};
        await Promise.all(
            idsCredores.map(async (credorId) => {
                try {
                    const { data } = await axios.get(`${CREDOR_SERVICE_URL}/detalhes/${credorId}`, {
                        headers: { Authorization: req.headers.authorization || "" }
                    });
                    credorMap[credorId] = data.descricao || "";
                } catch (err) {
                    console.error(`Credor ${credorId}:`, err.response?.status || err.message);
                    credorMap[credorId] = "";
                }
            })
        );

        const formatted = saidas.map((s) => ({
            id: s.id,
            id_usuario: s.id_usuario,
            descricao: s.descricao,
            id_credor: s.id_credor,
            credor_descricao: credorMap[s.id_credor] || "",
            pago: s.pago,
            tipo_pagamento: s.tipo_pagamento,
            categoria: s.categoria,
            total_parcela: s.total_parcela,
            parcela_atual: s.parcela_atual,
            data_vencimento: s.data_vencimento?.toISOString() || null,
            valor: s.valor,
            gasto_fixo: !!s.gasto_fixo
        }));

        return res.status(200).json({ result: formatted });

    } catch (error) {
        console.error("Erro ao buscar saídas fixas:", error);
        return res.status(500).json({ msg: "Erro interno ao buscar saídas fixas.", error: error.message });
    }
};

// SAIDAS VARIAVEIS POR USUARIO E MES
const getSaidasVariaveisPorMes = async (req, res) => {
    const { periodo, id } = req.params;

    if (!periodo || !id) {
        return res.status(400).json({ msg: "Período ou ID do usuário não fornecido." });
    }

    try {
        const [mes, ano] = periodo.split("-");
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        const saidas = await Saidas.findAll({
            where: {
                id_usuario: id,
                data_vencimento: {
                    [Op.gte]: inicioMes,
                    [Op.lte]: fimMes,
                },
                gasto_fixo: false,
                total_parcela: {
                    [Op.or]: [
                        { [Op.eq]: null },
                        { [Op.eq]: 0 },
                        { [Op.eq]: 1 },
                    ],
                },
            },
        });

        const idsCredores = [
            ...new Set(saidas.map(s => s.id_credor).filter(Boolean))
        ];

        const credorMap = {};
        await Promise.all(
            idsCredores.map(async (credorId) => {
                try {
                    const { data } = await axios.get(`${CREDOR_SERVICE_URL}/detalhes/${credorId}`, {
                        headers: { Authorization: req.headers.authorization || "" }
                    });
                    credorMap[credorId] = data.descricao || "";
                } catch (err) {
                    console.error(`Credor ${credorId}:`, err.response?.status || err.message);
                    credorMap[credorId] = "";
                }
            })
        );

        const formattedSaidas = saidas.map((s) => ({
            id: s.id,
            id_usuario: s.id_usuario,
            descricao: s.descricao,
            id_credor: s.id_credor,
            credor_descricao: credorMap[s.id_credor] || "",
            pago: s.pago,
            tipo_pagamento: s.tipo_pagamento,
            categoria: s.categoria,
            total_parcela: s.total_parcela,
            parcela_atual: s.parcela_atual,
            data_vencimento: s.data_vencimento?.toISOString() || null,
            valor: s.valor,
            gasto_fixo: !!s.gasto_fixo
        }));

        return res.status(200).json({ result: formattedSaidas });

    } catch (error) {
        console.error("Erro ao buscar saídas variáveis:", error);
        return res.status(500).json({ msg: "Erro ao buscar saídas variáveis.", error: error.message });
    }
};


// DELETE SAIDAS
const deleteSaidas = async (req, res) => {
    const { id } = req.params;

    try {
        const saidas = await Saidas.findByPk(id);
        if (!saidas) {
            return res.status(404).json({ msg: "Saída não existe no banco de dados." })
        }

        await saidas.destroy();
        res.status(200).json({ msg: "Saída foi removida com sucesso." })
    } catch (error) {
        console.error('Erro ao excluir o registro:', error);
        res.status(500).json({ msg: "Erro ao excluir o registro:", error });
    }
};

// EDITANDO SAIDAS PAG/NÃO PAGO
const putSaidaStatus = async (req, res) => {
    const { id } = req.params;
    const { pago } = req.body;

    try {
        const saidas = await Saidas.findOne({ where: { id } });
        if (!saidas) {
            return res.status(404).json({ msg: "Saída não encontrada." });
        }

        const updates = {
            pago,
        };

        await saidas.update(updates);

        res.status(200).json({ msg: "Saída atualizada com sucesso." });
    } catch (error) {
        console.log("Erro ao atualizar a saída:", error);
        res.status(500).json({ msg: "Erro ao atualizar a saída.", error });
    }
};

const getDetalhesSaidas = async (req, res) => {
    const { id_saida } = req.params;

    if (!id_saida) {
        return res.status(400).json({ msg: "ID não fornecido." });
    }

    try {
        const saida = await Saidas.findOne({
            where: { id: id_saida },
        });

        if (!saida) {
            return res.status(404).json({ msg: "Saída não encontrada." });
        }

        let credor_descricao = "";

        if (saida.id_credor) {
            try {
                const response = await axios.get(`${CREDOR_SERVICE_URL}/detalhes/${saida.id_credor}`);
                credor_descricao = response.data?.descricao || "";
            } catch (error) {
                console.error(`Erro ao buscar descrição do credor ${saida.id_credor}:`, error.message);
            }
        }

        const formattedSaida = {
            id: saida.id,
            id_usuario: saida.id_usuario,
            descricao: saida.descricao,
            id_credor: saida.id_credor,
            credor_descricao,
            pago: saida.pago,
            tipo_pagamento: saida.tipo_pagamento,
            categoria: saida.categoria,
            total_parcela: saida.total_parcela,
            parcela_atual: saida.parcela_atual,
            data_vencimento: saida.data_vencimento ? saida.data_vencimento.toISOString() : null,
            valor: saida.valor,
            gasto_fixo: !!saida.gasto_fixo
        };

        res.status(200).json({ result: formattedSaida });

    } catch (error) {
        console.error('Erro ao buscar detalhes da saída: ', error);
        res.status(500).json({ msg: "Erro ao buscar detalhes da saída.", error: error.message });
    }
};



module.exports = {
    getSaidas,
    getSaidasFixasPorMes,
    getSaidasVariaveisPorMes,
    getSaidasPorCredores,
    getSaidasPorUsu,
    getSaidasPorMes,
    postSaidas,
    putSaidas,
    deleteSaidas,
    putSaidaStatus,
    getDetalhesSaidas,
    getSaidasCategoria,
    getTotSaidaAno
};
