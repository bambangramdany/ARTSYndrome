'use client';

// Tombol submit yang meminta konfirmasi dulu (dipakai untuk hapus).
export default function ConfirmSubmit({ message, children, className }) {
  return (
    <button type="submit" className={className} onClick={(e) => { if (!window.confirm(message)) e.preventDefault(); }}>
      {children}
    </button>
  );
}
