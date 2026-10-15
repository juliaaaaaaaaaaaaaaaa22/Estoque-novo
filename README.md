# Saep — Next.js e MySQL

Aplicação Next.js para cadastrar e acompanhar produtos e estoque. A interface React e a API rodam no mesmo servidor Next.js. Os dados ficam no MySQL.

## Configuração local

1. Execute `schema-mysql.sql` no MySQL Workbench para criar o banco `api_saep` e as tabelas. Se escolher outro nome, ajuste `DB_NAME` e a linha `USE` do script para usarem o mesmo nome.
2. Configure `.env` com `DB_HOST`, `DB_USER`, `DB_PASSWORD`, `DB_NAME=api_saep` e `DB_PORT`, ou configure `DB_URL` com uma URL MySQL (`mysql://usuario:senha@host:3306/api_saep`). `DATABASE_URL` só é aceita quando começa com `mysql://`; URLs PostgreSQL não funcionam nesta aplicação.
3. Instale as dependências com `npm install`.
4. Defina `ADMIN_API_KEY` no `.env` com uma chave longa e secreta para liberar o gerenciamento de usuários.
5. Inicie em desenvolvimento com `npm run dev` e abra `http://localhost:3000`.

Para iniciar em produção, use `npm run build` e depois `npm start`.

## API Next.js

- `GET /api/produtos?busca=texto` — lista e pesquisa por nome ou categoria.
- `GET /api/produtos/:id` — consulta um produto.
- `POST /api/produtos` — cria um produto (`nome`, `descricao`, `categoria`, `preco`, `estoque`).
- `PUT /api/produtos/:id` — atualiza os dados do produto. Alterações de estoque devem usar as rotas de movimentação.
- `DELETE /api/produtos/:id` — remove um produto.
- `GET /api/produtos/:id/movimentacoes` — consulta entradas e saídas do produto.
- `GET /api/categorias?busca=texto` e `POST /api/categorias` — lista e cria categorias (`nome`, `descricao`).
- `PUT /api/categorias/:id` e `DELETE /api/categorias/:id` — altera ou exclui categoria. Uma categoria só pode ser excluída quando não tiver produtos vinculados.
- `GET /api/estoque?produtoId=1&tipo=entrada` — consulta as movimentações; os filtros são opcionais.
- `POST /api/estoque` — registra uma movimentação (`produtoId`, `tipo`: `entrada` ou `saida`, `quantidade`, `observacao` opcional e `usuarioId` opcional). A saída é recusada quando não há saldo suficiente. O saldo e o histórico são atualizados juntos.
- `GET /api/usuarios` e `POST /api/usuarios` — lista e cadastra usuários (`nome`, `email`, `senha`, `papel` opcional: `admin` ou `operador`).
- `GET /api/usuarios/:id`, `PUT /api/usuarios/:id` e `DELETE /api/usuarios/:id` — consulta, altera ou remove usuários. As rotas de usuários exigem o cabeçalho `x-admin-key` com o valor de `ADMIN_API_KEY`; senhas são armazenadas com hash scrypt.

Ao criar um produto com estoque inicial maior que zero, a API registra esse saldo como uma entrada inicial. Movimentações existentes impedem a exclusão do produto para preservar o histórico.

## Hospedagem no Railway

1. Envie o projeto para um repositório GitHub e crie um projeto Railway conectado a esse repositório.
2. Adicione um serviço MySQL ao projeto Railway.
3. No serviço Next, crie referências para `MYSQLHOST`, `MYSQLPORT`, `MYSQLUSER`, `MYSQLPASSWORD` e `MYSQLDATABASE` do serviço MySQL. A aplicação já reconhece essas variáveis.
4. Faça o deploy. O Railway executará `npm run build` e iniciará com `npm start`.
5. Para levar os três produtos locais: no serviço MySQL, abra **Settings → Networking → TCP Proxy** para habilitar acesso externo. Use os dados de conexão pública mostrados pelo Railway no MySQL Workbench e execute o arquivo local `railway-seed.sql` (menu **File → Run SQL Script**). Esse arquivo é ignorado pelo Git para não publicar os dados dos produtos.

Não publique o arquivo `.env`. Em produção, use as variáveis protegidas do Railway e uma senha própria para o banco. O banco MySQL precisa estar provisionado antes da primeira chamada à API; a tabela é criada automaticamente.
