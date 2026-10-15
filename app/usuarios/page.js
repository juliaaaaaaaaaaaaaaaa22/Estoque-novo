'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';

export default function UsuariosPage() {
  const [chave, setChave] = useState('');
  const [entradaChave, setEntradaChave] = useState('');
  const [usuarios, setUsuarios] = useState([]);
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [papel, setPapel] = useState('operador');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(false);

  const pedir = useCallback(async (url, options = {}) => {
    const response = await fetch(url, {
      ...options,
      headers: { 'Content-Type': 'application/json', 'x-admin-key': chave, ...options.headers },
    });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      throw new Error(body.mensagem || 'Não foi possível concluir a operação.');
    }
    return response.status === 204 ? null : response.json();
  }, [chave]);

  const carregar = useCallback(async () => {
    if (!chave) { setCarregando(false); return; }
    setCarregando(true);
    try { setUsuarios(await pedir('/api/usuarios')); setAviso(''); }
    catch (error) { setAviso(error.message); }
    finally { setCarregando(false); }
  }, [chave, pedir]);

  useEffect(() => {
    const salva = window.sessionStorage.getItem('saep-admin-key') || '';
    setChave(salva); setEntradaChave(salva);
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  function salvarChave(event) {
    event.preventDefault();
    const valor = entradaChave.trim();
    window.sessionStorage.setItem('saep-admin-key', valor);
    setChave(valor);
  }

  async function criarUsuario(event) {
    event.preventDefault();
    try {
      await pedir('/api/usuarios', { method: 'POST', body: JSON.stringify({ nome, email, senha, papel }) });
      setNome(''); setEmail(''); setSenha(''); setPapel('operador');
      await carregar(); setAviso('Usuário cadastrado.');
    } catch (error) { setAviso(error.message); }
  }

  async function alternarAtivo(usuario) {
    try {
      await pedir(`/api/usuarios/${usuario.id}`, { method: 'PUT', body: JSON.stringify({ nome: usuario.nome, email: usuario.email, papel: usuario.papel, ativo: !usuario.ativo }) });
      await carregar(); setAviso('Status do usuário atualizado.');
    } catch (error) { setAviso(error.message); }
  }

  async function excluir(usuario) {
    if (!window.confirm(`Excluir o usuário ${usuario.email}?`)) return;
    try { await pedir(`/api/usuarios/${usuario.id}`, { method: 'DELETE' }); await carregar(); setAviso('Usuário excluído.'); }
    catch (error) { setAviso(error.message); }
  }

  return <AppShell active="usuarios" titulo="Usuários" secao="ACESSO E EQUIPE">
    <section className="panel management-panel"><div className="panel-head"><div><h2>Chave de administração</h2><p>Necessária para consultar e gerenciar usuários.</p></div></div>
      <form className="inline-form key-form" onSubmit={salvarChave}><label>ADMIN_API_KEY<input type="password" autoComplete="current-password" value={entradaChave} onChange={(event) => setEntradaChave(event.target.value)} placeholder="Informe a chave configurada no servidor" required /></label><div className="inline-actions"><button className="primary-button" type="submit">Conectar</button><button type="button" className="secondary-button" onClick={() => { window.sessionStorage.removeItem('saep-admin-key'); setChave(''); setEntradaChave(''); setUsuarios([]); }}>Limpar</button></div></form>
    </section>
    <section className="panel management-panel"><div className="panel-head"><div><h2>Novo usuário</h2><p>As senhas são armazenadas como hash no servidor.</p></div></div>
      <form className="inline-form user-form" onSubmit={criarUsuario}>
        <label>Nome<input value={nome} onChange={(event) => setNome(event.target.value)} maxLength="120" required /></label>
        <label>E-mail<input type="email" value={email} onChange={(event) => setEmail(event.target.value)} maxLength="190" required /></label>
        <label>Senha<input type="password" value={senha} onChange={(event) => setSenha(event.target.value)} minLength="10" autoComplete="new-password" required /></label>
        <label>Perfil<select value={papel} onChange={(event) => setPapel(event.target.value)}><option value="operador">Operador</option><option value="admin">Administrador</option></select></label>
        <div className="inline-actions"><button className="primary-button" type="submit" disabled={!chave}>Cadastrar usuário</button></div>
      </form>
      {aviso && <p className="inline-notice" role="status">{aviso}</p>}
    </section>
    <section className="panel management-panel"><div className="panel-head"><div><h2>Usuários cadastrados</h2><p>{usuarios.length} no total</p></div></div>
      <div className="table-wrap"><table><thead><tr><th>NOME</th><th>E-MAIL</th><th>PERFIL</th><th>STATUS</th><th /></tr></thead><tbody>{usuarios.map((usuario) => <tr key={usuario.id}><td>{usuario.nome}</td><td>{usuario.email}</td><td>{usuario.papel === 'admin' ? 'Administrador' : 'Operador'}</td><td>{usuario.ativo ? 'Ativo' : 'Inativo'}</td><td><div className="row-actions"><button title={usuario.ativo ? 'Desativar' : 'Ativar'} onClick={() => alternarAtivo(usuario)}>{usuario.ativo ? '◌' : '✓'}</button><button className="delete" title="Excluir" onClick={() => excluir(usuario)}>⌫</button></div></td></tr>)}</tbody></table>
        {!carregando && chave && usuarios.length === 0 && <div className="empty"><strong>Nenhum usuário cadastrado</strong><span>Use o formulário acima para adicionar a equipe.</span></div>}
      </div>
      {!chave && <div className="empty"><strong>Conecte-se para ver os usuários</strong><span>Informe a chave de administração configurada no servidor.</span></div>}
    </section>
  </AppShell>;
}
