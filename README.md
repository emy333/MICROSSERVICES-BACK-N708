# Projeto Microsserviços + API Gateway

Este repositório contém uma arquitetura baseada em microsserviços com um **API Gateway** responsável por realizar o roteamento e proxy das requisições. Cada serviço é modularizado e isolado, facilitando a manutenção, escalabilidade e implantação independente.

---

## 📁 Estrutura do Repositório

/
├── api-gateway/ # Serviço responsável pelo roteamento das requisições para os microsserviços

├── auth-service/ # Microsserviço de autenticação e gerenciamento de usuários

├── entradas-service/ # Microsserviço para gerenciamento de entradas

├── credores-service/ # Microsserviço para gerenciamento de credores

├── saidas-service/ # Microsserviço para gerenciamento de saídas

---

## 🚀 Como executar
Para rodar o projeto, é necessário iniciar **todos os serviços**, incluindo o `api-gateway`.  
Em cada pasta de serviço, execute os comandos abaixo:
npm install
npm run dev

ℹ️ Importante:
Cada serviço possui um arquivo de exemplo chamado .env.example com as variáveis de ambiente utilizadas.
Renomeie este arquivo para .env e configure os valores conforme o seu ambiente local.

