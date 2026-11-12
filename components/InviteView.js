'use client';

import { useState } from 'react';
import { COVERAGE } from '../lib/util';

const BADGE = { VIP: 'Tamu VIP', Brand: 'Brand partner', Media: 'Media' };
const ANSWERS = [['yes', 'Ya, saya hadir'], ['maybe', 'Belum pasti'], ['no', 'Berhalangan hadir']];

export default function InviteView({ invite, event, qrSvg }) {
  const [answer, setAnswer] = useState(invite.rsvp || null);
  const [sent, setSent] = useState(!!invite.rsvp);
  const [guests, setGuests] = useState(invite.rsvpGuests || 1);
  const [companion, setCompanion] = useState(invite.companion || '');
  const [jobTitle, setJobTitle] = useState(invite.jobTitle || '');
  const [coverage, setCoverage] = useState(invite.coverage);
  const [presskit, setPresskit] = useState(invite.wantsPresskit);
  const [note, setNote] = useState(invite.note || '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  const isMedia = invite.category === 'Media';
  const isBrand = invite.category === 'Brand';
  const max = invite.maxGuests || 1;

  async function send() {
    if (!answer) return;
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/rsvp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code: invite.code, answer, guests, companion, jobTitle, coverage, presskit, note })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim.');
      setSent(true);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="invite">
      <header>
        <img src="/logo-black.svg" alt="ARTSYndrome" style={{ height: 120, width: 'auto', maxWidth: '100%' }} />
        <span className="badge">{BADGE[invite.category] || 'Undangan'}</span>
      </header>

      <section>
        <p className="eyebrow" style={{ fontSize: 12 }}>Undangan pribadi</p>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5 }}>
          Kepada <strong>{invite.name}</strong>
          {invite.organization ? <><br /><span style={{ color: '#444' }}>{invite.organization}</span></> : null}
        </p>
        <p style={{ margin: 0, fontSize: 17, lineHeight: 1.5, color: '#333' }}>ARTSYndrome dan {event.artist} mengundang Anda ke pembukaan pameran</p>
        <h1 className="display" style={{ fontSize: 60 }}>{event.title}</h1>
        {event.posterUrl ? (
          <figure style={{ margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <img src={event.posterUrl} alt={event.posterCaption || `Karya ${event.artist}`} style={{ width: '100%', display: 'block' }} />
            {event.posterCaption ? <figcaption className="small" style={{ color: '#444' }}>{event.posterCaption}</figcaption> : null}
          </figure>
        ) : null}
      </section>

      <section aria-label="Detail acara">
        {event.opening ? <div className="kv"><span>Pembukaan</span><strong>{event.opening}</strong></div> : null}
        <div className="kv"><span>Tempat</span><strong>{event.venue}</strong>{event.address ? <span style={{ fontFamily: 'inherit', fontSize: 16, textTransform: 'none', letterSpacing: 0, color: '#111', lineHeight: 1.5 }}>{event.address}</span> : null}</div>
        <div className="kv"><span>Pameran berlangsung</span><span style={{ fontFamily: 'inherit', fontSize: 16, textTransform: 'none', letterSpacing: 0, color: '#111' }}>{event.range}</span></div>
        <div className="row2" style={{ gap: 8, gridTemplateColumns: 'repeat(2, minmax(0, 1fr))' }}>
          <a className="btn-line" style={{ justifyContent: 'center' }} href={event.mapsUrl} target="_blank" rel="noopener noreferrer">Buka peta</a>
          <a className="btn-line" style={{ justifyContent: 'center' }} href={event.calUrl}>Simpan ke kalender</a>
        </div>
      </section>

      {!sent ? (
        <section aria-labelledby="h-rsvp" style={{ gap: 22, paddingBottom: 36 }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <h2 id="h-rsvp" className="h2" style={{ fontSize: 28 }}>Konfirmasi kehadiran</h2>
            {event.deadline ? <p className="lead" style={{ fontSize: 15 }}>Mohon konfirmasi sebelum {event.deadline}.</p> : null}
          </div>
          <div role="radiogroup" aria-labelledby="h-rsvp" className="answers">
            {ANSWERS.map(([k, label]) => (
              <button key={k} type="button" role="radio" aria-checked={answer === k} className="answer" onClick={() => setAnswer(k)}>
                <span>{label}</span><span className="dot" aria-hidden="true" />
              </button>
            ))}
          </div>

          {answer === 'yes' ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 22 }}>
              {max > 1 ? (
                <div className="stepper">
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <span style={{ fontSize: 15, fontWeight: 600 }}>Jumlah yang datang</span>
                    <span style={{ fontSize: 13, color: '#555' }}>Termasuk Anda, maks. {max} orang</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <button type="button" aria-label="Kurangi" onClick={() => setGuests(Math.max(1, guests - 1))}>−</button>
                    <span aria-live="polite" style={{ minWidth: 32, textAlign: 'center', fontSize: 20, fontWeight: 700 }}>{guests}</span>
                    <button type="button" aria-label="Tambah" onClick={() => setGuests(Math.min(max, guests + 1))}>+</button>
                  </div>
                </div>
              ) : null}
              {guests > 1 ? (
                <div className="field">
                  <label htmlFor="u-pendamping">Nama pendamping</label>
                  <input id="u-pendamping" className="input" value={companion} onChange={(e) => setCompanion(e.target.value)} maxLength={200} />
                </div>
              ) : null}
              {isBrand ? (
                <div className="field">
                  <label htmlFor="u-jabatan">Jabatan</label>
                  <input id="u-jabatan" className="input" autoComplete="organization-title" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)} maxLength={120} />
                </div>
              ) : null}
              {isMedia ? (
                <>
                  <fieldset>
                    <legend className="legend">Rencana liputan</legend>
                    <div className="chips">
                      {COVERAGE.map((c) => (
                        <button key={c} type="button" className="chip" aria-pressed={coverage.includes(c)}
                          onClick={() => setCoverage(coverage.includes(c) ? coverage.filter((x) => x !== c) : [...coverage, c])}>{c}</button>
                      ))}
                    </div>
                  </fieldset>
                  <label className="check" htmlFor="u-presskit">
                    <input id="u-presskit" type="checkbox" checked={presskit} onChange={(e) => setPresskit(e.target.checked)} />
                    <span>Kirimkan press kit (rilis, bio seniman, foto karya resolusi tinggi) ke email saya.</span>
                  </label>
                </>
              ) : null}
              <div className="field">
                <label htmlFor="u-catatan">Catatan untuk kami <span className="req">(opsional)</span></label>
                <input id="u-catatan" className="input" value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} />
              </div>
            </div>
          ) : null}

          {error ? <p className="error" role="alert">{error}</p> : null}
          <button type="button" className="btn" disabled={!answer || busy} onClick={send}>{busy ? 'Mengirim…' : 'Kirim konfirmasi'}</button>
        </section>
      ) : (
        <section aria-live="polite" style={{ gap: 20, paddingTop: 32, paddingBottom: 40 }}>
          {answer === 'yes' ? (
            <>
              <h2 className="big" style={{ fontSize: 36 }}>Sampai jumpa di pembukaan.</h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: '#333' }}>
                Kehadiran Anda untuk {guests} orang sudah kami catat. Tunjukkan kode ini kepada petugas saat tiba, tidak perlu mengisi buku tamu lagi.
              </p>
              <div className="qr" role="img" aria-label={`Kode QR check-in ${invite.code}`} dangerouslySetInnerHTML={{ __html: qrSvg }} />
              <p className="mono" style={{ margin: 0, alignSelf: 'center', letterSpacing: '.12em', fontSize: 15 }}>{invite.code}</p>
              <p className="small">Simpan tangkapan layar halaman ini, atau buka lagi tautan undangan saat tiba.</p>
            </>
          ) : answer === 'maybe' ? (
            <>
              <h2 className="big" style={{ fontSize: 36 }}>Baik, kami tunggu kabarnya.</h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: '#333' }}>Tautan ini tetap bisa dipakai untuk mengubah konfirmasi kapan saja.</p>
            </>
          ) : (
            <>
              <h2 className="big" style={{ fontSize: 36 }}>Terima kasih sudah mengabari.</h2>
              <p style={{ margin: 0, fontSize: 16, lineHeight: 1.55, color: '#333' }}>
                {event.endLabel ? <>Pameran masih berlangsung sampai {event.endLabel} jika Anda ingin datang di hari lain. </> : null}
                Kami juga akan mengundang Anda ke pameran ARTSYndrome berikutnya.
              </p>
            </>
          )}
          <button type="button" className="btn-line" style={{ alignSelf: 'flex-start' }} onClick={() => setSent(false)}>Ubah konfirmasi</button>
        </section>
      )}

      <footer style={{ marginTop: 'auto', padding: '18px 20px', display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13, color: '#444' }}>
        {event.contact ? <span>Pertanyaan? Hubungi {event.contact}</span> : null}
        <span className="mono" style={{ fontSize: 11, textTransform: 'uppercase', letterSpacing: '.06em', color: '#555' }}>Undangan ini khusus untuk Anda, mohon tidak diteruskan.</span>
      </footer>
    </div>
  );
}
