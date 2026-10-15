'use client';

import { useCallback, useEffect, useState } from 'react';
import AppShell from '../../components/AppShell';

async function pedir(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) {
    const body = await response.json().catch(() => ({}));
    throw new Error(body.mensagem || 'Não foi possível concluir a operação.');
  }
  return response.status === 204 ? null : response.json();
}

export default function CategoriasPage() {
  const [categorias, setCategorias] = useState([]);
  const [editando, setEditando] = useState(null);
  const [nome, setNome] = useState('');
  const [descricao, setDescricao] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try { setCategorias(await pedir('/api/categorias')); }
    catch (error) { setAviso(error.message); }
    finally { setCarregando(false); }
  }, []);
  useEffect(() => { carregar(); }, [carregar]);

  async function salvar(event) {
    event.preventDefault();
    try {
      await pedir(editando ? `/api/categorias/${editando.id}` : '/api/categorias', {
        method: editando ? 'PUT' : 'POST', body: JSON.stringify({ nome, descricao })
      });
      setNome(''); setDescricao(''); setEditando(null);
      setAviso(editando ? 'Categoria atualizada.' : 'Categoria criada.');
      await carregar();
    } catch (error) { setAviso(error.message); }
  }
  function editar(categoria) { setEditando(categoria); setNome(categoria.nome); setDescricao(categoria.descricao || ''); }
  async function excluir(categoria) {
    if (!window.confirm(`Excluir a categoria “${categoria.nome}”?`)) return;
    try { await pedir(`/api/categorias/${categoria.id}`, { method: 'DELETE' }); setAviso('Categoria excluída.'); await carregar(); }
    catch (error) { setAviso(error.message); }
  }

  return <AppShell active="categorias" titulo="Categorias" secao="ORGANIZAÇÃO">
    <section className="panel management-panel">
      <div className="panel-head"><div><h2>{editando ? 'Editar categoria' : 'Nova categoria'}</h2><p>Organize os produtos por grupos.</p></div></div>
      <form className="inline-form" onSubmit={salvar}>
        <label>Nome<input value={nome} onChange={(event) => setNome(event.target.value)} maxLength="80" required placeholder="Ex.: Limpeza" /></label>
        <label>Descrição<input value={descricao} onChange={(event) => setDescricao(event.target.value)} maxLength="255" placeholder="Descrição opcional" /></label>
        <div className="inline-actions"><button className="primary-button" type="submit">{editando ? 'Salvar' : 'Adicionar'}</button>{editando && <button type="button" className="secondary-button" onClick={() => { setEditando(null); setNome(''); setDescricao(''); }}>Cancelar</button>}</div>
      </form>
    </section>
    <section className="panel management-panel"><div className="panel-head"><div><h2>Categorias cadastradas</h2><p>{categorias.length} no total</p></div></div>
      {aviso && <p className="inline-notice" role="status">{aviso}</p>}
      <div className="table-wrap"><table><thead><tr><th>CATEGORIA</th><th>DESCRIÇÃO</th><th>PRODUTOS</th><th /></tr></thead><tbody>{categorias.map((categoria) => <tr key={categoria.id}><td>{categoria.nome}</td><td>{categoria.descricao || '—'}</td><td>{categoria.total_produtos}</td><td><div className="row-actions"><button onClick={() => editar(categoria)} aria-label={`Editar ${categoria.nome}`}>✎</button><button className="delete" onClick={() => excluir(categoria)} aria-label={`Excluir ${categoria.nome}`}>⌫</button></div></td></tr>)}</tbody></table>
        {!carregando && categorias.length === 0 && <div className="empty"><strong>Nenhuma categoria cadastrada</strong><span>Crie uma categoria usando o formulário acima.</span></div>}
      </div>
    </section>
  </AppShell>;
}
