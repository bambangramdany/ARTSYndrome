'use client';

export default function PrintButton() {
  return <button type="button" className="btn-dark" onClick={() => window.print()}>Cetak poster</button>;
}
