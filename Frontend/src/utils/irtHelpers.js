/**
 * Convert a student's IRT theta score (range -4 to +4)
 * into a human-readable ability label.
 */
export const abilityLabel = (theta) => {
  const t = typeof theta === 'number' ? theta : 0;
  if (t >= 2)  return 'Expert';
  if (t >= 1)  return 'Advanced';
  if (t >= 0)  return 'Intermediate';
  if (t >= -1) return 'Beginner';
  return 'Novice';
};

/**
 * Convert theta to a percentage (0-100) for progress bars.
 * Maps the -4…+4 range to 0…100.
 */
export const thetaToPercent = (theta) => {
  const clamped = Math.max(-4, Math.min(4, theta || 0));
  return Math.round(((clamped + 4) / 8) * 100);
};

/**
 * Returns a colour based on score percentage.
 */
export const scoreColor = (pct) => {
  if (pct >= 80) return '#22c55e';
  if (pct >= 60) return '#f59e0b';
  return '#ef4444';
};
