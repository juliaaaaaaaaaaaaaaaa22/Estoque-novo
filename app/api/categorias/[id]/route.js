import { NextResponse } from 'next/server';
import { conexao, inicializarBanco } from '../../../../lib/db';

export async function PUT(request, { params }) {
  try {
    await inicializarBanco();
    const { id } = await params;
    const body = await request.json();
    const nome = String(body.nome || '').trim();
    const descricao = String(body.descricao || '').trim();
    if (!nome || nome.length > 80 || descricao.length > 255) return NextResponse.json({ mensagem: 'Informe um nome de até 80 caracteres e descrição de até 255 caracteres.' }, { status: 400 });
    const [categoria] = await conexao.execute('SELECT nome FROM categorias WHERE id = ?', [id]);
    if (!categoria.length) return NextResponse.json({ mensagem: 'Categoria não encontrada.' }, { status: 404 });
    const [resultado] = await conexao.execute('UPDATE categorias SET nome = ?, descricao = ? WHERE id = ?', [nome, descricao, id]);
    if (!resultado.affectedRows) return NextResponse.json({ mensagem: 'Categoria não encontrada.' }, { status: 404 });
    await conexao.execute('UPDATE produtos SET categoria = ? WHERE categoria = ?', [nome, categoria[0].nome]);
    const [linhas] = await conexao.execute('SELECT id, nome, descricao, criado_em FROM categorias WHERE id = ?', [id]);
    return NextResponse.json(linhas[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ mensagem: 'Já existe uma categoria com esse nome.' }, { status: 409 });
    console.error('Erro ao atualizar categoria:', error);
    return NextResponse.json({ mensagem: 'Não foi possível atualizar a categoria.' }, { status: 500 });
  }
}

export async function DELETE(_request, { params }) {
  try {
    await inicializarBanco();
    const { id } = await params;
    const [categorias] = await conexao.execute('SELECT nome FROM categorias WHERE id = ?', [id]);
    if (!categorias.length) return NextResponse.json({ mensagem: 'Categoria não encontrada.' }, { status: 404 });
    const [produtos] = await conexao.execute('SELECT COUNT(*) AS total FROM produtos WHERE categoria = ?', [categorias[0].nome]);
    if (Number(produtos[0].total)) return NextResponse.json({ mensagem: 'Mova os produtos para outra categoria antes de excluir.' }, { status: 409 });
    await conexao.execute('DELETE FROM categorias WHERE id = ?', [id]);
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir categoria:', error);
    return NextResponse.json({ mensagem: 'Não foi possível excluir a categoria.' }, { status: 500 });
  }
}
