import React from 'react';
import { formatTanggalIndo, toSafeText } from '../utils/formLogic';

export default function TimelineView({ timeline = [] }) {
  if (!Array.isArray(timeline) || timeline.length === 0) {
    return (
      <p className="text-sm text-on-surface-variant italic">
        Belum ada catatan riwayat perubahan status.
      </p>
    );
  }

  // Tampilkan terbaru di atas agar kronologi mudah dipantau pasien
  const ordered = [...timeline].reverse();

  return (
    <ol className="relative border-l-2 border-secondary/30 ml-3 space-y-5 py-1">
      {ordered.map((item, idx) => {
        const isLatest = idx === 0;
        const actor = toSafeText(item.oleh || item.aktor || item.petugas);
        const titleText = toSafeText(item.keterangan || item.label || item.event);

        return (
          <li key={`${toSafeText(item.event) || 'ev'}-${idx}`} className="ml-6 relative">
            <span
              className={`absolute -left-[31px] top-1 w-3.5 h-3.5 rounded-full ring-4 ring-surface-container-lowest ${
                isLatest ? 'bg-secondary animate-pulse' : 'bg-primary-container/60'
              }`}
            />
            <div className="flex flex-col gap-0.5">
              <p
                className={`text-sm ${
                  isLatest ? 'font-semibold text-primary' : 'font-medium text-on-surface'
                }`}
              >
                {titleText}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-on-surface-variant">
                <span>{formatTanggalIndo(item.waktu || item.created_at)}</span>
                {actor && (
                  <>
                    <span>•</span>
                    <span className="font-medium text-primary/80">{actor}</span>
                  </>
                )}
              </div>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
