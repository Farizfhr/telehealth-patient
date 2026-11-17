import React from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Beranda from './pages/Beranda';
import PengaturanApi from './pages/PengaturanApi';
import PetunjukConsent from './pages/PetunjukConsent';
import FormBertahap from './pages/FormBertahap';
import PeriksaJawaban from './pages/PeriksaJawaban';
import KonfirmasiKirim from './pages/KonfirmasiKirim';
import Riwayat from './pages/Riwayat';
import HasilAssessment from './pages/HasilAssessment';
import TrackingStatus from './pages/TrackingStatus';

export default function App() {
  return (
    <div className="min-h-screen flex flex-col bg-surface text-on-surface">
      <Navbar />
      <main className="flex-1 pt-20 pb-24 md:pb-12">
        <Routes>
          <Route path="/" element={<Beranda />} />
          <Route path="/pengaturan" element={<PengaturanApi />} />
          <Route path="/formulir/:formId/petunjuk" element={<PetunjukConsent />} />
          <Route path="/isi/:assessmentId" element={<FormBertahap />} />
          <Route path="/periksa/:assessmentId" element={<PeriksaJawaban />} />
          <Route path="/konfirmasi/:assessmentId" element={<KonfirmasiKirim />} />
          <Route path="/riwayat" element={<Riwayat />} />
          <Route path="/hasil/:assessmentId" element={<HasilAssessment />} />
          <Route path="/status/:assessmentId" element={<TrackingStatus />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
