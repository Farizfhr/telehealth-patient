import React from 'react';
import { toSafeText } from '../utils/formLogic';

const PENGIRIMAN_STYLES = {
  draft: {
    bg: 'bg-slate-100 text-slate-700 border-slate-200',
    dot: 'bg-slate-500',
    icon: 'edit_note'
  },
  terkirim: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-500',
    icon: 'check_circle'
  }
};

const PENINJAUAN_STYLES = {
  belum_dikirim: {
    bg: 'bg-surface-container text-on-surface-variant border-outline-variant/50',
    dot: 'bg-outline',
    icon: 'schedule'
  },
  menunggu_peninjauan: {
    bg: 'bg-indigo-50 text-indigo-800 border-indigo-200',
    dot: 'bg-indigo-500',
    icon: 'hourglass_top'
  },
  sedang_ditinjau: {
    bg: 'bg-sky-50 text-sky-800 border-sky-200',
    dot: 'bg-sky-500',
    icon: 'medical_information'
  },
  perlu_klarifikasi: {
    bg: 'bg-amber-50 text-amber-900 border-amber-300',
    dot: 'bg-amber-500',
    icon: 'help'
  },
  klarifikasi_dijawab: {
    bg: 'bg-purple-50 text-purple-800 border-purple-200',
    dot: 'bg-purple-500',
    icon: 'forum'
  },
  sudah_ditinjau: {
    bg: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    dot: 'bg-emerald-600',
    icon: 'verified'
  }
};

export default function StatusBadge({ status, category = 'peninjauan', showIcon = false }) {
  if (!status) return null;

  const kode = typeof status === 'string' ? status : toSafeText(status.kode);
  const label = typeof status === 'string' ? status : toSafeText(status.label) || kode;

  const palette =
    category === 'pengiriman'
      ? PENGIRIMAN_STYLES[kode] || PENGIRIMAN_STYLES.draft
      : PENINJAUAN_STYLES[kode] || PENINJAUAN_STYLES.belum_dikirim;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border font-headline font-semibold text-xs ${palette.bg}`}
    >
      {showIcon ? (
        <span className="material-symbols-outlined text-[15px]">{palette.icon}</span>
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${palette.dot}`} />
      )}
      <span>{label}</span>
    </span>
  );
}
