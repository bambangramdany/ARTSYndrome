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

## Status per 12 Nov 2026 (sore)
- **Live di https://artsyndrome.id** (Vercel project `artsy-ndrome`, team `bamramdany-2285s-projects`). `www` → 308 ke apex.
- Supabase project **ARTSYndrome**, ref `oubtnzenigmbgdpinewo` (org "bambangramdany's WTM"). Schema sudah jalan; baris `si-pemikir` sudah lengkap (alamat, jam, RSVP, PIC, Instagram, kontak privasi, `poster_url = /poster-si-pemikir.jpg`).
- Uji produksi README bagian 4 bagian A–C lolos (buku tamu, admin, CSV, undangan → RSVP → QR → check-in).
- **Masih manual oleh tim:** hapus data uji, cetak poster `/admin/qr`, siapkan tablet meja tamu.
- Jam: pembukaan 16.00 WIB untuk VIP & media (yang tampil di website), 18.00 WIB untuk umum (di poster). Disengaja, jangan "diseragamkan" tanpa tanya.

## Catatan deploy (pelajaran 12 Nov)
- Env Vercel: isian manual `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY` (secret key `sb_secret_…`). Integrasi Supabase–Vercel juga terpasang dan menambah `NEXT_PUBLIC_SUPABASE_URL`/`SUPABASE_SECRET_KEY` dkk. `lib/db.js` mengambil URL+kunci **berpasangan**: manual dulu, lalu integrasi; log server mencatat sumber + host (`[db] Supabase via …`).
- Semua query Supabase wajib `fetch` **no-store** (`lib/db.js`). Tanpa itu Data Cache Vercel menyimpan hasil pertama lintas deploy → data pameran/tamu tidak pernah berubah.
- DNS di Rumahweb: edit lewat **cPanel → Zone Editor** (Manajemen DNS my.rumahweb.com tidak aktif untuk domain ini, jangan klik DAFTAR). Jaringan kantor membelokkan query DNS UDP ke cache ISP; untuk cek DNS pakai DNS-over-HTTPS (`dns.google/resolve`) atau `dig +tcp`.
- Alamat deployment `*-xxxx-bamramdany-2285s-projects.vercel.app` terkunci ke versi kodenya; untuk uji selalu pakai `artsyndrome.id`.

## Stack & struktur
- Next.js 14.2.35 (App Router, JavaScript, tanpa TypeScript), React 18, @supabase/supabase-js, qrcode.
- `lib/db.js` client Supabase **server-only** pakai service role. Tabel RLS aktif tanpa policy publik → browser tidak pernah akses database langsung; semua lewat route handler.
- `lib/auth.js` admin login = satu kata sandi (`ADMIN_PASSWORD`) + cookie HMAC (`SESSION_SECRET`), 30 hari.
- `supabase/schema.sql` tabel `exhibitions`, `invitations`, `guests`. Pameran aktif dipilih lewat env `EXHIBITION_SLUG` (default `si-pemikir`).
- Rute publik (13 Nov, struktur wadah banyak seniman): `/` profil ARTSYndrome + pameran berjalan/akan datang · `/pameran`, `/pameran/[slug]` · `/pameran/[slug]/buku-tamu` buku tamu per pameran · `/bukutamu` alamat pendek → buku tamu pameran aktif (dipakai QR & tablet) · `/seniman`, `/seniman/[slug]` · `/liputan` semua pameran · `/undangan` agenda + form minta undangan · `/u/[code]` undangan pribadi · `/c/[code]` check-in petugas.
- Rute admin: `/admin` tamu, `/admin/undangan`, `/admin/liputan`, `/admin/permintaan` (minta undangan publik → "Jadikan undangan"), `/admin/qr`. Admin tetap terikat ke pameran aktif `EXHIBITION_SLUG`. Data seniman/pameran diedit lewat Supabase Table Editor (tabel `artists`, `exhibitions`).
- `lib/catalog.js`: status pameran dari tanggal (Asia/Jakarta); buku tamu dibuka H-7 sampai H+1 setelah selesai.
- Liputan media (13 Nov): tim tempel link di `/admin/liputan`; `lib/press.js` ambil metadata Open Graph (judul, media, tanggal, cuplikan ≤240 karakter, gambar) dengan penjaga alamat internal. Situs yang menolak bot (mis. Tempo, 403) diisi manual. Tabel `press_links` (bagian akhir `schema.sql`). Artikel tidak disalin, hanya pratinjau + link.
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
