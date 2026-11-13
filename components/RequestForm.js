'use client';

import { useState } from 'react';
import { ROLES } from '../lib/util';

const empty = { name: '', email: '', whatsapp: '', organization: '', note: '', consent: false, website: '' };

export default function RequestForm({ agenda, preselect }) {
  const [f, setF] = useState(empty);
  const [pameran, setPameran] = useState(preselect || '');
  const [roles, setRoles] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState('');
  const set = (k) => (e) => setF({ ...f, [k]: e.target.type === 'checkbox' ? e.target.checked : e.target.value });
  const toggle = (r) => setRoles(roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r]);

  async function submit(e) {
    e.preventDefault();
    setError('');
    if (!f.name.trim() || (!f.email.trim() && !f.whatsapp.trim())) { setError('Isi nama, serta email atau nomor WhatsApp.'); return; }
    if (!f.consent) { setError('Centang persetujuan agar kami boleh menghubungi Anda.'); return; }
    setStatus('sending');
    try {
      const res = await fetch('/api/invite-request', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...f, roles, exhibition: pameran }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim.');
      setStatus('done');
    } catch (err) { setError(err.message || 'Gagal mengirim. Coba lagi.'); setStatus('idle'); }
  }

  if (status === 'done') {
    return (
      <div className="panel" aria-live="polite">
        <div className="done-mark"><svg aria-hidden="true" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2.2" strokeLinecap="square"><path d="M4 12.5l5 5L20 6.5" /></svg></div>
        <h2 className="big">Terima kasih, permintaan terkirim.</h2>
        <p className="lead">Tim ARTSYndrome akan menghubungi Anda lewat email atau WhatsApp. Undangan pembukaan bersifat terbatas, jadi kami kabari secepatnya.</p>
      </div>
    );
  }

  return (
    <form className="panel" onSubmit={submit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <p className="eyebrow">Permintaan undangan</p>
        <h2 className="h2">Daftarkan diri Anda</h2>
      </div>
      <div className="field">
        <label htmlFor="r-pameran">Untuk pameran</label>
        <select id="r-pameran" className="input" value={pameran} onChange={(e) => setPameran(e.target.value)}>
          <option value="">Semua pameran ARTSYndrome berikutnya</option>
          {agenda.map((a) => <option key={a.slug} value={a.slug}>{a.title} · {a.artist}</option>)}
        </select>
      </div>
      <div className="field"><label htmlFor="r-name">Nama lengkap <span className="req">(wajib)</span></label><input id="r-name" className="input" value={f.name} onChange={set('name')} maxLength={120} autoComplete="name" /></div>
      <div className="row2">
        <div className="field"><label htmlFor="r-email">Email</label><input id="r-email" type="email" className="input" value={f.email} onChange={set('email')} maxLength={160} autoComplete="email" /></div>
        <div className="field"><label htmlFor="r-wa">No. WhatsApp</label><input id="r-wa" type="tel" className="input" placeholder="08xx" value={f.whatsapp} onChange={set('whatsapp')} maxLength={20} autoComplete="tel" /></div>
      </div>
      <div className="field"><label htmlFor="r-org">Instansi / media / komunitas</label><input id="r-org" className="input" value={f.organization} onChange={set('organization')} maxLength={120} /></div>
      <fieldset>
        <legend className="legend">Saya datang sebagai</legend>
        <div className="chips">{ROLES.map((r) => <button key={r} type="button" className="chip" aria-pressed={roles.includes(r)} onClick={() => toggle(r)}>{r}</button>)}</div>
      </fieldset>
      <div className="field"><label htmlFor="r-note">Catatan (opsional)</label><textarea id="r-note" className="input" rows={3} value={f.note} onChange={set('note')} maxLength={500} /></div>
      <input type="text" name="website" value={f.website} onChange={set('website')} tabIndex={-1} autoComplete="off" aria-hidden="true" style={{ position: 'absolute', left: '-9999px' }} />
      <label className="check"><input type="checkbox" checked={f.consent} onChange={set('consent')} /> <span>Saya bersedia dihubungi ARTSYndrome lewat email atau WhatsApp untuk undangan dan informasi pameran.</span></label>
      {error ? <p className="error" role="alert">{error}</p> : null}
      <button type="submit" className="btn" disabled={status === 'sending'}>{status === 'sending' ? 'Mengirim…' : 'Kirim permintaan'}</button>
      <p className="small">Data hanya dipakai ARTSYndrome untuk undangan dan informasi pameran, tidak dijual atau dibagikan ke pihak lain.</p>
    </form>
  );
}
