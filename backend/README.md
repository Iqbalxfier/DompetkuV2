# Dompetku V2 — Backend Server

Server backend Node.js + Express + PostgreSQL untuk mendukung fitur multi-user dan sinkronisasi data offline-first secara aman dengan otentikasi JWT.

---

## 🛠️ Persiapan Mandiri

### 1. Database PostgreSQL
Pastikan Anda memiliki database PostgreSQL lokal yang aktif. 
1. Buat database baru bernama `dompetkuv2` di PostgreSQL Anda.
2. Jika kredensial default PostgreSQL lokal Anda bukan `postgres:postgres@localhost:5432`, harap sesuaikan berkas `backend/.env` Anda:
   ```env
   DATABASE_URL=postgresql://USERNAME:PASSWORD@localhost:5432/dompetkuv2
   ```

### 2. Inisialisasi Database (Membuat Tabel Otomatis)
Buka terminal baru di folder `backend/`, kemudian jalankan perintah migrasi skema berikut untuk membuat seluruh tabel dan seeding kategori default secara otomatis:
```bash
npm run init-db
```

### 3. Jalankan Development Server
Untuk menyalakan server Express di port `5000` (dengan fitur auto-reload nodemon):
```bash
npm run dev
```

---

## 🔑 Endpoint API Utama

*   **Otentikasi (`/api/auth`)**:
    *   `POST /api/auth/register` : Registrasi akun pengguna baru.
    *   `POST /api/auth/login` : Login akun manual (Password Bcrypt).
    *   `POST /api/auth/google` : Login otomatis via Google.
*   **Sinkronisasi (`/api/sync`)**:
    *   `POST /api/sync` : Sinkronisasi data dua arah offline-first (wallets, categories, budgets, transactions) dengan proteksi JWT.
