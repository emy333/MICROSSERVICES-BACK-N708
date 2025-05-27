# API Gateway

Este projeto é o API Gateway que faz o roteamento e proxy das requisições para os microsserviços da aplicação.

---

## Tecnologias

- Node.js
- Express
- http-proxy-middleware
- CORS

---

## Serviços Integrados

| Serviço   | URL base (variável de ambiente)         | Caminho no Gateway  |
| --------- | --------------------------------------- | ------------------- |
| Auth      | `AUTH_URL`                             | `/usuarios`, `/login`, `/usuarios/cadastro` |
| Entradas  | `ENTRADAS_URL`                         | `/entradas`         |
| Credores  | `CREDORES_URL`                         | `/credores`         |
| Saidas    | `SAIDAS_URL`                          | `/saidas`           |

---

## Variáveis de Ambiente

Para executar o gateway, configure as seguintes variáveis de ambiente:

.env
AUTH_URL=http://localhost:3001
ENTRADAS_URL=http://localhost:3002
CREDORES_URL=http://localhost:3003
SAIDAS_URL=http://localhost:3004

