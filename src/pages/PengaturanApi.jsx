import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  getMahasiswa,
  getToken,
  setApiBaseUrl,
  setCachedPatientProfile,
  setMahasiswa,
  setToken
} from '../config/api';
import { telehealthService } from '../services/telehealthService';

export default function PengaturanApi() {
  const navigate = useNavigate();
  const initialMhs = getMahasiswa();

  const [nim, setNim] = useState(initialMhs.nim || '');
  const [nama, setNama] = useState(initialMhs.nama || '');
  const [kelas, setKelas] = useState(initialMhs.kelas || '');
  const [token, setTokenValue] = useState(getToken() || '');
  const [apiUrl, setApiUrlValue] = useState(getApiBaseUrl() || DEFAULT_API_BASE_URL);
  const [showToken, setShowToken] = useState(false);

  const [loading, setLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const handleSaveAndTest = async (e) => {
    e.preventDefault();
    setFeedback(null);

    const cleanNim = nim.toUpperCase().replace(/[^A-Z0-9]/g, '').trim();
    const cleanNama = nama.trim();
    const cleanKelas = kelas.trim();
    const cleanToken = token.trim();

    if (cleanNim.length < 5 || cleanNim.length > 20) {
      setFeedback({
        type: 'error',
        title: 'Format NIM Tidak Valid',
        message: 'NIM wajib terdiri dari 5 hingga 20 karakter huruf/angka (contoh: G2A021001).'
      });
      return;
    }

    if (cleanNama.length < 3 || cleanNama.length > 100) {
      setFeedback({
        type: 'error',
        title: 'Format Nama Tidak Valid',
        message: 'Nama lengkap wajib terdiri dari 3 hingga 100 karakter.'
      });
      return;
    }

    if (!cleanKelas || cleanKelas.length > 20) {
      setFeedback({
        type: 'error',
        title: 'Format Kelas Tidak Valid',
        message: 'Kelas wajib diisi (maksimal 20 karakter, contoh: TI-5A).'
      });
      return;
    }

    if (!cleanToken) {
      setFeedback({
        type: 'error',
        title: 'Token Pasien Kosong',
        message: 'Masukkan token pasien dari dosen (berawalan tlh_pasien_).'
      });
      return;
    }

    const savedMhs = setMahasiswa({ nim: cleanNim, nama: cleanNama, kelas: cleanKelas });
    setNim(savedMhs.nim);
    setToken(cleanToken);
    setApiBaseUrl(apiUrl);

    setLoading(true);
    try {
      const meRes = await telehealthService.getMe(savedMhs.nim);
      const patientData = meRes.data;
      setCachedPatientProfile(patientData);

      setFeedback({
        type: 'success',
        title: 'Koneksi Berhasil (200 OK)',
        message: `Terhubung sebagai pasien ${patientData.nama} (${patientData.id} • ${patientData.no_rm || '-'}) untuk NIM ${savedMhs.nim}.`,
        patient: patientData
      });
    } catch (err) {
      setCachedPatientProfile(null);
      setFeedback({
        type: 'error',
        title: err.status === 401 ? 'Autentikasi Gagal (401 Unauthorized)' : 'Gagal Menguji Koneksi',
        message: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 flex flex-col gap-6">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-headline font-semibold text-secondary uppercase tracking-wider mb-1">
            <span>Portal Integrasi</span>
            <span className="text-outline-variant">/</span>
            <span className="text-on-surface-variant">Konfigurasi Mahasiswa & Token</span>
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
            Pengaturan & Koneksi API
          </h1>
          <p className="text-sm text-on-surface-variant mt-1 max-w-2xl">
            Identitas mahasiswa dan token pasien disimpan secara lokal di browser (localStorage) dan
            dikirim otomatis pada setiap permintaan self-assessment.
          </p>
        </div>

        {feedback?.type === 'success' && (
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface-container-lowest shadow-card border border-emerald-200 self-start">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="font-headline font-semibold text-xs text-emerald-800">
              Terhubung (200 OK)
            </span>
          </div>
        )}
      </div>

      {feedback && (
        <div
          role="alert"
          className={`rounded-card p-5 border shadow-card ${
            feedback.type === 'success'
              ? 'bg-emerald-50/90 border-emerald-300 text-emerald-950'
              : 'bg-error-container/70 border-error/40 text-on-error-container'
          }`}
        >
          <div className="flex items-start gap-3">
            <span className="material-symbols-outlined text-2xl mt-0.5">
              {feedback.type === 'success' ? 'verified' : 'gpp_bad'}
            </span>
            <div className="flex-1">
              <h2 className="font-headline font-bold text-base">{feedback.title}</h2>
              <p className="text-sm mt-1">{feedback.message}</p>
              {feedback.type === 'success' && (
                <button
                  type="button"
                  onClick={() => navigate('/')}
                  className="mt-3 inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-xs hover:opacity-95 transition-all"
                >
                  <span>Lanjut ke Beranda Pasien</span>
                  <span className="material-symbols-outlined text-[16px]">arrow_forward</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSaveAndTest} className="flex flex-col gap-6">
        <section className="bg-surface-container-lowest rounded-card p-6 sm:p-8 shadow-card border border-indigo-500/10">
          <div className="flex items-start justify-between gap-4 pb-5 border-b border-surface-container">
            <div className="flex items-center gap-3.5">
              <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">badge</span>
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg text-primary">Identitas Mahasiswa</h2>
                <p className="text-xs text-on-surface-variant">
                  Wajib dikirim saat membuat self-assessment dan memfilter riwayat Anda
                </p>
              </div>
            </div>
            <span className="hidden sm:inline-flex items-center gap-1 px-3 py-1 rounded-full bg-surface-container-low text-on-surface-variant font-headline font-semibold text-xs">
              <span className="material-symbols-outlined text-sm text-secondary">school</span>
              UNIMUS
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-5">
            <div>
              <label
                htmlFor="input-nim"
                className="block font-headline font-semibold text-xs text-on-surface-variant mb-1.5"
              >
                NIM (5–20 Alfanumerik) *
              </label>
              <input
                id="input-nim"
                type="text"
                value={nim}
                maxLength={20}
                placeholder="G2A021001"
                onChange={(e) => setNim(e.target.value.toUpperCase())}
                className="w-full h-12 px-5 rounded-full bg-surface-container-low/70 border border-primary/15 text-primary text-sm font-medium uppercase focus:bg-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="input-nama"
                className="block font-headline font-semibold text-xs text-on-surface-variant mb-1.5"
              >
                Nama Lengkap *
              </label>
              <input
                id="input-nama"
                type="text"
                value={nama}
                maxLength={100}
                placeholder="Rina Wulandari"
                onChange={(e) => setNama(e.target.value)}
                className="w-full h-12 px-5 rounded-full bg-surface-container-low/70 border border-primary/15 text-primary text-sm font-medium focus:bg-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15 transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="input-kelas"
                className="block font-headline font-semibold text-xs text-on-surface-variant mb-1.5"
              >
                Kelas *
              </label>
              <input
                id="input-kelas"
                type="text"
                value={kelas}
                maxLength={20}
                placeholder="TI-5A"
                onChange={(e) => setKelas(e.target.value)}
                className="w-full h-12 px-5 rounded-full bg-surface-container-low/70 border border-primary/15 text-primary text-sm font-medium focus:bg-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15 transition-all"
              />
            </div>
          </div>
        </section>

        <section className="bg-surface-container-lowest rounded-card p-6 sm:p-8 shadow-card border border-indigo-500/10">
          <div className="flex items-center gap-3.5 pb-5 border-b border-surface-container">
            <div className="w-12 h-12 rounded-2xl bg-secondary-fixed text-secondary flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">vpn_key</span>
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-primary">Kredensial & Endpoint API</h2>
              <p className="text-xs text-on-surface-variant">
                Gunakan token akun pasien simulasi dari dosen (P-001, P-002, atau P-003)
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-5">
            <div>
              <label
                htmlFor="input-token"
                className="block font-headline font-semibold text-xs text-on-surface-variant mb-1.5"
              >
                Token Pasien (Bearer Token) *
              </label>
              <div className="flex items-center gap-2">
                <input
                  id="input-token"
                  type={showToken ? 'text' : 'password'}
                  value={token}
                  placeholder="tlh_pasien_xxxxxxxxxxxxxxxxxxxxxxxx"
                  onChange={(e) => setTokenValue(e.target.value)}
                  className="flex-1 h-12 px-5 rounded-full bg-surface-container-low/70 border border-primary/15 text-primary text-sm font-mono focus:bg-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowToken((prev) => !prev)}
                  className="h-12 px-5 rounded-full bg-secondary-fixed text-primary font-headline font-semibold text-xs border border-secondary/20 hover:bg-secondary-fixed-dim/50 transition-all shrink-0"
                >
                  {showToken ? 'Sembunyikan' : 'Lihat'}
                </button>
              </div>
              <p className="text-xs text-on-surface-variant mt-1.5">
                Token disimpan di <code className="text-secondary font-mono">localStorage</code>{' '}
                browser Anda dan tidak ditulis di dalam kode sumber.
              </p>
            </div>

            <div>
              <label
                htmlFor="input-api-url"
                className="block font-headline font-semibold text-xs text-on-surface-variant mb-1.5"
              >
                Base URL REST API
              </label>
              <input
                id="input-api-url"
                type="url"
                value={apiUrl}
                onChange={(e) => setApiUrlValue(e.target.value)}
                className="w-full h-12 px-5 rounded-full bg-surface-container-low/70 border border-primary/15 text-primary text-sm font-mono focus:bg-white focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15 transition-all"
              />
            </div>
          </div>
        </section>

        <div className="flex flex-col sm:flex-row items-center justify-end gap-3">
          <button
            type="submit"
            disabled={loading}
            className="w-full sm:w-auto h-13 px-8 py-3.5 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-sm shadow-pill hover:opacity-95 disabled:opacity-60 transition-all flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[19px]">
              {loading ? 'sync' : 'check_circle'}
            </span>
            <span>{loading ? 'Menguji Koneksi...' : 'Simpan & Uji Koneksi'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
