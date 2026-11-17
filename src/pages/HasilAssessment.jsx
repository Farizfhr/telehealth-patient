import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { telehealthService } from '../services/telehealthService';
import { toSafeText } from '../utils/formLogic';
import DisclaimerBanner from '../components/DisclaimerBanner';

const GAD7_BANDS = [
  { range: '0–4', label: 'Minimal', kode: 'minimal' },
  { range: '5–9', label: 'Ringan', kode: 'ringan' },
  { range: '10–14', label: 'Sedang', kode: 'sedang' },
  { range: '15–21', label: 'Berat', kode: 'berat' }
];

export default function HasilAssessment() {
  const { assessmentId } = useParams();

  const [hasil, setHasil] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    async function fetchHasil() {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await telehealthService.getAssessmentHasil(assessmentId);
        if (active) {
          setHasil(res.data?.hasil || res.data);
        }
      } catch (err) {
        if (active) setErrorMsg(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchHasil();
    return () => {
      active = false;
    };
  }, [assessmentId]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-96 rounded-card bg-surface-container-lowest p-8 shadow-card animate-pulse" />
      </div>
    );
  }

  const skor = hasil?.skor || null;
  const perubahan = hasil?.perubahan || null;
  const ringkasan = Array.isArray(hasil?.ringkasan) ? hasil.ringkasan : [];
  const kelengkapan = hasil?.kelengkapan || {};

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* Top Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link
          to="/riwayat"
          className="inline-flex items-center gap-1.5 text-primary font-headline font-semibold text-sm hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Kembali ke Riwayat</span>
        </Link>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-full bg-surface-container-lowest border border-indigo-500/10 font-mono font-semibold text-xs text-primary">
            {assessmentId}
          </span>
          {kelengkapan.label && (
            <span className="px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 font-headline font-semibold text-xs">
              Kelengkapan: {toSafeText(kelengkapan.label)} ({kelengkapan.persen ?? 100}%)
            </span>
          )}
        </div>
      </div>

      {errorMsg && (
        <div
          role="alert"
          className="rounded-card bg-error-container/80 border border-error/40 text-on-error-container p-4 text-sm flex items-center gap-2.5"
        >
          <span className="material-symbols-outlined">error</span>
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Title Header */}
      <div>
        <span className="text-xs font-headline font-bold uppercase tracking-wider text-secondary">
          Ringkasan Hasil Self-Assessment
        </span>
        <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight mt-0.5">
          {toSafeText(hasil?.judul) || 'Ringkasan Pengisian Pasien'}
        </h1>
      </div>

      {/* Khusus FRM-GAD7: Skor Total (0-21) & Ambang Instrumen */}
      {skor && (
        <section className="rounded-card bg-gradient-to-br from-[#EEF2FF] via-[#E4E9FD] to-[#DCF0FE] p-6 sm:p-8 shadow-card-elevated border border-white/90">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <span className="text-xs font-headline font-bold uppercase tracking-wider text-secondary">
                Skor Generalized Anxiety Disorder-7 (GAD-7)
              </span>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="font-headline font-bold text-5xl text-primary">{skor.total}</span>
                <span className="text-lg font-headline font-semibold text-on-surface-variant">
                  / {skor.maks || 21}
                </span>
              </div>
            </div>

            {skor.kategori && (
              <div className="self-start sm:self-center px-5 py-2.5 rounded-2xl bg-white/95 border border-secondary/25 shadow-sm">
                <span className="text-[11px] text-on-surface-variant block">Kategori Gejala</span>
                <span className="font-headline font-bold text-base text-primary">
                  {toSafeText(skor.kategori.label)} ({toSafeText(skor.kategori.rentang)})
                </span>
              </div>
            )}
          </div>

          {skor.keterangan && (
            <p className="text-sm text-primary/90 mt-4 leading-relaxed">
              {toSafeText(skor.keterangan)}
            </p>
          )}

          {/* Visual Threshold Bar */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-5">
            {GAD7_BANDS.map((band) => {
              const active = skor.kategori?.kode === band.kode;
              return (
                <div
                  key={band.kode}
                  className={`p-2.5 rounded-xl text-center border text-xs ${
                    active
                      ? 'bg-primary-container text-on-primary border-primary font-bold shadow-sm'
                      : 'bg-white/75 text-on-surface-variant border-white'
                  }`}
                >
                  <div className="font-headline">{band.range}</div>
                  <div>{band.label}</div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* Perbandingan Perubahan Skor GAD-7 dari Pengisian Sebelumnya */}
      {perubahan && (
        <section className="rounded-card bg-surface-container-lowest p-6 shadow-card border border-indigo-500/10">
          <h2 className="font-headline font-bold text-lg text-primary">
            Perubahan dari Laporan Sebelumnya
          </h2>
          {perubahan.pembanding_id && (
            <p className="text-xs text-on-surface-variant mt-0.5">
              Dibandingkan dengan laporan{' '}
              <strong className="font-mono">{toSafeText(perubahan.pembanding_id)}</strong>
            </p>
          )}

          {perubahan.skor && (
            <div className="mt-4 p-4 rounded-2xl bg-secondary-fixed/40 border border-secondary/20 flex flex-wrap items-center justify-between gap-3">
              <div className="text-sm font-headline font-semibold text-primary">
                Skor {perubahan.skor.sebelumnya} → {perubahan.skor.sekarang}
              </div>
              <span
                className={`px-3 py-1 rounded-full font-headline font-bold text-xs ${
                  perubahan.skor.selisih > 0
                    ? 'bg-amber-100 text-amber-900'
                    : perubahan.skor.selisih < 0
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-slate-100 text-slate-700'
                }`}
              >
                {perubahan.skor.selisih > 0
                  ? `Naik +${perubahan.skor.selisih} poin`
                  : perubahan.skor.selisih < 0
                    ? `Turun ${perubahan.skor.selisih} poin`
                    : 'Tidak ada perubahan skor'}
              </span>
            </div>
          )}

          {Array.isArray(perubahan.perubahan) && perubahan.perubahan.length > 0 && (
            <div className="mt-4 divide-y divide-surface-container">
              {perubahan.perubahan.map((diff, idx) => (
                <div
                  key={idx}
                  className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-1 text-sm"
                >
                  <span className="text-on-surface-variant font-medium">
                    {toSafeText(diff.label)}
                  </span>
                  <span className="text-primary font-semibold">
                    {toSafeText(diff.sebelumnya)} → {toSafeText(diff.sekarang)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Ringkasan Jawaban Pasien */}
      <section className="rounded-card bg-surface-container-lowest p-6 shadow-card border border-indigo-500/10">
        <h2 className="font-headline font-bold text-lg text-primary mb-4">Jawaban Anda</h2>

        <div className="divide-y divide-surface-container">
          {ringkasan.map((item) => {
            const notFilled =
              item.terisi === false ||
              item.jawaban_teks === 'Belum diisi' ||
              item.jawaban === null ||
              item.jawaban === undefined;

            return (
              <div
                key={item.question_id}
                className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4"
              >
                <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                  <span>{toSafeText(item.label || item.pertanyaan)}</span>
                  {item.data_type === 'pengukuran' && (
                    <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline font-bold text-[10px]">
                      ukur
                    </span>
                  )}
                </div>

                <div className="sm:text-right">
                  {notFilled ? (
                    <span className="text-sm italic text-outline">Belum diisi</span>
                  ) : (
                    <span className="text-sm font-semibold text-primary">
                      {toSafeText(item.jawaban_teks) || toSafeText(item.jawaban)}
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* Langkah Berikutnya */}
      {hasil?.langkah_berikutnya && (
        <div className="rounded-card bg-secondary-fixed/50 border border-secondary/20 p-4 sm:p-5 text-sm text-primary">
          <strong>Langkah berikutnya:</strong> {toSafeText(hasil.langkah_berikutnya)}
        </div>
      )}

      {/* Disclaimer Wajib */}
      <DisclaimerBanner />

      {/* Bottom CTA */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Link
          to={`/status/${assessmentId}`}
          className="w-full py-4 px-8 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-sm shadow-pill hover:opacity-95 transition-all text-center inline-flex items-center justify-center gap-2"
        >
          <span className="material-symbols-outlined text-[18px]">track_changes</span>
          <span>Pantau Status Laporan</span>
        </Link>
      </div>
    </div>
  );
}
