import Link from 'next/link';

export function PublicShell({ children, exhibition }) {
  return (
    <div className="site">
      <header className="top">
        <div className="wrap">
          <Link href="/" aria-label="ARTSYndrome, beranda">
            <img className="logo" src="/logo-black.svg" alt="ARTSYndrome" width="117" height="52" />
          </Link>
          {exhibition ? (
            <span className="eyebrow" style={{ fontSize: 12 }}>{exhibition.title} · {exhibition.venue}</span>
          ) : null}
        </div>
      </header>
      <main>{children}</main>
      <footer className="foot">
        <div className="wrap">
          <span>ARTSYndrome · Ruang temu seni visual · <Link href="/liputan">Liputan media</Link></span>
          <span>© 2026 ARTSYndrome</span>
        </div>
      </footer>
    </div>
  );
}

export function AdminShell({ children, active }) {
  const items = [
    ['/admin', 'Tamu'],
    ['/admin/undangan', 'Undangan'],
    ['/admin/liputan', 'Liputan'],
    ['/admin/qr', 'QR Buku Tamu']
  ];
  return (
    <div className="site">
      <header className="top noprint">
        <div className="wrap">
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <Link href="/admin"><img className="logo" style={{ height: 44 }} src="/logo-black.svg" alt="ARTSYndrome" /></Link>
            <span className="tag">Admin</span>
          </div>
          <nav aria-label="Navigasi admin">
            {items.map(([href, label]) => (
              <Link key={href} href={href} aria-current={active === href ? 'page' : undefined}>{label}</Link>
            ))}
            <a href="/api/admin/logout">Keluar</a>
          </nav>
        </div>
      </header>
      <main className="wrap" style={{ paddingBottom: 64 }}>{children}</main>
    </div>
  );
}
