# ARTSYndrome · artsyndrome.id

Website tahap 1: buku tamu, undangan digital + RSVP, check-in QR, dan admin.

| Alamat | Untuk siapa | Isi |
|---|---|---|
| `artsyndrome.id` | Tamu kasual | Buku tamu (scan QR di pintu / tablet di meja tamu) |
| `artsyndrome.id/u/KODE` | Tamu undangan | Undangan pribadi + konfirmasi kehadiran + QR check-in |
| `artsyndrome.id/c/KODE` | Petugas | Hasil scan QR undangan → tombol "Catat kehadiran" |
| `artsyndrome.id/admin` | Tim | Database tamu, ekspor CSV |
| `artsyndrome.id/admin/undangan` | Tim | Tambah/impor undangan, kirim lewat WhatsApp/email, pantau RSVP |
| `artsyndrome.id/admin/qr` | Tim | Poster QR buku tamu siap cetak |

---

## 1. Supabase (database), ±10 menit

1. Buka supabase.com → **New project**. Nama: `artsyndrome`. Region: **Southeast Asia (Singapore)**. Simpan password database di tempat aman.
2. Setelah project jadi: menu **SQL Editor** → **New query** → tempel seluruh isi `supabase/schema.sql` → **Run**. Harus muncul "Success".
3. Menu **Project Settings → API** (atau **API Keys**). Catat dua hal:
   - **Project URL** → nanti jadi `SUPABASE_URL`
   - **service_role** key (klik Reveal) → nanti jadi `SUPABASE_SERVICE_ROLE_KEY`

   Kunci service_role ini setara kunci master. Jangan dikirim lewat chat atau ditaruh di file yang dibagikan. Cukup ditempel di Vercel.
4. Menu **Table Editor → exhibitions** → baris `si-pemikir`, lengkapi:
   - `address`, `opening_label` (contoh: `Minggu, 15 November 2026, 16.00 WIB`)
   - `opening_at` (contoh: `2026-11-15 16:00:00+07`, untuk tombol "Simpan ke kalender")
   - `rsvp_deadline_label`, `contact_label` (contoh: `Rani · 0812xxxx`)
   - `instagram` (contoh: `@artsyndrome`), `privacy_contact` (email untuk permintaan hapus data)
   - `poster_url` + `poster_caption` (opsional: foto karya utama. Upload ke Supabase **Storage** dalam bucket publik, salin URL-nya.)

   Semua bisa diubah kapan saja, website langsung ikut berubah.

## 2. Vercel (website), ±10 menit

Cara A, lewat GitHub (disarankan, sama seperti aplikasi HLM):
1. Buat repository baru (private) di GitHub, upload seluruh isi folder ini (tanpa `node_modules`).
2. vercel.com → **Add New → Project** → pilih repository tadi → Framework terdeteksi **Next.js**.
3. Sebelum Deploy, buka **Environment Variables** dan isi:

| Nama | Isi |
|---|---|
| `SUPABASE_URL` | Project URL dari Supabase |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key dari Supabase |
| `ADMIN_PASSWORD` | Kata sandi admin untuk tim (min. 12 karakter, jangan yang mudah ditebak) |
| `SESSION_SECRET` | Teks acak panjang, min. 40 karakter (bebas, tidak perlu diingat) |
| `NEXT_PUBLIC_SITE_URL` | `https://artsyndrome.id` |

4. **Deploy**.

Cara B, tanpa GitHub: di folder ini jalankan `npx vercel` lalu ikuti petunjuknya, kemudian isi Environment Variables yang sama di dashboard Vercel dan deploy ulang (`npx vercel --prod`).

## 3. Domain artsyndrome.id

1. Vercel → project → **Settings → Domains** → tambah `artsyndrome.id` dan `www.artsyndrome.id`.
2. Vercel menampilkan record DNS yang harus dipasang (biasanya satu **A record** untuk `@` dan satu **CNAME** untuk `www`). Salin persis nilai yang ditampilkan Vercel, jangan dari sumber lain, karena nilainya bisa berbeda per akun.
3. Masuk ke panel tempat domain dibeli → DNS Management → pasang record tersebut. Hapus record A/CNAME lama untuk `@` dan `www` jika ada (misalnya halaman parkir bawaan registrar).
4. Tunggu sampai status di Vercel jadi **Valid Configuration** (biasanya beberapa menit, bisa sampai beberapa jam). SSL/https otomatis.

Selama domain belum aktif, website sudah bisa dipakai di alamat `nama-project.vercel.app`. Tapi **cetak QR dan kirim undangan setelah domain aktif**, karena tautannya dibuat dari `NEXT_PUBLIC_SITE_URL`.

## 4. Cek sebelum hari H (Sabtu)

- [ ] Buka `artsyndrome.id` di ponsel, isi buku tamu sekali. Muncul di `/admin`.
- [ ] Login `/admin` di ponsel petugas meja tamu (login bertahan 30 hari per perangkat).
- [ ] Tambah 2–3 undangan uji (nomor tim sendiri) → **Kirim WA** → buka tautan → konfirmasi hadir → QR muncul.
- [ ] Dari ponsel petugas, scan QR uji dengan kamera → halaman check-in → **Catat kehadiran**.
- [ ] Hapus data uji: undangan lewat tombol Hapus; tamu uji lewat Supabase Table Editor → `guests`.
- [ ] Cetak poster `/admin/qr` (A4/A3), pasang di pintu dan meja tamu.
- [ ] Siapkan tablet di meja tamu yang membuka `artsyndrome.id` (tombol "Isi untuk tamu berikutnya" mengosongkan form).

## Cara kerja yang perlu tim tahu

- **Dua jalur, satu database.** Tamu undangan yang lupa konfirmasi atau tidak membawa QR tetap bisa mengisi buku tamu. Nomor WhatsApp-nya dicocokkan ke daftar undangan, otomatis tercatat sebagai jalur "Undangan" dan check-in, tidak dobel.
- **Satu nomor WhatsApp = satu tamu per pameran.** Isian kedua dengan nomor yang sama diabaikan.
- **Kirim WA** membuka WhatsApp (web atau aplikasi) dengan pesan dan tautan pribadi yang sudah terisi. Tim tinggal menekan kirim. Ini sengaja manual: kirim massal otomatis butuh WhatsApp Business API resmi (proses persetujuan + biaya per pesan) dan nomor pribadi yang mengirim massal berisiko diblokir.
- **Izin undangan.** Hanya tamu yang mencentang persetujuan yang boleh dimasukkan ke daftar kirim berikutnya (filter "Izin undangan" + Ekspor CSV). Tamu undangan yang check-in lewat QR tercatat tanpa centang ini karena mereka tidak mengisinya sendiri.
- **Keamanan.** Database tidak bisa dibaca dari luar. Semua akses lewat server website. Halaman admin dan ekspor butuh login. Mengganti `ADMIN_PASSWORD` di Vercel (lalu Redeploy) otomatis mengeluarkan semua perangkat.

## Pameran berikutnya

Tambah baris baru di tabel `exhibitions` (slug baru, misalnya `pameran-2`), lalu ubah `EXHIBITION_SLUG` di Vercel ke slug tersebut dan Redeploy. Data pameran lama tetap tersimpan.

## Logo

`public/logo-black.svg` dan `public/logo-white.svg`. Ganti file dengan nama yang sama bila logo diperbarui.
