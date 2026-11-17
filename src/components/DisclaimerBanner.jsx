import React from 'react';

export default function DisclaimerBanner({ compact = false }) {
  return (
    <div
      role="note"
      className={`rounded-card bg-gradient-to-r from-amber-50 via-amber-50/90 to-orange-50/70 border border-amber-300/70 text-amber-950 shadow-card ${
        compact ? 'px-4 py-3' : 'p-4 sm:p-5'
      }`}
    >
      <div className="flex items-start gap-3.5">
        <div className="w-9 h-9 rounded-2xl bg-amber-200/80 text-amber-900 flex items-center justify-center shrink-0 mt-0.5">
          <span className="material-symbols-outlined text-[20px]">clinical_notes</span>
        </div>
        <div className="flex-1 text-sm leading-relaxed">
          <p className="font-headline font-bold text-amber-950">Catatan Penting Klinis</p>
          <p className="text-amber-900 mt-0.5">
            Hasil self-assessment bukan diagnosis. Laporan akan ditinjau bersama informasi lain oleh
            tenaga kesehatan.
          </p>
        </div>
      </div>
    </div>
  );
}
