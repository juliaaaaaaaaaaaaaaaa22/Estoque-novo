export default function AppShell({ active, titulo, secao, children }) {
  const itens = [
    ['painel', '/', '⌂', 'Painel'],
    ['produtos', '/produtos', '▦', 'Produtos'],
    ['estoque', '/estoque', '▤', 'Estoque'],
    ['categorias', '/categorias', '◇', 'Categorias'],
    ['usuarios', '/usuarios', '◈', 'Usuários'],
  ];
  return <div className="layout">
    <aside className="sidebar">
      <a className="brand" href="/"><span className="brand-mark">S</span><span>saep<span className="brand-dot">.</span></span></a>
      <div className="workspace-label">ESPAÇO DE TRABALHO</div>
      <div className="workspace"><span className="workspace-icon">⌂</span><span>Minha loja</span><span className="chevron">⌄</span></div>
      <div className="nav-label">MENU PRINCIPAL</div>
      <nav>{itens.map(([id, href, icone, nome]) => <a className={`nav-item ${active === id ? 'active' : ''}`} href={href} key={id}><span className="nav-icon">{icone}</span>{nome}</a>)}</nav>
      <div className="sidebar-bottom"><div className="help-card"><span className="help-icon">?</span><strong>Precisa de ajuda?</strong><span>Estamos aqui para você.</span><a href="mailto:suporte@saep.com">Fale com o suporte <span>↗</span></a></div><div className="profile"><div className="avatar">SA</div><div className="profile-copy"><strong>Gestão Saep</strong><span>Painel administrativo</span></div></div></div>
    </aside>
    <main className="main">
      <header className="topbar"><div className="breadcrumb">Painel <span>/</span> <strong>{titulo}</strong></div><div className="top-actions"><span className="status-dot"></span><span className="top-status">Sistema online</span></div></header>
      <section className="content">
        <div className="heading-row"><div><div className="eyebrow"><span className="eyebrow-icon">◇</span> {secao}</div><h1>{titulo}</h1></div></div>
        {children}
        <footer>© 2026 Saep <span>·</span> Feito para simplificar sua gestão.</footer>
      </section>
    </main>
  </div>;
}
