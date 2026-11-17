import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { getMahasiswa, isConfigComplete, setCachedPatientProfile } from '../config/api';
import { telehealthService } from '../services/telehealthService';
import { toSafeText } from '../utils/formLogic';
import DisclaimerBanner from '../components/DisclaimerBanner';

const PENILAIAN_STATUS_LABELS = {
  belum_diperiksa: { label: 'Belum Diperiksa', color: 'bg-slate-100 text-slate-700' },
  disetujui: { label: 'Disetujui Dosen', color: 'bg-emerald-100 text-emerald-800' },
  perlu_revisi: { label: 'Perlu Revisi', color: 'bg-amber-100 text-amber-900' },
  ditolak: { label: 'Ditolak', color: 'bg-rose-100 text-rose-800' }
};

export default function Beranda() {
  const navigate = useNavigate();
  const mhs = getMahasiswa();
  const configured = isConfigComplete();

  const [profile, setProfile] = useState(null);
  const [forms, setForms] = useState([]);
  const [recentAssessments, setRecentAssessments] = useState([]);
  const [utsData, setUtsData] = useState(null);
  const [utsNotFound, setUtsNotFound] = useState(false);
  const [showUtsDetail, setShowUtsDetail] = useState(false);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }

    let active = true;
    async function loadDashboard() {
      setLoading(true);
      setErrorMsg('');
      try {
        const [meRes, formsRes, listRes] = await Promise.all([
          telehealthService.getMe(mhs.nim),
          telehealthService.getForms(),
          telehealthService.getAssessments(mhs.nim)
        ]);

        if (!active) return;
        setProfile(meRes.data);
        setCachedPatientProfile(meRes.data);
        setForms(Array.isArray(formsRes.data) ? formsRes.data : []);
        setRecentAssessments(Array.isArray(listRes.data) ? listRes.data : []);

        try {
          const utsRes = await telehealthService.getUtsStatus(mhs.nim);
          if (active) {
            setUtsData(utsRes.data);
            setUtsNotFound(false);
          }
        } catch (utsErr) {
          if (active && utsErr.status === 404) {
            setUtsNotFound(true);
            setUtsData(null);
          }
        }
      } catch (err) {
        if (active) setErrorMsg(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    loadDashboard();
    return () => {
      active = false;
    };
  }, [configured, mhs.nim]);

  if (!configured) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="rounded-card bg-surface-container-lowest p-8 shadow-card-elevated border border-indigo-500/15 text-center flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-secondary-fixed to-indigo-200 text-secondary flex items-center justify-center shadow-sm">
            <span className="material-symbols-outlined text-3xl">settings_applications</span>
          </div>
          <h1 className="font-headline font-bold text-2xl text-primary">
            Lengkapi Konfigurasi Token & Identitas Mahasiswa
          </h1>
          <p className="text-sm text-on-surface-variant max-w-lg leading-relaxed">
            Sebelum mengisi formulir self-assessment, silakan masukkan <strong>NIM</strong>,{' '}
            <strong>Nama Lengkap</strong>, <strong>Kelas</strong>, dan <strong>Token Pasien</strong>{' '}
            dari dosen pada halaman Pengaturan.
          </p>
          <button
            type="button"
            onClick={() => navigate('/pengaturan')}
            className="mt-2 px-8 py-3.5 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-sm shadow-pill hover:opacity-95 transition-all inline-flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">vpn_key</span>
            <span>Buka Pengaturan API</span>
          </button>
        </div>
      </div>
    );
  }

  const stats = profile?.statistik || {
    total: 0,
    draf: 0,
    menunggu: 0,
    perlu_klarifikasi: 0,
    sudah_ditinjau: 0
  };

  // Context subtitles dinamis dari riwayat nyata NIM
  const latestClarification = recentAssessments.find(
    (a) => a.status_peninjauan?.kode === 'perlu_klarifikasi'
  );
  const latestWaiting = recentAssessments.find((a) =>
    ['menunggu_peninjauan', 'sedang_ditinjau', 'klarifikasi_dijawab'].includes(
      a.status_peninjauan?.kode
    )
  );
  const latestReviewed = recentAssessments.find(
    (a) => a.status_peninjauan?.kode === 'sudah_ditinjau'
  );

  const buktiTercapai = utsData?.bukti_fitur?.tercapai ?? 0;
  const buktiTotal = utsData?.bukti_fitur?.total ?? 10;
  const buktiDaftar = utsData?.bukti_fitur?.daftar || [];
  const penilaianKode = utsData?.penilaian?.status?.kode || 'belum_diperiksa';
  const penilaianBadge =
    PENILAIAN_STATUS_LABELS[penilaianKode] || PENILAIAN_STATUS_LABELS.belum_diperiksa;
  const utsPercent = Math.min(100, Math.round((buktiTercapai / buktiTotal) * 100));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-7">
      {/* Top Identity & Clinical Encryption Ribbon */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2.5">
          <div className="inline-flex items-center gap-2 bg-surface-container-lowest px-4 py-1.5 rounded-full shadow-card border border-indigo-500/10">
            <span className="w-2 h-2 rounded-full bg-secondary animate-pulse" />
            <span className="font-headline font-bold text-xs text-primary">
              {profile?.nama || 'Memuat profil...'}
            </span>
            {profile?.id && (
              <span className="text-xs text-on-surface-variant">
                • {profile.id} ({profile.no_rm})
              </span>
            )}
          </div>

          <div className="inline-flex items-center gap-1.5 bg-surface-container-lowest px-3.5 py-1.5 rounded-full shadow-card border border-indigo-500/10 text-xs text-on-surface-variant">
            <span className="material-symbols-outlined text-[15px] text-secondary">school</span>
            <span className="font-semibold text-primary">{mhs.nama}</span>
            <span>•</span>
            <span className="font-mono font-semibold text-secondary">{mhs.nim}</span>
            <span>•</span>
            <span>{mhs.kelas}</span>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          <div className="hidden sm:inline-flex items-center gap-1.5 bg-surface-container-lowest px-3.5 py-1.5 rounded-full shadow-card border border-indigo-500/10 text-xs font-headline font-semibold text-primary/80">
            <span className="material-symbols-outlined text-[15px] text-secondary">verified_user</span>
            <span>Enkripsi Data Klinis Aktif</span>
          </div>
          <Link
            to="/pengaturan"
            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-secondary-fixed/70 hover:bg-secondary-fixed text-xs font-headline font-semibold text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span>Pengaturan</span>
          </Link>
        </div>
      </div>

      {/* Error State */}
      {errorMsg && (
        <div className="rounded-card bg-error-container/80 border border-error/40 text-on-error-container p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm">
            <span className="material-symbols-outlined">error</span>
            <span>{errorMsg}</span>
          </div>
          <Link
            to="/pengaturan"
            className="px-4 py-1.5 rounded-full bg-error text-on-error text-xs font-headline font-semibold shrink-0"
          >
            Periksa Token
          </Link>
        </div>
      )}

      {/* Atmospheric Hero Greeting Banner */}
      <section className="relative overflow-hidden rounded-card p-6 sm:p-9 bg-gradient-to-br from-[#EEF2FF] via-[#E4E9FD] to-[#DCF0FE] shadow-card-elevated border border-white/90">
        {/* Soft Decorative Radial Glow */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -right-16 -top-16 w-72 h-72 rounded-full bg-indigo-400/15 blur-2xl"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-28 -bottom-20 w-64 h-64 rounded-full bg-sky-300/20 blur-2xl"
        />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-white/90 text-secondary font-headline font-bold text-[11px] uppercase tracking-wider shadow-sm mb-3.5">
              <span className="material-symbols-outlined text-[15px]">health_and_safety</span>
              <span>Pra-Konsultasi Mandiri</span>
            </div>
            <h1 className="font-headline font-bold text-2xl sm:text-[32px] text-primary tracking-tight leading-[1.2]">
              Pantau Kondisi Kesehatan Anda Sebelum Konsultasi
            </h1>
            <p className="text-sm text-on-surface-variant mt-2.5 leading-relaxed max-w-xl">
              Isi formulir keluhan dan kuesioner mandiri untuk membantu tenaga kesehatan meninjau
              kondisi Anda secara lebih akurat sebelum sesi konsultasi.
            </p>
          </div>

          {/* Embedded Action Pill & White CTA Button inside Hero */}
          <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end gap-3 shrink-0">
            {stats.perlu_klarifikasi > 0 ? (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-100/95 border border-amber-300/90 text-amber-950 font-headline font-semibold text-xs shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-amber-700">warning</span>
                  <span>{stats.perlu_klarifikasi} laporan memerlukan klarifikasi petugas</span>
                </div>
                <Link
                  to="/riwayat?filter=perlu_klarifikasi"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary font-headline font-bold text-xs shadow-card hover:shadow-pill hover:translate-y-[-1px] transition-all"
                >
                  <span>Lihat Klarifikasi</span>
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    arrow_forward
                  </span>
                </Link>
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/85 border border-indigo-200/80 text-primary font-headline font-semibold text-xs shadow-sm">
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    folder_shared
                  </span>
                  <span>
                    {stats.total} Total Laporan • {stats.draf} Draf Tersimpan
                  </span>
                </div>
                <Link
                  to="/riwayat"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-white text-primary font-headline font-bold text-xs shadow-card hover:shadow-pill hover:translate-y-[-1px] transition-all"
                >
                  <span>Lihat Riwayat Laporan</span>
                  <span className="material-symbols-outlined text-[16px] text-secondary">
                    arrow_forward
                  </span>
                </Link>
              </>
            )}
          </div>
        </div>
      </section>

      {/* 3-Column Spacious KPI Stat Cards */}
      <section aria-label="Ringkasan Status Laporan" className="grid grid-cols-1 md:grid-cols-3 gap-5">
        {/* KPI 1: Perlu Klarifikasi */}
        <Link
          to="/riwayat?filter=perlu_klarifikasi"
          className="group rounded-card bg-surface-container-lowest p-6 shadow-card border border-indigo-500/10 hover:shadow-card-elevated hover:border-amber-300/80 transition-all flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-11 h-11 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">
                notification_important
              </span>
            </div>
            <span
              className={`px-3 py-1 rounded-full font-headline font-bold text-[11px] ${
                stats.perlu_klarifikasi > 0
                  ? 'bg-amber-100 text-amber-900'
                  : 'bg-amber-50/90 text-amber-800'
              }`}
            >
              {stats.perlu_klarifikasi > 0 ? 'Perlu Aksi Segera' : 'Tidak Ada Antrean'}
            </span>
          </div>

          <div>
            <div className="font-headline font-bold text-4xl text-primary tracking-tight">
              {loading ? '...' : stats.perlu_klarifikasi}
            </div>
            <h2 className="font-headline font-bold text-base text-primary mt-1">
              Perlu Klarifikasi
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5 truncate">
              {latestClarification
                ? toSafeText(latestClarification.judul || latestClarification.id)
                : 'Semua pertanyaan petugas telah terjawab'}
            </p>
          </div>
        </Link>

        {/* KPI 2: Menunggu Ditinjau */}
        <Link
          to="/riwayat?filter=diproses"
          className="group rounded-card bg-surface-container-lowest p-6 shadow-card border border-indigo-500/10 hover:shadow-card-elevated hover:border-secondary/40 transition-all flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-11 h-11 rounded-2xl bg-secondary-fixed/80 border border-secondary/15 text-secondary flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">hourglass_top</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline font-bold text-[11px]">
              Dalam Antrean Medis
            </span>
          </div>

          <div>
            <div className="font-headline font-bold text-4xl text-primary tracking-tight">
              {loading ? '...' : stats.menunggu}
            </div>
            <h2 className="font-headline font-bold text-base text-primary mt-1">
              Menunggu Ditinjau
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5 truncate">
              {latestWaiting
                ? toSafeText(latestWaiting.judul || latestWaiting.id)
                : `${stats.draf} draf belum dikirim`}
            </p>
          </div>
        </Link>

        {/* KPI 3: Sudah Ditinjau */}
        <Link
          to="/riwayat?filter=sudah_ditinjau"
          className="group rounded-card bg-surface-container-lowest p-6 shadow-card border border-indigo-500/10 hover:shadow-card-elevated hover:border-emerald-300/80 transition-all flex flex-col justify-between gap-4"
        >
          <div className="flex items-center justify-between gap-2">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 border border-emerald-200/70 text-emerald-700 flex items-center justify-center group-hover:scale-105 transition-transform">
              <span className="material-symbols-outlined text-[22px]">verified</span>
            </div>
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 font-headline font-bold text-[11px]">
              Selesai Diverifikasi
            </span>
          </div>

          <div>
            <div className="font-headline font-bold text-4xl text-primary tracking-tight">
              {loading ? '...' : stats.sudah_ditinjau}
            </div>
            <h2 className="font-headline font-bold text-base text-primary mt-1">
              Sudah Ditinjau
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5 truncate">
              {latestReviewed
                ? toSafeText(latestReviewed.judul || latestReviewed.id)
                : 'Arahan tindak lanjut akan muncul di sini'}
            </p>
          </div>
        </Link>
      </section>

      {/* Daftar Formulir Tersedia */}
      <section className="flex flex-col gap-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-headline font-bold text-xl text-primary tracking-tight">
              Pilih Formulir Self-Assessment
            </h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              Lengkapi instrumen penilaian di bawah ini sesuai kebutuhan konsultasi Anda.
            </p>
          </div>

          <div className="inline-flex items-center bg-surface-container-lowest p-1 rounded-full border border-indigo-500/10 shadow-card text-xs font-headline">
            <span className="px-3.5 py-1.5 rounded-full bg-surface-container-low font-bold text-primary">
              Semua Formulir
            </span>
            <span className="px-3.5 py-1.5 font-semibold text-on-surface-variant">
              Tersedia ({forms.length || 2})
            </span>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[1, 2].map((n) => (
              <div
                key={n}
                className="h-64 rounded-card bg-surface-container-lowest p-7 shadow-card animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {forms.map((form) => {
              const isGad7 = form.id === 'FRM-GAD7';
              const estMinutes = form.estimasi_menit || (isGad7 ? 2 : 5);

              return (
                <article
                  key={form.id}
                  className="group rounded-card bg-surface-container-lowest p-6 sm:p-7 shadow-card border border-indigo-500/10 hover:shadow-card-elevated hover:border-secondary/30 transition-all flex flex-col justify-between gap-6"
                >
                  <div>
                    {/* Top Row: Category Pill & Icon */}
                    <div className="flex items-center justify-between gap-3 mb-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full font-headline font-bold text-xs ${
                          isGad7
                            ? 'bg-emerald-50 text-emerald-800 border border-emerald-200/70'
                            : 'bg-secondary-fixed text-on-secondary-fixed'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            isGad7 ? 'bg-emerald-500' : 'bg-secondary'
                          }`}
                        />
                        <span>
                          {isGad7 ? `Bonus • ${estMinutes} Menit` : `Wajib • ${estMinutes} Menit`}
                        </span>
                      </span>

                      <div
                        className={`w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-105 ${
                          isGad7
                            ? 'bg-teal-50 text-teal-700 border border-teal-200/60'
                            : 'bg-secondary-fixed/70 text-secondary border border-secondary/15'
                        }`}
                      >
                        <span className="material-symbols-outlined text-[22px]">
                          {isGad7 ? 'psychology' : 'medical_services'}
                        </span>
                      </div>
                    </div>

                    {/* Title & Description */}
                    <h3 className="font-headline font-bold text-lg sm:text-xl text-primary">
                      {toSafeText(form.judul)}
                    </h3>
                    <p className="text-sm text-on-surface-variant mt-2 leading-relaxed">
                      {toSafeText(form.deskripsi) ||
                        (isGad7
                          ? 'Instrumen tervalidasi untuk memantau gejala kecemasan dalam 2 minggu terakhir.'
                          : 'Ceritakan keluhan Anda sebelum konsultasi. Jawaban akan ditinjau oleh petugas.')}
                    </p>

                    {/* Feature Highlights */}
                    <div className="flex flex-wrap items-center gap-3 mt-4 text-xs font-medium text-on-surface-variant">
                      {isGad7 ? (
                        <>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-teal-600">
                              quiz
                            </span>
                            7 Pertanyaan Terstandar
                          </span>
                          <span className="text-outline-variant">•</span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              monitoring
                            </span>
                            Interpretasi Otomatis (0–21)
                          </span>
                        </>
                      ) : (
                        <>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              format_list_numbered
                            </span>
                            4 Bagian Singkat
                          </span>
                          <span className="text-outline-variant">•</span>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined text-[16px] text-secondary">
                              alt_route
                            </span>
                            Pertanyaan Bercabang
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Bottom Bar: Standard Badge + Contrasting Pill CTA */}
                  <div className="pt-4 border-t border-surface-container flex flex-wrap items-center justify-between gap-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-headline font-semibold text-on-surface-variant">
                      <span className="material-symbols-outlined text-[16px] text-secondary">
                        verified
                      </span>
                      <span>Sesuai Standar Klinis</span>
                    </span>

                    <Link
                      to={`/formulir/${form.id}/petunjuk`}
                      className={`px-6 py-3 rounded-full font-headline font-semibold text-xs sm:text-sm inline-flex items-center gap-2 transition-all shadow-sm hover:shadow-pill ${
                        isGad7
                          ? 'bg-secondary hover:bg-secondary-container text-on-secondary'
                          : 'bg-primary-container hover:opacity-95 text-on-primary'
                      }`}
                    >
                      <span>Mulai Self-Assessment</span>
                      <span className="material-symbols-outlined text-[17px]">arrow_forward</span>
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Status Tugas UTS Card with Left Accent Bar & Gradient Progress */}
      <section className="rounded-card bg-surface-container-lowest p-6 sm:p-7 shadow-card border border-indigo-500/10 border-l-4 border-l-secondary">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="flex-1 max-w-2xl">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="font-headline font-bold text-lg text-primary">
                {utsNotFound
                  ? `Status Tugas UTS (${mhs.nim})`
                  : `Status Tugas UTS: Bukti Fitur Terdeteksi ${buktiTercapai}/${buktiTotal}`}
              </h2>

              {!utsNotFound && utsData && (
                <>
                  <span
                    className={`inline-flex items-center gap-1 px-3 py-0.5 rounded-full font-headline font-bold text-xs ${
                      buktiTercapai >= buktiTotal
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-secondary-fixed text-on-secondary-fixed'
                    }`}
                  >
                    <span className="material-symbols-outlined text-[14px]">check_circle</span>
                    <span>
                      {buktiTercapai >= buktiTotal ? 'Lengkap & Terverifikasi' : 'Dalam Progres'}
                    </span>
                  </span>

                  <span
                    className={`px-3 py-0.5 rounded-full font-headline font-semibold text-xs ${penilaianBadge.color}`}
                  >
                    {toSafeText(utsData?.penilaian?.status) || penilaianBadge.label}
                  </span>
                </>
              )}
            </div>

            <p className="text-xs sm:text-sm text-on-surface-variant mt-1.5 leading-relaxed">
              {utsNotFound
                ? 'Belum ada riwayat pengisian untuk NIM ini. Mulai isi formulir untuk mencatat bukti fitur otomatis.'
                : 'Seluruh alur self-assessment, validasi input, pelacakan status, dan ringkasan hasil terpantau otomatis oleh server.'}
            </p>

            {/* Gradient Progress Bar */}
            {!utsNotFound && utsData && (
              <div className="mt-4 max-w-md">
                <div className="w-full h-2 rounded-full bg-surface-container overflow-hidden">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-primary-container via-secondary to-teal-500 transition-all duration-500"
                    style={{ width: `${utsPercent}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {buktiDaftar.length > 0 && (
            <button
              type="button"
              onClick={() => setShowUtsDetail((prev) => !prev)}
              className="self-start md:self-center inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full bg-secondary-fixed/70 hover:bg-secondary-fixed text-secondary font-headline font-bold text-xs transition-all shrink-0"
            >
              <span>{showUtsDetail ? 'Tutup Rincian' : 'Lihat Rincian'}</span>
              <span className="material-symbols-outlined text-[16px]">
                {showUtsDetail ? 'expand_less' : 'arrow_forward'}
              </span>
            </button>
          )}
        </div>

        {/* Rincian 10 Bukti Fitur UTS */}
        {showUtsDetail && buktiDaftar.length > 0 && (
          <div className="mt-6 pt-5 border-t border-surface-container">
            {utsData?.penilaian?.catatan && (
              <div className="mb-4 p-3.5 rounded-2xl bg-secondary-fixed/40 text-xs text-primary">
                <strong>Catatan Dosen:</strong> {toSafeText(utsData.penilaian.catatan)}
              </div>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5">
              {buktiDaftar.map((item) => (
                <div
                  key={item.kode}
                  className={`p-3 rounded-2xl border flex items-start gap-2.5 transition-all ${
                    item.tercapai
                      ? 'bg-emerald-50/80 border-emerald-200 text-emerald-950'
                      : 'bg-surface-container-low border-outline-variant/40 text-on-surface-variant'
                  }`}
                >
                  <span
                    className={`material-symbols-outlined text-[18px] mt-0.5 shrink-0 ${
                      item.tercapai ? 'text-emerald-600' : 'text-outline'
                    }`}
                  >
                    {item.tercapai ? 'check_circle' : 'radio_button_unchecked'}
                  </span>
                  <div className="min-w-0">
                    <span className="block font-mono font-bold text-[11px] uppercase">
                      {item.kode}
                    </span>
                    <span className="text-xs leading-tight block mt-0.5">
                      {toSafeText(item.label) || item.kode}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Pernyataan Disclaimer Wajib */}
      <DisclaimerBanner />
    </div>
  );
}
