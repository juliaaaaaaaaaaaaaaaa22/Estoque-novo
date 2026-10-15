import { promisify } from 'node:util';
import { randomBytes, scrypt as scryptCallback, timingSafeEqual } from 'node:crypto';
import { NextResponse } from 'next/server';

const scrypt = promisify(scryptCallback);

export function exigirChaveAdmin(request) {
  const esperada = process.env.ADMIN_API_KEY;
  const recebida = request.headers.get('x-admin-key') || '';
  if (!esperada) {
    return NextResponse.json({ mensagem: 'Configure ADMIN_API_KEY para habilitar o gerenciamento de usuários.' }, { status: 503 });
  }
  const a = Buffer.from(esperada);
  const b = Buffer.from(recebida);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ mensagem: 'Acesso não autorizado.' }, { status: 401 });
  }
  return null;
}

export async function gerarHashSenha(senha) {
  const sal = randomBytes(16).toString('hex');
  const hash = await scrypt(senha, sal, 64);
  return `scrypt:${sal}:${hash.toString('hex')}`;
}
