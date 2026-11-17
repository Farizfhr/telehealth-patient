/**
 * Mengonversi nilai dari API (string, number, array, atau object) menjadi teks aman untuk JSX
 * sehingga tidak pernah memicu error "Objects are not valid as a React child".
 */
export function toSafeText(val) {
  if (val === null || val === undefined) return '';
  if (typeof val === 'string' || typeof val === 'number') return String(val);
  if (Array.isArray(val)) return val.map(toSafeText).filter(Boolean).join(', ');
  if (typeof val === 'object') {
    if (val.judul && val.isi) return `${val.judul}: ${val.isi}`;
    return (
      val.isi ||
      val.teks ||
      val.text ||
      val.keterangan ||
      val.deskripsi ||
      val.pesan ||
      val.label ||
      val.nama ||
      val.judul ||
      val.kode ||
      ''
    );
  }
  return String(val);
}

/**
 * Mengecek apakah sebuah nilai dianggap "terisi" (tidak undefined, null, string kosong, atau array kosong).
 * Membedakan secara tegas antara jawaban "tidak" / angka 0 dengan kosong.
 */
export function isValueFilled(value) {
  if (value === undefined || value === null || value === '') return false;
  if (Array.isArray(value) && value.length === 0) return false;
  return true;
}

/**
 * Evaluasi aturan percabangan show_if dari definisi formulir API.
 * Mendukung operator: equals, in, includes, filled, any, all.
 */
export function isVisible(cond, answers = {}) {
  if (!cond) return true;
  if (cond.any) return cond.any.some((c) => isVisible(c, answers));
  if (cond.all) return cond.all.every((c) => isVisible(c, answers));

  const v = answers[cond.question];
  const filled = isValueFilled(v);

  if ('equals' in cond) {
    return v === cond.equals;
  }
  if ('in' in cond) {
    return Array.isArray(cond.in) && cond.in.includes(v);
  }
  if ('includes' in cond) {
    return Array.isArray(v) && v.includes(cond.includes);
  }
  if ('filled' in cond) {
    return filled === Boolean(cond.filled);
  }
  return true;
}

/**
 * Mengembalikan daftar section (bagian) yang saat ini tampil berdasarkan show_if.
 */
export function getVisibleSections(sections = [], answers = {}) {
  return sections.filter((section) => isVisible(section.show_if, answers));
}

/**
 * Mengembalikan daftar pertanyaan yang tampil dalam satu section berdasarkan show_if.
 */
export function getVisibleQuestions(section, answers = {}) {
  if (!section || !Array.isArray(section.questions)) return [];
  if (!isVisible(section.show_if, answers)) return [];
  return section.questions.filter((q) => isVisible(q.show_if, answers));
}

/**
 * Menangani pemilihan multi_choice dengan dukungan opsi eksklusif (mis. `tidak_ada`).
 */
export function toggleMultiChoiceValue(currentValues = [], optionValue, optionsList = []) {
  const current = Array.isArray(currentValues) ? [...currentValues] : [];
  const exists = current.includes(optionValue);

  if (exists) {
    return current.filter((item) => item !== optionValue);
  }

  const exclusiveCodes = new Set(
    optionsList
      .filter((opt) => opt.exclusive === true || opt.value === 'tidak_ada' || opt.kode === 'tidak_ada')
      .map((opt) => opt.value ?? opt.kode)
  );
  exclusiveCodes.add('tidak_ada');

  if (exclusiveCodes.has(optionValue)) {
    return [optionValue];
  }

  const filtered = current.filter((item) => !exclusiveCodes.has(item));
  return [...filtered, optionValue];
}

/**
 * Menormalisasi nilai field sesuai tipe pertanyaan dari API.
 */
export function normalizeFieldValue(question, rawValue) {
  if (!isValueFilled(rawValue)) return null;

  if (question.type === 'number' || question.type === 'scale') {
    const num = Number(rawValue);
    return Number.isNaN(num) ? null : num;
  }

  if (question.type === 'multi_choice') {
    return Array.isArray(rawValue) && rawValue.length > 0 ? rawValue : null;
  }

  if (typeof rawValue === 'string') {
    const trimmed = rawValue.trim();
    return trimmed === '' ? null : trimmed;
  }

  return rawValue;
}

/**
 * Membangun payload `answers` untuk PATCH / POST / Validate.
 */
export function buildSanitizedAnswers(sections = [], rawAnswers = {}, persistedAnswers = {}, { forPatch = false } = {}) {
  const visibleMap = new Map();

  for (const section of sections) {
    if (!isVisible(section.show_if, rawAnswers)) continue;
    for (const q of section.questions || []) {
      if (isVisible(q.show_if, rawAnswers)) {
        visibleMap.set(q.id, q);
      }
    }
  }

  const sanitized = {};

  for (const [qId, question] of visibleMap.entries()) {
    const normalized = normalizeFieldValue(question, rawAnswers[qId]);
    if (normalized !== null) {
      sanitized[qId] = normalized;
    } else if (forPatch && persistedAnswers && persistedAnswers[qId] !== undefined && persistedAnswers[qId] !== null) {
      sanitized[qId] = null;
    }
  }

  if (forPatch && persistedAnswers) {
    for (const oldKey of Object.keys(persistedAnswers)) {
      if (!visibleMap.has(oldKey) && persistedAnswers[oldKey] !== null) {
        sanitized[oldKey] = null;
      }
    }
  }

  return sanitized;
}

/**
 * Format tanggal ISO dari API ke format Indonesia yang mudah dibaca.
 */
export function formatTanggalIndo(isoString) {
  if (!isoString) return '-';
  try {
    const date = new Date(isoString);
    if (Number.isNaN(date.getTime())) return String(isoString);
    return new Intl.DateTimeFormat('id-ID', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  } catch {
    return String(isoString);
  }
}
