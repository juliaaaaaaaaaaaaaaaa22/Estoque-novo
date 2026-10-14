import { NextResponse } from 'next/server';
import { conexao, inicializarBanco } from '../../../../lib/db';

export async function PUT(request, { params }) {
  try {
    await inicializarBanco();
    const { id } = await params;
    const { nome, descricao = '', categoria = '', preco = 0, estoque = 0 } = await request.json();
    const precoNumero = Number(preco);
    const estoqueNumero = Number(estoque);
    if (!String(nome || '').trim() || !Number.isFinite(precoNumero) || precoNumero < 0 || !Number.isInteger(estoqueNumero) || estoqueNumero < 0) {
      return NextResponse.json({ mensagem: 'Informe nome, preço válido e estoque inteiro igual ou maior que zero.' }, { status: 400 });
    }
    const [resultado] = await conexao.execute(
      'UPDATE produtos SET nome = ?, descricao = ?, categoria = ?, preco = ?, estoque = ? WHERE id = ?',
      [String(nome).trim(), String(descricao).trim(), String(categoria).trim(), precoNumero, estoqueNumero, id]
    );
    if (!resultado.affectedRows) return NextResponse.json({ mensagem: 'Produto não encontrado.' }, { status: 404 });
    const [linhas] = await conexao.execute('SELECT * FROM produtos WHERE id = ?', [id]);
    return NextResponse.json(linhas[0]);
  } catch (error) {
    console.error('Erro ao atualizar produto:', error);
    return NextResponse.json({ mensagem: 'Não foi possível atualizar o produto.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    await inicializarBanco();
    const { id } = await params;
    const [resultado] = await conexao.execute('DELETE FROM produtos WHERE id = ?', [id]);
    if (!resultado.affectedRows) return NextResponse.json({ mensagem: 'Produto não encontrado.' }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ mensagem: 'Não foi possível excluir o produto.' }, { status: 500 });
  }
}
