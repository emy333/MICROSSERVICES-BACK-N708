require('dotenv').config();
const express = require('express');
const cors = require('cors');


const financesRoutes = require('./src/routes/finance');

const app = express();
app.use(cors());
app.use(express.json());

app.use("/finances", financesRoutes);

const PORT = process.env.PORT || 3005;


app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
