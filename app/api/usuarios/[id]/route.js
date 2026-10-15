import { NextResponse } from 'next/server';
import { conexao, inicializarBanco } from '../../../../lib/db';
import { exigirChaveAdmin, gerarHashSenha } from '../../../../lib/seguranca';

export async function GET(request, { params }) {
  const bloqueio = exigirChaveAdmin(request);
  if (bloqueio) return bloqueio;
  try {
    await inicializarBanco();
    const { id } = await params;
    const [linhas] = await conexao.execute('SELECT id, nome, email, papel, ativo, criado_em FROM usuarios WHERE id = ?', [id]);
    if (!linhas.length) return NextResponse.json({ mensagem: 'Usuário não encontrado.' }, { status: 404 });
    return NextResponse.json(linhas[0]);
  } catch (error) {
    console.error('Erro ao buscar usuário:', error);
    return NextResponse.json({ mensagem: 'Não foi possível carregar o usuário.' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  const bloqueio = exigirChaveAdmin(request);
  if (bloqueio) return bloqueio;
  try {
    await inicializarBanco();
    const { id } = await params;
    const body = await request.json();
    const [existente] = await conexao.execute('SELECT id FROM usuarios WHERE id = ?', [id]);
    if (!existente.length) return NextResponse.json({ mensagem: 'Usuário não encontrado.' }, { status: 404 });
    const nome = String(body.nome || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const papel = body.papel === 'admin' ? 'admin' : 'operador';
    const ativo = body.ativo === false || body.ativo === 0 ? 0 : 1;
    if (!nome || nome.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190) return NextResponse.json({ mensagem: 'Informe nome e e-mail válido.' }, { status: 400 });
    if (body.senha && String(body.senha).length < 10) return NextResponse.json({ mensagem: 'A senha deve ter pelo menos 10 caracteres.' }, { status: 400 });
    if (body.senha) {
      const hash = await gerarHashSenha(String(body.senha));
      await conexao.execute('UPDATE usuarios SET nome = ?, email = ?, papel = ?, ativo = ?, senha_hash = ? WHERE id = ?', [nome, email, papel, ativo, hash, id]);
    } else {
      await conexao.execute('UPDATE usuarios SET nome = ?, email = ?, papel = ?, ativo = ? WHERE id = ?', [nome, email, papel, ativo, id]);
    }
    const [linhas] = await conexao.execute('SELECT id, nome, email, papel, ativo, criado_em FROM usuarios WHERE id = ?', [id]);
    return NextResponse.json(linhas[0]);
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ mensagem: 'Já existe um usuário com esse e-mail.' }, { status: 409 });
    console.error('Erro ao atualizar usuário:', error);
    return NextResponse.json({ mensagem: 'Não foi possível atualizar o usuário.' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  const bloqueio = exigirChaveAdmin(request);
  if (bloqueio) return bloqueio;
  try {
    await inicializarBanco();
    const { id } = await params;
    const [resultado] = await conexao.execute('DELETE FROM usuarios WHERE id = ?', [id]);
    if (!resultado.affectedRows) return NextResponse.json({ mensagem: 'Usuário não encontrado.' }, { status: 404 });
    return new Response(null, { status: 204 });
  } catch (error) {
    console.error('Erro ao excluir usuário:', error);
    return NextResponse.json({ mensagem: 'Não foi possível excluir o usuário.' }, { status: 500 });
  }
}
