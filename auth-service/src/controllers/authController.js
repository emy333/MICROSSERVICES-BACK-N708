const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Usuarios = require('../models/Usuarios');
require('dotenv').config();

const login = async (req, res) => {
    const { email, senha } = req.body;

    try {
        const user = await Usuarios.findOne({ where: { email } });

        if (!user) {
            return res.status(404).json({ msg: 'Email não cadastrado.' });
        }
        const isPasswordValid = await bcrypt.compare(senha, user.senha);
        if (!isPasswordValid) {
            return res.status(401).json({ msg: 'Senha incorreta.' });
        }

        const token = jwt.sign(
            { userId: user.id },
            process.env.JWT_SECRET,
            { expiresIn: '1h' }
        );

        res.status(200).json({
            msg: 'Login bem-sucedido.',
            token,
            id_usuario: user.id,
            nome: user.nome_completo
        });

    } catch (error) {
        console.error('Erro no login:', error);
        res.status(500).json({ msg: 'Erro no servidor' });
    }
}

module.exports = { login };