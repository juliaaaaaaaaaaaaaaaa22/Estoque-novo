import { NextResponse } from 'next/server';
import { conexao, inicializarBanco } from '../../../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(_request, { params }) {
  try {
    await inicializarBanco();
    const { id } = await params;
    const [produtos] = await conexao.execute('SELECT id FROM produtos WHERE id = ?', [id]);
    if (!produtos.length) return NextResponse.json({ mensagem: 'Produto não encontrado.' }, { status: 404 });
    const [movimentacoes] = await conexao.execute(
      'SELECT m.id, m.produto_id, m.usuario_id, u.nome AS usuario, m.tipo, m.quantidade, m.observacao, m.criado_em FROM movimentacoes_estoque m LEFT JOIN usuarios u ON u.id = m.usuario_id WHERE m.produto_id = ? ORDER BY m.criado_em DESC, m.id DESC',
      [id]
    );
    return NextResponse.json(movimentacoes);
  } catch (error) {
    console.error('Erro ao consultar movimentações do produto:', error);
    return NextResponse.json({ mensagem: 'Não foi possível carregar o histórico de estoque.' }, { status: 500 });
  }
}
