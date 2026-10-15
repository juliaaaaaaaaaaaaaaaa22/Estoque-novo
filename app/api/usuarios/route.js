import { NextResponse } from 'next/server';
import { conexao, inicializarBanco } from '../../../lib/db';
import { exigirChaveAdmin, gerarHashSenha } from '../../../lib/seguranca';

export const dynamic = 'force-dynamic';

export async function GET(request) {
  const bloqueio = exigirChaveAdmin(request);
  if (bloqueio) return bloqueio;
  try {
    await inicializarBanco();
    const [usuarios] = await conexao.execute('SELECT id, nome, email, papel, ativo, criado_em FROM usuarios ORDER BY nome');
    return NextResponse.json(usuarios);
  } catch (error) {
    console.error('Erro ao listar usuários:', error);
    return NextResponse.json({ mensagem: 'Não foi possível carregar os usuários.' }, { status: 500 });
  }
}

export async function POST(request) {
  const bloqueio = exigirChaveAdmin(request);
  if (bloqueio) return bloqueio;
  try {
    await inicializarBanco();
    const body = await request.json();
    const nome = String(body.nome || '').trim();
    const email = String(body.email || '').trim().toLowerCase();
    const senha = String(body.senha || '');
    const papel = body.papel === 'admin' ? 'admin' : 'operador';
    if (!nome || nome.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 190 || senha.length < 10) {
      return NextResponse.json({ mensagem: 'Informe nome, e-mail válido e senha com pelo menos 10 caracteres.' }, { status: 400 });
    }
    const senha_hash = await gerarHashSenha(senha);
    const [resultado] = await conexao.execute('INSERT INTO usuarios (nome, email, senha_hash, papel) VALUES (?, ?, ?, ?)', [nome, email, senha_hash, papel]);
    const [linhas] = await conexao.execute('SELECT id, nome, email, papel, ativo, criado_em FROM usuarios WHERE id = ?', [resultado.insertId]);
    return NextResponse.json(linhas[0], { status: 201 });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return NextResponse.json({ mensagem: 'Já existe um usuário com esse e-mail.' }, { status: 409 });
    console.error('Erro ao criar usuário:', error);
    return NextResponse.json({ mensagem: 'Não foi possível salvar o usuário.' }, { status: 500 });
  }
}
