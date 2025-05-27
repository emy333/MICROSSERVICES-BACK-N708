const Sequelize = require('sequelize');
const db = require('../config/db');

const Credores = db.define('credores', {
    id_credor: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        allowNull: false,
        primaryKey: true
    },
    descricao: {
        type: Sequelize.STRING,
        allowNull: false,
    },
    id_usuario: {
        type: Sequelize.INTEGER,
        allowNull: false,
    }

});



Credores.sync({ alter: true })
    .then(() => {
        console.log("A tabela 'credores' foi criada/alterada com sucesso.");
    })
    .catch(error => {
        console.error("Houve um erro ao criar/alterar a tabela:", error);
    });

module.exports = Credores;
