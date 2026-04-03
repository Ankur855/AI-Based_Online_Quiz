import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { quizApi, questionApi } from '../api';
import useAuthStore from '../context/authStore';

const TABS = [
  { key: 'quizzes',  label: '📋 My Quizzes' },
  { key: 'create',   label: '➕ Create Quiz' },
  { key: 'generate', label: '🤖 AI Generate' },
];

export default function TeacherDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [tab,      setTab]      = useState('quizzes');
  const [quizzes,  setQuizzes]  = useState([]);
  const [loading,  setLoading]  = useState(true);

  // Create quiz form
  const [quizForm,  setQuizForm]  = useState({
    title: '', description: '', subject: '', mode: 'adaptive',
    timeLimitMinutes: 30, passingScore: 60,
  });
  const [creating, setCreating] = useState(false);

  // AI generate form
  const [genForm, setGenForm]   = useState({ topic: '', subject: '', difficulty: 3, count: 5 });
  const [generating, setGenerating] = useState(false);
  const [generated,  setGenerated]  = useState([]);

  useEffect(() => {
    quizApi.getAll()
      .then(r => setQuizzes(r.data.quizzes))
      .catch(() => toast.error('Failed to load quizzes'))
      .finally(() => setLoading(false));
  }, []);

  // ── Handlers ────────────────────────────────────────────────
  const handleCreateQuiz = async (e) => {
    e.preventDefault();
    setCreating(true);
    try {
      const { data } = await quizApi.create(quizForm);
      setQuizzes([data.quiz, ...quizzes]);
      toast.success('Quiz created!');
      setTab('quizzes');
      setQuizForm({ title: '', description: '', subject: '', mode: 'adaptive', timeLimitMinutes: 30, passingScore: 60 });
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to create quiz');
    } finally {
      setCreating(false);
    }
  };

  const togglePublish = async (quiz) => {
    const newStatus = quiz.status === 'published' ? 'draft' : 'published';
    try {
      await quizApi.update(quiz.id, { status: newStatus });
      setQuizzes(quizzes.map(q => q.id === quiz.id ? { ...q, status: newStatus } : q));
      toast.success(`Quiz ${newStatus === 'published' ? 'published' : 'unpublished'}`);
    } catch { toast.error('Update failed'); }
  };

  const deleteQuiz = async (id) => {
    if (!window.confirm('Delete this quiz permanently?')) return;
    try {
      await quizApi.delete(id);
      setQuizzes(quizzes.filter(q => q.id !== id));
      toast.success('Quiz deleted');
    } catch { toast.error('Delete failed'); }
  };

  const handleGenerate = async (e) => {
    e.preventDefault();
    setGenerating(true);
    setGenerated([]);
    try {
      const { data } = await questionApi.generate(genForm);
      setGenerated(data.questions);
      toast.success(`${data.count} questions generated and saved!`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'AI generation failed');
    } finally {
      setGenerating(false);
    }
  };

  // ── Shared input style ───────────────────────────────────────
  const inp = {
    width: '100%', padding: '10px 12px', borderRadius: 8,
    border: '1px solid #e0e0e0', fontSize: 13, fontFamily: 'inherit', boxSizing: 'border-box',
  };

  return (
    <div className="page-container fade-in">

      {/* Header */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>🎓 Teacher Dashboard</h1>
          <p style={s.sub}>{user?.name} &nbsp;·&nbsp; {quizzes.length} quizzes created</p>
        </div>
        <button className="btn-secondary" onClick={() => { logout(); navigate('/login'); }}>
          Logout
        </button>
      </div>

      {/* Tabs */}
      <div style={s.tabBar}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            style={{ ...s.tabBtn, ...(tab === key ? s.tabActive : {}) }}
            onClick={() => setTab(key)}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Tab: My Quizzes ─────────────────────────────────── */}
      {tab === 'quizzes' && (
        <div>
          {loading && <p style={s.empty}>Loading...</p>}
          {!loading && quizzes.length === 0 && (
            <div className="card" style={{ textAlign: 'center', padding: '2rem' }}>
              <p style={s.empty}>No quizzes yet. Create your first one!</p>
              <button className="btn-primary" style={{ marginTop: 12 }} onClick={() => setTab('create')}>
                ➕ Create Quiz
              </button>
            </div>
          )}
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="card" style={s.quizRow}>
              <div style={{ flex: 1 }}>
                <span style={s.quizTitle}>{quiz.title}</span>
                <span style={s.quizMeta}>
                  {quiz.subject} &nbsp;·&nbsp; {quiz.mode} &nbsp;·&nbsp; {quiz.totalAttempts || 0} attempts
                </span>
              </div>
              <span className={`badge ${quiz.status === 'published' ? 'badge-green' : 'badge-yellow'}`}>
                {quiz.status}
              </span>
              <div style={s.actions}>
                <button className="btn-secondary" style={{ fontSize: 12, padding: '5px 12px' }} onClick={() => togglePublish(quiz)}>
                  {quiz.status === 'published' ? 'Unpublish' : 'Publish'}
                </button>
                <button className="btn-danger" style={{ fontSize: 12, padding: '5px 10px' }} onClick={() => deleteQuiz(quiz.id)}>
                  ✕
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Tab: Create Quiz ────────────────────────────────── */}
      {tab === 'create' && (
        <div className="card">
          <h2 style={s.cardTitle}>Create a New Quiz</h2>
          <form onSubmit={handleCreateQuiz} style={s.form}>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Quiz Title *</label>
                <input style={inp} value={quizForm.title}
                  onChange={e => setQuizForm({ ...quizForm, title: e.target.value })}
                  placeholder="e.g. Mathematics Fundamentals" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Subject *</label>
                <input style={inp} value={quizForm.subject}
                  onChange={e => setQuizForm({ ...quizForm, subject: e.target.value })}
                  placeholder="e.g. mathematics" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Quiz Mode</label>
                <select style={inp} value={quizForm.mode}
                  onChange={e => setQuizForm({ ...quizForm, mode: e.target.value })}>
                  <option value="adaptive">Adaptive (AI picks questions)</option>
                  <option value="fixed">Fixed (manual question list)</option>
                  <option value="practice">Practice (no timer)</option>
                </select>
              </div>
              <div style={s.field}>
                <label style={s.label}>Time Limit (minutes)</label>
                <input type="number" style={inp} value={quizForm.timeLimitMinutes} min={0}
                  onChange={e => setQuizForm({ ...quizForm, timeLimitMinutes: +e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Passing Score (%)</label>
                <input type="number" style={inp} value={quizForm.passingScore} min={0} max={100}
                  onChange={e => setQuizForm({ ...quizForm, passingScore: +e.target.value })} />
              </div>
            </div>
            <div style={s.field}>
              <label style={s.label}>Description</label>
              <textarea style={{ ...inp, minHeight: 72, resize: 'vertical' }}
                value={quizForm.description}
                onChange={e => setQuizForm({ ...quizForm, description: e.target.value })}
                placeholder="Optional short description for students" />
            </div>
            <button type="submit" className="btn-primary" disabled={creating} style={{ alignSelf: 'flex-start', minWidth: 140 }}>
              {creating ? 'Creating...' : 'Create Quiz'}
            </button>
          </form>
        </div>
      )}

      {/* ── Tab: AI Generate ────────────────────────────────── */}
      {tab === 'generate' && (
        <div className="card">
          <h2 style={s.cardTitle}>🤖 AI Question Generator</h2>
          <p style={s.hint}>
            Powered by OpenAI GPT-4o-mini — generates MCQ questions and saves them
            directly to your question bank.
          </p>
          <form onSubmit={handleGenerate} style={s.form}>
            <div style={s.grid2}>
              <div style={s.field}>
                <label style={s.label}>Topic *</label>
                <input style={inp} value={genForm.topic}
                  onChange={e => setGenForm({ ...genForm, topic: e.target.value })}
                  placeholder="e.g. Quadratic Equations" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Subject *</label>
                <input style={inp} value={genForm.subject}
                  onChange={e => setGenForm({ ...genForm, subject: e.target.value })}
                  placeholder="e.g. mathematics" required />
              </div>
              <div style={s.field}>
                <label style={s.label}>Difficulty: {genForm.difficulty} / 5</label>
                <input type="range" min={1} max={5} step={1} style={{ width: '100%', marginTop: 4 }}
                  value={genForm.difficulty}
                  onChange={e => setGenForm({ ...genForm, difficulty: +e.target.value })} />
              </div>
              <div style={s.field}>
                <label style={s.label}>Number of Questions</label>
                <input type="number" style={inp} min={1} max={20} value={genForm.count}
                  onChange={e => setGenForm({ ...genForm, count: +e.target.value })} />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={generating} style={{ alignSelf: 'flex-start', minWidth: 160 }}>
              {generating ? '🤖 Generating...' : 'Generate Questions'}
            </button>
          </form>

          {/* Preview generated questions */}
          {generated.length > 0 && (
            <div style={{ marginTop: 24 }}>
              <h3 style={{ ...s.cardTitle, marginBottom: 12 }}>
                ✅ Generated {generated.length} questions — saved to question bank
              </h3>
              {generated.map((q, i) => (
                <div key={i} style={s.genCard}>
                  <p style={s.genQ}><strong>{i + 1}.</strong> {q.text}</p>
                  <div style={s.genOptions}>
                    {(q.options || []).map((opt, j) => (
                      <span key={j} style={{
                        ...s.optPill,
                        background: opt.isCorrect ? '#dcfce7' : '#f5f5f5',
                        color:      opt.isCorrect ? '#166534' : '#555',
                      }}>
                        {opt.isCorrect ? '✓' : '○'} {opt.text}
                      </span>
                    ))}
                  </div>
                  {q.explanation && <p style={s.genExp}>💡 {q.explanation}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const s = {
  header:    { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  h1:        { fontSize: 22, fontWeight: 700, margin: 0 },
  sub:       { fontSize: 13, color: '#888', marginTop: 4 },
  tabBar:    { display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' },
  tabBtn:    { padding: '8px 18px', borderRadius: 20, border: '1px solid #e0e0e0', background: '#fff', cursor: 'pointer', fontSize: 13, color: '#555', fontFamily: 'inherit' },
  tabActive: { background: '#4f46e5', color: '#fff', border: '1px solid #4f46e5', fontWeight: 600 },
  quizRow:   { display: 'flex', alignItems: 'center', gap: 14, padding: '12px 16px', marginBottom: 8, flexWrap: 'wrap' },
  quizTitle: { display: 'block', fontSize: 14, fontWeight: 600, color: '#1a1a2e' },
  quizMeta:  { display: 'block', fontSize: 11, color: '#888', marginTop: 3 },
  actions:   { display: 'flex', gap: 6 },
  empty:     { color: '#aaa', fontSize: 13 },
  cardTitle: { fontSize: 15, fontWeight: 700, marginBottom: 16, color: '#1a1a2e' },
  hint:      { fontSize: 13, color: '#666', marginBottom: 18, lineHeight: 1.6 },
  form:      { display: 'flex', flexDirection: 'column', gap: 14 },
  grid2:     { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 },
  field:     { display: 'flex', flexDirection: 'column', gap: 5 },
  label:     { fontSize: 12, fontWeight: 600, color: '#555' },
  genCard:   { background: '#f9f9f9', borderRadius: 8, padding: 12, marginBottom: 10, border: '1px solid #eee' },
  genQ:      { fontSize: 13, color: '#1a1a2e', marginBottom: 8, lineHeight: 1.5 },
  genOptions:{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 6 },
  optPill:   { padding: '3px 10px', borderRadius: 20, fontSize: 12 },
  genExp:    { fontSize: 12, color: '#666', fontStyle: 'italic', marginTop: 4 },
};
