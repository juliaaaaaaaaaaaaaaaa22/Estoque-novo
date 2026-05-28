const dotenv = require('dotenv');
dotenv.config();

const app = require('./app');
const conexao = require("./db");


const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`Servidor rodando na porta ${port}...`);
});