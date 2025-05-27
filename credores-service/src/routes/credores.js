const express = require("express");
const { getCredoresPorUsu, getTotalDespesasCredor, postCredores, putCredores, deleteCredores, getDetalhesCredor, } = require('../controllers/credores');
const router = express.Router();


router.get("/credoresUsu/:id", getCredoresPorUsu);
router.post("/", postCredores);
router.put("/:id", putCredores);
router.get("/detalhes/:id_credor", getDetalhesCredor);

router.get("/totalSaidasCredor/:id_usuario", getTotalDespesasCredor);
router.delete("/:id", deleteCredores);


module.exports = router;
