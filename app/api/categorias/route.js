import { NextResponse } from 'next/server';
import { conexao, inicializarBanco } from '../../../lib/db';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  try {
    await inicializarBanco();
    const busca = String(new URL(request.url).searchParams.get('busca') || '').trim();
    const [categorias] = await conexao.execute(
      'SELECT c.id, c.nome, c.descricao, c.criado_em, COUNT(p.id) AS total_produtos FROM categorias c LEFT JOIN produtos p ON p.categoria = c.nome WHERE c.nome LIKE ? GROUP BY c.id ORDER BY c.nome',
      [`%${busca}%`]
    );
    return NextResponse.json(categorias);
  } catch (error) {
    console.error('Erro ao listar categorias:', error);
    return NextResponse.json({ mensagem: 'Não foi possível carregar as categorias.' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    await inicializarBanco();
    const body = await request.json();
    const nome = String(body.nome || '').trim();
    const descricao = String(body.descricao || '').trim();
    if (!nome || nome.length > 80 || descricao.length > 255) return NextResponse.json({ mensagem: 'Informe um nome de até 80 caracteres e descrição de até 255 caracteres.' }, { status: 400 });
    const [resultado] = await conexao.execute('INSERT INTO categorias (nome, descricao) VALUES (?, ?)', [nome, descricao]);
    const [linhas] = await conexao.execute('SELECT id, nome, descricao, criado_em FROM categorias WHERE id = ?', [resultado.insertId]);
    return NextResponse.json(linhas[0], { status: 201 });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ mensagem: 'Já existe uma categoria com esse nome.' }, { status: 409 });
    console.error('Erro ao criar categoria:', error);
    return NextResponse.json({ mensagem: 'Não foi possível salvar a categoria.' }, { status: 500 });
  }
}
