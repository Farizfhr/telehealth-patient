export const DEFAULT_API_BASE_URL = 'https://telehealth.informatikaunimus.site/api';

const STORAGE_KEYS = {
  API_URL: 'tlh_portal_api_url',
  TOKEN: 'tlh_portal_patient_token',
  MAHASISWA: 'tlh_portal_mahasiswa',
  PATIENT_PROFILE: 'tlh_portal_patient_profile'
};

export function getApiBaseUrl() {
  const saved = localStorage.getItem(STORAGE_KEYS.API_URL);
  return (saved && saved.trim() ? saved.trim() : DEFAULT_API_BASE_URL).replace(/\/+$/, '');
}

export function setApiBaseUrl(url) {
  const cleanUrl = (url || DEFAULT_API_BASE_URL).trim().replace(/\/+$/, '');
  localStorage.setItem(STORAGE_KEYS.API_URL, cleanUrl);
  return cleanUrl;
}

export function getToken() {
  return (localStorage.getItem(STORAGE_KEYS.TOKEN) || '').trim();
}

export function setToken(token) {
  localStorage.setItem(STORAGE_KEYS.TOKEN, (token || '').trim());
}

export function getMahasiswa() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.MAHASISWA);
    if (!raw) {
      return { nim: '', nama: '', kelas: '' };
    }
    const parsed = JSON.parse(raw);
    return {
      nim: (parsed.nim || '').toUpperCase().trim(),
      nama: (parsed.nama || '').trim(),
      kelas: (parsed.kelas || '').trim()
    };
  } catch {
    return { nim: '', nama: '', kelas: '' };
  }
}

export function setMahasiswa({ nim, nama, kelas }) {
  const normalized = {
    nim: (nim || '').toUpperCase().replace(/[^A-Z0-9]/g, '').trim(),
    nama: (nama || '').trim(),
    kelas: (kelas || '').trim()
  };
  localStorage.setItem(STORAGE_KEYS.MAHASISWA, JSON.stringify(normalized));
  return normalized;
}

export function getCachedPatientProfile() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PATIENT_PROFILE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function setCachedPatientProfile(profile) {
  if (!profile) {
    localStorage.removeItem(STORAGE_KEYS.PATIENT_PROFILE);
    return;
  }
  localStorage.setItem(STORAGE_KEYS.PATIENT_PROFILE, JSON.stringify(profile));
}

export function isConfigComplete() {
  const token = getToken();
  const mhs = getMahasiswa();
  return Boolean(
    token &&
      mhs.nim.length >= 5 &&
      mhs.nim.length <= 20 &&
      mhs.nama.length >= 3 &&
      mhs.kelas.length >= 1
  );
}

export class ApiError extends Error {
  constructor({ status, message, errors = {}, raw = null }) {
    super(message || 'Terjadi kesalahan pada permintaan API.');
    this.name = 'ApiError';
    this.status = status;
    this.errors = errors;
    this.raw = raw;
  }
}

function mapHttpErrorMessage(status, serverMessage) {
  if (serverMessage) return serverMessage;
  switch (status) {
    case 400:
      return 'Format permintaan tidak valid (400). Pastikan data dikirim dalam format JSON yang benar.';
    case 401:
      return 'Token pasien tidak ditemukan atau tidak valid (401). Silakan periksa kembali token di menu Pengaturan.';
    case 403:
      return 'Akses ditolak (403). Token pasien tidak memiliki hak akses ke endpoint ini.';
    case 404:
      return 'Data atau endpoint tidak ditemukan (404).';
    case 409:
      return 'Aksi ditolak karena status laporan saat ini (409). Laporan yang sudah dikirim tidak dapat diubah atau dihapus.';
    case 422:
      return 'Validasi gagal (422). Mohon periksa kembali kolom yang ditandai.';
    default:
      return `Terjadi gangguan pada server (HTTP ${status}).`;
  }
}

export async function apiRequest(path, { method = 'GET', body, skipAuth = false } = {}) {
  const baseUrl = getApiBaseUrl();
  const token = getToken();

  const headers = {
    Accept: 'application/json',
    'Content-Type': 'application/json'
  };

  if (!skipAuth) {
    if (!token) {
      throw new ApiError({
        status: 401,
        message: 'Token pasien belum diisi. Silakan masukkan token pasien di halaman Pengaturan.'
      });
    }
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined
    });
  } catch {
    throw new ApiError({
      status: 0,
      message: `Gagal terhubung ke server API (${baseUrl}). Periksa koneksi internet atau alamat API.`
    });
  }

  let json = null;
  try {
    json = await response.json();
  } catch {
    throw new ApiError({
      status: response.status,
      message: mapHttpErrorMessage(response.status, null)
    });
  }

  if (!response.ok || json?.success === false) {
    throw new ApiError({
      status: response.status,
      message: mapHttpErrorMessage(response.status, json?.message),
      errors: json?.errors || {},
      raw: json
    });
  }

  return json;
}
