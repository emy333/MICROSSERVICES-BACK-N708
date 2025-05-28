const express = require("express");
const { 
getTotalSaidas, 
getTotalEntradas, 
getTotalDespesasPagas, 
getTotalDespesasApagar, 
getSaldo,
getTotalDespesasCredor,
getTotalDespesasVariaveis,
getTotalDespesasFixasParceladas
} = require('../controllers/financeController');
const router = express.Router();

router.get("/saidas/total/:periodo/:id", getTotalSaidas);
router.get("/entradas/total/:periodo/:id", getTotalEntradas);
router.get("/saldo/:periodo/:id", getSaldo);
router.get("/despesasApagar/total/:periodo/:id", getTotalDespesasApagar);
router.get("/despesasPagas/total/:periodo/:id", getTotalDespesasPagas);
router.get("/saidas/total/:periodo/:id_usuario/:id_credor", getTotalDespesasCredor);

router.get("/despesasVariaveis/total/:periodo/:id", getTotalDespesasVariaveis);
router.get("/despesasFixasParcelas/total/:periodo/:id", getTotalDespesasFixasParceladas);


module.exports = router;
