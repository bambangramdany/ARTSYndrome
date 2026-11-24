'use client';

export default function PrintButton({ label = 'Cetak poster' }) {
  return <button type="button" className="btn-dark" onClick={() => window.print()}>{label}</button>;
}
