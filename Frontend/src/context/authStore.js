import { create } from 'zustand';
import { authApi } from '../api';

const useAuthStore = create((set, get) => ({
  user:    null,
  loading: true,   // true on first mount while we verify the stored token
  error:   null,

  // ── init: called once in App.js on mount ─────────────────────
  init: async () => {
    const token = localStorage.getItem('accessToken');
    if (!token) {
      set({ loading: false });
      return;
    }
    try {
      const { data } = await authApi.getMe();
      set({ user: data.user, loading: false });
    } catch {
      localStorage.clear();
      set({ user: null, loading: false });
    }
  },

  // ── login ────────────────────────────────────────────────────
  login: async (email, password) => {
    set({ error: null });
    const { data } = await authApi.login({ email, password });
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user });
    return data.user;
  },

  // ── register ─────────────────────────────────────────────────
  register: async (name, email, password, role) => {
    set({ error: null });
    const { data } = await authApi.register({ name, email, password, role });
    localStorage.setItem('accessToken',  data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);
    set({ user: data.user });
    return data.user;
  },

  // ── logout ───────────────────────────────────────────────────
  logout: () => {
    localStorage.clear();
    set({ user: null });
  },

  // ── helpers ──────────────────────────────────────────────────
  isStudent: () => get().user?.role === 'student',
  isTeacher: () => ['teacher', 'admin'].includes(get().user?.role),
}));

export default useAuthStore;
