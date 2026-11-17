import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMahasiswa, isConfigComplete } from '../config/api';
import { telehealthService } from '../services/telehealthService';
import { toSafeText } from '../utils/formLogic';

export default function PetunjukConsent() {
  const { formId } = useParams();
  const navigate = useNavigate();
  const mhs = getMahasiswa();

  const [formDetail, setFormDetail] = useState(null);
  const [agreed, setAgreed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (!isConfigComplete()) {
      navigate('/pengaturan');
      return;
    }

    let active = true;
    async function fetchForm() {
      setLoading(true);
      setErrorMsg('');
      try {
        const res = await telehealthService.getFormDetail(formId);
        if (active) setFormDetail(res.data);
      } catch (err) {
        if (active) setErrorMsg(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    fetchForm();
    return () => {
      active = false;
    };
  }, [formId, navigate]);

  const handleStart = async () => {
    if (!agreed || submitting) return;
    setSubmitting(true);
    setErrorMsg('');

    try {
      const res = await telehealthService.createAssessment({
        form_id: formId,
        persetujuan: true,
        mahasiswa: mhs
      });
      const createdId = res.data?.id;
      if (createdId) {
        navigate(`/isi/${createdId}`);
      } else {
        setErrorMsg('ID draf self-assessment tidak diterima dari server.');
      }
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-80 rounded-card bg-surface-container-lowest p-8 shadow-card animate-pulse" />
      </div>
    );
  }

  const petunjukList = Array.isArray(formDetail?.petunjuk)
    ? formDetail.petunjuk.map((p) => toSafeText(p))
    : [
        'Formulir ini membantu Anda menyampaikan kondisi kesehatan sebelum sesi konsultasi.',
        'Jawab sesuai kondisi yang Anda rasakan. Tidak ada jawaban benar atau salah.',
        'Pertanyaan bertanda wajib (*) harus diisi sebelum formulir dapat dikirim.',
        'Anda dapat menyimpan jawaban sebagai draf dan melanjutkannya kapan saja.',
        'Hasil self-assessment BUKAN diagnosis. Laporan akan ditinjau oleh tenaga kesehatan.'
      ];

  const consentText =
    toSafeText(formDetail?.persetujuan) ||
    'Saya memahami bahwa data yang saya isi digunakan untuk persiapan konsultasi, hanya dapat diakses oleh petugas yang berwenang, dan hasilnya bukan diagnosis.';

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* Back Button */}
      <div>
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-primary font-headline font-semibold text-sm hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Kembali ke Beranda</span>
        </Link>
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

      {/* Form Header Card */}
      <section className="rounded-card bg-gradient-to-br from-[#EEF2FF] via-[#E4E9FD] to-[#DCF0FE] p-6 sm:p-8 shadow-card-elevated border border-white/90 text-center flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-white text-secondary flex items-center justify-center shadow-sm mb-4">
          <span className="material-symbols-outlined text-3xl">
            {formId === 'FRM-GAD7' ? 'psychology' : 'medical_services'}
          </span>
        </div>
        <span className="px-3.5 py-1 rounded-full bg-white/90 text-secondary font-headline font-bold text-xs mb-2 shadow-sm">
          {formDetail?.id || formId} • Versi {formDetail?.versi || '1.0'}
        </span>
        <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
          {toSafeText(formDetail?.judul) || 'Formulir Self-Assessment'}
        </h1>
        <p className="text-sm text-on-surface-variant mt-2 max-w-xl leading-relaxed">
          {toSafeText(formDetail?.tujuan || formDetail?.deskripsi) ||
            'Ceritakan keluhan dan kondisi Anda sebelum konsultasi agar tenaga kesehatan dapat meninjau secara menyeluruh.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 mt-5 text-xs text-primary font-medium">
          <span className="inline-flex items-center gap-1.5 bg-white/90 px-3.5 py-1.5 rounded-full shadow-sm">
            <span className="material-symbols-outlined text-[16px] text-secondary">schedule</span>
            Perkiraan waktu: {formDetail?.estimasi_menit || 5} menit
          </span>
          {formDetail?.periode_pelaporan && (
            <span className="inline-flex items-center gap-1.5 bg-white/90 px-3.5 py-1.5 rounded-full shadow-sm">
              <span className="material-symbols-outlined text-[16px] text-secondary">event_note</span>
              Periode: {toSafeText(formDetail.periode_pelaporan)}
            </span>
          )}
        </div>
      </section>

      {/* Petunjuk Pengisian */}
      <section className="rounded-card bg-surface-container-lowest p-6 sm:p-8 shadow-card border border-indigo-500/10">
        <h2 className="font-headline font-bold text-lg text-primary mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined text-secondary">info</span>
          <span>Petunjuk Pengisian</span>
        </h2>
        <ul className="space-y-3">
          {petunjukList.map((item, idx) => (
            <li key={idx} className="flex items-start gap-3 text-sm text-on-surface leading-relaxed">
              <span className="w-6 h-6 rounded-full bg-secondary-fixed text-secondary font-headline font-bold text-xs flex items-center justify-center shrink-0 mt-0.5">
                {idx + 1}
              </span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Persetujuan Penggunaan Data (Consent) */}
      <section className="rounded-card bg-surface-container-lowest p-6 sm:p-8 shadow-card border border-indigo-500/10 flex flex-col gap-5">
        <div>
          <h2 className="font-headline font-bold text-lg text-primary">
            Persetujuan Penggunaan Data
          </h2>
          <p className="text-xs text-on-surface-variant mt-0.5">
            Pengisian akan tercatat atas identitas mahasiswa{' '}
            <strong className="text-primary">
              {mhs.nama} ({mhs.nim} • {mhs.kelas})
            </strong>
          </p>
        </div>

        <label
          htmlFor="consent-checkbox"
          className={`p-4 sm:p-5 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-3.5 ${
            agreed
              ? 'bg-secondary-fixed/50 border-secondary text-primary'
              : 'bg-surface-container-low/60 border-primary/15 text-on-surface hover:border-secondary/40'
          }`}
        >
          <input
            id="consent-checkbox"
            type="checkbox"
            checked={agreed}
            onChange={(e) => setAgreed(e.target.checked)}
            className="mt-1 w-5 h-5 rounded accent-secondary cursor-pointer shrink-0"
          />
          <span className="text-sm leading-relaxed font-medium">{consentText}</span>
        </label>

        <button
          type="button"
          disabled={!agreed || submitting}
          onClick={handleStart}
          className="w-full py-4 px-8 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-sm shadow-pill hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2"
        >
          <span>{submitting ? 'Membuat Draf Pengisian...' : 'Mulai Pengisian Formulir'}</span>
          <span className="material-symbols-outlined text-[19px]">arrow_forward</span>
        </button>
      </section>
    </div>
  );
}
