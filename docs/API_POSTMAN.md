# Panduan Cek API BETA di Postman

Base URL:

```text
http://localhost:5000/api
```

Root health check:

```text
GET http://localhost:5000/api
```

Jalankan backend:

```powershell
cd backend
npm.cmd start
```

Endpoint paling enak untuk mulai:

```http
GET http://localhost:5000/api
```

Endpoint ini menampilkan katalog API lengkap dalam format yang lebih mudah dibaca.

## Auth

| Method | Endpoint | Token | Kegunaan |
| --- | --- | --- | --- |
| POST | `/auth/login` | Tidak | Login dan mendapatkan token |
| GET | `/auth/me` | Ya | Cek profil user login |
| PUT | `/auth/me` | Ya | Update profil |
| POST | `/auth/upload-photo` | Ya | Upload foto profil dengan form-data key `foto` |
| PUT | `/auth/password` | Ya | Ganti password |
| GET | `/auth/users` | Ya, admin | Ambil daftar user |

Contoh body login:

```json
{
  "username": "admin",
  "password": "admin123"
}
```

Untuk endpoint yang butuh token, pilih tab Authorization di Postman:

```text
Type: Bearer Token
Token: isi_dengan_token_dari_login
```

## Admin

| Method | Endpoint | Token | Kegunaan |
| --- | --- | --- | --- |
| GET | `/admin/dashboard` | Ya, admin | Statistik dashboard |
| GET | `/admin/users` | Ya, admin | Daftar user |
| POST | `/admin/users` | Ya, admin | Tambah user |
| PUT | `/admin/users/:id` | Ya, admin | Update user |
| DELETE | `/admin/users/:id` | Ya, admin | Hapus user |

Contoh body tambah user:

```json
{
  "nama_lengkap": "Nama User",
  "email": "user@example.com",
  "password": "password123",
  "role": "user",
  "status": "aktif"
}
```

## Area

| Method | Endpoint | Token | Kegunaan |
| --- | --- | --- | --- |
| GET | `/area` | Tidak | Daftar area |
| GET | `/area/:id` | Tidak | Detail area |
| POST | `/area` | Tidak | Tambah area |
| PUT | `/area/:id` | Tidak | Update area |
| DELETE | `/area/:id` | Tidak | Hapus area |

Contoh body area:

```json
{
  "nama": "Area Testing",
  "status": "aktif"
}
```

## Shift

| Method | Endpoint | Token | Kegunaan |
| --- | --- | --- | --- |
| GET | `/shift` | Tidak | Daftar shift |
| GET | `/shift/:id` | Tidak | Detail shift |
| POST | `/shift` | Tidak | Tambah shift |
| PUT | `/shift/:id` | Tidak | Update shift |
| DELETE | `/shift/:id` | Tidak | Hapus shift |

Contoh body shift:

```json
{
  "nama_shift": "Shift Pagi",
  "jam_mulai": "08:00",
  "jam_selesai": "12:00"
}
```

## Penugasan

| Method | Endpoint | Token | Kegunaan |
| --- | --- | --- | --- |
| GET | `/penugasan` | Tidak | Daftar penugasan |
| GET | `/penugasan/:id` | Tidak | Detail penugasan |
| POST | `/penugasan` | Tidak | Tambah penugasan |
| PUT | `/penugasan/:id` | Tidak | Update penugasan |
| DELETE | `/penugasan/:id` | Tidak | Hapus penugasan |

Contoh body penugasan:

```json
{
  "id_user": 1,
  "tanggal_awal": "2026-06-23",
  "id_tugas": 1
}
```

## OB

| Method | Endpoint | Token | Kegunaan |
| --- | --- | --- | --- |
| GET | `/penugasan/ob/all` | Tidak | Daftar OB |
| POST | `/penugasan/ob` | Tidak | Tambah OB |
| PUT | `/penugasan/ob/:id` | Tidak | Update OB |
| DELETE | `/penugasan/ob/:id` | Tidak | Hapus OB |

Contoh body OB:

```json
{
  "nama_ob": "Nama OB",
  "status": "aktif"
}
```

## Ruangan

| Method | Endpoint | Token | Kegunaan |
| --- | --- | --- | --- |
| GET | `/penugasan/ruangan/all` | Tidak | Daftar ruangan |
| POST | `/penugasan/ruangan` | Tidak | Tambah ruangan |

Contoh body ruangan:

```json
{
  "nama_ruangan": "Ruang Testing"
}
```

## Tugas

| Method | Endpoint | Token | Kegunaan |
| --- | --- | --- | --- |
| GET | `/penugasan/tugas/all` | Tidak | Daftar tugas |
| POST | `/penugasan/tugas` | Tidak | Tambah tugas |
| PUT | `/penugasan/tugas/:id` | Tidak | Update tugas |
| DELETE | `/penugasan/tugas/:id` | Tidak | Hapus tugas |

Contoh body tugas:

```json
{
  "nama_tugas": "Sapu Lantai"
}
```

## Laporan

| Method | Endpoint | Token | Kegunaan |
| --- | --- | --- | --- |
| GET | `/penugasan/laporan/all` | Tidak | Daftar laporan |
| GET | `/penugasan/laporan/all?tanggal=2026-06-23` | Tidak | Filter laporan per tanggal |
| GET | `/penugasan/laporan/:id_penugasan` | Tidak | Laporan berdasarkan penugasan |
| POST | `/penugasan/laporan` | Tidak | Tambah laporan |
| PUT | `/penugasan/laporan/:id_laporan` | Tidak | Update laporan |

Contoh body laporan tanpa foto:

```json
{
  "id_penugasan": 1,
  "tanggal": "2026-06-23",
  "status_kehadiran": "hadir",
  "nilai": "green"
}
```

Jika memakai foto, gunakan Body `form-data`, lalu isi field teks seperti biasa dan tambahkan key `foto` bertipe File.

## Aktivitas

| Method | Endpoint | Token | Kegunaan |
| --- | --- | --- | --- |
| GET | `/penugasan/aktivitas/all?limit=10` | Tidak | Daftar aktivitas terbaru |
| POST | `/penugasan/aktivitas` | Tidak | Tambah aktivitas |

Contoh body aktivitas:

```json
{
  "id_user": 1,
  "tipe_aktivitas": "login",
  "aksi": "User login"
}
```
