import QRCode from 'qrcode';
import { AdminShell } from '../../../components/Shell';
import PrintButton from '../../../components/PrintButton';
import { requireAdmin } from '../../../lib/auth';
import { currentExhibition, siteUrl } from '../../../lib/db';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'QR buku tamu · ARTSYndrome', robots: { index: false, follow: false } };

export default async function QrPoster() {
  requireAdmin('/admin/qr');
  const ex = await currentExhibition();
  const url = siteUrl();
  const svg = await QRCode.toString(url, { type: 'svg', margin: 0, errorCorrectionLevel: 'H', color: { dark: '#111111', light: '#FFFFFF' } });

  return (
    <AdminShell active="/admin/qr">
      <div className="noprint admin-head" style={{ alignItems: 'center' }}>
        <p className="lead" style={{ maxWidth: 640 }}>Cetak poster ini (A4 atau A3) dan pasang di pintu masuk serta meja tamu. Tamu kasual cukup memindai dengan kamera ponsel.</p>
        <PrintButton />
      </div>
      <article style={{ maxWidth: 640, margin: '32px auto 0', border: '1px solid #111', padding: '56px 48px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28, textAlign: 'center', breakInside: 'avoid' }}>
        <img src="/logo-black.svg" alt="ARTSYndrome" style={{ height: 120, width: 'auto' }} />
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p className="eyebrow">Buku Tamu</p>
          <h1 className="display" style={{ fontSize: 64 }}>{ex.title}</h1>
          <p className="artist">{ex.artist}</p>
        </div>
        <div style={{ width: 320, height: 320 }} role="img" aria-label={`Kode QR ke ${url}`} dangerouslySetInnerHTML={{ __html: svg.replace('<svg', '<svg width="100%" height="100%"') }} />
        <p style={{ margin: 0, fontSize: 22, fontWeight: 700, letterSpacing: '-.01em' }}>Pindai untuk mengisi buku tamu</p>
        <p className="mono" style={{ margin: 0, fontSize: 16 }}>{url.replace(/^https?:\/\//, '')}</p>
      </article>
    </AdminShell>
  );
}
