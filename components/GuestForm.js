'use client';

import { useState } from 'react';
import { ROLES, SOURCES } from '../lib/util';

const empty = { name: '', email: '', whatsapp: '', city: '', instagram: '', source: '', consent: false, website: '' };

export default function GuestForm({ instagram, privacyContact, title }) {
  const [f, setF] = useState(empty);
  const [roles, setRoles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const [doneName, setDoneName] = useState('');

  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggle = (r) => setRoles(roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.name.trim() || !f.email.trim() || !f.whatsapp.trim()) {
      setError('Nama, email, dan nomor WhatsApp wajib diisi.');
      return;
    }
    setStatus('sending');
    try {
      const res = await fetch('/api/guest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...f, roles })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menyimpan.');
      setDoneName(f.name.trim().split(/\s+/)[0]);
      setStatus('done');
    } catch (err) {
      setError(err.message || 'Gagal menyimpan. Coba lagi.');
      setStatus('idle');
    }
  }

  function reset() {
    setF(empty);
    setRoles([]);
    setStatus('idle');
    setDoneName('');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  if (status === 'done') {
    return (
      <div className="panel" style={{ minHeight: 520, justifyContent: 'center' }} aria-live="polite">
        <div className="done-mark">
          <svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="square"><path d="M4 12.5l5 5L20 6.5" /></svg>
        </div>
        <h2 className="big">Terima kasih, {doneName || 'teman'}.</h2>
        <p style={{ margin: 0, fontSize: 18, lineHeight: 1.55, color: '#333', maxWidth: 420 }}>
          Kehadiranmu sudah tercatat. Selamat menikmati <em>{title}</em>, dan sampai jumpa di pameran berikutnya.
        </p>
        {instagram ? <p className="mono" style={{ margin: 0, fontSize: 14 }}>Ikuti kami di {instagram}</p> : null}
        <button type="button" className="btn-line" style={{ alignSelf: 'flex-start' }} onClick={reset}>Isi untuk tamu berikutnya</button>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={submit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        <p className="eyebrow">Buku Tamu</p>
        <h2 className="h2">Selamat datang. Tulis namamu di sini.</h2>
        <p className="lead">Cukup sekali isi. Kami akan mengabari pameran ARTSYndrome berikutnya.</p>
      </div>

      <div className="field">
        <label htmlFor="nama">Nama lengkap <span className="req">(wajib)</span></label>
        <input id="nama" className="input" autoComplete="name" value={f.name} onChange={set('name')} required maxLength={120} />
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="email">Email <span className="req">(wajib)</span></label>
          <input id="email" type="email" inputMode="email" className="input" autoComplete="email" value={f.email} onChange={set('email')} required maxLength={160} />
        </div>
        <div className="field">
          <label htmlFor="wa">No. WhatsApp <span className="req">(wajib)</span></label>
          <input id="wa" type="tel" inputMode="tel" className="input" autoComplete="tel" placeholder="08xx" value={f.whatsapp} onChange={set('whatsapp')} required maxLength={20} />
        </div>
      </div>
      <div className="row2">
        <div className="field">
          <label htmlFor="kota">Kota domisili</label>
          <input id="kota" className="input" autoComplete="address-level2" value={f.city} onChange={set('city')} maxLength={80} />
        </div>
        <div className="field">
          <label htmlFor="ig">Instagram</label>
          <input id="ig" className="input" placeholder="@" value={f.instagram} onChange={set('instagram')} maxLength={60} />
        </div>
      </div>

      <fieldset>
        <legend className="legend">Kamu datang sebagai <span className="req">(boleh lebih dari satu)</span></legend>
        <div className="chips">
          {ROLES.map((r) => (
            <button key={r} type="button" className="chip" aria-pressed={roles.includes(r)} onClick={() => toggle(r)}>{r}</button>
          ))}
        </div>
      </fieldset>

      <div className="field">
        <label htmlFor="sumber">Tahu pameran ini dari</label>
        <select id="sumber" className="input" value={f.source} onChange={set('source')}>
          <option value="">Pilih salah satu</option>
          {SOURCES.map((s) => <option key={s}>{s}</option>)}
        </select>
      </div>

      {/* Honeypot: hidden from people, bots fill it in. */}
      <div aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }}>
        <label htmlFor="website">Website</label>
        <input id="website" tabIndex={-1} autoComplete="off" value={f.website} onChange={set('website')} />
      </div>

      <label className="check" htmlFor="izin">
        <input id="izin" type="checkbox" checked={f.consent} onChange={set('consent')} />
        <span>Saya bersedia dihubungi lewat email atau WhatsApp untuk undangan pameran ARTSYndrome berikutnya.</span>
      </label>

      {error ? <p className="error" role="alert">{error}</p> : null}

      <button type="submit" className="btn" disabled={status === 'sending'}>
        {status === 'sending' ? 'Menyimpan…' : 'Catat kehadiran'}
        {status === 'sending' ? null : (
          <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="square"><path d="M5 12h14M13 6l6 6-6 6" /></svg>
        )}
      </button>

      <p className="small">
        Data kamu hanya dipakai ARTSYndrome untuk undangan dan informasi pameran, tidak dijual atau dibagikan ke pihak lain.
        {privacyContact ? <> Ingin datamu dihapus? Hubungi {privacyContact}.</> : null}
      </p>
    </form>
  );
}
