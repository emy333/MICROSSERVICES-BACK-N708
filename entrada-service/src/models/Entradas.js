const Sequelize = require('sequelize');
const db = require('../config/db');

const Entradas = db.define('entradas', {
    id: {
        type: Sequelize.INTEGER, 
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    }, 
    data_referente: { 
        type: Sequelize.DATE,
        allowNull: false,
    },
    descricao: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    valor: {
        type: Sequelize.DECIMAL(10, 2), 
        allowNull: false,
    },
    id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
    }
});

Entradas.sync({ alter: true })
    .then(() => {
        console.log("A tabela 'entradas' foi criada/alterada com sucesso.");
    })
    .catch(error => {
        console.error("Houve um erro ao criar/alterar a tabela:", error);
    });

module.exports = Entradas;
