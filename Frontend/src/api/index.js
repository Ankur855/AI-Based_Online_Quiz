import api from './axiosConfig';

// ── Auth ──────────────────────────────────────────────────────
export const authApi = {
  register:       (data) => api.post('/auth/register', data),
  login:          (data) => api.post('/auth/login', data),
  getMe:          ()     => api.get('/auth/me'),
  updatePassword: (data) => api.put('/auth/updatepassword', data),
};

// ── Quizzes ───────────────────────────────────────────────────
export const quizApi = {
  getAll:   ()         => api.get('/quizzes'),
  getOne:   (id)       => api.get(`/quizzes/${id}`),
  create:   (data)     => api.post('/quizzes', data),
  update:   (id, data) => api.put(`/quizzes/${id}`, data),
  delete:   (id)       => api.delete(`/quizzes/${id}`),
  getStats: (id)       => api.get(`/quizzes/${id}/stats`),
};

// ── Questions ─────────────────────────────────────────────────
export const questionApi = {
  getAll:   (params)   => api.get('/questions', { params }),
  create:   (data)     => api.post('/questions', data),
  generate: (data)     => api.post('/questions/generate', data),
  update:   (id, data) => api.put(`/questions/${id}`, data),
  delete:   (id)       => api.delete(`/questions/${id}`),
};

// ── Quiz Attempts / Scores ────────────────────────────────────
export const scoreApi = {
  startQuiz:    (quizId)        => api.post(`/scores/start/${quizId}`),
  submitAnswer: (attemptId, data) => api.post(`/scores/${attemptId}/answer`, data),
  finishQuiz:   (attemptId)     => api.post(`/scores/${attemptId}/finish`),
  getHint:      (questionId)    => api.get(`/scores/hint/${questionId}`),
  getMyScores:  ()              => api.get('/scores/my'),
};

// ── Notifications ─────────────────────────────────────────────
export const notificationApi = {
  getAll:     ()   => api.get('/notifications'),
  markRead:   (id) => api.put(`/notifications/${id}/read`),
  markAllRead: ()  => api.put('/notifications/read-all'),
};
