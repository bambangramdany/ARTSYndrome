import Link from 'next/link';
import { notFound } from 'next/navigation';
import { isAdmin } from '../../../lib/auth';
import { db } from '../../../lib/db';
import { fmtTime } from '../../../lib/util';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Check-in · ARTSYndrome', robots: { index: false, follow: false } };

const RSVP = { yes: 'Konfirmasi hadir', maybe: 'Belum pasti', no: 'Sempat menjawab berhalangan' };

export default async function CheckIn({ params, searchParams }) {
  const code = String(params.code || '').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 16);
  const { data: inv } = await db().from('invitations').select('*, exhibitions(title)').eq('code', code).maybeSingle();
  if (!inv) notFound();
  const admin = isAdmin();

  return (
    <main style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
      <div className="panel" style={{ width: '100%', maxWidth: 480 }}>
        <img src="/logo-black.svg" alt="ARTSYndrome" style={{ height: 52, width: 'auto', alignSelf: 'flex-start' }} />
        {!admin ? (
          <>
            <h1 className="h2">Tunjukkan kode ini kepada petugas.</h1>
            <p className="lead">Petugas di meja tamu akan memindai kode QR Anda untuk mencatat kehadiran.</p>
            <p className="mono" style={{ margin: 0, fontSize: 18, letterSpacing: '.12em' }}>{inv.code}</p>
            <Link className="btn-line" style={{ alignSelf: 'flex-start' }} href={'/admin/login?next=' + encodeURIComponent('/c/' + inv.code)}>Saya petugas</Link>
          </>
        ) : (
          <>
            <p className="eyebrow" style={{ fontSize: 12 }}>Check-in · {inv.exhibitions?.title}</p>
            <h1 className="big" style={{ fontSize: 40 }}>{inv.name}</h1>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className={inv.category === 'VIP' ? 't-accent' : inv.category === 'Media' ? 't-solid' : 't-line'}>{inv.category}</span>
              {inv.organization ? <span style={{ fontSize: 16 }}>{inv.organization}</span> : null}
            </div>
            <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5 }}>
              {RSVP[inv.rsvp] || 'Belum konfirmasi'}{inv.rsvp === 'yes' ? ` · ${inv.rsvp_guests || 1} orang` : ''}
              {inv.companion ? <><br />Pendamping: {inv.companion}</> : null}
            </p>
            {inv.checked_in_at ? (
              <div style={{ background: '#111', color: '#fff', padding: '20px', display: 'flex', flexDirection: 'column', gap: 4 }} role="status">
                <strong style={{ fontSize: 22 }}>{searchParams.done ? 'Berhasil, sudah tercatat.' : 'Sudah check-in sebelumnya.'}</strong>
                <span className="mono" style={{ color: '#ddd' }}>{fmtTime(inv.checked_in_at)}</span>
              </div>
            ) : (
              <form method="post" action="/api/admin/checkin">
                <input type="hidden" name="code" value={inv.code} />
                <button type="submit" className="btn" style={{ width: '100%' }}>Catat kehadiran</button>
              </form>
            )}
            <Link className="btn-line" style={{ alignSelf: 'flex-start' }} href="/admin/undangan">Ke daftar undangan</Link>
          </>
        )}
      </div>
    </main>
  );
}
