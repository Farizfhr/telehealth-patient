import React, { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { telehealthService } from '../services/telehealthService';
import { formatTanggalIndo, toSafeText } from '../utils/formLogic';
import StatusBadge from '../components/StatusBadge';

export default function KonfirmasiKirim() {
  const { assessmentId } = useParams();
  const location = useLocation();
  const [data, setData] = useState(location.state?.submitData || null);

  useEffect(() => {
    if (data) return;
    let active = true;
    telehealthService
      .getAssessmentDetail(assessmentId)
      .then((res) => {
        if (active) setData(res.data);
      })
      .catch(() => {});
    return () => {
      active = false;
    };
  }, [assessmentId, data]);

  const statusPeninjauan = data?.status_peninjauan || {
    kode: 'menunggu_peninjauan',
    label: 'Menunggu peninjauan'
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 py-10">
      <div className="rounded-card bg-surface-container-lowest p-8 sm:p-10 shadow-card-elevated border border-indigo-500/10 text-center flex flex-col items-center">
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mb-5 shadow-sm">
          <span className="material-symbols-outlined text-4xl">check_circle</span>
        </div>

        <h1 className="font-headline font-bold text-2xl sm:text-3xl text-primary tracking-tight">
          Formulir Anda telah diterima.
        </h1>

        <p className="text-sm text-on-surface-variant mt-2">
          Nomor laporan{' '}
          <strong className="font-mono text-primary">{data?.id || assessmentId}</strong>
          {data?.dikirim_pada ? ` • dikirim ${formatTanggalIndo(data.dikirim_pada)}` : ''}
        </p>

        <div className="w-full mt-6 p-5 rounded-2xl bg-secondary-fixed/40 border border-secondary/20 flex flex-col items-center gap-2">
          <StatusBadge status={statusPeninjauan} category="peninjauan" showIcon />
          <p className="text-sm text-primary mt-1 leading-relaxed">
            {toSafeText(data?.pesan_status) ||
              'Laporan Anda sudah diterima dan sedang menunggu peninjauan petugas kesehatan.'}
          </p>
        </div>

        <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-3 mt-7">
          <Link
            to={`/hasil/${assessmentId}`}
            className="w-full py-3.5 px-6 rounded-full bg-secondary-fixed text-primary font-headline font-semibold text-sm border border-secondary/20 hover:bg-secondary-fixed-dim/50 transition-all text-center"
          >
            Lihat Ringkasan
          </Link>

          <Link
            to={`/status/${assessmentId}`}
            className="w-full py-3.5 px-6 rounded-full bg-primary-container text-on-primary font-headline font-semibold text-sm shadow-pill hover:opacity-95 transition-all text-center"
          >
            Pantau Status
          </Link>
        </div>

        <Link
          to="/"
          className="w-full mt-3 py-3 px-6 rounded-full border border-outline-variant/60 text-on-surface-variant font-headline font-semibold text-sm hover:bg-surface-container-low transition-all text-center"
        >
          Selesai & Kembali ke Beranda
        </Link>
      </div>
    </div>
  );
}
