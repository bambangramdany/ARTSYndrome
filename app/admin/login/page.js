export const metadata = { title: 'Masuk admin · ARTSYndrome', robots: { index: false, follow: false } };

export default function Login({ searchParams }) {
  const next = typeof searchParams.next === 'string' && searchParams.next.startsWith('/') ? searchParams.next : '/admin';
  const failed = searchParams.e === '1';
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <form method="post" action="/api/admin/login" className="panel" style={{ width: '100%', maxWidth: 420 }}>
        <img src="/logo-black.svg" alt="ARTSYndrome" style={{ height: 56, width: 'auto', alignSelf: 'flex-start' }} />
        <h1 className="h2" style={{ fontSize: 28 }}>Masuk admin</h1>
        <input type="hidden" name="next" value={next} />
        <div className="field">
          <label htmlFor="pw">Kata sandi</label>
          <input id="pw" name="password" type="password" className="input" autoComplete="current-password" required autoFocus />
        </div>
        {failed ? <p className="error" role="alert">Kata sandi salah.</p> : null}
        <button type="submit" className="btn">Masuk</button>
      </form>
    </main>
  );
}
