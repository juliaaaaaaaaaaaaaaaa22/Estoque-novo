'use client';

import { useEffect, useState } from 'react';
import AppShell from '../components/AppShell';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const atalhos = [
  { href: '/produtos', icone: '▦', titulo: 'Produtos', texto: 'Cadastre itens, ajuste preços e consulte o saldo atual.' },
  { href: '/estoque', icone: '↕', titulo: 'Estoque', texto: 'Registre entradas e saídas e acompanhe o histórico.' },
  { href: '/categorias', icone: '◇', titulo: 'Categorias', texto: 'Organize o catálogo em grupos de produtos.' },
  { href: '/usuarios', icone: '◈', titulo: 'Usuários', texto: 'Gerencie os acessos da equipe com a chave administrativa.' },
];

async function carregar(url) {
  const response = await fetch(url);
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.mensagem || 'Não foi possível carregar os dados.');
  return body;
}

export default function PainelPage() {
  const [dados, setDados] = useState({ produtos: [], categorias: [], movimentacoes: [] });
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');

  useEffect(() => {
    let ativo = true;
    Promise.all([carregar('/api/produtos'), carregar('/api/categorias'), carregar('/api/estoque')])
      .then(([produtos, categorias, movimentacoes]) => { if (ativo) setDados({ produtos, categorias, movimentacoes }); })
      .catch((error) => { if (ativo) setErro(error.message); })
      .finally(() => { if (ativo) setCarregando(false); });
    return () => { ativo = false; };
  }, []);

  const unidades = dados.produtos.reduce((soma, produto) => soma + Number(produto.estoque), 0);
  const valor = dados.produtos.reduce((soma, produto) => soma + Number(produto.preco) * Number(produto.estoque), 0);
  const baixo = dados.produtos.filter((produto) => Number(produto.estoque) <= 5).length;

  return <AppShell active="painel" titulo="Painel" secao="VISÃO GERAL">
    <p className="subtitle dashboard-subtitle">Acompanhe sua operação e acesse as áreas de gestão.</p>
    {erro && <div className="inline-notice" role="alert">{erro}</div>}
    <section className="stats dashboard-stats">
      <article className="stat-card"><div className="stat-top"><span>Produtos cadastrados</span><span className="stat-icon purple">▦</span></div><strong>{carregando ? '—' : dados.produtos.length}</strong><small>Itens no catálogo</small></article>
      <article className="stat-card"><div className="stat-top"><span>Unidades em estoque</span><span className="stat-icon green">▤</span></div><strong>{carregando ? '—' : unidades}</strong><small>Saldo somado de todos os produtos</small></article>
      <article className="stat-card"><div className="stat-top"><span>Valor em estoque</span><span className="stat-icon green">↗</span></div><strong>{carregando ? '—' : moeda.format(valor)}</strong><small>Preço multiplicado pelo saldo</small></article>
      <article className="stat-card"><div className="stat-top"><span>Estoque baixo</span><span className="stat-icon orange">⌁</span></div><strong>{carregando ? '—' : baixo}</strong><small>Produtos com até 5 unidades</small></article>
    </section>
    <section className="dashboard-shortcuts"><div className="section-heading"><div><h2>Acessos rápidos</h2><p>Escolha uma área para continuar.</p></div></div><div className="shortcut-grid">{atalhos.map((atalho) => <a className="shortcut-card" href={atalho.href} key={atalho.href}><span className="shortcut-icon">{atalho.icone}</span><span className="shortcut-copy"><strong>{atalho.titulo}</strong><small>{atalho.texto}</small></span><span className="shortcut-arrow">↗</span></a>)}</div></section>
    <section className="panel management-panel"><div className="panel-head"><div><h2>Movimentações recentes</h2><p>Últimas entradas e saídas registradas.</p></div><a className="secondary-button dashboard-link" href="/estoque">Ver estoque</a></div>
      <div className="table-wrap"><table><thead><tr><th>DATA</th><th>PRODUTO</th><th>MOVIMENTO</th><th>QUANTIDADE</th><th>OBSERVAÇÃO</th></tr></thead><tbody>{dados.movimentacoes.slice(0, 6).map((mov) => <tr key={mov.id}><td>{new Date(mov.criado_em).toLocaleString('pt-BR')}</td><td>{mov.produto}</td><td><span className={`movement-pill ${mov.tipo}`}>{mov.tipo === 'entrada' ? 'Entrada' : 'Saída'}</span></td><td>{mov.quantidade} un.</td><td>{mov.observacao || '—'}</td></tr>)}</tbody></table>
        {!carregando && !dados.movimentacoes.length && <div className="empty"><strong>Sem movimentações ainda</strong><span>Quando registrar uma entrada ou saída, ela aparecerá aqui.</span></div>}
      </div>
    </section>
    <p className="dashboard-category-count">Categorias cadastradas: <strong>{carregando ? '—' : dados.categorias.length}</strong></p>
  </AppShell>;
}
