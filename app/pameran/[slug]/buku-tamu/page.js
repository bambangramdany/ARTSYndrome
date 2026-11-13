import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PublicShell } from '../../../../components/Shell';
import GuestForm from '../../../../components/GuestForm';
import { artistName } from '../../../../components/Cards';
import { getExhibition, guestbookOpen } from '../../../../lib/catalog';
import { fmtRange } from '../../../../lib/util';

export const dynamic = 'force-dynamic';

export async function generateMetadata({ params }) {
  const ex = await getExhibition(params.slug);
  return { title: ex ? `Buku tamu ${ex.title} · ARTSYndrome` : 'Buku tamu · ARTSYndrome' };
}

export default async function Guestbook({ params }) {
  const ex = await getExhibition(params.slug);
  if (!ex) notFound();
  const open = guestbookOpen(ex);
  const name = artistName(ex);

  return (
    <PublicShell active="/pameran">
      <div className="wrap split guestbook">
        <section className="info" aria-labelledby="judul-pameran">
          <p className="eyebrow">Buku tamu · {fmtRange(ex.starts_on, ex.ends_on)}</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            <h1 id="judul-pameran" className="display">{ex.title}</h1>
            <p className="artist">{name}</p>
          </div>
          <dl className="meta">
            <div><dt>Tempat</dt><dd>{ex.venue}</dd></div>
            <div><dt>Bersama</dt><dd>ARTSYndrome</dd></div>
            {ex.address ? <div><dt>Alamat</dt><dd style={{ fontWeight: 400 }}>{ex.address}</dd></div> : null}
            {ex.opening_label ? <div><dt>Pembukaan</dt><dd style={{ fontWeight: 400 }}>{ex.opening_label}</dd></div> : null}
          </dl>
          <p className="small gb-links"><Link href={`/pameran/${ex.slug}`}>Tentang pameran ini</Link> · <Link href="/">Tentang ARTSYndrome</Link></p>
        </section>
        <section className="side" aria-label="Buku tamu">
          {open ? (
            <GuestForm instagram={ex.instagram} privacyContact={ex.privacy_contact} title={ex.title} exhibitionSlug={ex.slug} />
          ) : (
            <div className="panel">
              <h2 className="big">Buku tamu sudah ditutup.</h2>
              <p className="lead">Terima kasih untuk semua yang datang ke {ex.title}. Ingin diundang ke pameran berikutnya?</p>
              <Link className="btn" href="/undangan">Minta undangan</Link>
            </div>
          )}
        </section>
      </div>
    </PublicShell>
  );
}
