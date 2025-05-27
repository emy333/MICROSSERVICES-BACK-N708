require('dotenv').config();
const express = require('express');
const cors = require('cors');

const usuariosRoutes = require('./src/routes/usuarios');
const authRoutes = require('./src/routes/authRoutes');

const app = express();
app.use(cors());
app.use(express.json());

app.use("/usuarios", usuariosRoutes);
app.use("/login", authRoutes);

const PORT = process.env.PORT || 3001;


app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
