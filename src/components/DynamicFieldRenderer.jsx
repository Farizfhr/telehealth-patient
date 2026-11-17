import React from 'react';
import FieldError from './FieldError';
import { toggleMultiChoiceValue, toSafeText } from '../utils/formLogic';

export default function DynamicFieldRenderer({ question, value, onChange, error }) {
  const {
    id,
    label,
    pertanyaan,
    deskripsi,
    helper_text,
    type,
    required,
    wajib,
    options = [],
    min,
    max,
    step,
    satuan,
    unit,
    max_length,
    placeholder,
    data_type
  } = question;

  const titleText = toSafeText(pertanyaan || label || id);
  const isRequired = Boolean(required || wajib);
  const unitText = toSafeText(satuan || unit || '');
  const isMeasurement = data_type === 'pengukuran';
  const todayIso = new Date().toISOString().split('T')[0];

  const handleSingleChoice = (optVal) => {
    onChange(id, optVal);
  };

  const handleMultiChoice = (optVal) => {
    const nextValues = toggleMultiChoiceValue(value, optVal, options);
    onChange(id, nextValues);
  };

  return (
    <div
      id={`field-${id}`}
      className={`rounded-card p-5 transition-all border ${
        error
          ? 'bg-error-container/15 border-error/50'
          : isMeasurement
            ? 'bg-secondary-fixed/20 border-secondary/20'
            : 'bg-surface-container-low/60 border-indigo-500/10'
      }`}
    >
      {/* Question Header */}
      <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
        <label htmlFor={`input-${id}`} className="font-headline font-semibold text-[15px] text-primary leading-snug">
          {titleText}
          {isRequired ? (
            <span className="text-error ml-1" title="Wajib diisi">
              *
            </span>
          ) : (
            <span className="text-xs font-normal text-on-surface-variant ml-1.5">(opsional)</span>
          )}
        </label>

        {isMeasurement && (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline font-bold text-[11px]">
            <span className="material-symbols-outlined text-[13px]">straighten</span>
            Data Pengukuran
          </span>
        )}
      </div>

      {(deskripsi || helper_text) && (
        <p className="text-xs text-on-surface-variant mb-3">{toSafeText(deskripsi || helper_text)}</p>
      )}

      {/* 1. TEXT */}
      {type === 'text' && (
        <div>
          <input
            id={`input-${id}`}
            type="text"
            value={value ?? ''}
            maxLength={max_length || undefined}
            placeholder={placeholder || 'Ketik jawaban Anda di sini...'}
            onChange={(e) => onChange(id, e.target.value)}
            className="w-full h-12 px-5 rounded-full bg-surface-container-lowest border border-primary/15 text-primary text-sm focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15 transition-all"
          />
          {max_length && (
            <div className="text-right text-[11px] text-on-surface-variant mt-1">
              {(value || '').length}/{max_length} karakter
            </div>
          )}
        </div>
      )}

      {/* 2. TEXTAREA */}
      {type === 'textarea' && (
        <div>
          <textarea
            id={`input-${id}`}
            rows={3}
            value={value ?? ''}
            maxLength={max_length || undefined}
            placeholder={placeholder || 'Tuliskan keterangan tambahan...'}
            onChange={(e) => onChange(id, e.target.value)}
            className="w-full p-4 rounded-2xl bg-surface-container-lowest border border-primary/15 text-primary text-sm focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15 transition-all"
          />
          {max_length && (
            <div className="text-right text-[11px] text-on-surface-variant mt-1">
              {(value || '').length}/{max_length} karakter
            </div>
          )}
        </div>
      )}

      {/* 3. NUMBER */}
      {type === 'number' && (
        <div className="flex items-center gap-3">
          <div className="relative flex-1 max-w-xs">
            <input
              id={`input-${id}`}
              type="number"
              inputMode="decimal"
              value={value ?? ''}
              min={min !== undefined ? min : undefined}
              max={max !== undefined ? max : undefined}
              step={step || 'any'}
              placeholder={
                placeholder ||
                (min !== undefined && max !== undefined ? `${min} – ${max}` : 'Masukkan angka')
              }
              onChange={(e) => {
                const raw = e.target.value;
                onChange(id, raw === '' ? '' : Number(raw));
              }}
              className="w-full h-12 px-5 rounded-full bg-surface-container-lowest border border-primary/15 text-primary text-sm focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15 transition-all"
            />
          </div>
          {unitText && (
            <span className="px-3.5 py-2 rounded-full bg-surface-container-lowest border border-primary/10 text-xs font-headline font-semibold text-on-surface-variant">
              {unitText}
            </span>
          )}
        </div>
      )}

      {/* 4. DATE */}
      {type === 'date' && (
        <div className="max-w-xs">
          <input
            id={`input-${id}`}
            type="date"
            value={value ?? ''}
            max={max || todayIso}
            min={min || undefined}
            onChange={(e) => onChange(id, e.target.value)}
            className="w-full h-12 px-5 rounded-full bg-surface-container-lowest border border-primary/15 text-primary text-sm focus:outline-none focus:border-secondary focus:ring-4 focus:ring-secondary/15 transition-all"
          />
        </div>
      )}

      {/* 5. SINGLE CHOICE */}
      {type === 'single_choice' && (
        <div className="grid grid-cols-1 gap-2.5 mt-1">
          {options.map((opt) => {
            const optVal = opt.value ?? opt.kode;
            const optLabel = toSafeText(opt.label ?? opt.teks ?? String(optVal));
            const checked = value === optVal;

            return (
              <button
                key={String(optVal)}
                type="button"
                onClick={() => handleSingleChoice(optVal)}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all flex items-center gap-3.5 ${
                  checked
                    ? 'bg-secondary-fixed/60 border-2 border-secondary text-primary shadow-sm'
                    : 'bg-surface-container-lowest border-primary/10 text-on-surface hover:border-secondary/40'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-full flex items-center justify-center border shrink-0 transition-all ${
                    checked ? 'border-secondary bg-secondary text-white' : 'border-outline bg-white'
                  }`}
                >
                  {checked && <span className="w-2 h-2 rounded-full bg-white" />}
                </span>
                <span className="text-sm font-medium leading-snug">{optLabel}</span>
              </button>
            );
          })}
        </div>
      )}

      {/* 6. MULTI CHOICE */}
      {type === 'multi_choice' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-1">
          {options.map((opt) => {
            const optVal = opt.value ?? opt.kode;
            const optLabel = toSafeText(opt.label ?? opt.teks ?? String(optVal));
            const selectedArray = Array.isArray(value) ? value : [];
            const checked = selectedArray.includes(optVal);
            const isExclusive = opt.exclusive === true || optVal === 'tidak_ada';

            return (
              <button
                key={String(optVal)}
                type="button"
                onClick={() => handleMultiChoice(optVal)}
                className={`w-full text-left px-4 py-3.5 rounded-2xl border transition-all flex items-center gap-3 ${
                  checked
                    ? isExclusive
                      ? 'bg-slate-100 border-2 border-primary-container text-primary shadow-sm'
                      : 'bg-secondary-fixed/60 border-2 border-secondary text-primary shadow-sm'
                    : 'bg-surface-container-lowest border-primary/10 text-on-surface hover:border-secondary/40'
                }`}
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition-all ${
                    checked
                      ? isExclusive
                        ? 'border-primary-container bg-primary-container text-white'
                        : 'border-secondary bg-secondary text-white'
                      : 'border-outline bg-white'
                  }`}
                >
                  {checked && <span className="material-symbols-outlined text-[15px]">check</span>}
                </span>
                <div className="flex flex-col">
                  <span className="text-sm font-medium leading-snug">{optLabel}</span>
                  {isExclusive && (
                    <span className="text-[11px] text-on-surface-variant">
                      Melepas pilihan penyakit lainnya
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* 7. SCALE */}
      {type === 'scale' && (
        <div
          className={`grid gap-2 mt-1 ${
            options.length <= 3
              ? 'grid-cols-3'
              : options.length === 4
                ? 'grid-cols-2 sm:grid-cols-4'
                : 'grid-cols-2 sm:grid-cols-5'
          }`}
        >
          {options.map((opt) => {
            const numericVal = Number(opt.value ?? opt.kode);
            const optLabel = toSafeText(opt.label ?? opt.teks ?? String(numericVal));
            const checked = Number(value) === numericVal && value !== '' && value !== null && value !== undefined;

            return (
              <button
                key={String(numericVal)}
                type="button"
                onClick={() => onChange(id, numericVal)}
                className={`p-3.5 rounded-2xl border text-center transition-all flex flex-col items-center justify-center gap-1.5 ${
                  checked
                    ? 'bg-secondary-fixed/70 border-2 border-secondary text-primary shadow-sm'
                    : 'bg-surface-container-lowest border-primary/10 text-on-surface hover:border-secondary/40'
                }`}
              >
                <span
                  className={`w-7 h-7 rounded-full text-xs font-headline font-bold flex items-center justify-center ${
                    checked ? 'bg-secondary text-white' : 'bg-surface-container text-primary'
                  }`}
                >
                  {numericVal}
                </span>
                <span className="text-xs font-medium leading-tight">{optLabel}</span>
              </button>
            );
          })}
        </div>
      )}

      <FieldError message={error} />
    </div>
  );
}
