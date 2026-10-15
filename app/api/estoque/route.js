import { NextResponse } from 'next/server';
import { conexao, inicializarBanco } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await inicializarBanco();
    const params = new URL(request.url).searchParams;
    const produtoId = params.get('produtoId');
    const tipo = params.get('tipo');
    if (tipo && !['entrada', 'saida'].includes(tipo)) return NextResponse.json({ mensagem: 'O tipo deve ser entrada ou saida.' }, { status: 400 });
    const filtros = [];
    const valores = [];
    if (produtoId) { filtros.push('m.produto_id = ?'); valores.push(produtoId); }
    if (tipo) { filtros.push('m.tipo = ?'); valores.push(tipo); }
    const where = filtros.length ? `WHERE ${filtros.join(' AND ')}` : '';
    const [movimentacoes] = await conexao.execute(
      `SELECT m.id, m.produto_id, p.nome AS produto, m.tipo, m.quantidade, m.observacao, m.usuario_id, u.nome AS usuario, m.criado_em FROM movimentacoes_estoque m JOIN produtos p ON p.id = m.produto_id LEFT JOIN usuarios u ON u.id = m.usuario_id ${where} ORDER BY m.criado_em DESC, m.id DESC`,
      valores
    );
    return NextResponse.json(movimentacoes);
  } catch (error) {
    console.error('Erro ao consultar movimentações de estoque:', error);
    return NextResponse.json({ mensagem: 'Não foi possível carregar as movimentações.' }, { status: 500 });
  }
}

export async function POST(request) {
  let conexaoTransacao;
  try {
    await inicializarBanco();
    const body = await request.json();
    const produtoId = Number(body.produtoId);
    const quantidade = Number(body.quantidade);
    const tipo = String(body.tipo || '').toLowerCase();
    const observacao = String(body.observacao || '').trim();
    const usuarioId = body.usuarioId ? Number(body.usuarioId) : null;
    if (!Number.isInteger(produtoId) || produtoId < 1 || !['entrada', 'saida'].includes(tipo) || !Number.isInteger(quantidade) || quantidade < 1 || observacao.length > 255 || (usuarioId !== null && (!Number.isInteger(usuarioId) || usuarioId < 1))) {
      return NextResponse.json({ mensagem: 'Informe produtoId, tipo entrada ou saida e quantidade inteira positiva.' }, { status: 400 });
    }
    conexaoTransacao = await conexao.getConnection();
    await conexaoTransacao.beginTransaction();
    const [produtos] = await conexaoTransacao.execute('SELECT id, estoque FROM produtos WHERE id = ? FOR UPDATE', [produtoId]);
    if (!produtos.length) {
      await conexaoTransacao.rollback();
      return NextResponse.json({ mensagem: 'Produto não encontrado.' }, { status: 404 });
    }
    if (tipo === 'saida' && Number(produtos[0].estoque) < quantidade) {
      await conexaoTransacao.rollback();
      return NextResponse.json({ mensagem: 'Estoque insuficiente para essa saída.' }, { status: 409 });
    }
    if (usuarioId) {
      const [usuarios] = await conexaoTransacao.execute('SELECT id FROM usuarios WHERE id = ? AND ativo = 1', [usuarioId]);
      if (!usuarios.length) {
        await conexaoTransacao.rollback();
        return NextResponse.json({ mensagem: 'Usuário não encontrado ou inativo.' }, { status: 400 });
      }
    }
    const operacao = tipo === 'entrada' ? '+' : '-';
    await conexaoTransacao.execute(`UPDATE produtos SET estoque = estoque ${operacao} ? WHERE id = ?`, [quantidade, produtoId]);
    const [resultado] = await conexaoTransacao.execute(
      'INSERT INTO movimentacoes_estoque (produto_id, usuario_id, tipo, quantidade, observacao) VALUES (?, ?, ?, ?, ?)',
      [produtoId, usuarioId, tipo, quantidade, observacao]
    );
    const [linhas] = await conexaoTransacao.execute(
      'SELECT m.id, m.produto_id, p.nome AS produto, m.tipo, m.quantidade, m.observacao, m.usuario_id, m.criado_em, p.estoque AS estoque_atual FROM movimentacoes_estoque m JOIN produtos p ON p.id = m.produto_id WHERE m.id = ?',
      [resultado.insertId]
    );
    await conexaoTransacao.commit();
    return NextResponse.json(linhas[0], { status: 201 });
  } catch (error) {
    if (conexaoTransacao) await conexaoTransacao.rollback().catch(() => {});
    console.error('Erro ao registrar movimentação de estoque:', error);
    return NextResponse.json({ mensagem: 'Não foi possível registrar a movimentação.' }, { status: 500 });
  } finally {
    conexaoTransacao?.release();
  }
}
