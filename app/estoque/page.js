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

export default function EstoquePage() {
  const [produtos, setProdutos] = useState([]);
  const [movimentacoes, setMovimentacoes] = useState([]);
  const [produtoId, setProdutoId] = useState('');
  const [tipo, setTipo] = useState('entrada');
  const [quantidade, setQuantidade] = useState('1');
  const [observacao, setObservacao] = useState('');
  const [aviso, setAviso] = useState('');
  const [carregando, setCarregando] = useState(true);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const [lista, historico] = await Promise.all([pedir('/api/produtos'), pedir('/api/estoque')]);
      setProdutos(lista); setMovimentacoes(historico);
      if (!produtoId && lista.length) setProdutoId(String(lista[0].id));
    } catch (error) { setAviso(error.message); }
    finally { setCarregando(false); }
  }, [produtoId]);
  useEffect(() => { carregar(); }, [carregar]);

  async function registrar(event) {
    event.preventDefault();
    try {
      await pedir('/api/estoque', { method: 'POST', body: JSON.stringify({ produtoId: Number(produtoId), tipo, quantidade: Number(quantidade), observacao }) });
      setObservacao('');
      await carregar();
      setAviso(tipo === 'entrada' ? 'Entrada registrada e saldo atualizado.' : 'Saída registrada e saldo atualizado.');
    } catch (error) { setAviso(error.message); }
  }

  return <AppShell active="estoque" titulo="Estoque" secao="CONTROLE DE ESTOQUE">
    <section className="stats">
      <article className="stat-card"><div className="stat-top"><span>Produtos controlados</span><span className="stat-icon purple">▦</span></div><strong>{carregando ? '—' : produtos.length}</strong><small>Itens no catálogo</small></article>
      <article className="stat-card"><div className="stat-top"><span>Unidades disponíveis</span><span className="stat-icon green">▤</span></div><strong>{carregando ? '—' : produtos.reduce((soma, p) => soma + Number(p.estoque), 0)}</strong><small>Saldo atual somado</small></article>
      <article className="stat-card"><div className="stat-top"><span>Movimentações</span><span className="stat-icon orange">↕</span></div><strong>{carregando ? '—' : movimentacoes.length}</strong><small>Entradas e saídas registradas</small></article>
    </section>
    <section className="panel management-panel"><div className="panel-head"><div><h2>Registrar movimentação</h2><p>O saldo e o histórico são atualizados juntos.</p></div></div>
      <form className="inline-form stock-form" onSubmit={registrar}>
        <label>Produto<select value={produtoId} onChange={(event) => setProdutoId(event.target.value)} required><option value="" disabled>Selecione um produto</option>{produtos.map((p) => <option value={p.id} key={p.id}>{p.nome} · saldo {p.estoque}</option>)}</select></label>
        <label>Movimento<select value={tipo} onChange={(event) => setTipo(event.target.value)}><option value="entrada">Entrada</option><option value="saida">Saída</option></select></label>
        <label>Quantidade<input type="number" min="1" step="1" value={quantidade} onChange={(event) => setQuantidade(event.target.value)} required /></label>
        <label>Observação<input value={observacao} onChange={(event) => setObservacao(event.target.value)} maxLength="255" placeholder="Opcional" /></label>
        <div className="inline-actions"><button className="primary-button" disabled={!produtos.length} type="submit">Registrar {tipo}</button></div>
      </form>
      {aviso && <p className="inline-notice" role="status">{aviso}</p>}
    </section>
    <section className="panel management-panel"><div className="panel-head"><div><h2>Histórico de movimentações</h2><p>Entradas e saídas recentes de todos os produtos.</p></div><button className="secondary-button" onClick={carregar}>Atualizar</button></div>
      <div className="table-wrap"><table><thead><tr><th>DATA</th><th>PRODUTO</th><th>TIPO</th><th>QUANTIDADE</th><th>OBSERVAÇÃO</th></tr></thead><tbody>{movimentacoes.map((mov) => <tr key={mov.id}><td>{new Date(mov.criado_em).toLocaleString('pt-BR')}</td><td>{mov.produto}</td><td><span className={`movement-pill ${mov.tipo}`}>{mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td><td>{mov.quantidade} un.</td><td>{mov.observacao || '—'}</td></tr>)}</tbody></table>
        {!carregando && movimentacoes.length === 0 && <div className="empty"><strong>Nenhuma movimentação registrada</strong><span>Registre uma entrada ou saída para começar o histórico.</span></div>}
      </div>
    </section>
  </AppShell>;
}
