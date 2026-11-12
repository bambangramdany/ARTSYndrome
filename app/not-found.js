import Link from 'next/link';

export default function NotFound() {
  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div style={{ maxWidth: 440, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <img src="/logo-black.svg" alt="ARTSYndrome" style={{ height: 64, width: 'auto', alignSelf: 'flex-start' }} />
        <h1 className="h2">Halaman tidak ditemukan.</h1>
        <p className="lead">Jika Anda membuka tautan undangan, pastikan tautannya utuh seperti yang kami kirim. Masih bermasalah? Hubungi tim ARTSYndrome.</p>
        <Link href="/" className="btn-line" style={{ alignSelf: 'flex-start' }}>Ke buku tamu</Link>
      </div>
    </main>
  );
}
