import { apiRequest } from '../config/api';

export const telehealthService = {
  // 7.1 Umum
  checkHealth() {
    return apiRequest('', { method: 'GET', skipAuth: true });
  },

  getMe(nim) {
    const query = nim ? `?nim=${encodeURIComponent(nim.toUpperCase())}` : '';
    return apiRequest(`/me${query}`, { method: 'GET' });
  },

  getForms() {
    return apiRequest('/forms', { method: 'GET' });
  },

  getFormDetail(formId) {
    return apiRequest(`/forms/${encodeURIComponent(formId)}`, { method: 'GET' });
  },

  validateForm(formId, { nim, answers }) {
    return apiRequest(`/forms/${encodeURIComponent(formId)}/validate`, {
      method: 'POST',
      body: {
        nim: nim.toUpperCase(),
        answers
      }
    });
  },

  // 7.2 Self-Assessment
  createAssessment({ form_id, persetujuan, mahasiswa, answers, kirim }) {
    const payload = {
      form_id,
      persetujuan: Boolean(persetujuan),
      mahasiswa: {
        nim: mahasiswa.nim.toUpperCase(),
        nama: mahasiswa.nama,
        kelas: mahasiswa.kelas
      }
    };
    if (answers && Object.keys(answers).length > 0) {
      payload.answers = answers;
    }
    if (typeof kirim === 'boolean') {
      payload.kirim = kirim;
    }
    return apiRequest('/assessments', {
      method: 'POST',
      body: payload
    });
  },

  getAssessments(nim, filters = {}) {
    const params = new URLSearchParams();
    if (nim) params.set('nim', nim.toUpperCase());
    if (filters.status_peninjauan) params.set('status_peninjauan', filters.status_peninjauan);
    if (filters.status_pengiriman) params.set('status_pengiriman', filters.status_pengiriman);
    if (filters.form_id) params.set('form_id', filters.form_id);
    if (filters.q) params.set('q', filters.q);

    const qs = params.toString();
    return apiRequest(`/assessments${qs ? `?${qs}` : ''}`, { method: 'GET' });
  },

  getAssessmentDetail(id) {
    return apiRequest(`/assessments/${encodeURIComponent(id)}`, { method: 'GET' });
  },

  updateAssessment(id, answers) {
    return apiRequest(`/assessments/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: { answers }
    });
  },

  replaceAssessment(id, answers) {
    return apiRequest(`/assessments/${encodeURIComponent(id)}`, {
      method: 'PUT',
      body: { answers }
    });
  },

  deleteAssessment(id) {
    return apiRequest(`/assessments/${encodeURIComponent(id)}`, {
      method: 'DELETE'
    });
  },

  submitAssessment(id) {
    return apiRequest(`/assessments/${encodeURIComponent(id)}/submit`, {
      method: 'POST'
    });
  },

  getAssessmentHasil(id) {
    return apiRequest(`/assessments/${encodeURIComponent(id)}/hasil`, {
      method: 'GET'
    });
  },

  getAssessmentStatus(id) {
    return apiRequest(`/assessments/${encodeURIComponent(id)}/status`, {
      method: 'GET'
    });
  },

  replyClarification(assessmentId, clarificationId, jawaban) {
    return apiRequest(
      `/assessments/${encodeURIComponent(assessmentId)}/clarifications/${encodeURIComponent(clarificationId)}/reply`,
      {
        method: 'POST',
        body: { jawaban }
      }
    );
  },

  // 7.3 Status UTS
  getUtsStatus(nim) {
    return apiRequest(`/uts/${encodeURIComponent(nim.toUpperCase())}`, {
      method: 'GET'
    });
  }
};
