# Product Requirements Document (PRD)
## Dompetku — Personal Money Management untuk Anak Kost

**Versi:** 1.0 (Draft)
**Tanggal:** 21 Agustus 2026
**Disusun oleh:** Iqbal

---

## 1. Ringkasan Produk (Executive Summary)

Dompetku adalah aplikasi web pengelolaan keuangan pribadi (Progressive Web App) yang dirancang khusus untuk kebutuhan anak kost/mahasiswa. Aplikasi ini menggabungkan fitur pencatatan keuangan, budgeting, dan fitur sosial-finansial (patungan, utang-piutang) dalam satu platform yang bisa diakses online maupun offline.

### 1.1 Latar Belakang Masalah

Anak kost umumnya menghadapi tantangan keuangan yang spesifik:
- Uang bulanan/kiriman terbatas dan harus bertahan sampai periode tertentu
- Pengeluaran rutin yang mudah terlupa (kos, listrik, WiFi, cicilan)
- Sering melakukan transaksi patungan dengan teman kost
- Minim kontrol terhadap pola pengeluaran harian
- Koneksi internet tidak selalu stabil di lingkungan kost

### 1.2 Tujuan Produk

- Membantu anak kost mencatat dan memantau keuangan secara cepat dan mudah
- Memberikan kontrol budget yang jelas per kategori pengeluaran
- Menyediakan fitur khusus yang relevan dengan gaya hidup kost (patungan, reminder tagihan, utang-piutang)
- Tetap dapat digunakan tanpa koneksi internet aktif

---

## 2. Target Pengguna

| Persona | Deskripsi |
|---|---|
| Mahasiswa kost | Penerima kiriman bulanan dari orang tua, budget terbatas, aktif di kegiatan sosial kampus |
| Anak kost kerja/magang | Punya penghasilan sendiri, butuh kontrol pengeluaran lebih detail |

---

## 3. Ruang Lingkup (Scope)

### 3.1 Dalam Cakupan (In Scope) — MVP
- Manajemen transaksi keuangan multi-akun
- Budgeting per kategori
- Dashboard visual per akun (multi-user)
- Fitur khas anak kost (patungan, reminder tagihan, utang-piutang)
- Autentikasi manual + Google OAuth
- Mode online-offline (PWA)

### 3.2 Di Luar Cakupan (Out of Scope) — versi awal
- Integrasi langsung ke rekening bank/e-wallet (open banking API)
- Fitur investasi/reksadana
- Aplikasi native (Android/iOS terpisah)
- Fitur komunitas/statistik antar-kost

---

## 4. Kebutuhan Fungsional (Functional Requirements)

### 4.1 Autentikasi & Manajemen Akun
| ID | Requirement | Prioritas |
|---|---|---|
| F-01 | User dapat mendaftar dan login menggunakan email + password | Must Have |
| F-02 | User dapat login/daftar menggunakan akun Google (OAuth via Laravel Socialite) | Must Have |
| F-03 | Sistem menautkan akun Google ke akun manual jika email sama | Must Have |
| F-04 | Setiap user memiliki dashboard yang terisolasi dari user lain (data-level security) | Must Have |
| F-05 | User dapat mengelola profil (nama, foto, info dasar) | Should Have |

### 4.2 Manajemen Transaksi
| ID | Requirement | Prioritas |
|---|---|---|
| F-06 | User dapat mencatat transaksi pemasukan/pengeluaran dengan kategori | Must Have |
| F-07 | User dapat membuat dan mengelola multi-dompet/akun (cash, e-wallet, rekening) | Must Have |
| F-08 | User dapat membuat kategori transaksi custom | Should Have |
| F-09 | Sistem mendukung transaksi berulang otomatis (recurring) | Should Have |
| F-10 | User dapat melihat riwayat transaksi dengan filter (tanggal, kategori, nominal) | Must Have |

### 4.3 Budgeting
| ID | Requirement | Prioritas |
|---|---|---|
| F-11 | User dapat menetapkan budget bulanan per kategori | Must Have |
| F-12 | Sistem memberi notifikasi saat budget mendekati/melebihi limit | Should Have |
| F-13 | Sistem menampilkan proyeksi sisa saldo hingga akhir bulan | Could Have |

### 4.4 Fitur Khas Anak Kost
| ID | Requirement | Prioritas |
|---|---|---|
| F-14 | Kalkulator patungan/split bill untuk transaksi bersama | Should Have |
| F-15 | Reminder tagihan rutin (kos, listrik, WiFi, cicilan) | Should Have |
| F-16 | Pencatatan utang-piutang antar pengguna/teman | Should Have |
| F-17 | Deteksi otomatis saldo menipis dengan saran penghematan | Could Have |
| F-18 | Target tabungan (saving goal) dengan progress bar | Could Have |

### 4.5 Dashboard & Visualisasi
| ID | Requirement | Prioritas |
|---|---|---|
| F-19 | Dashboard menampilkan ringkasan saldo, pengeluaran, dan status budget | Must Have |
| F-20 | Grafik breakdown pengeluaran per kategori (pie/bar chart) | Must Have |
| F-21 | Grafik tren pengeluaran bulanan (line chart) | Should Have |

### 4.6 Mode Offline
| ID | Requirement | Prioritas |
|---|---|---|
| F-22 | Aplikasi dapat dibuka dan digunakan tanpa koneksi internet | Must Have |
| F-23 | Transaksi yang diinput offline disimpan lokal (IndexedDB) dengan status `pending_sync` | Must Have |
| F-24 | Sistem otomatis sinkronisasi data begitu koneksi kembali tersedia | Must Have |
| F-25 | Sistem menangani konflik data jika ada perubahan bentrok saat sinkronisasi | Should Have |
| F-26 | Login Google tidak tersedia dalam mode offline (butuh koneksi ke server Google) | Must Have (constraint) |

---

## 5. Kebutuhan Non-Fungsional (Non-Functional Requirements)

| ID | Kategori | Requirement |
|---|---|---|
| NF-01 | Usability | Input transaksi harus dapat dilakukan maksimal 2-3 tap/klik |
| NF-02 | Performance | Dashboard harus termuat dalam < 2 detik pada koneksi normal |
| NF-03 | Security | Password di-hash (bcrypt), token API menggunakan Laravel Sanctum |
| NF-04 | Security | Setiap query database di-scope otomatis ke `user_id` (Global Scope) untuk mencegah kebocoran data antar user |
| NF-05 | Compatibility | Mendukung mode PWA (installable, "Add to Home Screen") |
| NF-06 | Availability | Aplikasi harus tetap fungsional (baca & tulis data lokal) tanpa koneksi internet |
| NF-07 | Accessibility | UI harus mendukung dark mode |

---

## 6. Spesifikasi Teknis (Technical Stack)

| Layer | Teknologi | Keterangan |
|---|---|---|
| Backend | Laravel 11 | REST API, business logic |
| Autentikasi | Laravel Sanctum + Laravel Socialite | Token-based auth + Google OAuth |
| Frontend | Vue.js / React + Inertia.js | State management lebih baik untuk offline-first |
| Local Storage | IndexedDB (via Dexie.js) | Penyimpanan data transaksi saat offline |
| Offline Mechanism | Service Worker + Workbox | Caching aset & background sync |
| Database | MySQL | Penyimpanan data utama di server |
| Visualisasi | Chart.js | Grafik pie, bar, line |
| Hosting | Niagahoster / ZenHosta | Wajib mendukung HTTPS (syarat Service Worker) |
| Styling | Tailwind CSS | UI clean dan konsisten |

> **Catatan:** Stack ini dipilih berdasarkan pertimbangan familiaritas Laravel dan kebutuhan arsitektur offline-first. Livewire tidak digunakan sebagai frontend utama karena membutuhkan koneksi server aktif untuk sebagian besar interaksi, yang bertentangan dengan requirement mode offline.

---

## 7. Struktur Data (Ringkasan Entitas)

```
users (id, name, email, password [nullable], google_id [nullable], avatar, ...)
accounts/wallets (id, user_id, nama_dompet, saldo, tipe)
categories (id, user_id [nullable jika default], nama, tipe, icon)
transactions (id, user_id, account_id, category_id, jumlah, tanggal, catatan, sync_status)
budgets (id, user_id, category_id, limit_bulanan, bulan, tahun)
debts (id, user_id, nama_pihak, jumlah, status, jenis [utang/piutang], tanggal_jatuh_tempo)
bills_reminder (id, user_id, nama_tagihan, nominal, tanggal_jatuh_tempo, status)
```
*(Struktur ERD detail akan disusun terpisah pada dokumen desain database.)*

---

## 8. Prioritas Rilis (Release Plan — Usulan)

| Fase | Fitur | Target |
|---|---|---|
| MVP (v1.0) | F-01, F-02, F-03, F-04, F-06, F-07, F-10, F-11, F-19, F-20, F-22, F-23, F-24 | Aplikasi dasar bisa dipakai online & offline dengan pencatatan + budget |
| v1.1 | F-08, F-09, F-12, F-14, F-15, F-16, F-21 | Fitur khas anak kost + notifikasi |
| v1.2 | F-13, F-17, F-18, F-25 | Fitur prediktif & penyempurnaan sync |

---

## 9. Risiko & Mitigasi

| Risiko | Dampak | Mitigasi |
|---|---|---|
| Konflik data saat sinkronisasi offline-online | Data transaksi tidak konsisten | Terapkan strategi `last-write-wins` di MVP, evaluasi `timestamp-based merge` di v1.2 |
| Kompleksitas setup PWA melebihi timeline | Fitur offline tertunda | Prioritaskan online-first untuk MVP, offline capability menyusul jika waktu memungkinkan |
| Login Google gagal saat offline | User tidak bisa akses akun tanpa internet | Simpan token setelah login pertama agar sesi tetap aktif secara lokal |

---

## 10. Hal yang Masih Perlu Diputuskan (Open Items)

- Nama final aplikasi dan branding
- ERD lengkap dan skema migrasi database
- Wireframe/mockup UI final
- Strategi detail conflict resolution untuk sync
- Kebijakan retensi data (berapa lama riwayat transaksi disimpan)