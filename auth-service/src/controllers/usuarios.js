const Usuarios = require('../models/Usuarios');
const bcrypt = require('bcryptjs');

// CONSULTANDO TODOS OS USUÁRIOS
const getUsers = async (req, res) => {
    try {
        const usuarios = await Usuarios.findAll();
        res.status(200).json({ result: usuarios });
    } catch (error) {
        console.error('Erro ao buscar os usuários:', error);
        res.status(500).json({ msg: "Erro ao buscar os usuários", error });
    }
};

// CONSULTAR USUÁRIO POR ID
const getUserById = async (req, res) => {
    const { id } = req.params;

    try {
        const usuario = await Usuarios.findByPk(id);

        if (!usuario) {
            return res.status(404).json({ msg: "Usuário não encontrado." });
        }

        res.status(200).json(usuario);
    } catch (error) {
        console.error('Erro ao buscar o usuário por ID:', error);
        res.status(500).json({ msg: "Erro ao buscar o usuário por ID", error });
    }
};


// CRIANDO USUÁRIO
const postUsers = async (req, res) => {
    try {
        const { nome_completo, email, senha } = req.body;

        const usuarioExistente = await Usuarios.findOne({ where: { email } });
        if (usuarioExistente) {
            return res.status(400).json({ message: 'Email já pertence a outro usuário.' });
        }

        const senhaCriptografada = await bcrypt.hash(senha, 10);

        const novoUsuario = await Usuarios.create({ nome_completo, email, senha: senhaCriptografada });

        res.status(201).json(novoUsuario);
    } catch (error) {
        console.error('Erro ao cadastrar o usuário:', error);
        res.status(500).json({ message: 'Erro interno do servidor.', error });
    }
};


// EDITANDO USUÁRIO
const putUsers = async (req, res) => {
    const id = req.params.id;
    const { nome_completo, email, senha } = req.body;

    if (!nome_completo && !email && !senha) {
        return res.status(400).json({ msg: "Informe ao menos um campo para atualizar." });
    }

    try {
        const user = await Usuarios.findByPk(id);

        if (!user) {
            return res.status(404).json({ msg: "O usuário não existe no banco de dados." });
        }

        const dadosAtualizados = {};

        if (nome_completo) dadosAtualizados.nome_completo = nome_completo;
        if (email) dadosAtualizados.email = email;
        if (senha) dadosAtualizados.senha = await bcrypt.hash(senha, 10);

        await user.update(dadosAtualizados);

        res.status(200).json({ msg: "Usuário foi editado com sucesso." });
    } catch (error) {
        console.error('Erro ao editar o usuário:', error);
        res.status(500).json({ msg: "Erro ao editar o usuário", error });
    }
};

// DELETE USUÁRIO
const deleteUser = async (req, res) => {
    const id = req.params.id;

    try {
        const user = await Usuarios.findByPk(id);
        if (!user) {
            return res.status(404).json({ msg: "O usuário não existe no banco de dados." })
        }

        await user.destroy();
        res.status(200).json({ msg: "Usuário deletado com sucesso." })
    } catch (error) {
        console.error('Erro ao deletar o usuário:', error);
        res.status(500).json({ msg: "Erro ao deletar o usuário", error });
    }
};

module.exports = { getUsers, postUsers, putUsers, deleteUser, getUserById };