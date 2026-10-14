# Saep — Next.js e MySQL

Aplicação Next.js para cadastrar e acompanhar produtos e estoque. A interface React e a API rodam no mesmo servidor Next.js. Os dados ficam no MySQL.

## Configuração local

1. Configure `.env` com `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME` e `DB_PORT`.
2. Confirme que o banco indicado por `DB_NAME` já existe no MySQL. A tabela `produtos` é criada pela aplicação na primeira chamada à API.
3. Instale as dependências com `npm install`.
4. Inicie em desenvolvimento com `npm run dev` e abra `http://localhost:3000`.

Para iniciar em produção, use `npm run build` e depois `npm start`.

## API Next.js

- `GET /api/produtos?busca=texto` — lista e pesquisa por nome ou categoria.
- `POST /api/produtos` — cria um produto (`nome`, `descricao`, `categoria`, `preco`, `estoque`).
- `PUT /api/produtos/:id` — atualiza um produto.
- `DELETE /api/produtos/:id` — remove um produto.

## Hospedagem no Railway

1. Envie o projeto para um repositório GitHub e crie um projeto Railway conectado a esse repositório.
2. Adicione um serviço MySQL ao projeto Railway.
3. No serviço Next, crie referências para `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` e `MYSQLDATABASE` do serviço MySQL. A aplicação já reconhece essas variáveis.
4. Faça o deploy. O Railway executará `npm run build` e iniciará com `npm start`.
5. Para levar os três produtos locais: no serviço MySQL, abra **Settings → Networking → TCP Proxy** para habilitar acesso externo. Use os dados de conexão pública mostrados pelo Railway no MySQL Workbench e execute o arquivo local `railway-seed.sql` (menu **File → Run SQL Script**). Esse arquivo é ignorado pelo Git para não publicar os dados dos produtos.

Não publique o arquivo `.env`. Em produção, use as variáveis protegidas do Railway e uma senha própria para o banco. O banco MySQL precisa estar provisionado antes da primeira chamada à API; a tabela é criada automaticamente.
