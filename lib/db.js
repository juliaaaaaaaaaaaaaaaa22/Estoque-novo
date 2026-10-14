import mysql from 'mysql2/promise';

const nomeBanco = process.env.DB_NAME || process.env.MYSQLDATABASE || 'api_saep';
const config = {
  host: process.env.DB_HOST || process.env.MYSQLHOST || 'localhost',
  user: process.env.DB_USER || process.env.MYSQLUSER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD || '',
  port: Number(process.env.DB_PORT || process.env.MYSQLPORT) || 3306,
  database: nomeBanco,
  waitForConnections: true,
  connectionLimit: 10
};

const globalMysql = globalThis;
export const conexao = globalMysql.__saepPool || mysql.createPool(config);
if (process.env.NODE_ENV !== 'production') globalMysql.__saepPool = conexao;

let inicializacao;
export function inicializarBanco() {
  if (!inicializacao) {
    inicializacao = (async () => {
      if (!/^[a-zA-Z0-9_$]+$/.test(nomeBanco)) throw new Error('DB_NAME contém caracteres inválidos.');
      const [databases] = await conexao.query('SELECT DATABASE() AS nome');
      if (!databases[0]?.nome) throw new Error('O banco configurado não foi selecionado.');
      await conexao.query(`
        CREATE TABLE IF NOT EXISTS produtos (
          id INT NOT NULL AUTO_INCREMENT PRIMARY KEY,
          nome VARCHAR(120) NOT NULL,
          descricao VARCHAR(500) DEFAULT '',
          categoria VARCHAR(80) DEFAULT '',
          preco DECIMAL(10, 2) NOT NULL DEFAULT 0,
          estoque INT NOT NULL DEFAULT 0,
          criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4
      `);
    })().catch((error) => { inicializacao = undefined; throw error; });
  }
  return inicializacao;
}
