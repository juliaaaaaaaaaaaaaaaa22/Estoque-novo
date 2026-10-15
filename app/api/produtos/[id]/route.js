import { NextResponse } from 'next/server';
import { conexao, inicializarBanco } from '../../../../lib/db';

export async function GET(_request, { params }) {
  try {
    await inicializarBanco();
    const { id } = await params;
    const [linhas] = await conexao.execute('SELECT id, nome, descricao, categoria, preco, estoque, criado_em FROM produtos WHERE id = ?', [id]);
    if (!linhas.length) return NextResponse.json({ mensagem: 'Produto não encontrado.' }, { status: 404 });
    return NextResponse.json(linhas[0]);
  } catch (error) {
    console.error('Erro ao buscar produto:', error);
    return NextResponse.json({ mensagem: 'Não foi possível carregar o produto.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    await inicializarBanco();
    const { id } = await params;
    const { nome, descricao = '', categoria = '', preco = 0, estoque } = await request.json();
    const precoNumero = Number(preco);
    const estoqueNumero = estoque === undefined ? null : Number(estoque);
    if (!String(nome || '').trim() || !Number.isFinite(precoNumero) || precoNumero < 0 || (estoqueNumero !== null && (!Number.isInteger(estoqueNumero) || estoqueNumero < 0))) {
      return NextResponse.json({ mensagem: 'Informe nome, preço válido e, se enviado, estoque inteiro igual ou maior que zero.' }, { status: 400 });
    }
    const [atuais] = await conexao.execute('SELECT estoque FROM produtos WHERE id = ?', [id]);
    if (!atuais.length) return NextResponse.json({ mensagem: 'Produto não encontrado.' }, { status: 404 });
    if (estoqueNumero !== null && estoqueNumero !== Number(atuais[0].estoque)) {
      return NextResponse.json({ mensagem: 'Altere o estoque pelas rotas POST /api/estoque com tipo entrada ou saida.' }, { status: 400 });
    }
    const [resultado] = await conexao.execute(
      'UPDATE produtos SET nome = ?, descricao = ?, categoria = ?, preco = ? WHERE id = ?',
      [String(nome).trim(), String(descricao).trim(), String(categoria).trim(), precoNumero, id]
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
    if (error.code === 'ER_ROW_IS_REFERENCED_2') return NextResponse.json({ mensagem: 'Este produto tem movimentações registradas e não pode ser excluído.' }, { status: 409 });
    console.error('Erro ao excluir produto:', error);
    return NextResponse.json({ mensagem: 'Não foi possível excluir o produto.' }, { status: 500 });
  }
}
