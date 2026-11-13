'use client';

import { useState } from 'react';

// Gambar sampul dari situs media; disembunyikan bila situs menolak ditampilkan dari luar.
export default function PressImage({ src, alt, className }) {
  const [ok, setOk] = useState(true);
  if (!src || !ok) return null;
  return <img src={src} alt={alt} className={className} loading="lazy" referrerPolicy="no-referrer" onError={() => setOk(false)} />;
}
