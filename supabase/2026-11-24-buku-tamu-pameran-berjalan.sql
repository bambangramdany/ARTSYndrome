-- ARTSYndrome · 24 Nov 2026
-- Buku tamu untuk pameran yang berjalan sejak Senin, 23 November 2026, memakai QR
-- Si Pemikir yang sudah tertempel (alamatnya artsyndrome.id/bukutamu).
--
-- Cara kerja: /bukutamu sekarang otomatis membuka buku tamu pameran yang sedang
-- berjalan menurut tanggal. Cukup tambahkan baris pameran baru di bawah; tidak perlu
-- mengubah env Vercel atau cetak ulang QR.
--
-- Jalankan di Supabase: SQL Editor › New query › tempel › Run. Ganti semua [KURUNG] dulu.

-- ── Langkah 1: baris pameran yang sedang berjalan ──
-- published = false: buku tamu jalan, tetapi pameran tidak tampil di /pameran dan beranda.
--   Ubah ke true lewat Table Editor bila pameran ini memang ingin ditampilkan.
-- ends_on dibiarkan kosong (null) = buku tamu terus terbuka sampai diisi tanggal selesai,
--   atau sampai ada pameran lain yang mulai lebih akhir.
insert into exhibitions (slug, title, artist, venue, address, starts_on, ends_on, published)
values (
  '[slug-pameran]',            -- huruf kecil dan tanda hubung, contoh: 'nama-pameran-2026'
  '[JUDUL PAMERAN]',
  '[NAMA SENIMAN]',
  'Galeri TOKONOMA',           -- ganti bila tempatnya lain
  'Jl. Fatmawati No. 22A, Jakarta Selatan',
  '2026-11-23',
  null,                        -- contoh: '2026-12-06'
  false
)
on conflict (slug) do nothing;

-- ── Langkah 2 (opsional, cek dulu): isian Senin 23 Nov yang masuk ke Si Pemikir ──
-- Buku tamu Si Pemikir masih terbuka sampai 23 Nov (H+1), jadi pengunjung pameran baru
-- yang memindai QR hari Senin tercatat di Si Pemikir. Lihat dulu daftarnya:
select g.created_at at time zone 'Asia/Jakarta' as waktu_wib, g.name, g.path, g.city
from guests g join exhibitions e on e.id = g.exhibition_id
where e.slug = 'si-pemikir' and g.created_at >= '2026-11-23 00:00+07'
order by g.created_at;

-- Bila memang tamu pameran baru, pindahkan (hanya walk-in; tamu lewat undangan Si Pemikir
-- dibiarkan, putuskan manual bila ada):
-- update guests set exhibition_id = (select id from exhibitions where slug = '[slug-pameran]')
-- where exhibition_id = (select id from exhibitions where slug = 'si-pemikir')
--   and created_at >= '2026-11-23 00:00+07'
--   and invitation_id is null;
