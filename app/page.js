import { PublicShell } from '../components/Shell';
import GuestForm from '../components/GuestForm';
import { currentExhibition } from '../lib/db';
import { fmtRange } from '../lib/util';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const ex = await currentExhibition();
  // Poster tampil di kolom info saat layar lebar, dan di bawah form saat layar sempit
  // (ponsel/tablet tegak), supaya tamu walk-in langsung melihat form buku tamu.
  const poster = (cls) => ex.poster_url ? (
    <figure className={cls} style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 12 }}>
      <img src={ex.poster_url} alt={ex.poster_caption || `${ex.title} · ${ex.artist}`} loading="lazy" style={{ width: '100%', height: 'auto', display: 'block' }} />
      {ex.poster_caption ? <figcaption className="small" style={{ color: '#444' }}>{ex.poster_caption}</figcaption> : null}
    </figure>
  ) : null;
  return (
    <PublicShell exhibition={ex}>
      <div className="wrap split">
        <section className="info" aria-labelledby="judul-pameran">
          <p className="eyebrow">Pameran · {fmtRange(ex.starts_on, ex.ends_on)}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 id="judul-pameran" className="display">{ex.title}</h1>
            <p className="artist">{ex.artist}</p>
          </div>
          {poster('poster-wide')}
          <dl className="meta">
            <div><dt>Tempat</dt><dd>{ex.venue}</dd></div>
            <div><dt>Kolaborasi</dt><dd>ARTSYndrome × {ex.artist}</dd></div>
            {ex.address ? <div><dt>Alamat</dt><dd style={{ fontWeight: 400 }}>{ex.address}</dd></div> : null}
            {ex.opening_label ? <div><dt>Pembukaan</dt><dd style={{ fontWeight: 400 }}>{ex.opening_label}</dd></div> : null}
          </dl>
          <p style={{ margin: 0, fontSize: 17, lineHeight: 1.6, maxWidth: 560, color: '#222' }}>
            ARTSYndrome mempertemukan seniman, penikmat seni, dan mereka yang baru ingin mengenal seni visual. Kami hadir bersama pameran yang digelar seniman dan komunitas. Seniman dan karyanya tetap yang utama.
          </p>
        </section>
        <section className="side" aria-label="Buku tamu">
          <GuestForm instagram={ex.instagram} privacyContact={ex.privacy_contact} title={ex.title} />
        </section>
        {poster('poster-narrow')}
      </div>
    </PublicShell>
  );
}
