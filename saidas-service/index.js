require('dotenv').config();
const express = require('express');
const cors = require('cors');


const saidasRoutes = require('./src/routes/saidas');

const app = express();
app.use(cors());
app.use(express.json());

app.use("/saidas", saidasRoutes);

const PORT = process.env.PORT || 3004;


app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
