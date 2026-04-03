import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import toast from 'react-hot-toast';

import { quizApi, scoreApi } from '../api';
import useAuthStore from '../context/authStore';
import { abilityLabel, scoreColor } from '../utils/irtHelpers';

export default function StudentDashboard() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const [quizzes, setQuizzes] = useState([]);
  const [scores,  setScores]  = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const [qRes, sRes] = await Promise.all([
          quizApi.getAll(),
          scoreApi.getMyScores(),
        ]);
        setQuizzes(qRes.data.quizzes);
        setScores(sRes.data.scores);
      } catch {
        toast.error('Failed to load dashboard data.');
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const avgScore = scores.length
    ? Math.round(scores.reduce((s, r) => s + r.scorePercent, 0) / scores.length)
    : 0;

  const chartData = [...scores].reverse().map((s, i) => ({
    attempt: `#${i + 1}`,
    score:   Math.round(s.scorePercent),
    label:   s.quiz?.title || 'Quiz',
  }));

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Loading your dashboard...</span>
      </div>
    );
  }

  return (
    <div className="page-container fade-in">

      {/* ── Header ─────────────────────────────────────────── */}
      <div style={s.header}>
        <div>
          <h1 style={s.h1}>👋 Hello, {user?.name?.split(' ')[0]}!</h1>
          <p style={s.sub}>
            Ability level:&nbsp;
            <span style={s.levelBadge}>{abilityLabel(user?.overallRating || 0)}</span>
          </p>
        </div>
        <button
          className="btn-secondary"
          onClick={() => { logout(); navigate('/login'); }}
        >
          Logout
        </button>
      </div>

      {/* ── Stat cards ─────────────────────────────────────── */}
      <div style={s.statsGrid}>
        {[
          { label: 'Quizzes Available', value: quizzes.length,                        icon: '📋' },
          { label: 'Attempts Made',     value: scores.length,                          icon: '✏️' },
          { label: 'Average Score',     value: `${avgScore}%`,                         icon: '📊' },
          { label: 'Passed',            value: scores.filter(s => s.passed).length,    icon: '✅' },
        ].map((stat) => (
          <div key={stat.label} className="card" style={s.statCard}>
            <div style={s.statIcon}>{stat.icon}</div>
            <div style={s.statNum}>{stat.value}</div>
            <div style={s.statLabel}>{stat.label}</div>
          </div>
        ))}
      </div>

      {/* ── Two-column layout ──────────────────────────────── */}
      <div style={s.grid2}>

        {/* Available Quizzes */}
        <div className="card">
          <h2 style={s.sectionTitle}>Available Quizzes</h2>
          {quizzes.length === 0 ? (
            <p style={s.empty}>No quizzes published yet. Check back soon!</p>
          ) : (
            quizzes.map((quiz) => (
              <div key={quiz.id} style={s.quizRow}>
                <div style={{ flex: 1 }}>
                  <div style={s.quizTitle}>{quiz.title}</div>
                  <div style={s.quizMeta}>
                    {quiz.subject} &nbsp;·&nbsp;
                    <span style={s.modeBadge}>{quiz.mode}</span> &nbsp;·&nbsp;
                    {quiz.timeLimitMinutes} min
                  </div>
                </div>
                <button
                  className="btn-primary"
                  style={{ padding: '7px 16px', fontSize: 13 }}
                  onClick={() => navigate(`/quiz/${quiz.id}`)}
                >
                  Start →
                </button>
              </div>
            ))
          )}
        </div>

        {/* Score history chart */}
        <div className="card">
          <h2 style={s.sectionTitle}>Score History</h2>
          {chartData.length >= 2 ? (
            <ResponsiveContainer width="100%" height={220}>
              <LineChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="attempt" tick={{ fontSize: 12 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 12 }} unit="%" />
                <Tooltip
                  formatter={(v) => [`${v}%`, 'Score']}
                  labelFormatter={(l) => `Attempt ${l}`}
                />
                <Line
                  type="monotone"
                  dataKey="score"
                  stroke="#4f46e5"
                  strokeWidth={2.5}
                  dot={{ fill: '#4f46e5', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p style={s.empty}>
              Complete at least 2 quizzes to see your progress chart here.
            </p>
          )}
        </div>
      </div>

      {/* ── Recent Results table ───────────────────────────── */}
      {scores.length > 0 && (
        <div className="card" style={{ marginTop: 16 }}>
          <h2 style={s.sectionTitle}>Recent Results</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={s.table}>
              <thead>
                <tr>
                  {['Quiz', 'Score', 'Status', 'Ability Level', 'Date'].map((h) => (
                    <th key={h} style={s.th}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {scores.slice(0, 8).map((sc) => (
                  <tr key={sc.id} style={s.tr}>
                    <td style={s.td}>{sc.quiz?.title || '—'}</td>
                    <td style={s.td}>
                      <span style={{ fontWeight: 700, color: scoreColor(sc.scorePercent) }}>
                        {Math.round(sc.scorePercent)}%
                      </span>
                    </td>
                    <td style={s.td}>
                      <span className={`badge ${sc.passed ? 'badge-green' : 'badge-red'}`}>
                        {sc.passed ? 'Pass' : 'Fail'}
                      </span>
                    </td>
                    <td style={s.td}>{abilityLabel(sc.finalAbility)}</td>
                    <td style={s.td}>
                      {sc.createdAt
                        ? new Date(sc.createdAt).toLocaleDateString('en-IN')
                        : '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}

const s = {
  header:     { display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 },
  h1:         { fontSize: 22, fontWeight: 700, margin: 0 },
  sub:        { fontSize: 13, color: '#666', marginTop: 4, display: 'flex', alignItems: 'center', gap: 6 },
  levelBadge: { background: '#ede9fe', color: '#4f46e5', padding: '2px 10px', borderRadius: 20, fontWeight: 700, fontSize: 12 },
  statsGrid:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12, marginBottom: 16 },
  statCard:   { textAlign: 'center', padding: '18px 12px' },
  statIcon:   { fontSize: 22, marginBottom: 6 },
  statNum:    { fontSize: 26, fontWeight: 800, color: '#4f46e5' },
  statLabel:  { fontSize: 11, color: '#888', marginTop: 3 },
  grid2:      { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 },
  sectionTitle: { fontSize: 15, fontWeight: 700, marginBottom: 14, color: '#1a1a2e' },
  quizRow:    { display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 12, marginBottom: 12, borderBottom: '1px solid #f5f5f5' },
  quizTitle:  { fontSize: 13, fontWeight: 600 },
  quizMeta:   { fontSize: 11, color: '#888', marginTop: 3 },
  modeBadge:  { background: '#ede9fe', color: '#4f46e5', padding: '1px 7px', borderRadius: 10, fontSize: 10, fontWeight: 600 },
  empty:      { color: '#aaa', fontSize: 13, lineHeight: 1.6 },
  table:      { width: '100%', borderCollapse: 'collapse', fontSize: 13 },
  th:         { textAlign: 'left', padding: '8px 10px', background: '#fafafa', color: '#555', fontWeight: 600, borderBottom: '1px solid #eee', whiteSpace: 'nowrap' },
  td:         { padding: '10px', borderBottom: '1px solid #f5f5f5', color: '#333' },
  tr:         { transition: 'background 0.15s' },
};
