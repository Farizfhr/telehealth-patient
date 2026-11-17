import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { getMahasiswa, isConfigComplete } from '../config/api';
import { telehealthService } from '../services/telehealthService';
import { formatTanggalIndo, toSafeText } from '../utils/formLogic';
import StatusBadge from '../components/StatusBadge';

const FILTER_TABS = [
  { key: 'semua', label: 'Semua' },
  { key: 'draft', label: 'Draf' },
  { key: 'diproses', label: 'Diproses' },
  { key: 'perlu_klarifikasi', label: 'Perlu klarifikasi' },
  { key: 'sudah_ditinjau', label: 'Sudah ditinjau' }
];

export default function Riwayat() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const mhs = getMahasiswa();

  const initialTab = searchParams.get('filter') || 'semua';
  const [activeTab, setActiveTab] = useState(initialTab);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deletingId, setDeletingId] = useState(null);
  const [feedback, setFeedback] = useState(null);

  const loadAssessments = async () => {
    if (!isConfigComplete()) {
      navigate('/pengaturan');
      return;
    }

    setLoading(true);
    try {
      const res = await telehealthService.getAssessments(mhs.nim);
      setItems(Array.isArray(res.data) ? res.data : []);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAssessments();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mhs.nim]);

  const handleTabChange = (tabKey) => {
    setActiveTab(tabKey);
    if (tabKey === 'semua') {
      setSearchParams({});
    } else {
      setSearchParams({ filter: tabKey });
    }
  };

  const handleDeleteDraft = async (id) => {
    const confirmed = window.confirm(`Hapus draf laporan ${id}? Tindakan ini tidak dapat dibatalkan.`);
    if (!confirmed) return;

    setDeletingId(id);
    setFeedback(null);
    try {
      const res = await telehealthService.deleteAssessment(id);
      setFeedback({
        type: 'success',
        text: toSafeText(res.message) || `Draf ${id} berhasil dihapus.`
      });
      setItems((prev) => prev.filter((item) => item.id !== id));
    } catch (err) {
      setFeedback({
        type: 'error',
        text: err.message
      });
    } finally {
      setDeletingId(null);
    }
  };

  const counts = {
    semua: items.length,
    draft: items.filter((i) => i.status_pengiriman?.kode === 'draft').length,
    diproses: items.filter(
      (i) =>
        i.status_pengiriman?.kode === 'terkirim' &&
        ['menunggu_peninjauan', 'sedang_ditinjau', 'klarifikasi_dijawab'].includes(
          i.status_peninjauan?.kode
        )
    ).length,
    perlu_klarifikasi: items.filter(
      (i) => i.status_peninjauan?.kode === 'perlu_klarifikasi'
    ).length,
    sudah_ditinjau: items.filter((i) => i.status_peninjauan?.kode === 'sudah_ditinjau').length
  };

  const filteredItems = items.filter((item) => {
    const pengiriman = item.status_pengiriman?.kode;
    const peninjauan = item.status_peninjauan?.kode;

    if (activeTab === 'semua') return true;
    if (activeTab === 'draft') return pengiriman === 'draft';
    if (activeTab === 'diproses') {
      return (
        pengiriman === 'terkirim' &&
        ['menunggu_peninjauan', 'sedang_ditinjau', 'klarifikasi_dijawab'].includes(peninjauan)
      );
    }
    if (activeTab === 'perlu_klarifikasi') return peninjauan === 'perlu_klarifikasi';
    if (activeTab === 'sudah_ditinjau') return peninjauan === 'sudah_ditinjau';
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* Header Banner */}
      <section className="rounded-card p-6 sm:p-7 bg-gradient-to-br from-[#EEF2FF] via-[#E5EAFD] to-[#E0F2FE] shadow-card border border-white/90 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 text-secondary font-headline font-bold text-[11px] uppercase tracking-wider mb-2">
            <span className="material-symbols-outlined text-[14px]">folder_open</span>
            <span>Arsip Rekam Self-Assessment</span>
          </div>
          <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
            Riwayat Self-Assessment
          </h1>
          <p className="text-xs sm:text-sm text-on-surface-variant mt-1">
            Menampilkan khusus laporan milik <strong className="text-primary">{mhs.nama}</strong> •
            NIM <strong className="font-mono text-secondary">{mhs.nim}</strong>
          </p>
        </div>

        <Link
          to="/"
          className="px-6 py-3 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-xs sm:text-sm shadow-pill hover:opacity-95 transition-all inline-flex items-center gap-2 self-start sm:self-center shrink-0"
        >
          <span className="material-symbols-outlined text-[18px]">add_circle</span>
          <span>Isi Formulir Baru</span>
        </Link>
      </section>

      {/* Filter Tabs with Live Counters */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        {FILTER_TABS.map((tab) => {
          const active = activeTab === tab.key;
          const count = counts[tab.key] ?? 0;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => handleTabChange(tab.key)}
              className={`px-4 py-2 rounded-full font-headline font-semibold text-xs whitespace-nowrap transition-all inline-flex items-center gap-2 ${
                active
                  ? 'bg-primary-container text-on-primary shadow-sm'
                  : 'bg-surface-container-lowest text-on-surface-variant border border-indigo-500/10 hover:text-primary hover:border-secondary/30'
              }`}
            >
              <span>{tab.label}</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                  active
                    ? 'bg-white/20 text-white'
                    : 'bg-surface-container text-on-surface-variant'
                }`}
              >
                {count}
              </span>
            </button>
          );
        })}
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`rounded-card p-4 border text-sm flex items-center justify-between gap-3 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-error-container/80 border-error/40 text-on-error-container'
          }`}
        >
          <span>{toSafeText(feedback.text)}</span>
          <button
            type="button"
            onClick={() => setFeedback(null)}
            className="text-xs font-bold underline"
          >
            Tutup
          </button>
        </div>
      )}

      {/* List */}
      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-40 rounded-card bg-surface-container-lowest p-6 shadow-card animate-pulse"
            />
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="rounded-card bg-surface-container-lowest p-12 shadow-card border border-indigo-500/10 text-center flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-secondary-fixed/70 text-secondary flex items-center justify-center">
            <span className="material-symbols-outlined text-3xl">inbox</span>
          </div>
          <h2 className="font-headline font-bold text-lg text-primary">
            Tidak ada laporan pada kategori ini
          </h2>
          <p className="text-sm text-on-surface-variant max-w-md">
            Mulai pengisian formulir keluhan atau kuesioner GAD-7 dari halaman Beranda.
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-4">
          {filteredItems.map((item) => {
            const isDraft = item.status_pengiriman?.kode === 'draft';
            const peninjauanKode = item.status_peninjauan?.kode;
            const needClarification = peninjauanKode === 'perlu_klarifikasi';
            const isReviewed = peninjauanKode === 'sudah_ditinjau';
            const isGad7 = (item.form?.id || item.form_id) === 'FRM-GAD7';

            return (
              <article
                key={item.id}
                className={`rounded-card bg-surface-container-lowest p-5 sm:p-6 shadow-card border border-indigo-500/10 border-l-4 hover:shadow-card-elevated transition-all flex flex-col gap-4 ${
                  needClarification
                    ? 'border-l-amber-500'
                    : isReviewed
                      ? 'border-l-emerald-500'
                      : isDraft
                        ? 'border-l-slate-400'
                        : 'border-l-secondary'
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                  <div className="flex items-start gap-3.5">
                    <div
                      className={`w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 mt-0.5 ${
                        isGad7
                          ? 'bg-teal-50 text-teal-700 border border-teal-200/70'
                          : 'bg-secondary-fixed/70 text-secondary border border-secondary/15'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[22px]">
                        {isGad7 ? 'psychology' : 'medical_services'}
                      </span>
                    </div>

                    <div>
                      <h2 className="font-headline font-bold text-lg text-primary leading-snug">
                        {toSafeText(item.judul || item.form?.judul) || 'Self-Assessment'}
                      </h2>
                      <div className="flex flex-wrap items-center gap-2 text-xs text-on-surface-variant mt-1">
                        <span>{toSafeText(item.form?.judul)}</span>
                        <span>•</span>
                        <span className="px-2 py-0.5 rounded-md bg-surface-container-low font-mono font-semibold text-primary">
                          {item.id}
                        </span>
                        <span>•</span>
                        <span>
                          {isDraft
                            ? `Dibuat ${formatTanggalIndo(item.dibuat_pada)}`
                            : `Dikirim ${formatTanggalIndo(item.dikirim_pada || item.dibuat_pada)}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <StatusBadge status={item.status_pengiriman} category="pengiriman" />
                    {!isDraft && (
                      <StatusBadge status={item.status_peninjauan} category="peninjauan" />
                    )}
                  </div>
                </div>

                {needClarification && (
                  <div className="px-4 py-2.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 font-medium flex items-center gap-2">
                    <span className="material-symbols-outlined text-[16px] text-amber-700">
                      help
                    </span>
                    <span>Petugas meminta klarifikasi tambahan. Silakan segera jawab.</span>
                  </div>
                )}

                <div className="flex flex-wrap items-center justify-between gap-2.5 pt-3 border-t border-surface-container">
                  <div className="flex flex-wrap items-center gap-2.5">
                    {isDraft ? (
                      <>
                        <Link
                          to={`/isi/${item.id}`}
                          className="px-5 py-2.5 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-xs hover:opacity-95 transition-all inline-flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">edit</span>
                          <span>Lanjutkan Pengisian</span>
                        </Link>
                        <button
                          type="button"
                          disabled={deletingId === item.id}
                          onClick={() => handleDeleteDraft(item.id)}
                          className="px-5 py-2.5 rounded-full bg-error-container/50 text-error font-headline font-semibold text-xs border border-error/20 hover:bg-error-container transition-all disabled:opacity-50 inline-flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">delete</span>
                          <span>{deletingId === item.id ? 'Menghapus...' : 'Hapus Draf'}</span>
                        </button>
                      </>
                    ) : (
                      <>
                        <Link
                          to={`/hasil/${item.id}`}
                          className="px-5 py-2.5 rounded-full bg-secondary-fixed text-primary font-headline font-semibold text-xs border border-secondary/20 hover:bg-secondary-fixed-dim/50 transition-all inline-flex items-center gap-1.5"
                        >
                          <span className="material-symbols-outlined text-[16px]">summarize</span>
                          <span>Lihat Ringkasan</span>
                        </Link>

                        <Link
                          to={`/status/${item.id}`}
                          className={`px-5 py-2.5 rounded-full font-headline font-semibold text-xs transition-all inline-flex items-center gap-1.5 ${
                            needClarification
                              ? 'bg-amber-500 text-white hover:bg-amber-600'
                              : isReviewed
                                ? 'bg-emerald-700 text-white hover:bg-emerald-800'
                                : 'bg-primary-container text-on-primary hover:opacity-95'
                          }`}
                        >
                          <span className="material-symbols-outlined text-[16px]">
                            {needClarification
                              ? 'forum'
                              : isReviewed
                                ? 'medical_services'
                                : 'track_changes'}
                          </span>
                          <span>
                            {needClarification
                              ? 'Jawab Klarifikasi'
                              : isReviewed
                                ? 'Lihat Tindak Lanjut'
                                : 'Pantau Status'}
                          </span>
                        </Link>
                      </>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
