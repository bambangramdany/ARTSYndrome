# ARTSYndrome · konteks proyek

## Tentang
ARTSYndrome menjembatani seniman visual, penikmat seni, dan orang yang baru ingin mengenal seni (terutama Gen Z). Hadir bersama pameran yang digelar seniman/komunitas; seniman dan karyanya tetap yang utama. Pemilik proyek: Bambang (CEO Watermark Indonesia, EO/PH di Bekasi).

Kolaborasi pertama: pameran **"Si Pemikir"** bersama **Franki Indrasmoro** (ejaan satu "a"), **Galeri TOKONOMA**, **15–22 November 2026**. Pembukaan Minggu, 15 Nov 2026.

Domain: **artsyndrome.id** (sudah dibeli). Hosting: Vercel (repo ini, cabang `main`). Database: Supabase.

## Tahapan
1. **Sekarang (kode di repo ini):** buku tamu walk-in, undangan digital VIP/Brand/Media + RSVP, check-in QR, admin (database tamu + CSV, kelola undangan + kirim WhatsApp manual via wa.me, poster QR).
2. **Berikutnya:** ruang display digital: profil seniman, dokumentasi/arsip pameran, press kit, rujukan untuk seniman/media/penikmat seni.
3. **Nanti:** marketplace edisi terbatas hasil showcase pameran.

Desain referensi (6 artboard + catatan) ada di canvas Claude Design "ARTSYndrome Website": https://claude.ai/code/artifact/038d6939-79b4-448a-8902-ed90236036f3

## Status per 12 Nov 2026
- Kode tahap 1 selesai, lolos `next build`, diuji end-to-end dengan Postgres + PostgREST lokal (buku tamu, validasi, dedup WA, RSVP, check-in tanpa dobel, admin auth, CSV, ICS, tampilan desktop & ponsel).
- **Belum:** project Supabase dibuat, deploy Vercel, DNS artsyndrome.id, isi data pameran di tabel `exhibitions` (alamat, jam pembukaan, PIC, Instagram, foto karya), uji di produksi.
- Target: siap dan diuji tim paling lambat **Sabtu 14 Nov 2026**.

## Stack & struktur
- Next.js 14.2.35 (App Router, JavaScript, tanpa TypeScript), React 18, @supabase/supabase-js, qrcode.
- `lib/db.js` client Supabase **server-only** pakai service role. Tabel RLS aktif tanpa policy publik → browser tidak pernah akses database langsung; semua lewat route handler.
- `lib/auth.js` admin login = satu kata sandi (`ADMIN_PASSWORD`) + cookie HMAC (`SESSION_SECRET`), 30 hari.
- `supabase/schema.sql` tabel `exhibitions`, `invitations`, `guests`. Pameran aktif dipilih lewat env `EXHIBITION_SLUG` (default `si-pemikir`).
- Rute: `/` buku tamu · `/u/[code]` undangan · `/c/[code]` check-in petugas · `/admin`, `/admin/undangan`, `/admin/qr` · API di `app/api/*`.
- Env: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `ADMIN_PASSWORD`, `SESSION_SECRET`, `NEXT_PUBLIC_SITE_URL`, opsional `EXHIBITION_SLUG`.

## Aturan bisnis
- Dua jalur, satu database: Undangan (WA → RSVP → QR → scan petugas) dan Walk-in (buku tamu). Kolom `guests.path`.
- Nomor WA dinormalisasi ke `62xxxxxxxxxx`. Satu nomor = satu tamu per pameran. Walk-in yang nomornya ada di undangan → otomatis jalur Undangan + `checked_in_at`.
- Persetujuan undangan berikutnya harus eksplisit (UU PDP No. 27/2022). Hanya `consent = true` yang boleh masuk daftar kirim.
- Batas orang per undangan diatur per tamu (`max_guests`, default 2).
- WhatsApp dikirim manual lewat tautan wa.me (tidak pakai WhatsApp Business API).

## Desain
- Gaya galeri "white cube": latar putih, tinta #111111, satu aksen #FF4F1F (teks di atas aksen selalu hitam). Font Archivo + IBM Plex Mono (Google Fonts).
- Karya seni selalu elemen terbesar. Caption baku: Nama, *Judul*, Tahun. Medium, ukuran.
- Logo: `public/logo-black.svg` / `logo-white.svg` (proporsi ±2,25:1). Header 52 px desktop, 40–44 px ponsel, 120 px di undangan.
- Aksesibel: kontras ≥4.5:1, target sentuh ≥44 px, label di semua input.

## Gaya kerja dengan Bambang
- Bahasa Indonesia yang bersih, profesional, manusiawi. Tanpa frasa khas AI, tanpa filler, hemat tanda pisah panjang.
- Skeptis dan cek ulang fakta; jangan mengarang data. Data yang belum ada ditulis sebagai [KURUNG].
- Jangan pernah meminta atau mencetak kunci service_role / kata sandi di chat.
