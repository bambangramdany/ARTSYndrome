'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function InviteActions({ id, link, waUrl, mailUrl, name }) {
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  async function markSent() {
    try {
      await fetch('/api/admin/invites/sent', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
      router.refresh();
    } catch {}
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
      setTimeout(() => setCopied(false), 1800);
    } catch {
      window.prompt('Salin tautan ini:', link);
    }
  }

  async function remove() {
    if (!window.confirm(`Hapus undangan untuk ${name}? Tautannya tidak bisa dipakai lagi.`)) return;
    await fetch('/api/admin/invites/delete', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id }) });
    router.refresh();
  }

  return (
    <div className="actions">
      {waUrl ? <a href={waUrl} target="_blank" rel="noopener noreferrer" onClick={markSent}>Kirim WA</a> : null}
      {mailUrl ? <a href={mailUrl} onClick={markSent}>Email</a> : null}
      <button type="button" onClick={copy}>{copied ? 'Tersalin' : 'Salin tautan'}</button>
      <a href={link} target="_blank" rel="noopener noreferrer">Lihat</a>
      <button type="button" onClick={remove} aria-label={`Hapus undangan ${name}`}>Hapus</button>
    </div>
  );
}
