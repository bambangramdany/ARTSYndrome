'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode';

// Membuat poster QR buku tamu sebagai PNG A4 300 dpi (2480 × 3508 px) di browser,
// untuk diunduh atau dibagikan (WhatsApp) tanpa perlu printer.
const W = 2480, H = 3508, INK = '#111111';

function loadImage(src) {
  return new Promise((resolve, reject) => { const img = new Image(); img.onload = () => resolve(img); img.onerror = reject; img.src = src; });
}

async function renderPoster({ title, artist, url }) {
  await Promise.all([
    document.fonts.load('800 300px Archivo'), document.fonts.load('500 140px Archivo'),
    document.fonts.load('700 110px Archivo'), document.fonts.load('400 64px "IBM Plex Mono"')
  ]).catch(() => {});
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#FFFFFF'; ctx.fillRect(0, 0, W, H);
  ctx.strokeStyle = INK; ctx.lineWidth = 6; ctx.strokeRect(150, 150, W - 300, H - 300);

  const logo = await loadImage('/logo-black.svg');
  const qr = await QRCode.toCanvas(document.createElement('canvas'), url, { width: 1240, margin: 0, errorCorrectionLevel: 'H', color: { dark: INK, light: '#FFFFFF' } });

  // Judul diperkecil otomatis bila terlalu panjang
  let titleSize = 300;
  ctx.font = `800 ${titleSize}px Archivo, sans-serif`;
  while (ctx.measureText(title).width > W - 520 && titleSize > 120) { titleSize -= 10; ctx.font = `800 ${titleSize}px Archivo, sans-serif`; }

  const logoH = 470, logoW = Math.round(logoH * (614.9 / 276.01));
  const blocks = [
    { h: logoH, draw: (y) => ctx.drawImage(logo, (W - logoW) / 2, y, logoW, logoH) },
    { gap: 150 },
    { h: 64, draw: (y) => text('BUKU TAMU', y + 56, '400 64px "IBM Plex Mono", monospace', '#555555', 12) },
    { gap: 70 },
    { h: titleSize, draw: (y) => text(title, y + titleSize * 0.82, `800 ${titleSize}px Archivo, sans-serif`, INK, -titleSize * 0.03) },
    { gap: 50 },
    { h: 140, draw: (y) => text(artist, y + 112, '500 140px Archivo, sans-serif', INK) },
    { gap: 140 },
    { h: 1240, draw: (y) => ctx.drawImage(qr, (W - 1240) / 2, y, 1240, 1240) },
    { gap: 140 },
    { h: 110, draw: (y) => text('Pindai untuk mengisi buku tamu', y + 90, '700 110px Archivo, sans-serif', INK) },
    { gap: 60 },
    { h: 72, draw: (y) => text(url.replace(/^https?:\/\//, ''), y + 60, '400 72px "IBM Plex Mono", monospace', INK) }
  ];
  function text(s, baseline, font, color, spacing = 0) {
    ctx.font = font; ctx.fillStyle = color; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    if ('letterSpacing' in ctx) ctx.letterSpacing = `${spacing}px`;
    ctx.fillText(s, W / 2, baseline);
    if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
  }
  const total = blocks.reduce((n, b) => n + (b.h || b.gap), 0);
  let y = Math.round((H - total) / 2);
  for (const b of blocks) { if (b.draw) b.draw(y); y += b.h || b.gap; }
  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

export default function PosterDownload({ title, artist, url, slug }) {
  const [busy, setBusy] = useState(false);
  const [canShare, setCanShare] = useState(false);
  const filename = `poster-buku-tamu-${slug || 'artsyndrome'}.png`;

  useEffect(() => {
    try { setCanShare(!!navigator.canShare && navigator.canShare({ files: [new File([''], 'x.png', { type: 'image/png' })] })); } catch { setCanShare(false); }
  }, []);

  async function download() {
    setBusy(true);
    try {
      const blob = await renderPoster({ title, artist, url });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(a.href), 2000);
    } catch { alert('Gagal membuat file poster. Coba lagi.'); }
    setBusy(false);
  }

  async function share() {
    setBusy(true);
    try {
      const blob = await renderPoster({ title, artist, url });
      await navigator.share({ files: [new File([blob], filename, { type: 'image/png' })], title: `Poster buku tamu ${title}` });
    } catch (e) { if (e?.name !== 'AbortError') alert('Gagal membagikan. Coba tombol Unduh.'); }
    setBusy(false);
  }

  return (
    <>
      <button type="button" className="btn-line" onClick={download} disabled={busy}>{busy ? 'Menyiapkan…' : 'Unduh poster (PNG)'}</button>
      {canShare ? <button type="button" className="btn-line" onClick={share} disabled={busy}>Bagikan</button> : null}
    </>
  );
}
