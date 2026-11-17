import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { getMahasiswa } from '../config/api';
import { telehealthService } from '../services/telehealthService';
import {
  buildSanitizedAnswers,
  getVisibleQuestions,
  getVisibleSections,
  toSafeText
} from '../utils/formLogic';

export default function PeriksaJawaban() {
  const { assessmentId } = useParams();
  const navigate = useNavigate();
  const mhs = getMahasiswa();

  const [assessment, setAssessment] = useState(null);
  const [formSchema, setFormSchema] = useState(null);
  const [validationResult, setValidationResult] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    let active = true;
    async function runValidation() {
      setLoading(true);
      setErrorMsg('');
      try {
        const detailRes = await telehealthService.getAssessmentDetail(assessmentId);
        const detail = detailRes.data;
        if (!active) return;

        if (detail?.status_pengiriman?.kode === 'terkirim') {
          navigate(`/hasil/${assessmentId}`, { replace: true });
          return;
        }

        setAssessment(detail);
        const formId = detail.form?.id || detail.form_id;
        const formRes = await telehealthService.getFormDetail(formId);
        if (!active) return;

        const schema = formRes.data;
        setFormSchema(schema);

        const rawAnswers = detail.answers || {};
        const sanitized = buildSanitizedAnswers(schema.sections || [], rawAnswers, rawAnswers, {
          forPatch: false
        });

        const valRes = await telehealthService.validateForm(formId, {
          nim: mhs.nim,
          answers: sanitized
        });

        if (active) {
          setValidationResult(valRes.data);
        }
      } catch (err) {
        if (active) setErrorMsg(err.message);
      } finally {
        if (active) setLoading(false);
      }
    }

    runValidation();
    return () => {
      active = false;
    };
  }, [assessmentId, mhs.nim, navigate]);

  const questionSectionMap = useMemo(() => {
    const map = {};
    for (const sec of formSchema?.sections || []) {
      for (const q of sec.questions || []) {
        map[q.id] = sec.id;
      }
    }
    return map;
  }, [formSchema]);

  const summaryRows = useMemo(() => {
    if (!formSchema || !assessment) return [];
    const rawAnswers = assessment.answers || {};
    const pratinjauRingkasan = validationResult?.hasil_pratinjau?.ringkasan;
    const pratinjauMap = new Map(
      Array.isArray(pratinjauRingkasan) ? pratinjauRingkasan.map((r) => [r.question_id, r]) : []
    );

    const rows = [];
    const visSecs = getVisibleSections(formSchema.sections || [], rawAnswers);

    for (const sec of visSecs) {
      const visQs = getVisibleQuestions(sec, rawAnswers);
      for (const q of visQs) {
        const previewItem = pratinjauMap.get(q.id);
        const rawVal = rawAnswers[q.id];
        const isFilled =
          rawVal !== undefined &&
          rawVal !== null &&
          rawVal !== '' &&
          !(Array.isArray(rawVal) && rawVal.length === 0);

        let displayAnswer = 'Belum diisi';
        if (previewItem && previewItem.jawaban_teks) {
          displayAnswer = toSafeText(previewItem.jawaban_teks);
        } else if (isFilled) {
          if (Array.isArray(rawVal)) {
            displayAnswer = rawVal
              .map((code) => {
                const opt = (q.options || []).find((o) => (o.value ?? o.kode) === code);
                return opt ? toSafeText(opt.label ?? opt.teks) : String(code);
              })
              .join(', ');
          } else if (q.options && q.options.length > 0) {
            const opt = q.options.find((o) => String(o.value ?? o.kode) === String(rawVal));
            displayAnswer = opt
              ? q.type === 'scale'
                ? `${toSafeText(opt.label ?? opt.teks)} (${rawVal})`
                : toSafeText(opt.label ?? opt.teks)
              : String(rawVal);
          } else {
            const unit = q.satuan || q.unit ? ` ${toSafeText(q.satuan || q.unit)}` : '';
            displayAnswer = `${rawVal}${unit}`;
          }
        }

        rows.push({
          questionId: q.id,
          sectionId: sec.id,
          label: toSafeText(q.label || q.pertanyaan || q.id),
          isFilled,
          displayAnswer,
          isMeasurement: q.data_type === 'pengukuran',
          hasError: Boolean(validationResult?.errors?.[q.id])
        });
      }
    }
    return rows;
  }, [formSchema, assessment, validationResult]);

  const handleFinalSubmit = async () => {
    if (!validationResult?.valid || submitting) return;
    setSubmitting(true);
    setErrorMsg('');
    try {
      const res = await telehealthService.submitAssessment(assessmentId);
      navigate(`/konfirmasi/${assessmentId}`, {
        state: { submitData: res.data, message: res.message }
      });
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-96 rounded-card bg-surface-container-lowest p-8 shadow-card animate-pulse" />
      </div>
    );
  }

  const isValid = Boolean(validationResult?.valid);
  const errorsObj = validationResult?.errors || {};
  const errorEntries = Object.entries(errorsObj);
  const kelengkapan = validationResult?.kelengkapan || {};
  const persen = kelengkapan.persen ?? (isValid ? 100 : 0);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <Link
          to={`/isi/${assessmentId}`}
          className="inline-flex items-center gap-1.5 text-primary font-headline font-semibold text-sm hover:text-secondary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          <span>Kembali ke Pengisian</span>
        </Link>
        <span className="px-3 py-1 rounded-full bg-surface-container-lowest border border-indigo-500/10 font-mono font-semibold text-xs text-primary">
          {assessmentId}
        </span>
      </div>

      <div>
        <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
          Periksa Jawaban Sebelum Mengirim
        </h1>
        <p className="text-sm text-on-surface-variant mt-1">
          Pastikan seluruh pertanyaan wajib telah terisi dengan benar. Setelah dikirim, laporan akan
          masuk ke antrean peninjauan petugas kesehatan.
        </p>
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

      {/* Completeness Card */}
      <section className="rounded-card bg-surface-container-lowest p-6 shadow-card border border-indigo-500/10">
        <div className="flex items-center justify-between gap-3 mb-3">
          <div>
            <h2 className="font-headline font-bold text-base text-primary">Kelengkapan Formulir</h2>
            <p className="text-xs text-on-surface-variant mt-0.5">
              {kelengkapan.wajib_terisi !== undefined && kelengkapan.wajib_total !== undefined
                ? `${kelengkapan.wajib_terisi} dari ${kelengkapan.wajib_total} pertanyaan wajib terisi`
                : isValid
                  ? 'Seluruh pertanyaan wajib telah lengkap.'
                  : 'Masih ada kolom wajib yang perlu dilengkapi.'}
            </p>
          </div>
          <span
            className={`px-3.5 py-1 rounded-full font-headline font-bold text-xs ${
              isValid ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-900'
            }`}
          >
            {isValid ? 'Siap Dikirim (100%)' : `Belum Lengkap (${persen}%)`}
          </span>
        </div>

        <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
          <div
            className={`h-full rounded-full transition-all ${
              isValid ? 'bg-emerald-500' : 'bg-amber-500'
            }`}
            style={{ width: `${persen}%` }}
          />
        </div>

        {errorEntries.length > 0 && (
          <div className="mt-5 p-4 rounded-2xl bg-amber-50 border border-amber-300">
            <p className="font-headline font-bold text-xs text-amber-950 uppercase tracking-wider mb-2">
              Masih ada yang perlu dilengkapi (ketuk untuk memperbaiki):
            </p>
            <ul className="space-y-1.5">
              {errorEntries.map(([qId, msg]) => {
                const targetSec = questionSectionMap[qId];
                return (
                  <li key={qId} className="text-sm">
                    <Link
                      to={`/isi/${assessmentId}${targetSec ? `?section=${targetSec}` : ''}`}
                      className="inline-flex items-center gap-1.5 text-amber-900 hover:text-secondary font-medium underline"
                    >
                      <span className="material-symbols-outlined text-[16px]">edit_square</span>
                      <span>{toSafeText(msg)}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        )}
      </section>

      {/* Ringkasan Jawaban */}
      <section className="rounded-card bg-surface-container-lowest p-6 shadow-card border border-indigo-500/10">
        <h2 className="font-headline font-bold text-lg text-primary mb-4">Ringkasan Jawaban</h2>

        <div className="divide-y divide-surface-container">
          {summaryRows.map((row) => (
            <div
              key={row.questionId}
              className="py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-1.5 sm:gap-4"
            >
              <div className="flex items-center gap-2 text-sm text-on-surface-variant">
                <span>{row.label}</span>
                {row.isMeasurement && (
                  <span className="px-2 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline font-bold text-[10px]">
                    ukur
                  </span>
                )}
              </div>

              <div className="sm:text-right">
                {row.isFilled ? (
                  <span className="text-sm font-semibold text-primary">{row.displayAnswer}</span>
                ) : (
                  <span
                    className={`text-sm italic ${
                      row.hasError ? 'text-error font-semibold' : 'text-outline'
                    }`}
                  >
                    Belum diisi
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 pt-5 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3">
          <Link
            to={`/isi/${assessmentId}`}
            className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-secondary-fixed text-primary font-headline font-semibold text-sm border border-secondary/20 text-center hover:bg-secondary-fixed-dim/50 transition-all"
          >
            Ubah Jawaban
          </Link>

          <button
            type="button"
            disabled={!isValid || submitting}
            onClick={handleFinalSubmit}
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-sm shadow-pill hover:opacity-95 disabled:opacity-40 disabled:cursor-not-allowed transition-all inline-flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">send</span>
            <span>{submitting ? 'Mengirim Laporan...' : 'Kirim Jawaban'}</span>
          </button>
        </div>
      </section>
    </div>
  );
}
