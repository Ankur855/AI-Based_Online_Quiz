import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import useAuthStore from '../context/authStore';

export default function LoginPage() {
  const [mode, setMode]     = useState('login'); // 'login' | 'register'
  const [loading, setLoading] = useState(false);
  const [form, setForm]     = useState({ name: '', email: '', password: '', role: 'student' });

  const { login, register } = useAuthStore();
  const navigate = useNavigate();

  const onChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      let user;
      if (mode === 'login') {
        user = await login(form.email, form.password);
        console.log(user,'UHUH')
      } else {
        if (form.password.length < 6) {
          toast.error('Password must be at least 6 characters');
          return;
        }
        user = await register(form.name, form.email, form.password, form.role);
      }
      toast.success(`Welcome, ${user.name}! 🎉`);
      navigate(user.role === 'student' ? '/student/dashboard' : '/teacher/dashboard');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      <div style={s.card} className="fade-in">

        {/* Logo */}
        <div style={s.logoRow}>
          <span style={s.logoEmoji}>⚡</span>
          <span style={s.logoText}>AdaptIQ</span>
        </div>
        <p style={s.tagline}>AI-Powered Adaptive Quiz System</p>

        {/* Tab toggle */}
        <div style={s.tabRow}>
          {['login', 'register'].map((m) => (
            <button
              key={m}
              style={{ ...s.tabBtn, ...(mode === m ? s.tabActive : {}) }}
              onClick={() => setMode(m)}
              type="button"
            >
              {m === 'login' ? 'Sign In' : 'Register'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={s.form}>
          {mode === 'register' && (
            <>
              <div style={s.field}>
                <label style={s.label}>Full Name</label>
                <input
                  className="form-input"
                  name="name"
                  placeholder="e.g. Ankur Ojha"
                  value={form.name}
                  onChange={onChange}
                  required
                />
              </div>
              <div style={s.field}>
                <label style={s.label}>I am a</label>
                <select className="form-input" name="role" value={form.role} onChange={onChange}>
                  <option value="student">Student</option>
                  <option value="teacher">Teacher</option>
                </select>
              </div>
            </>
          )}

          <div style={s.field}>
            <label style={s.label}>Email Address</label>
            <input
              className="form-input"
              type="email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              required
            />
          </div>

          <div style={s.field}>
            <label style={s.label}>Password</label>
            <input
              className="form-input"
              type="password"
              name="password"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={onChange}
              required
              minLength={6}
            />
          </div>

          <button
            type="submit"
            className="btn-primary"
            disabled={loading}
            style={{ width: '100%', marginTop: 8, opacity: loading ? 0.75 : 1 }}
          >
            {loading
              ? (mode === 'login' ? 'Signing in...' : 'Creating account...')
              : (mode === 'login' ? 'Sign In' : 'Create Account')}
          </button>
        </form>

        {/* Demo credentials hint */}
        {mode === 'login' && (
          <div style={s.demo}>
            <span style={s.demoLabel}>Demo accounts after seeding:</span>
            <code style={s.demoCode}>teacher@demo.com / password123</code>
            <code style={s.demoCode}>alice@demo.com / password123</code>
          </div>
        )}
      </div>
    </div>
  );
}

const s = {
  page: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: 'linear-gradient(135deg, #f5f5f0 0%, #ede9fe 100%)',
    padding: '1rem',
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '2.5rem 2rem',
    width: '100%',
    maxWidth: 420,
    boxShadow: '0 8px 40px rgba(79, 70, 229, 0.12)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 },
  logoEmoji: { fontSize: 32 },
  logoText:  { fontSize: 26, fontWeight: 800, color: '#1a1a2e', letterSpacing: '-0.5px' },
  tagline:   { fontSize: 13, color: '#888', marginBottom: 24 },
  tabRow: {
    display: 'flex',
    background: '#f5f5f5',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
    gap: 4,
  },
  tabBtn: {
    flex: 1,
    padding: '8px 0',
    border: 'none',
    borderRadius: 8,
    background: 'transparent',
    fontSize: 14,
    fontWeight: 500,
    color: '#777',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  tabActive: {
    background: '#fff',
    color: '#4f46e5',
    fontWeight: 700,
    boxShadow: '0 1px 6px rgba(0,0,0,0.08)',
  },
  form:  { display: 'flex', flexDirection: 'column', gap: 14 },
  field: { display: 'flex', flexDirection: 'column', gap: 5 },
  label: { fontSize: 12, fontWeight: 600, color: '#555' },
  demo: {
    marginTop: 20,
    background: '#f8f7ff',
    borderRadius: 8,
    padding: '10px 12px',
    display: 'flex',
    flexDirection: 'column',
    gap: 4,
  },
  demoLabel: { fontSize: 11, color: '#888', marginBottom: 2 },
  demoCode: {
    fontSize: 11,
    fontFamily: 'monospace',
    color: '#4f46e5',
    background: '#ede9fe',
    padding: '2px 6px',
    borderRadius: 4,
  },
};
