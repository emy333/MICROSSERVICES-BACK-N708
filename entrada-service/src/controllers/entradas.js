const e = require('express');

const axios = require('axios');
const Entradas = require('../models/Entradas');
const { Op } = require('sequelize');

const USUARIO_SERVICE_URL = process.env.USUARIO_SERVICE_URL || 'http://localhost:3000/usuarios';

// TODAS ENTRADAS 
const getEntradas = async (req, res) => {
    try {
        const entradas = await Entradas.findAll();

        const formattedEntradas = entradas.map((entrada) => ({
            id: entrada.id,
            data_referente: entrada.data_referente.toISOString(), 
            descricao: entrada.descricao,
            id_usuario: entrada.id_usuario,
            valor: entrada.valor
        }));

        res.status(200).json({ result: formattedEntradas });
    } catch (error) {
        console.error('Erro ao buscar todas as entradas realizadas: ', error);
        res.status(500).json({ msg: "Erro ao buscar todas as entradas realizadas: ", error });
    }
}

// ENTRADAS POR USUARIO
const getEntradasUsuarios = async (req, res) => {
    const { id } = req.params;

    try {
        const entradas = await Entradas.findAll({
            where: { id_usuario: id }
        });

        const formattedEntradas = entradas.map((entrada) => ({
            id: entrada.id,
            data_referente: entrada.data_referente.toISOString(), 
            descricao: entrada.descricao,
            id_usuario: entrada.id_usuario,
            valor: entrada.valor
        }));

        res.status(200).json({ result: formattedEntradas });
    } catch (error) {
        console.error('Erro ao buscar todas as entradas realizadas: ', error);
        res.status(500).json({ msg: "Erro ao buscar todas as entradas realizadas: ", error });
    }
}

// ENTRADAS POR USUARIO E MES
const getEntradasPorMes = async (req, res) => {
    const { periodo, id } = req.params;

    try {
        const [mes, ano] = periodo.split('-');
        const inicioMes = new Date(Date.UTC(ano, mes - 1, 1));
        const fimMes = new Date(Date.UTC(ano, mes, 0, 23, 59, 59, 999));

        const entradas = await Entradas.findAll({ 
            where: {
                id_usuario: id,
                data_referente: {
                    [Op.gte]: inicioMes, 
                    [Op.lte]: fimMes,   
                }
            }
        });

        const formattedEntradas = entradas.map((entrada) => ({
            id: entrada.id,
            data_referente: entrada.data_referente.toISOString(),
            descricao: entrada.descricao,
            id_usuario: entrada.id_usuario,
            valor: entrada.valor
        }));

        res.status(200).json({ result: formattedEntradas });
    } catch (error) {
        console.error('Erro ao buscar todas as entradas realizadas: ', error);
        res.status(500).json({ msg: "Erro ao buscar todas as entradas realizadas: ", error });
    }
};

// CRIANDO ENTRADA
const postEntradas = async (req, res) => {
    const { data_referente, descricao, valor, id_usuario } = req.body;

    if (!data_referente || !descricao || !valor || !id_usuario) {
        return res.status(400).json({ msg: "Há campos obrigatórios que não estão preenchidos." });
    }

    // Validação do usuário via microsserviço
    try {
        const response = await axios.get(`${USUARIO_SERVICE_URL}/${id_usuario}`);
        if (!response.data) {
            return res.status(400).json({ message: 'Usuário não cadastrado no banco de dados.' });
        }
    } catch (error) {
        if (error.response && error.response.status === 404) {
            return res.status(400).json({ message: 'Usuário não cadastrado no banco de dados.' });
        }
        console.error("Erro ao validar usuário no microsserviço:", error);
        return res.status(500).json({ message: 'Erro ao validar usuário.', error });
    }

    const formattedDate = new Date(data_referente.split('/').reverse().join('-'));

    try {
        const newEntrada = await Entradas.create({ data_referente: formattedDate, descricao, valor, id_usuario });
        res.status(201).json({ msg: "Entrada registrada com sucesso.", entrada: newEntrada });
    } catch (error) {
        console.log("Ocorreu um erro ao registrar a entrada.", error);
        res.status(500).json({ msg: "Ocorreu um erro ao registrar a entrada.", error });
    }
};

// EDITANDO ENTRADAS
const putEntradas = async (req, res) => {
    const { id } = req.params; 
    const { id_usuario, data_referente, descricao, valor } = req.body;

    try {
        const entrada = await Entradas.findOne({ where: { id } });

        if (!entrada) {
            return res.status(404).json({ msg: "Entrada não encontrada." });
        }

        if (!id_usuario) {
            return res.status(400).json({ msg: "O campo 'id_usuario' é obrigatório para verificar permissões." });
        }

        const idUsuarioReq = parseInt(id_usuario, 10); 

        if (entrada.id_usuario !== idUsuarioReq) {
            return res.status(403).json({ msg: "Você não tem permissão para editar esta entrada." });
        }

        const updates = {};

        if (data_referente) {
            updates.data_referente = new Date(data_referente.split('/').reverse().join('-'));
        }
        if (descricao) {
            updates.descricao = descricao;
        }
        if (valor) {
            updates.valor = valor;
        }

        await entrada.update(updates);

        res.status(200).json({ msg: "Entrada atualizada com sucesso.", entrada });
    } catch (error) {
        console.log("Erro ao atualizar a entrada:", error);
        res.status(500).json({ msg: "Erro ao atualizar a entrada.", error });
    }
};

// DELETE ENTRADAS
const deleteEntradas = async (req, res) => {
    const id = req.params.id;

    try {
        const entrada = await Entradas.findByPk(id);
        if (!entrada) {
            return res.status(404).json({ msg: "Entrada não existe no banco de dados." })
        }

        await entrada.destroy();
        res.status(200).json({ msg: "Entrada foi removida com sucesso." })
    } catch (error) {
        console.error('Erro ao excluir o registro:', error);
        res.status(500).json({ msg: "Erro ao excluir o registro:", error });
    }
};

const getDetalhesEntradas = async (req, res) => {
    const { id_entrada } = req.params;

    if (!id_entrada) {
        return res.status(400).json({ msg: "ID não fornecido." });
    }

    try {
        const entradas = await Entradas.findAll({
            where: {
                id: id_entrada,
            }
        });

        const formattedEntradas = entradas.map((entrada) => ({
            id: entrada.id,
            id_usuario: entrada.id_usuario,
            descricao: entrada.descricao,
            data_referente: entrada.data_referente ? entrada.data_referente.toISOString() : null,
            valor: entrada.valor,
        }));
        res.status(200).json({ result: formattedEntradas });

    } catch (error) {
        console.error('Erro ao buscar entradas realizadas: ', error);
        res.status(500).json({ msg: "Erro ao buscar as entradas realizadas: ", error });
    }
};

module.exports = {
    getEntradas, 
    getEntradasUsuarios, 
    getEntradasPorMes, 
    postEntradas, 
    putEntradas, 
    deleteEntradas, 
    getDetalhesEntradas
}
