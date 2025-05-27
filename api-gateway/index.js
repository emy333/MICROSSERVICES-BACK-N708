const express = require('express');
const { createProxyMiddleware, fixRequestBody } = require('http-proxy-middleware');
const cors = require('cors');
const authMiddleware = require('./src/middlewares/authMiddleware');

const app = express();
app.use(cors());

const services = {
  auth: process.env.AUTH_URL,
  entradas: process.env.ENTRADAS_URL,
  credores: process.env.CREDORES_URL,
  saidas: process.env.SAIDAS_URL,
};


app.use('/usuarios/cadastro', createProxyMiddleware({
  target: services.auth + '/usuarios/cadastro',
  changeOrigin: true,
})); 

app.use('/login', createProxyMiddleware({ target: services.auth + '/login', changeOrigin: true, onProxyReq: fixRequestBody }));

app.use('/usuarios', authMiddleware, createProxyMiddleware({
  target: services.auth + '/usuarios',
  changeOrigin: true,
}));
app.use('/entradas', authMiddleware, createProxyMiddleware({ target: services.entradas + "/entradas", changeOrigin: true }));
app.use('/credores', authMiddleware, createProxyMiddleware({ target: services.credores + "/credores", changeOrigin: true }));
app.use('/saidas', authMiddleware, createProxyMiddleware({ target: services.saidas + "/saidas", changeOrigin: true }));


const PORT = 3000;
app.listen(PORT, () => {
  console.log(`API Gateway rodando na porta ${PORT}`);
});
