const Sequelize = require('sequelize');
const db = require('../config/db'); 


const Saidas = db.define('saidas', {
    id: {
        type: Sequelize.INTEGER, 
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },  
    data_vencimento: { 
        type: Sequelize.DATE,
    },
    pago: {
        type: Sequelize.BOOLEAN,
        defaultValue: false, 
    },
    descricao: {
        type: Sequelize.STRING,
    },
    tipo_pagamento: {
        type: Sequelize.STRING,
    },
    categoria: {
        type: Sequelize.STRING,
        defaultValue: "",
    },
    total_parcela: {
        type: Sequelize.INTEGER,
        defaultValue: null,
    },
    parcela_atual: {
        type: Sequelize.INTEGER,
        defaultValue: null,
    },
    valor: {
        type: Sequelize.DECIMAL(10, 2), 
    },
    gasto_fixo: {
        type: Sequelize.BOOLEAN, 
    },
    id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
    },
    id_credor: {
        type: Sequelize.INTEGER,
    },
});


Saidas.sync({ alter: true })
    .then(() => {
        console.log("A tabela 'saidas' foi criada/alterada com sucesso.");
    })
    .catch(error => {
        console.error("Houve um erro ao criar/alterar a tabela:", error);
    });

module.exports = Saidas;
