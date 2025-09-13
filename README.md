# Painel Gestão — Boilerplate Node + PostgreSQL

Projeto mínimo para rodar o schema e expor uma API REST simples.

## 1) Requisitos
- Node 18+
- PostgreSQL 12+ (com extensão `pgcrypto` disponível)

## 2) Configuração
1. Copie o arquivo `.env.example` para `.env` e ajuste as variáveis de conexão do PostgreSQL.
2. (Se necessário) habilite a extensão uma vez no banco como superuser:
   ```sql
   CREATE EXTENSION IF NOT EXISTS pgcrypto;
   ```

## 3) Instalação e Migração
```bash
npm i
npm run migrate  # cria/atualiza as tabelas conforme db/schema.sql
```

## 4) Rodar a API
```bash
npm run dev
# Healthcheck:
curl http://localhost:${PORT:-3000}/health
```

## 5) Endpoints (amostras)
- `GET /clientes` — lista clientes
- `POST /clientes` — cria cliente `{nome, email}`
- `GET /clientes/:id` — detalhe
- `PUT /clientes/:id` — atualiza `{nome?, email?}`
- `DELETE /clientes/:id` — remove

- `GET /dominios?cliente_id=...` — lista domínios
- `POST /dominios` — cria domínio `{cliente_id, dominio, ativo}`

- `GET /lancamentos?user_id=...` — lista lançamentos
- `POST /lancamentos` — cria lançamento `{user_id, descricao, valor, data, tipo, categoria}`

Ajuste/expanda conforme sua necessidade.
