-- Execute este script no MySQL Workbench para criar o banco e as tabelas do Saep.
CREATE DATABASE IF NOT EXISTS api_saep
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE api_saep;

CREATE TABLE IF NOT EXISTS produtos (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  descricao VARCHAR(500) NOT NULL DEFAULT '',
  categoria VARCHAR(80) NOT NULL DEFAULT '',
  preco DECIMAL(10, 2) NOT NULL DEFAULT 0,
  estoque INT NOT NULL DEFAULT 0,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  CONSTRAINT chk_produtos_preco CHECK (preco >= 0),
  CONSTRAINT chk_produtos_estoque CHECK (estoque >= 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS categorias (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(80) NOT NULL,
  descricao VARCHAR(255) NOT NULL DEFAULT '',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_categorias_nome (nome)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS usuarios (
  id INT NOT NULL AUTO_INCREMENT,
  nome VARCHAR(120) NOT NULL,
  email VARCHAR(190) NOT NULL,
  senha_hash VARCHAR(255) NOT NULL,
  papel ENUM('admin', 'operador') NOT NULL DEFAULT 'operador',
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  UNIQUE KEY uq_usuarios_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS movimentacoes_estoque (
  id BIGINT NOT NULL AUTO_INCREMENT,
  produto_id INT NOT NULL,
  usuario_id INT NULL,
  tipo ENUM('entrada', 'saida') NOT NULL,
  quantidade INT NOT NULL,
  observacao VARCHAR(255) NOT NULL DEFAULT '',
  criado_em TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (id),
  KEY idx_movimentacoes_produto_data (produto_id, criado_em),
  KEY idx_movimentacoes_usuario (usuario_id),
  CONSTRAINT chk_movimentacoes_quantidade CHECK (quantidade > 0),
  CONSTRAINT fk_movimentacao_produto FOREIGN KEY (produto_id)
    REFERENCES produtos (id) ON DELETE RESTRICT,
  CONSTRAINT fk_movimentacao_usuario FOREIGN KEY (usuario_id)
    REFERENCES usuarios (id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Cria categorias para produtos antigos que já tinham categoria como texto.
INSERT IGNORE INTO categorias (nome)
SELECT DISTINCT TRIM(categoria)
FROM produtos
WHERE TRIM(categoria) <> '';
