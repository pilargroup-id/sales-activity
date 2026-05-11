# Local Development Guide

## Prerequisites

IMPORT DATABASE "pilargroup" dan "db_sales"

Pastiin semua service ini jalan sebelum develop:

| Service | Port | Cara jalanin |
|---|---|---|
| Laragon (MySQL) | 3306 | Buka Laragon → Start |
| Pilargroup BE | 8000 | `php artisan serve --port=8000` |
| TP BE | 8001 | `php artisan serve --port=8001` |
| TP FE | 5173 | `npm run dev` |

---
 
## TouchPoint (TP)
 
### BE — Jalanin server
 
```cmd
cd D:\Project\sales-activity\backend (sesuaikan path dan nama project)
php artisan serve --port=8001
```
 
### FE — Setup `.env.local`
 
Buat file `.env.local` di root folder FE:
 
```dotenv
VITE_MOCK_AUTH=true
VITE_PILARGROUP_LOCAL_URL=http://localhost:8000
VITE_MOCK_USERNAME=username_kamu
VITE_MOCK_PASSWORD=password_kamu
VITE_API_URL=http://localhost:8001/api
```
 
> ⚠️ `.env.local` tidak di-commit ke git.
 
### FE — Jalanin dev server
 
```cmd
cd D:\Project\sales-activity\frontend (sesuaikan path dan nama project)
npm run dev
```
 
Buka `http://localhost:5173` — auto login sebagai user dari `.env.local`.
 
---

## Flow Mock Auth (Local Only)
 
```
Buka localhost:5173 (incognito/fresh)
  → ProtectedRoute: localStorage kosong, VITE_MOCK_AUTH=true
  → Hit BE lokal /api/dev/login
  → BE hit pilargroup localhost:8000/api/auth/login
  → Dapat JWT asli + user data
  → Simpen ke localStorage
  → Reload → AuthContext pick up token → masuk app
```
 
> Mock auth hanya aktif kalau `APP_ENV=local` di BE dan `VITE_MOCK_AUTH=true` di FE.
> Di production kedua env ini tidak ada, jadi route `/api/dev/login` tidak ter-register sama sekali.
 
---
 
## Ganti User
 
Ubah `VITE_MOCK_USERNAME` dan `VITE_MOCK_PASSWORD` di `.env.development` FE, lalu jalankan di browser console:
 
```javascript
localStorage.clear()
```
 
Kemudian refresh — mock auth akan inject ulang dengan credentials baru.
 
> Pastiin juga `DEV_MOCK_USERNAME` dan `DEV_MOCK_PASSWORD` di `.env.local` BE ikut diupdate, karena BE yang validasi credentials sebelum hit pilargroup.
 
---
 
## Troubleshooting
 
**503 Service Unavailable saat mock auth**
→ Pastiin pilargroup BE sudah jalan (`artisan serve` atau service lainnya). Cek dengan curl ke `http://localhost:8000/api/auth/login`.
 
**Token expired / invalid setelah beberapa waktu**
→ Jalankan `localStorage.clear()` di browser console lalu refresh — mock auth akan inject ulang otomatis.
 
**Loop redirect ke pilargroup / halaman login**
→ Pastiin user yang dipakai punya akses ke sub-project terkait di tabel `central_user_projects` DB pilargroup lokal.
 
**Mock auth tidak jalan (langsung redirect ke pilargroup)**
→ Pastiin `VITE_MOCK_AUTH=true` ada di `.env.development` FE dan `APP_ENV=local` ada di `.env.local` BE. Kalau baru ditambah, restart kedua server (`uvicorn` atau `php artisan serve` dan `npm run dev`).
 
**Auto login tapi masuk sebagai user yang salah**
→ `localStorage.clear()` di browser console lalu refresh.