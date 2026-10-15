import './globals.css';

export const metadata = {
  title: 'Saep | Gestão de produtos e estoque',
  description: 'Painel de gestão de produtos, estoque, categorias e usuários.'
};

export default function RootLayout({ children }) {
  return <html lang="pt-BR">
    <head>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
    </head>
    <body>{children}</body>
  </html>;
}
