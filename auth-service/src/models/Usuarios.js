const Sequelize = require('sequelize');
const db = require('../config/db'); 

const Usuarios = db.define('usuarios', {
    id: {
        type: Sequelize.INTEGER, 
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    }, 
    nome_completo: {
        type: Sequelize.STRING,
        allowNull: false
    },
    email: {
        type: Sequelize.STRING,
        allowNull: false,
        unique: true 
    },
    senha: {
        type: Sequelize.STRING,
        allowNull: false
    }
}, {
    timestamps: true 
});

Usuarios.sync({ alter: true })
    .then(() => {
        console.log("A tabela 'usuarios' foi criada/alterada com sucesso.");
    })
    .catch(error => {
        console.error("Houve um erro ao criar/alterar a tabela:", error);
    });

module.exports = Usuarios;
