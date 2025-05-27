 require('dotenv').config();
const express = require('express');
const cors = require('cors');


const credoresRoutes = require('./src/routes/credores');

const app = express();
app.use(cors());
app.use(express.json());

app.use("/credores", credoresRoutes);

const PORT = process.env.PORT || 3003;


app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
