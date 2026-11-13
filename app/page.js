import Link from 'next/link';
import { PublicShell } from '../components/Shell';
import { ArtistCard, ExhibitionCard, PressCard } from '../components/Cards';
import { guestbookOpen, listArtists, listExhibitions, listPress } from '../lib/catalog';

export const dynamic = 'force-dynamic';

export default async function Home() {
  const [exhibitions, artists, press] = await Promise.all([listExhibitions(), listArtists(), listPress({ limit: 3 })]);
  const current = exhibitions.filter((e) => e.status !== 'past').sort((a, b) => (a.starts_on || '').localeCompare(b.starts_on || ''));
  const past = exhibitions.filter((e) => e.status === 'past');

  return (
    <PublicShell active="/">
      <section className="wrap home-hero">
        <p className="eyebrow">Ruang temu seni visual</p>
        <h1 className="display home-title">ARTSYndrome</h1>
        <p className="home-lead">Kami mempertemukan seniman visual, penikmat seni, dan mereka yang baru ingin mengenal seni, supaya semuanya bisa bertemu dan saling mengenal.</p>
      </section>

      {current.length ? (
        <section className="wrap home-block" aria-labelledby="h-pameran">
          <div className="block-head"><h2 id="h-pameran" className="h2">Pameran</h2><Link className="mono-link" href="/pameran">Semua pameran →</Link></div>
          <div className="ex-list">
            {current.map((ex) => <ExhibitionCard key={ex.id} ex={ex} showGuestbook={guestbookOpen(ex)} />)}
          </div>
        </section>
      ) : null}

      <section className="wrap home-block home-about" aria-labelledby="h-tentang">
        <h2 id="h-tentang" className="h2">Tentang ARTSYndrome</h2>
        <div className="about-cols">
          <div>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Kenapa kami ada</p>
            <p className="about-p">Ruang untuk berkesenian masih terbatas. Seniman masih sulit mendapat tempat memamerkan karya, jaringan, dan penonton. Di sisi lain, banyak orang belum terbiasa dan merasa galeri bukan tempat untuk mereka.</p>
          </div>
          <div>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Untuk siapa</p>
            <p className="about-p">Ketertarikan pada seni visual masih besar, terutama di kalangan Gen Z. Mereka penasaran, tetapi belum tentu tahu harus mulai dari mana. ARTSYndrome menjembatani seniman, penikmat seni, dan mereka yang baru ingin mengenal seni.</p>
          </div>
          <div>
            <p className="eyebrow" style={{ marginBottom: 10 }}>Cara kami bekerja</p>
            <p className="about-p">Kami hadir bersama pameran yang digelar seniman dan komunitas, mendukung karya yang sudah ada agar lebih dekat dengan penonton. Seniman dan karyanya tetap yang utama.</p>
          </div>
        </div>
      </section>

      {artists.length ? (
        <section className="wrap home-block" aria-labelledby="h-seniman">
          <div className="block-head"><h2 id="h-seniman" className="h2">Seniman</h2><Link className="mono-link" href="/seniman">Semua seniman →</Link></div>
          <div className="artist-grid">{artists.slice(0, 6).map((a) => <ArtistCard key={a.id} a={a} />)}</div>
        </section>
      ) : null}

      {press.length ? (
        <section className="wrap home-block" aria-labelledby="h-liputan">
          <div className="block-head"><h2 id="h-liputan" className="h2">Liputan terbaru</h2><Link className="mono-link" href="/liputan">Semua liputan →</Link></div>
          <ul className="press-grid" style={{ marginTop: 0 }}>{press.map((r) => <PressCard key={r.id} r={r} showExhibition />)}</ul>
        </section>
      ) : null}

      {past.length ? (
        <section className="wrap home-block" aria-labelledby="h-arsip">
          <div className="block-head"><h2 id="h-arsip" className="h2">Arsip pameran</h2></div>
          <div className="ex-list">{past.slice(0, 4).map((ex) => <ExhibitionCard key={ex.id} ex={ex} />)}</div>
        </section>
      ) : null}

      <section className="wrap home-block">
        <div className="cta-band">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <h2 className="h2">Ingin diundang ke pameran berikutnya?</h2>
            <p className="lead">Tinggalkan kontak, kami kabari agenda pameran ARTSYndrome yang akan datang.</p>
          </div>
          <Link className="btn" href="/undangan" style={{ height: 56, fontSize: 17 }}>Minta undangan</Link>
        </div>
      </section>
    </PublicShell>
  );
}
