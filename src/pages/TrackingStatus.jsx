import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { telehealthService } from '../services/telehealthService';
import { formatTanggalIndo, toSafeText } from '../utils/formLogic';
import StatusBadge from '../components/StatusBadge';
import TimelineView from '../components/TimelineView';
import DisclaimerBanner from '../components/DisclaimerBanner';

const CYCLE_STEPS = [
  { key: 'terkirim', label: 'Terkirim', icon: 'send' },
  { key: 'ditinjau', label: 'Ditinjau Petugas', icon: 'medical_information' },
  { key: 'klarifikasi', label: 'Klarifikasi', icon: 'forum' },
  { key: 'selesai', label: 'Tindak Lanjut', icon: 'verified' }
];

function getActiveCycleIndex(peninjauanKode) {
  switch (peninjauanKode) {
    case 'sudah_ditinjau':
      return 3;
    case 'perlu_klarifikasi':
    case 'klarifikasi_dijawab':
      return 2;
    case 'sedang_ditinjau':
    case 'menunggu_peninjauan':
      return 1;
    default:
      return 0;
  }
}

export default function TrackingStatus() {
  const { assessmentId } = useParams();

  const [statusData, setStatusData] = useState(null);
  const [replyTexts, setReplyTexts] = useState({});
  const [submittingCid, setSubmittingCid] = useState(null);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const loadStatus = async () => {
    setLoading(true);
    try {
      const res = await telehealthService.getAssessmentStatus(assessmentId);
      setStatusData(res.data);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessmentId]);

  const handleReplyClarification = async (cid) => {
    const jawaban = (replyTexts[cid] || '').trim();
    if (!jawaban) {
      setFeedback({
        type: 'error',
        text: 'Silakan tulis jawaban klarifikasi terlebih dahulu sebelum mengirim.'
      });
      return;
    }

    setSubmittingCid(cid);
    setFeedback(null);
    try {
      const res = await telehealthService.replyClarification(assessmentId, cid, jawaban);
      setFeedback({
        type: 'success',
        text: toSafeText(res.message) || 'Jawaban klarifikasi berhasil dikirim ke petugas.'
      });
      setReplyTexts((prev) => ({ ...prev, [cid]: '' }));
      await loadStatus();
    } catch (err) {
      setFeedback({ type: 'error', text: err.message });
    } finally {
      setSubmittingCid(null);
    }
  };

  if (loading && !statusData) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-96 rounded-card bg-surface-container-lowest p-8 shadow-card animate-pulse" />
      </div>
    );
  }

  const pengiriman = statusData?.status_pengiriman;
  const peninjauan = statusData?.status_peninjauan;
  const pesanStatus = toSafeText(statusData?.pesan);
  const klarifikasiMenunggu = Array.isArray(statusData?.klarifikasi_menunggu)
    ? statusData.klarifikasi_menunggu
    : [];
  const tindakLanjut = statusData?.tindak_lanjut || null;
  const timeline = Array.isArray(statusData?.timeline) ? statusData.timeline : [];
  const activeStepIdx = getActiveCycleIndex(peninjauan?.kode);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-3">
        <Link
          to="/riwayat"
          className="inline-flex items-center gap-1.5 text-primary font-headline font-semibold text-sm hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Kembali ke Riwayat</span>
        </Link>

        <span className="px-3.5 py-1 rounded-full bg-surface-container-lowest border border-indigo-500/10 font-mono font-semibold text-xs text-primary shadow-card">
          {assessmentId}
        </span>
      </div>

      {/* Header Banner */}
      <section className="rounded-card p-6 bg-gradient-to-br from-[#EEF2FF] via-[#E5EAFD] to-[#E0F2FE] shadow-card border border-white/90">
        <span className="text-xs font-headline font-bold uppercase tracking-wider text-secondary">
          Pelacakan Siklus Laporan
        </span>
        <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight mt-0.5">
          Status Laporan & Peninjauan Petugas
        </h1>

        {/* 4-Stage Visual Stepper */}
        <div className="grid grid-cols-4 gap-2 mt-5">
          {CYCLE_STEPS.map((step, idx) => {
            const completed = idx <= activeStepIdx;
            const current = idx === activeStepIdx;
            return (
              <div
                key={step.key}
                className={`p-3 rounded-2xl border text-center transition-all flex flex-col items-center gap-1.5 ${
                  current
                    ? 'bg-primary-container text-on-primary border-primary shadow-sm'
                    : completed
                      ? 'bg-white/95 text-primary border-secondary/20'
                      : 'bg-white/50 text-on-surface-variant border-white/60'
                }`}
              >
                <span
                  className={`material-symbols-outlined text-[18px] ${
                    current ? 'text-white' : completed ? 'text-secondary' : 'text-outline'
                  }`}
                >
                  {step.icon}
                </span>
                <span className="font-headline font-semibold text-[11px] leading-tight">
                  {step.label}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Feedback Banner */}
      {feedback && (
        <div
          role="alert"
          className={`rounded-card p-4 border text-sm flex items-center gap-2.5 ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-error-container/80 border-error/40 text-on-error-container'
          }`}
        >
          <span className="material-symbols-outlined">
            {feedback.type === 'success' ? 'check_circle' : 'error'}
          </span>
          <span>{toSafeText(feedback.text)}</span>
        </div>
      )}

      {/* Dual Status Card */}
      <section className="rounded-card bg-surface-container-lowest p-6 shadow-card border border-indigo-500/10 flex flex-col gap-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="p-4 rounded-2xl bg-surface-container-low/70 flex items-center justify-between gap-2">
            <span className="text-xs font-headline font-semibold text-on-surface-variant">
              Status Pengiriman
            </span>
            <StatusBadge status={pengiriman} category="pengiriman" showIcon />
          </div>

          <div className="p-4 rounded-2xl bg-surface-container-low/70 flex items-center justify-between gap-2">
            <span className="text-xs font-headline font-semibold text-on-surface-variant">
              Status Peninjauan
            </span>
            <StatusBadge status={peninjauan} category="peninjauan" showIcon />
          </div>
        </div>

        {pesanStatus && (
          <div className="p-4 rounded-2xl bg-secondary-fixed/40 border border-secondary/20 text-sm text-primary leading-relaxed">
            {pesanStatus}
          </div>
        )}
      </section>

      {/* Kartu Klarifikasi Petugas */}
      {(peninjauan?.kode === 'perlu_klarifikasi' || klarifikasiMenunggu.length > 0) && (
        <section className="rounded-card bg-surface-container-lowest p-6 shadow-card-elevated border-2 border-amber-300 flex flex-col gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <span className="material-symbols-outlined text-2xl">forum</span>
            </div>
            <div>
              <h2 className="font-headline font-bold text-lg text-primary">
                Klarifikasi dari Petugas
              </h2>
              <p className="text-xs text-on-surface-variant">
                Mohon lengkapi informasi tambahan berikut untuk membantu peninjauan klinis
              </p>
            </div>
          </div>

          {klarifikasiMenunggu.map((kl) => (
            <div
              key={toSafeText(kl.id)}
              className="p-4 sm:p-5 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col gap-3"
            >
              <div className="flex items-center justify-between text-xs text-amber-900">
                <span className="font-mono font-bold">{toSafeText(kl.id)}</span>
                {kl.dibuat_pada && <span>{formatTanggalIndo(kl.dibuat_pada)}</span>}
              </div>

              <p className="text-sm font-semibold text-primary">
                Petugas: &ldquo;{toSafeText(kl.pertanyaan)}&rdquo;
              </p>

              <div>
                <label
                  htmlFor={`reply-${toSafeText(kl.id)}`}
                  className="block font-headline font-semibold text-xs text-on-surface-variant mb-1.5"
                >
                  Jawaban Anda *
                </label>
                <textarea
                  id={`reply-${toSafeText(kl.id)}`}
                  rows={3}
                  value={replyTexts[kl.id] || ''}
                  onChange={(e) =>
                    setReplyTexts((prev) => ({
                      ...prev,
                      [kl.id]: e.target.value
                    }))
                  }
                  placeholder="Tuliskan penjelasan tambahan Anda secara jelas..."
                  className="w-full p-4 rounded-2xl bg-white border border-amber-300 text-primary text-sm focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15 transition-all"
                />
              </div>

              <button
                type="button"
                disabled={submittingCid === kl.id}
                onClick={() => handleReplyClarification(kl.id)}
                className="w-full py-3.5 px-6 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-sm shadow-pill hover:opacity-95 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">send</span>
                <span>
                  {submittingCid === kl.id ? 'Mengirim Klarifikasi...' : 'Kirim Jawaban Klarifikasi'}
                </span>
              </button>
            </div>
          ))}
        </section>
      )}

      {/* Kartu Arahan Tindak Lanjut Petugas */}
      {(peninjauan?.kode === 'sudah_ditinjau' || tindakLanjut) && tindakLanjut && (
        <section className="rounded-card bg-surface-container-lowest p-6 shadow-card-elevated border-2 border-emerald-300 flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-2xl">medical_services</span>
              </div>
              <div>
                <h2 className="font-headline font-bold text-lg text-primary">
                  Arahan Tindak Lanjut Petugas
                </h2>
                <p className="text-xs text-on-surface-variant">
                  Rekomendasi langkah selanjutnya dari tenaga kesehatan
                </p>
              </div>
            </div>

            {tindakLanjut.jenis && (
              <span className="px-3.5 py-1 rounded-full bg-emerald-100 text-emerald-900 font-headline font-bold text-xs">
                {toSafeText(tindakLanjut.jenis)}
              </span>
            )}
          </div>

          <p className="text-sm text-primary leading-relaxed bg-surface-container-low/70 p-4 rounded-2xl">
            {toSafeText(tindakLanjut.arahan)}
          </p>

          {tindakLanjut.jadwal_konsultasi && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5 text-sm text-emerald-950">
              <span className="material-symbols-outlined text-emerald-700">event_available</span>
              <span>
                <strong>Jadwal Konsultasi:</strong>{' '}
                {formatTanggalIndo(tindakLanjut.jadwal_konsultasi)}
              </span>
            </div>
          )}

          {(tindakLanjut.dicatat_oleh || tindakLanjut.dicatat_pada) && (
            <p className="text-xs text-on-surface-variant">
              Dicatat oleh{' '}
              <strong>{toSafeText(tindakLanjut.dicatat_oleh) || 'Petugas Kesehatan'}</strong>
              {tindakLanjut.dicatat_pada ? ` • ${formatTanggalIndo(tindakLanjut.dicatat_pada)}` : ''}
            </p>
          )}
        </section>
      )}

      {/* Timeline Kronologis */}
      <section className="rounded-card bg-surface-container-lowest p-6 shadow-card border border-indigo-500/10">
        <h2 className="font-headline font-bold text-lg text-primary mb-4">Riwayat Status</h2>
        <TimelineView timeline={timeline} />
      </section>

      {/* Disclaimer Wajib */}
      <DisclaimerBanner compact />

      {/* Bottom Action Buttons */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to={`/hasil/${assessmentId}`}
          className="w-full py-3.5 px-6 rounded-full bg-secondary-fixed text-primary font-headline font-semibold text-sm border border-secondary/20 text-center hover:bg-secondary-fixed-dim/50 transition-all"
        >
          Lihat Ringkasan
        </Link>

        <button
          type="button"
          onClick={loadStatus}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-sm shadow-pill hover:opacity-95 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">refresh</span>
          <span>{loading ? 'Memuat Ulang...' : 'Muat Ulang Status'}</span>
        </button>
      </div>
    </div>
  );
}
