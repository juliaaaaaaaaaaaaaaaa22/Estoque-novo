'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

const moeda = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const icones = ['▣', '◇', '▤', '◈', '▧', '⌂'];

async function pedir(url, options = {}) {
  const response = await fetch(url, { headers: { 'Content-Type': 'application/json' }, ...options });
  if (!response.ok) {
    const result = await response.json().catch(() => ({}));
    throw new Error(result.mensagem || 'Não foi possível concluir a operação.');
  }
  return response.status === 204 ? null : response.json();
}

export default function ProdutosPage() {
  const [produtos, setProdutos] = useState([]);
  const [busca, setBusca] = useState('');
  const [carregando, setCarregando] = useState(true);
  const [erro, setErro] = useState('');
  const [aviso, setAviso] = useState('');
  const [produtoEditando, setProdutoEditando] = useState(null);
  const [salvando, setSalvando] = useState(false);
  const dialog = useRef(null);
  const form = useRef(null);

  const carregar = useCallback(async () => {
    setCarregando(true);
    try {
      const dados = await pedir('/api/produtos');
      setProdutos(dados);
      setErro('');
    } catch (error) {
      setErro(error.message);
    } finally {
      setCarregando(false);
    }
  }, []);

  useEffect(() => { carregar(); }, [carregar]);
  useEffect(() => {
    if (!aviso) return undefined;
    const timer = setTimeout(() => setAviso(''), 2800);
    return () => clearTimeout(timer);
  }, [aviso]);
  useEffect(() => {
    function atalho(event) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        document.querySelector('#busca')?.focus();
      }
    }
    document.addEventListener('keydown', atalho);
    return () => document.removeEventListener('keydown', atalho);
  }, []);

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase('pt-BR');
    if (!termo) return produtos;
    return produtos.filter((produto) => `${produto.nome} ${produto.categoria || ''}`.toLocaleLowerCase('pt-BR').includes(termo));
  }, [produtos, busca]);
  const totalEstoque = useMemo(() => produtos.reduce((total, produto) => total + Number(produto.preco) * Number(produto.estoque), 0), [produtos]);
  const estoqueBaixo = useMemo(() => produtos.filter((produto) => Number(produto.estoque) <= 5).length, [produtos]);

  function abrirNovo() {
    setProdutoEditando(null);
    form.current?.reset();
    dialog.current?.showModal();
    setTimeout(() => document.querySelector('#nome')?.focus(), 0);
  }
  function abrirEdicao(produto) {
    setProdutoEditando(produto);
    dialog.current?.showModal();
  }
  async function salvar(event) {
    event.preventDefault();
    const dados = Object.fromEntries(new FormData(event.currentTarget));
    dados.preco = Number(dados.preco);
    dados.estoque = Number(dados.estoque);
    setSalvando(true);
    try {
      await pedir(produtoEditando ? `/api/produtos/${produtoEditando.id}` : '/api/produtos', {
        method: produtoEditando ? 'PUT' : 'POST', body: JSON.stringify(dados)
      });
      dialog.current?.close();
      setAviso(produtoEditando ? 'Produto atualizado.' : 'Produto cadastrado.');
      await carregar();
    } catch (error) {
      setAviso(error.message);
    } finally {
      setSalvando(false);
    }
  }
  async function excluir(produto) {
    if (!window.confirm(`Excluir "${produto.nome}"? Esta ação não pode ser desfeita.`)) return;
    try {
      await pedir(`/api/produtos/${produto.id}`, { method: 'DELETE' });
      setAviso('Produto excluído.');
      await carregar();
    } catch (error) {
      setAviso(error.message);
    }
  }

  return <div className="layout">
    <aside className="sidebar">
      <a className="brand" href="#"><span className="brand-mark">S</span><span>saep<span className="brand-dot">.</span></span></a>
      <div className="workspace-label">ESPAÇO DE TRABALHO</div>
      <div className="workspace"><span className="workspace-icon">⌂</span><span>Minha loja</span><span className="chevron">⌄</span></div>
      <div className="nav-label">MENU PRINCIPAL</div>
      <nav><a className="nav-item active" href="#produtos"><span className="nav-icon">▦</span> Produtos</a><a className="nav-item muted" href="#produtos"><span className="nav-icon">▤</span> Estoque</a></nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">?</span><strong>Precisa de ajuda?</strong><span>Estamos aqui para você.</span><a href="mailto:suporte@saep.com">Fale com o suporte <span>↗</span></a></div><div className="profile"><div className="avatar">JD</div><div className="profile-copy"><strong>João da Silva</strong><span>Administrador</span></div><button className="more-button" aria-label="Mais opções">···</button></div></div>
    </aside>
    <main className="main" id="produtos">
      <header className="topbar"><div className="breadcrumb">Painel <span>/</span> <strong>Produtos</strong></div><div className="top-actions"><span className="status-dot"></span><span className="top-status">Sistema online</span><button className="icon-button" aria-label="Notificações">♧<i /></button><div className="top-avatar">JD</div></div></header>
      <section className="content">
        <div className="heading-row"><div><div className="eyebrow"><span className="eyebrow-icon">▦</span> CATÁLOGO</div><h1>Produtos</h1><p className="subtitle">Gerencie os produtos e acompanhe seu estoque.</p></div><button className="primary-button" onClick={abrirNovo}><span>＋</span> Novo produto</button></div>
        <div className="stats"><article className="stat-card"><div className="stat-top"><span>Total de produtos</span><span className="stat-icon purple">▦</span></div><strong>{carregando ? '—' : produtos.length}</strong><small>Itens cadastrados</small></article><article className="stat-card"><div className="stat-top"><span>Valor em estoque</span><span className="stat-icon green">↗</span></div><strong>{carregando ? '—' : moeda.format(totalEstoque)}</strong><small>Valor total dos produtos</small></article><article className="stat-card"><div className="stat-top"><span>Estoque baixo</span><span className="stat-icon orange">⌁</span></div><strong>{carregando ? '—' : estoqueBaixo}</strong><small>Produtos com até 5 unidades</small></article></div>
        <section className="panel"><div className="panel-head"><div><h2>Todos os produtos</h2><p>Veja e gerencie os produtos cadastrados.</p></div><label className="search"><span>⌕</span><input id="busca" type="search" placeholder="Buscar produto..." value={busca} onChange={(event) => setBusca(event.target.value)} autoComplete="off"/><kbd>⌘ K</kbd></label></div>
          <div className="table-wrap"><table className={filtrados.length ? '' : 'hidden'}><thead><tr><th>PRODUTO</th><th>CATEGORIA</th><th>PREÇO</th><th>ESTOQUE</th><th /></tr></thead><tbody>{filtrados.map((produto, index) => <tr key={produto.id}><td><div className="product-cell"><div className="product-thumb">{icones[index % icones.length]}</div><div className="product-copy"><span>{String(produto.nome)}</span>{produto.descricao && <small>{String(produto.descricao)}</small>}</div></div></td><td><span className="category-pill">{String(produto.categoria || 'Sem categoria')}</span></td><td className="price">{moeda.format(Number(produto.preco))}</td><td><span className={`stock ${Number(produto.estoque) <= 5 ? 'low' : ''}`}><i className="stock-dot" />{Number(produto.estoque)} un.</span></td><td><div className="row-actions"><button onClick={() => abrirEdicao(produto)} aria-label={`Editar ${produto.nome}`} title="Editar">✎</button><button className="delete" onClick={() => excluir(produto)} aria-label={`Excluir ${produto.nome}`} title="Excluir">⌫</button></div></td></tr>)}</tbody></table>
            {erro ? <div className="empty"><div className="empty-icon">!</div><strong>Não foi possível carregar</strong><span>{erro}</span><button className="secondary-button" onClick={carregar}>Tentar novamente</button></div> : !carregando && filtrados.length === 0 ? <div className="empty"><div className="empty-icon">▦</div><strong>{busca ? 'Nenhum produto encontrado' : 'Nenhum produto por aqui'}</strong><span>{busca ? 'Tente outro termo de busca.' : 'Adicione seu primeiro produto para organizar o catálogo.'}</span>{!busca && <button className="secondary-button" onClick={abrirNovo}>＋ Adicionar produto</button>}</div> : null}
          </div><div className="table-foot"><span>{carregando ? 'Carregando produtos...' : `${filtrados.length} ${filtrados.length === 1 ? 'produto' : 'produtos'} encontrados`}</span><span>Atualizado agora <span className="refresh">↻</span></span></div>
        </section><footer>© 2024 Saep <span>·</span> Feito para simplificar sua gestão.</footer>
      </section>
    </main>
    <div className={`toast ${aviso ? 'show' : ''}`} role="status">{aviso}</div>
    <dialog ref={dialog} onClick={(event) => { if (event.target === dialog.current) dialog.current.close(); }}><form ref={form} onSubmit={salvar} key={produtoEditando?.id || 'novo'}><div className="modal-head"><div><span className="eyebrow">CATÁLOGO</span><h2>{produtoEditando ? 'Editar produto' : 'Novo produto'}</h2><p>Preencha os dados do produto abaixo.</p></div><button type="button" className="close-button" onClick={() => dialog.current?.close()} aria-label="Fechar">×</button></div>
      <label>Nome do produto<input id="nome" name="nome" maxLength="120" placeholder="Ex.: Cadeira de escritório" defaultValue={produtoEditando?.nome || ''} required /></label>
      <label>Descrição <span className="optional">· opcional</span><textarea name="descricao" maxLength="500" rows="3" placeholder="Descreva o produto..." defaultValue={produtoEditando?.descricao || ''} /></label>
      <div className="form-grid"><label>Categoria<input name="categoria" maxLength="80" placeholder="Ex.: Móveis" defaultValue={produtoEditando?.categoria || ''} /></label><label>Preço (R$)<input name="preco" type="number" min="0" step="0.01" placeholder="0,00" defaultValue={produtoEditando?.preco ?? ''} required /></label><label>Quantidade em estoque<input name="estoque" type="number" min="0" step="1" placeholder="0" defaultValue={produtoEditando?.estoque ?? ''} required /></label></div>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={() => dialog.current?.close()}>Cancelar</button><button className="primary-button" type="submit" disabled={salvando}>{salvando ? 'Salvando...' : produtoEditando ? 'Salvar alterações' : 'Salvar produto'}</button></div>
    </form></dialog>
  </div>;
}
