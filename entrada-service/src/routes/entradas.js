const express = require("express");
const { getEntradas, getEntradasUsuarios, getEntradasPorMes, postEntradas, putEntradas, deleteEntradas, getDetalhesEntradas } = require('../controllers/entradas');
const router = express.Router();

router.get("/todasEntradas/", getEntradas);
router.get("/entradasUsu/:id", getEntradasUsuarios);
router.get("/entradasMes/:periodo/:id", getEntradasPorMes);
router.post("/", postEntradas);
router.put("/:id", putEntradas);
router.delete("/:id", deleteEntradas);
router.get("/detalhes/:id_entrada", getDetalhesEntradas);


module.exports = router;
