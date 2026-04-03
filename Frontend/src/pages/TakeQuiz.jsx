import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import { scoreApi } from '../api';
import { abilityLabel, scoreColor } from '../utils/irtHelpers';

// State machine states
const STATE = { LOADING: 'loading', ANSWERING: 'answering', FEEDBACK: 'feedback', FINISHED: 'finished' };

export default function TakeQuiz() {
  const { quizId } = useParams();
  const navigate   = useNavigate();

  const [uiState,       setUiState]       = useState(STATE.LOADING);
  const [attemptId,     setAttemptId]     = useState(null);
  const [question,      setQuestion]      = useState(null);
  const [questionNum,   setQuestionNum]   = useState(1);
  const [totalQ,        setTotalQ]        = useState(10);
  const [selected,      setSelected]      = useState('');
  const [feedback,      setFeedback]      = useState(null);
  const [result,        setResult]        = useState(null);
  const [theta,         setTheta]         = useState(0);
  const [hint,          setHint]          = useState('');
  const [hintLoading,   setHintLoading]   = useState(false);
  const [submitting,    setSubmitting]    = useState(false);
  const [startTime,     setStartTime]     = useState(Date.now());

  // ── Start quiz on mount ──────────────────────────────────────
  useEffect(() => {
    const start = async () => {
      try {
        const { data } = await scoreApi.startQuiz(quizId);
        setAttemptId(data.attemptId);
        setQuestion(data.question);
        setQuestionNum(1);
        setTotalQ(data.totalQuestions);
        setTheta(data.theta || 0);
        setStartTime(Date.now());
        setUiState(STATE.ANSWERING);
      } catch (err) {
        toast.error(err.response?.data?.message || 'Failed to start quiz');
        navigate(-1);
      }
    };
    start();
  }, [quizId]);

  // ── Submit an answer ─────────────────────────────────────────
  const submitAnswer = async () => {
    if (!selected || submitting) return;
    setSubmitting(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);

    try {
      const { data } = await scoreApi.submitAnswer(attemptId, {
        questionId:     question.id,
        selectedOption: selected,
        timeTakenSeconds: timeTaken,
      });

      setFeedback(data);
      setTheta(data.newTheta ?? theta);
      setUiState(STATE.FEEDBACK);

      if (data.isComplete) {
        // Auto-advance to finish after a short delay so student sees last feedback
        setTimeout(() => finishQuiz(), 1800);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to submit answer');
    } finally {
      setSubmitting(false);
    }
  };

  // ── Advance to next question ─────────────────────────────────
  const nextQuestion = () => {
    if (!feedback) return;
    if (feedback.isComplete) { finishQuiz(); return; }

    setQuestion(feedback.question);
    setQuestionNum(n => n + 1);
    setSelected('');
    setFeedback(null);
    setHint('');
    setStartTime(Date.now());
    setUiState(STATE.ANSWERING);
  };

  // ── Finish quiz & get results ────────────────────────────────
  const finishQuiz = useCallback(async () => {
    try {
      const { data } = await scoreApi.finishQuiz(attemptId);
      setResult(data.result);
      setUiState(STATE.FINISHED);
    } catch {
      toast.error('Could not load your results. Please try again.');
    }
  }, [attemptId]);

  // ── Get AI hint ──────────────────────────────────────────────
  const getHint = async () => {
    if (hintLoading || hint) return;
    setHintLoading(true);
    try {
      const { data } = await scoreApi.getHint(question.id);
      setHint(data.hint);
    } catch {
      toast.error('Could not get hint right now.');
    } finally {
      setHintLoading(false);
    }
  };

  // ────────────────────────────────────────────────────────────
  //  RENDER: Loading
  // ────────────────────────────────────────────────────────────
  if (uiState === STATE.LOADING) {
    return (
      <div className="loading-screen">
        <div className="spinner" />
        <span>Preparing your adaptive quiz...</span>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  //  RENDER: Finished / Results
  // ────────────────────────────────────────────────────────────
  if (uiState === STATE.FINISHED && result) {
    const { scorePercent, correctAnswers, totalQuestions, passed,
            timeTakenMinutes, finalAbility, topicBreakdown, aiFeedback,
            difficultyProgression } = result;

    return (
      <div style={s.page}>
        <div style={s.resultCard} className="fade-in">

          <div style={s.resultEmoji}>{passed ? '🎉' : '📚'}</div>
          <h1 style={s.resultTitle}>{passed ? 'Well Done!' : 'Keep Practising!'}</h1>

          {/* Score circle */}
          <div style={s.scoreCircle}>
            <span style={{ ...s.scoreNum, color: scoreColor(scorePercent) }}>
              {Math.round(scorePercent)}%
            </span>
            <span style={s.scoreLbl}>Score</span>
          </div>

          {/* Stats grid */}
          <div style={s.statsGrid}>
            {[
              ['Correct',      `${correctAnswers} / ${totalQuestions}`],
              ['Ability',      abilityLabel(finalAbility)],
              ['Time',         `${timeTakenMinutes} min`],
              ['Result',       passed ? '✅ Passed' : '❌ Failed'],
            ].map(([lbl, val]) => (
              <div key={lbl} style={s.statBox}>
                <div style={s.statLbl}>{lbl}</div>
                <div style={s.statVal}>{val}</div>
              </div>
            ))}
          </div>

          {/* Difficulty progression dots */}
          {difficultyProgression?.length > 0 && (
            <div style={s.progRow}>
              <span style={s.progLbl}>Difficulty path:</span>
              {difficultyProgression.map((d, i) => (
                <span key={i} style={{ ...s.dot, background: ['#22c55e','#84cc16','#f59e0b','#f97316','#ef4444'][d - 1] }}>
                  {d}
                </span>
              ))}
            </div>
          )}

          {/* AI Feedback */}
          {aiFeedback && (
            <div style={s.aiFeedback}>
              <div style={s.aiLabel}>🤖 AI Feedback</div>
              <p style={s.aiText}>{aiFeedback}</p>
            </div>
          )}

          {/* Topic breakdown */}
          {topicBreakdown && Object.keys(topicBreakdown).length > 0 && (
            <div style={{ textAlign: 'left', marginBottom: 20 }}>
              <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 10 }}>Topic Breakdown</div>
              {Object.entries(topicBreakdown).map(([topic, d]) => (
                <div key={topic} style={s.topicRow}>
                  <span style={s.topicName}>{topic}</span>
                  <div style={s.barTrack}>
                    <div style={{ ...s.barFill, width: `${d.percent}%`, background: scoreColor(d.percent) }} />
                  </div>
                  <span style={s.topicPct}>{d.percent}%</span>
                </div>
              ))}
            </div>
          )}

          <button className="btn-primary" style={{ width: '100%' }} onClick={() => navigate('/student/dashboard')}>
            Back to Dashboard
          </button>
        </div>
      </div>
    );
  }

  // ────────────────────────────────────────────────────────────
  //  RENDER: Answering / Feedback
  // ────────────────────────────────────────────────────────────
  const options = question?.options || [];
  const progress = Math.round((questionNum / totalQ) * 100);

  return (
    <div style={s.page}>
      <div style={s.quizCard} className="fade-in">

        {/* Progress bar */}
        <div style={s.progressTrack}>
          <div style={{ ...s.progressFill, width: `${progress}%` }} />
        </div>

        {/* Meta row */}
        <div style={s.metaRow}>
          <span style={s.metaText}>Question {questionNum} of {totalQ}</span>
          <span style={s.abilityPill}>⚡ {abilityLabel(theta)}</span>
        </div>

        {/* Difficulty dots */}
        {question && (
          <div style={s.diffRow}>
            {[1, 2, 3, 4, 5].map(d => (
              <div key={d} style={{
                ...s.diffDot,
                background: d <= question.difficulty ? '#4f46e5' : '#e5e7eb',
              }} />
            ))}
            <span style={s.diffLbl}>Difficulty {question.difficulty} / 5</span>
          </div>
        )}

        {/* Question text */}
        <h2 style={s.qText}>{question?.text}</h2>

        {/* Answer options */}
        <div style={s.optionsCol}>
          {options.map((opt) => {
            let bg = '#f9fafb', border = '#e5e7eb', color = '#1a1a2e';

            // Highlight selected option while answering
            if (uiState === STATE.ANSWERING && selected === opt.text) {
              bg = '#ede9fe'; border = '#4f46e5'; color = '#4f46e5';
            }
            // Show correct/wrong after submitting
            if (uiState === STATE.FEEDBACK) {
              if (opt.text === feedback?.correct)                     { bg = '#dcfce7'; border = '#22c55e'; color = '#166534'; }
              else if (opt.text === selected && !feedback?.isCorrect) { bg = '#fee2e2'; border = '#ef4444'; color = '#991b1b'; }
            }

            return (
              <button
                key={opt.text}
                disabled={uiState !== STATE.ANSWERING}
                onClick={() => setSelected(opt.text)}
                style={{ ...s.optBtn, background: bg, border: `2px solid ${border}`, color }}
              >
                {opt.text}
              </button>
            );
          })}
        </div>

        {/* Hint */}
        {uiState === STATE.ANSWERING && (
          <div style={{ marginBottom: 16 }}>
            {hint
              ? <div style={s.hintBox}>💡 {hint}</div>
              : (
                <button
                  style={s.hintBtn}
                  onClick={getHint}
                  disabled={hintLoading}
                >
                  {hintLoading ? 'Getting hint...' : '💡 Get AI Hint'}
                </button>
              )
            }
          </div>
        )}

        {/* Explanation after answer */}
        {uiState === STATE.FEEDBACK && feedback?.explanation && (
          <div style={s.explanation}>
            <strong>Explanation:</strong> {feedback.explanation}
          </div>
        )}

        {/* Action button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          {uiState === STATE.ANSWERING ? (
            <button
              className="btn-primary"
              onClick={submitAnswer}
              disabled={!selected || submitting}
              style={{ minWidth: 140 }}
            >
              {submitting ? 'Submitting...' : 'Submit Answer'}
            </button>
          ) : (
            <button
              className="btn-primary"
              onClick={nextQuestion}
              style={{ background: '#059669', minWidth: 140 }}
            >
              {feedback?.isComplete ? 'See Results 🎉' : 'Next Question →'}
            </button>
          )}
        </div>

      </div>
    </div>
  );
}

const s = {
  page:         { minHeight: '100vh', background: '#f5f5f0', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' },
  quizCard:     { background: '#fff', borderRadius: 20, padding: '2rem', width: '100%', maxWidth: 600, boxShadow: '0 8px 40px rgba(0,0,0,0.08)' },
  progressTrack:{ height: 6, background: '#f0f0f0', borderRadius: 3, marginBottom: 16, overflow: 'hidden' },
  progressFill: { height: '100%', background: '#4f46e5', borderRadius: 3, transition: 'width 0.4s ease' },
  metaRow:      { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  metaText:     { fontSize: 13, color: '#888' },
  abilityPill:  { background: '#ede9fe', color: '#4f46e5', padding: '2px 10px', borderRadius: 20, fontSize: 12, fontWeight: 700 },
  diffRow:      { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 18 },
  diffDot:      { width: 9, height: 9, borderRadius: '50%', transition: 'background 0.3s' },
  diffLbl:      { fontSize: 11, color: '#aaa', marginLeft: 4 },
  qText:        { fontSize: 17, fontWeight: 700, lineHeight: 1.55, marginBottom: 22, color: '#1a1a2e' },
  optionsCol:   { display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 18 },
  optBtn:       { padding: '13px 16px', borderRadius: 10, fontSize: 14, textAlign: 'left', cursor: 'pointer', transition: 'all 0.15s', fontFamily: 'inherit', lineHeight: 1.4 },
  hintBtn:      { background: 'transparent', border: '1px dashed #ccc', borderRadius: 8, padding: '8px 14px', fontSize: 13, color: '#888', cursor: 'pointer', fontFamily: 'inherit' },
  hintBox:      { background: '#fef9c3', border: '1px solid #fde047', borderRadius: 8, padding: '11px 13px', fontSize: 13, color: '#713f12', lineHeight: 1.6 },
  explanation:  { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 8, padding: '11px 13px', fontSize: 13, color: '#0c4a6e', marginBottom: 18, lineHeight: 1.6 },
  // Results
  resultCard:   { background: '#fff', borderRadius: 20, padding: '2.5rem 2rem', width: '100%', maxWidth: 540, boxShadow: '0 8px 40px rgba(0,0,0,0.08)', textAlign: 'center' },
  resultEmoji:  { fontSize: 48, marginBottom: 8 },
  resultTitle:  { fontSize: 22, fontWeight: 800, color: '#1a1a2e', marginBottom: 20 },
  scoreCircle:  { width: 100, height: 100, borderRadius: '50%', background: '#f5f5f0', border: '4px solid #ede9fe', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' },
  scoreNum:     { fontSize: 24, fontWeight: 800 },
  scoreLbl:     { fontSize: 11, color: '#aaa' },
  statsGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 20 },
  statBox:      { background: '#fafafa', borderRadius: 10, padding: 12 },
  statLbl:      { fontSize: 11, color: '#888', marginBottom: 3 },
  statVal:      { fontSize: 14, fontWeight: 700, color: '#1a1a2e' },
  progRow:      { display: 'flex', alignItems: 'center', gap: 5, marginBottom: 16, justifyContent: 'center', flexWrap: 'wrap' },
  progLbl:      { fontSize: 12, color: '#888' },
  dot:          { width: 22, height: 22, borderRadius: '50%', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700, color: '#fff' },
  aiFeedback:   { background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 10, padding: '14px', marginBottom: 20, textAlign: 'left' },
  aiLabel:      { fontSize: 12, fontWeight: 700, color: '#0369a1', marginBottom: 6 },
  aiText:       { fontSize: 13, color: '#0c4a6e', lineHeight: 1.6, margin: 0 },
  topicRow:     { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 },
  topicName:    { fontSize: 12, width: 100, color: '#555', flexShrink: 0, textAlign: 'left' },
  barTrack:     { flex: 1, height: 7, background: '#f0f0f0', borderRadius: 4, overflow: 'hidden' },
  barFill:      { height: '100%', borderRadius: 4, transition: 'width 0.6s ease' },
  topicPct:     { fontSize: 12, width: 34, textAlign: 'right', color: '#555' },
};
