import mysql from 'mysql2/promise';

const env = process.env;
const urlBanco = env.DB_URL || env.MYSQL_PRIVATE_URL || env.MYSQL_URL || env.MYSQL_PUBLIC_URL;
const primeiroValor = (...nomes) => nomes.map((nome) => env[nome]).find((valor) => valor !== undefined && valor !== '');

function configPorUrl(valor) {
  if (!valor) return null;
  const url = new URL(valor);
  if (url.protocol !== 'mysql:') throw new Error('A URL do MySQL precisa começar com mysql://.');
  return {
    host: url.hostname,
    port: Number(url.port) || 3306,
    user: decodeURIComponent(url.username),
    password: decodeURIComponent(url.password),
    database: decodeURIComponent(url.pathname.replace(/^\//, '')),
  };
}

const config = {
  ...(configPorUrl(urlBanco) || {
    host: primeiroValor('DB_HOST', 'MYSQLHOST', 'MYSQL_HOST') || 'localhost',
    port: Number(primeiroValor('DB_PORT', 'MYSQLPORT', 'MYSQL_PORT')) || 3306,
    user: primeiroValor('DB_USER', 'MYSQLUSER', 'MYSQL_USER') || 'root',
    password: primeiroValor('DB_PASSWORD', 'MYSQLPASSWORD', 'MYSQL_PASSWORD') || '',
    database: primeiroValor('DB_NAME', 'MYSQLDATABASE', 'MYSQL_DATABASE') || 'api_saep',
  }),
  waitForConnections: true,
  connectionLimit: 10,
};

const globalMysql = globalThis;
export const conexao = globalMysql.__saepPool || mysql.createPool(config);
if (process.env.NODE_ENV !== 'production') globalMysql.__saepPool = conexao;

let inicializacao;
export function inicializarBanco() {
  if (!inicializacao) {
    inicializacao = (async () => {
      const hostConfigurado = primeiroValor('DB_HOST', 'MYSQLHOST', 'MYSQL_HOST');
      const usuarioConfigurado = primeiroValor('DB_USER', 'MYSQLUSER', 'MYSQL_USER');
      const bancoConfigurado = primeiroValor('DB_NAME', 'MYSQLDATABASE', 'MYSQL_DATABASE');
      if (process.env.NODE_ENV === 'production' && !urlBanco && (!hostConfigurado || !usuarioConfigurado || !bancoConfigurado)) {
        throw new Error('Configure DB_HOST, DB_USER e DB_NAME ou MYSQL_PRIVATE_URL nas variáveis do serviço.');
      }
      if (!/^[a-zA-Z0-9_$]+$/.test(config.database)) throw new Error('DB_NAME contém caracteres inválidos.');
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
