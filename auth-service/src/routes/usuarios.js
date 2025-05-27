const express = require("express");
const { getUsers, postUsers, putUsers, deleteUser, getUserById } = require("../controllers/usuarios");
const router = express.Router();


router.get("/listaUsuarios", getUsers);
router.get("/:id", getUserById);
router.post("/cadastro", postUsers);
router.put("/edita/:id", putUsers);
router.delete("/deleta/:id", deleteUser);

module.exports = router;
