# Klinik Tenang — Portal Pasien Self-Assessment Telehealth

Aplikasi web frontend **Portal Pasien Self-Assessment Telehealth** berbasis **React + Vite + Tailwind CSS** yang terintegrasi penuh dengan REST API `https://telehealth.informatikaunimus.site/api` serta dirancang mengikuti sistem desain **Klinik Tenang**.

> **Catatan Penting Klinis:** Hasil self-assessment bukan diagnosis. Laporan akan ditinjau bersama informasi lain oleh tenaga kesehatan.

---

## 1. Prasyarat Sistem

Pastikan perangkat Anda sudah terpasang:
- **Node.js** versi **18.0 atau lebih baru** (unduh di [nodejs.org](https://nodejs.org/))
- **npm** (otomatis terpasang bersama Node.js)

---

## 2. Cara Menjalankan Proyek

1. **Buka terminal / Command Prompt / PowerShell**, lalu masuk ke direktori proyek:
   ```bash
   cd telehealth-patient-portal
   ```
2. **Instal seluruh dependensi** proyek:
   ```bash
   npm install
   ```
3. **Jalankan server pengembangan (development server):**
   ```bash
   npm run dev
   ```
4. Buka alamat URL yang muncul di terminal pada browser Anda (umumnya `http://localhost:5173`).

---

## 3. Struktur Direktori Proyek

```text
telehealth-patient-portal/
├── index.html
├── package.json
├── postcss.config.js
├── tailwind.config.js
├── vite.config.js
├── README.md
└── src/
    ├── main.jsx
    ├── index.css
    ├── App.jsx
    ├── config/
    │   └── api.js                  # Base URL, manajemen localStorage, wrapper fetch & error HTTP
    ├── services/
    │   └── telehealthService.js    # Fungsi pemanggilan seluruh endpoint REST API Telehealth
    ├── utils/
    │   └── formLogic.js            # Evaluasi percabangan show_if, aturan exclusive, toSafeText, sanitasi
    ├── components/
    │   ├── Navbar.jsx              # Navigasi responsif desktop & mobile + profil aktif
    │   ├── Footer.jsx              # Footer klinis Klinik Tenang
    │   ├── DisclaimerBanner.jsx    # Pernyataan disclaimer klinis wajib
    │   ├── StatusBadge.jsx         # Badge terpisah status pengiriman & status peninjauan
    │   ├── FieldError.jsx          # Pesan error validasi per kolom (HTTP 422)
    │   ├── DynamicFieldRenderer.jsx# Renderer dinamis text, textarea, single/multi_choice, scale, number, date
    │   └── TimelineView.jsx        # Tampilan kronologis riwayat perubahan status (aman dari object child)
    └── pages/
        ├── PengaturanApi.jsx       # Input NIM, Nama, Kelas, Token Pasien & Uji Koneksi (GET /me)
        ├── Beranda.jsx             # Hero banner atmosferik, 3 kartu KPI, kartu form kontras & status UTS
        ├── PetunjukConsent.jsx     # Petunjuk formulir & persetujuan penggunaan data (POST /assessments)
        ├── FormBertahap.jsx        # Pengisian bertahap per section & pertanyaan bercabang (PATCH /assessments/{id})
        ├── PeriksaJawaban.jsx      # Validasi sebelum kirim (POST /forms/{id}/validate) & ringkasan jawaban
        ├── KonfirmasiKirim.jsx     # Konfirmasi pengiriman berhasil (POST /assessments/{id}/submit)
        ├── Riwayat.jsx             # Daftar laporan filter NIM, tab status dengan counter & hapus draf
        ├── HasilAssessment.jsx     # Ringkasan jawaban, kelengkapan, skor GAD-7 & perbandingan skor
        └── TrackingStatus.jsx      # Stepper progres, pelacakan status, jawab klarifikasi & tindak lanjut
```
