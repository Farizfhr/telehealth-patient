import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { telehealthService } from '../services/telehealthService';
import {
  buildSanitizedAnswers,
  getVisibleQuestions,
  getVisibleSections,
  toSafeText
} from '../utils/formLogic';
import DynamicFieldRenderer from '../components/DynamicFieldRenderer';
import DisclaimerBanner from '../components/DisclaimerBanner';

export default function FormBertahap() {
  const { assessmentId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const [assessment, setAssessment] = useState(null);
  const [formSchema, setFormSchema] = useState(null);
  const [answers, setAnswers] = useState({});
  const [persistedAnswers, setPersistedAnswers] = useState({});
  const [currentStep, setCurrentStep] = useState(0);

  const [fieldErrors, setFieldErrors] = useState({});
  const [bannerMessage, setBannerMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let active = true;
    async function loadAssessmentAndForm() {
      setLoading(true);
      setBannerMessage(null);
      try {
        const detailRes = await telehealthService.getAssessmentDetail(assessmentId);
        const detail = detailRes.data;
        if (!active) return;

        if (detail?.status_pengiriman?.kode === 'terkirim') {
          navigate(`/hasil/${assessmentId}`, { replace: true });
          return;
        }

        setAssessment(detail);
        const initialAns = detail.answers && typeof detail.answers === 'object' ? detail.answers : {};
        setAnswers(initialAns);
        setPersistedAnswers(initialAns);

        const formId = detail.form?.id || detail.form_id;
        const formRes = await telehealthService.getFormDetail(formId);
        if (!active) return;

        setFormSchema(formRes.data);

        const targetSectionId = searchParams.get('section');
        if (targetSectionId && Array.isArray(formRes.data?.sections)) {
          const visSecs = getVisibleSections(formRes.data.sections, initialAns);
          const foundIdx = visSecs.findIndex((s) => s.id === targetSectionId);
          if (foundIdx >= 0) {
            setCurrentStep(foundIdx);
          }
        }
      } catch (err) {
        if (active) {
          setBannerMessage({ type: 'error', text: err.message });
        }
      } finally {
        if (active) setLoading(false);
      }
    }

    loadAssessmentAndForm();
    return () => {
      active = false;
    };
  }, [assessmentId, navigate, searchParams]);

  const sections = formSchema?.sections || [];
  const visibleSections = useMemo(() => getVisibleSections(sections, answers), [sections, answers]);

  const safeStepIndex = Math.min(currentStep, Math.max(0, visibleSections.length - 1));
  const activeSection = visibleSections[safeStepIndex] || null;
  const activeQuestions = useMemo(
    () => getVisibleQuestions(activeSection, answers),
    [activeSection, answers]
  );

  const handleFieldChange = (questionId, nextVal) => {
    setAnswers((prev) => ({
      ...prev,
      [questionId]: nextVal
    }));
    if (fieldErrors[questionId]) {
      setFieldErrors((prev) => {
        const copy = { ...prev };
        delete copy[questionId];
        return copy;
      });
    }
  };

  const validateCurrentSectionLocally = () => {
    const errors = {};
    for (const q of activeQuestions) {
      const isReq = Boolean(q.required || q.wajib);
      if (!isReq) continue;

      const val = answers[q.id];
      const empty =
        val === undefined ||
        val === null ||
        val === '' ||
        (Array.isArray(val) && val.length === 0);

      if (empty) {
        errors[q.id] =
          toSafeText(q.pesan_wajib) || `Silakan isi ${toSafeText(q.label || q.pertanyaan || q.id)}.`;
      }
    }
    return errors;
  };

  const persistToServer = async ({ moveNext = false } = {}) => {
    setBannerMessage(null);

    if (moveNext) {
      const localErrors = validateCurrentSectionLocally();
      if (Object.keys(localErrors).length > 0) {
        setFieldErrors(localErrors);
        setBannerMessage({
          type: 'error',
          text: 'Masih ada kolom wajib pada bagian ini yang belum diisi.'
        });
        const firstErrKey = Object.keys(localErrors)[0];
        document.getElementById(`field-${firstErrKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        return;
      }
    }

    setSaving(true);
    try {
      const sanitizedPayload = buildSanitizedAnswers(sections, answers, persistedAnswers, {
        forPatch: true
      });
      const res = await telehealthService.updateAssessment(assessmentId, sanitizedPayload);

      const updatedAnswers = res.data?.answers || answers;
      setPersistedAnswers(updatedAnswers);
      setFieldErrors({});

      if (moveNext) {
        const nextVisibleSections = getVisibleSections(sections, answers);
        if (safeStepIndex < nextVisibleSections.length - 1) {
          setCurrentStep(safeStepIndex + 1);
          window.scrollTo({ top: 0, behavior: 'smooth' });
        } else {
          navigate(`/periksa/${assessmentId}`);
        }
      } else {
        setBannerMessage({
          type: 'success',
          text: 'Draf jawaban berhasil disimpan. Anda dapat melanjutkan pengisian kapan saja.'
        });
      }
    } catch (err) {
      if (err.status === 422 && err.errors) {
        setFieldErrors(err.errors);
        setBannerMessage({
          type: 'error',
          text: err.message || 'Validasi gagal. Periksa kembali isian Anda.'
        });
        const firstKey = Object.keys(err.errors)[0];
        if (firstKey) {
          document.getElementById(`field-${firstKey}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      } else {
        setBannerMessage({
          type: 'error',
          text: err.message
        });
      }
    } finally {
      setSaving(false);
    }
  };

  const handlePreviousStep = () => {
    setBannerMessage(null);
    setFieldErrors({});
    if (safeStepIndex > 0) {
      setCurrentStep(safeStepIndex - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      navigate('/');
    }
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <div className="h-96 rounded-card bg-surface-container-lowest p-8 shadow-card animate-pulse" />
      </div>
    );
  }

  const totalSteps = visibleSections.length || 1;
  const progressPercent = Math.round(((safeStepIndex + 1) / totalSteps) * 100);

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-8 flex flex-col gap-6">
      {/* Top Bar & Progress */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handlePreviousStep}
            className="inline-flex items-center gap-1.5 text-primary font-headline font-semibold text-sm hover:text-secondary transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            <span>{safeStepIndex > 0 ? 'Bagian Sebelumnya' : 'Beranda'}</span>
          </button>

          <span className="px-3 py-1 rounded-full bg-surface-container-lowest border border-indigo-500/10 font-mono font-semibold text-xs text-primary">
            {assessment?.id || assessmentId}
          </span>
        </div>

        <div className="rounded-card bg-surface-container-lowest p-4 shadow-card border border-indigo-500/10">
          <div className="flex items-center justify-between text-xs font-headline font-semibold text-on-surface-variant mb-2">
            <span className="text-primary">{toSafeText(formSchema?.judul) || 'Formulir Self-Assessment'}</span>
            <span className="px-2.5 py-0.5 rounded-full bg-secondary-fixed text-secondary font-bold">
              Bagian {safeStepIndex + 1} dari {totalSteps}
            </span>
          </div>
          <div className="w-full h-2.5 rounded-full bg-surface-container overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary-container via-secondary to-teal-500 rounded-full transition-all duration-300"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Feedback Banner */}
      {bannerMessage && (
        <div
          role="alert"
          className={`rounded-card p-4 border text-sm flex items-center justify-between gap-3 ${
            bannerMessage.type === 'success'
              ? 'bg-emerald-50 border-emerald-300 text-emerald-950'
              : 'bg-error-container/80 border-error/40 text-on-error-container'
          }`}
        >
          <div className="flex items-center gap-2.5">
            <span className="material-symbols-outlined">
              {bannerMessage.type === 'success' ? 'check_circle' : 'error'}
            </span>
            <span>{toSafeText(bannerMessage.text)}</span>
          </div>
          {bannerMessage.type === 'success' && (
            <Link to="/riwayat" className="text-xs font-headline font-bold underline shrink-0">
              Ke Riwayat
            </Link>
          )}
        </div>
      )}

      {/* Active Section Card */}
      {activeSection && (
        <section className="rounded-card bg-surface-container-lowest p-6 sm:p-8 shadow-card border border-indigo-500/10 flex flex-col gap-5">
          <div className="border-b border-surface-container pb-4">
            <span className="text-[11px] font-headline font-bold uppercase tracking-wider text-secondary">
              Langkah {safeStepIndex + 1} / {totalSteps}
            </span>
            <h1 className="font-headline font-bold text-xl sm:text-2xl text-primary mt-0.5">
              {toSafeText(activeSection.judul || activeSection.title)}
            </h1>
            {activeSection.deskripsi && (
              <p className="text-sm text-on-surface-variant mt-1">
                {toSafeText(activeSection.deskripsi)}
              </p>
            )}
          </div>

          <div className="flex flex-col gap-4">
            {activeQuestions.map((question) => (
              <DynamicFieldRenderer
                key={question.id}
                question={question}
                value={answers[question.id]}
                onChange={handleFieldChange}
                error={fieldErrors[question.id]}
              />
            ))}
          </div>

          {/* Action Buttons: Simpan Draf & Lanjut */}
          <div className="pt-4 border-t border-surface-container flex flex-col sm:flex-row items-center justify-between gap-3">
            <button
              type="button"
              disabled={saving}
              onClick={() => persistToServer({ moveNext: false })}
              className="w-full sm:w-auto px-6 py-3.5 rounded-full bg-secondary-fixed text-primary font-headline font-semibold text-sm border border-secondary/20 hover:bg-secondary-fixed-dim/50 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">save</span>
              <span>{saving ? 'Menyimpan...' : 'Simpan Draf'}</span>
            </button>

            <button
              type="button"
              disabled={saving}
              onClick={() => persistToServer({ moveNext: true })}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-sm shadow-pill hover:opacity-95 disabled:opacity-60 transition-all inline-flex items-center justify-center gap-2"
            >
              <span>
                {safeStepIndex < totalSteps - 1 ? 'Simpan & Lanjut' : 'Periksa Jawaban'}
              </span>
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </button>
          </div>
        </section>
      )}

      {/* Disclaimer Wajib */}
      <DisclaimerBanner compact />
    </div>
  );
}
