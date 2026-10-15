import { NextResponse } from 'next/server';
import { conexao, inicializarBanco } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await inicializarBanco();
    const busca = String(new URL(request.url).searchParams.get('busca') || '').trim();
    const [produtos] = await conexao.execute(
      `SELECT id, nome, descricao, categoria, preco, estoque, criado_em FROM produtos
       WHERE nome LIKE ? OR categoria LIKE ? ORDER BY criado_em DESC, id DESC`,
      [`%${busca}%`, `%${busca}%`]
    );
    return NextResponse.json(produtos);
  } catch (error) {
    console.error('Erro ao listar produtos:', error);
    return NextResponse.json({ mensagem: 'Não foi possível carregar os produtos.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await inicializarBanco();
    const { nome, descricao = '', categoria = '', preco = 0, estoque = 0 } = await request.json();
    const precoNumero = Number(preco);
    const estoqueNumero = Number(estoque);
    if (!String(nome || '').trim() || !Number.isFinite(precoNumero) || precoNumero < 0 || !Number.isInteger(estoqueNumero) || estoqueNumero < 0) {
      return NextResponse.json({ mensagem: 'Informe nome, preço válido e estoque inteiro igual ou maior que zero.' }, { status: 400 });
    }
    const transacao = await conexao.getConnection();
    try {
      await transacao.beginTransaction();
      const [resultado] = await transacao.execute(
        'INSERT INTO produtos (nome, descricao, categoria, preco, estoque) VALUES (?, ?, ?, ?, ?)',
        [String(nome).trim(), String(descricao).trim(), String(categoria).trim(), precoNumero, estoqueNumero]
      );
      if (estoqueNumero > 0) {
        await transacao.execute(
          'INSERT INTO movimentacoes_estoque (produto_id, tipo, quantidade, observacao) VALUES (?, ?, ?, ?)',
          [resultado.insertId, 'entrada', estoqueNumero, 'Estoque inicial do produto']
        );
      }
      const [linhas] = await transacao.execute('SELECT * FROM produtos WHERE id = ?', [resultado.insertId]);
      await transacao.commit();
      return NextResponse.json(linhas[0], { status: 201 });
    } catch (error) {
      await transacao.rollback();
      throw error;
    } finally {
      transacao.release();
    }
  } catch (error) {
    console.error('Erro ao criar produto:', error);
    return NextResponse.json({ mensagem: 'Não foi possível salvar o produto.' }, { status: 500 });
  }
}
