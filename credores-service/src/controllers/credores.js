const axios = require('axios');
const Credores = require('../models/Credores');


const USUARIO_SERVICE_URL = process.env.USUARIO_SERVICE_URL || 'http://localhost:3001/usuarios';
const SAIDAS_SERVICE_URL = process.env.SAIDAS_SERVICE_URL || 'http://localhost:3000/saidas';

// TODOS CREDORES POR USUÁRIO
const getCredoresPorUsu = async (req, res) => {
    const { id } = req.params;

    if (!id) {
        return res.status(400).json({ msg: "ID do usuário não fornecido." });
    }

    try {
        const credores = await Credores.findAll({
            where: { id_usuario: id }
        });

        const formattedCredores = credores.map((credor) => ({
            id_credor: credor.id_credor,
            descricao: credor.descricao,
            id_usuario: credor.id_usuario
        }));

        res.status(200).json({ result: formattedCredores });
    } catch (error) {
        console.error('Erro ao buscar todos os credores: ', error);
        res.status(500).json({ msg: "Erro ao buscar todos os credores", error });
    }
};

// TOTAL DE SAÍDAS POR USUÁRIO
const getTotalDespesasCredor = async (req, res) => {
    const { id_usuario } = req.params;

    if (!id_usuario) {
        return res.status(400).json({ msg: "ID do usuário não fornecido." });
    }

    try {
        const response = await axios.get(`${SAIDAS_SERVICE_URL}/total-por-usuario/${id_usuario}`);
        const totalSaidasCredor = response.data.total;
        res.status(200).json({ result: totalSaidasCredor });
    } catch (error) {
        console.error("Erro ao consultar total de despesas por credor.", error);
        res.status(500).json({ msg: "Erro ao consultar total de despesas por credor.", error });
    }
};

// CRIANDO CREDOR
const postCredores = async (req, res) => {
    const { descricao, id_usuario } = req.body;

    if (!descricao || !id_usuario) {
        return res.status(400).json({ msg: "Há campos obrigatórios que não estão preenchidos." });
    }

    try {
        const response = await axios.get(`${USUARIO_SERVICE_URL}/${id_usuario}`, {
            headers: {
                Authorization: req.headers.authorization
            }
        });

        const usuario = response.data;

        if (!usuario) {
            return res.status(400).json({ msg: 'Usuário não cadastrado no banco de dados.' });
        }

        const newCredor = await Credores.create({ descricao, id_usuario });
        res.status(201).json({ msg: "Credor registrado com sucesso.", credor: newCredor });

    } catch (error) {
        if (error.response?.status === 404) {
            return res.status(400).json({ msg: 'Usuário não cadastrado no banco de dados.' });
        }

        console.error("Erro ao registrar o credor:", error.message);
        res.status(error.response?.status || 500).json({
            msg: "Ocorreu um erro ao registrar o credor.",
            error: error.message
        });
    }

};



// EDITANDO CREDOR
const putCredores = async (req, res) => {
    const id = req.params.id;
    const { descricao, id_usuario } = req.body;

    if (!id_usuario) {
        return res.status(400).json({ msg: "O campo 'id_usuario' é obrigatório para verificar permissões." });
    }

    try {
        const credor = await Credores.findOne({ where: { id_credor: id } });

        if (!credor) {
            return res.status(404).json({ msg: "Credor não encontrado." });
        }

        // Verifica se o usuário existe no serviço de usuários
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
            if (error.response?.status === 404) {
                return res.status(400).json({ msg: 'Usuário não cadastrado no banco de dados.' });
            }

            console.error("Erro ao verificar usuário:", error.message);
            return res.status(error.response?.status || 500).json({
                msg: "Erro ao verificar usuário.",
                error: error.message
            });
        }

        const updates = {};
        if (descricao) updates.descricao = descricao;
        if (id_usuario) updates.id_usuario = id_usuario;

        await credor.update(updates);
        res.status(200).json({ msg: "Credor foi editado com sucesso." });
    } catch (error) {
        console.error('Erro ao editar o credor:', error.message);
        res.status(500).json({
            msg: "Erro ao editar o credor.",
            error: error.message
        });
    }
};


// DELETAR CREDOR
const deleteCredores = async (req, res) => {
    const id = req.params.id;

    try {
        const credor = await Credores.findByPk(id);
        if (!credor) {
            return res.status(404).json({ msg: "Credor não existe no banco de dados." });
        }

        const response = await axios.get(`${SAIDAS_SERVICE_URL}/por-credor/${id}`);
        const saidasAssociadas = response.data && response.data.length > 0;

        if (saidasAssociadas) {
            return res.status(400).json({ msg: "Não é possível excluir este credor, pois existem saídas registradas com ele." });
        }

        await credor.destroy();
        res.status(200).json({ msg: "Credor foi removido com sucesso." });
    } catch (error) {
        console.error("Erro ao excluir o registro:", error);
        res.status(500).json({
            msg: "Erro ao excluir o registro.",
            error: error.message || "Erro desconhecido",
            stack: error.stack || null
        });
    }
};

// DETALHES DE UM CREDOR
const getDetalhesCredor = async (req, res) => {
    const { id_credor } = req.params;

    if (!id_credor) {
        return res.status(400).json({ msg: "ID do credor não fornecido." });
    }

    try {
        const credores = await Credores.findAll({
            where: { id_credor }
        });

        const formattedCredores = credores.map((credor) => ({
            id_credor: credor.id_credor,
            id_usuario: credor.id_usuario,
            descricao: credor.descricao,
        }));

        res.status(200).json({ result: formattedCredores });
    } catch (error) {
        console.error('Erro ao buscar credores: ', error);
        res.status(500).json({ msg: "Erro ao buscar credores", error });
    }
};

module.exports = {
    getCredoresPorUsu,
    getTotalDespesasCredor,
    postCredores,
    putCredores,
    deleteCredores,
    getDetalhesCredor
};
