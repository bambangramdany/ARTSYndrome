import './globals.css';

export const metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://artsyndrome.id'),
  title: 'ARTSYndrome · Ruang temu seni visual',
  description: 'ARTSYndrome mempertemukan seniman, penikmat seni, dan mereka yang baru ingin mengenal seni visual.',
  icons: { icon: '/logo-black.svg' },
  robots: { index: true, follow: true }
};

export const viewport = { width: 'device-width', initialScale: 1, themeColor: '#FFFFFF' };

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Archivo:wght@400;500;600;700;800&family=IBM+Plex+Mono:wght@400;500&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
