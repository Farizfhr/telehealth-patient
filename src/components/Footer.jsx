import React from 'react';

export default function Footer() {
  return (
    <footer className="mt-auto border-t border-indigo-500/10 bg-surface-container-lowest/70 backdrop-blur-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-on-surface-variant">
        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
          <span className="font-headline font-bold text-primary text-sm">Klinik Tenang</span>
          <span className="text-outline-variant">•</span>
          <span>Sistem Telehealth & Skrining Klinis Pasien Terpadu</span>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-4 font-headline font-medium">
          <span className="inline-flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[15px] text-secondary">verified_user</span>
            Protokol Medis Terverifikasi
          </span>
          <span className="inline-flex items-center gap-1 text-on-surface-variant">
            <span className="material-symbols-outlined text-[15px] text-emerald-600">lock</span>
            Privasi Pasien Terjamin
          </span>
        </div>
      </div>
    </footer>
  );
}
