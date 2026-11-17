import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getCachedPatientProfile, getMahasiswa } from '../config/api';

export default function Navbar() {
  const location = useLocation();
  const mhs = getMahasiswa();
  const profile = getCachedPatientProfile();

  const navItems = [
    { path: '/', label: 'Beranda', icon: 'home' },
    { path: '/riwayat', label: 'Riwayat', icon: 'history' },
    { path: '/pengaturan', label: 'Pengaturan', icon: 'settings' }
  ];

  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-surface-container-lowest/85 backdrop-blur-xl shadow-[0_1px_8px_rgba(30,27,75,0.04)] border-b border-indigo-500/10">
        <div className="h-20 w-full px-4 sm:px-6 max-w-7xl mx-auto flex items-center justify-between gap-4">
          {/* Brand Logo & App Tag */}
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2.5 group">
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-primary-container to-secondary text-on-primary flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform">
                <span className="material-symbols-outlined text-[22px]">health_and_safety</span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline font-bold text-lg text-primary tracking-tight leading-none">
                  Klinik Tenang
                </span>
                <span className="text-[11px] text-on-surface-variant font-medium mt-0.5 sm:hidden">
                  Telehealth UNIMUS
                </span>
              </div>
            </Link>
            <span className="hidden sm:inline-flex items-center px-3 py-1 rounded-full bg-secondary-fixed text-on-secondary-fixed font-headline font-bold text-[11px] tracking-wide">
              Self-Assessment Pasien
            </span>
          </div>

          {/* Desktop Navigation Pills */}
          <nav
            aria-label="Navigasi Utama"
            className="hidden md:flex items-center gap-1 bg-surface-container-low p-1.5 rounded-full border border-indigo-500/10"
          >
            {navItems.map((item) => {
              const active = isActive(item.path);
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`px-5 py-2 rounded-full font-headline font-semibold text-[13px] transition-all flex items-center gap-1.5 ${
                    active
                      ? 'bg-primary-container text-on-primary shadow-[0_4px_12px_-2px_rgba(30,27,75,0.16)]'
                      : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`}
                >
                  <span className="material-symbols-outlined text-[17px]">{item.icon}</span>
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Patient & Student Identity Pill */}
          <Link
            to="/pengaturan"
            title="Ubah identitas mahasiswa & token"
            className="flex items-center gap-2.5 bg-surface-container-lowest pl-2 pr-3.5 py-1.5 rounded-full shadow-[0_4px_20px_-4px_rgba(30,27,75,0.06)] border border-indigo-500/10 hover:border-secondary/40 transition-all"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-secondary-fixed to-indigo-200 text-secondary flex items-center justify-center font-headline font-bold text-xs shrink-0">
              {profile?.nama
                ? profile.nama
                    .split(' ')
                    .map((n) => n[0])
                    .slice(0, 2)
                    .join('')
                    .toUpperCase()
                : 'PS'}
            </div>
            <div className="flex flex-col text-left max-w-[160px] sm:max-w-[210px]">
              <span className="font-headline font-semibold text-xs text-primary leading-tight truncate">
                {profile?.nama ? `${profile.nama} (${profile.id})` : 'Pasien Belum Terhubung'}
              </span>
              <span className="font-headline font-bold text-[10px] text-on-surface-variant leading-tight truncate">
                {mhs.nim ? `${mhs.kelas || 'Kelas -'} • ${mhs.nim}` : 'Atur NIM & Token'}
              </span>
            </div>
          </Link>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav
        aria-label="Navigasi Mobile"
        className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface-container-lowest/95 backdrop-blur-xl border-t border-indigo-500/10 px-4 py-2 flex items-center justify-around shadow-[0_-4px_20px_rgba(30,27,75,0.05)]"
      >
        {navItems.map((item) => {
          const active = isActive(item.path);
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-0.5 px-4 py-1.5 rounded-full transition-all ${
                active ? 'text-secondary font-semibold bg-secondary-fixed/70' : 'text-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
              <span className="text-[11px] font-headline">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
