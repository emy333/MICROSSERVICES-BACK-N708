const express = require("express");
const { 
getSaidas, 
getSaidasFixasPorMes,
getSaidasVariaveisPorMes,
getSaidasPorCredores,
getSaidasPorUsu, 
getSaidasPorMes, 
postSaidas, 
putSaidas, 
deleteSaidas, 
putSaidaStatus,
getDetalhesSaidas,
getSaidasCategoria,
getTotSaidaAno
} = require('../controllers/saidas');
const router = express.Router();
 

router.post("/", postSaidas);
router.get("/", getSaidas);
router.get("/saidasPorMes/:periodo/:id", getSaidasPorMes);
router.get("/saidasFixas/:periodo/:id", getSaidasFixasPorMes);
router.get("/saidasVariaveis/:periodo/:id", getSaidasVariaveisPorMes);

router.get("/saidasTotCategoria/:periodo/:id", getSaidasCategoria);
router.get("/totSaidasAno/:ano/:id", getTotSaidaAno);

router.get("/:id", getSaidasPorUsu);
router.put("/:id", putSaidas);
router.put("/editaStatus/:id", putSaidaStatus);

router.delete("/:id", deleteSaidas);
router.get("/totalPorCredores/:periodo/:id_usuario", getSaidasPorCredores);
router.get("/detalhes/:id_saida", getDetalhesSaidas);

module.exports = router;
