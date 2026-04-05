require('dotenv').config();
const { connectDB, sequelize } = require('./db');
const { User, Question, Quiz, Attempt, Notification } = require('./Model/index');

const seed = async () => {
  await connectDB();

  // Disable FK checks, wipe all tables in safe order, re-enable
  await sequelize.query('PRAGMA foreign_keys = OFF');
  await Attempt.destroy({ where: {}, force: true });
  await Notification.destroy({ where: {}, force: true });
  await Quiz.destroy({ where: {}, force: true });
  await Question.destroy({ where: {}, force: true });
  await User.destroy({ where: {}, force: true });
  await sequelize.query('PRAGMA foreign_keys = ON');
  console.log('🗑  Cleared existing data');

  // ── Users ─────────────────────────────────────────────────
  const teacher = await User.create({
    name: 'Dr. Smith',
    email: 'teacher@demo.com',
    password: 'password123',
    role: 'teacher',
  });
  await User.create({
    name: 'Alice Johnson',
    email: 'alice@demo.com',
    password: 'password123',
    role: 'student',
  });
  await User.create({
    name: 'Bob Khan',
    email: 'bob@demo.com',
    password: 'password123',
    role: 'student',
  });
  console.log('👤 Created 3 users');

  // ── Questions ─────────────────────────────────────────────
  await Question.bulkCreate([
    {
      text: 'What is 2 + 2?',
      type: 'mcq',
      options: JSON.stringify([
        { text: '3' },
        { text: '4', isCorrect: true },
        { text: '5' },
        { text: '6' },
      ]),
      explanation: '2 + 2 = 4 by basic addition.',
      topic: 'arithmetic',
      subject: 'mathematics',
      difficulty: 1,
      createdById: teacher.id,
    },
    {
      text: 'What is the square root of 144?',
      type: 'mcq',
      options: JSON.stringify([
        { text: '10' },
        { text: '11' },
        { text: '12', isCorrect: true },
        { text: '14' },
      ]),
      explanation: '12 x 12 = 144.',
      topic: 'arithmetic',
      subject: 'mathematics',
      difficulty: 2,
      createdById: teacher.id,
    },
    {
      text: 'Solve for x: 3x + 6 = 21',
      type: 'mcq',
      options: JSON.stringify([
        { text: 'x = 3' },
        { text: 'x = 5', isCorrect: true },
        { text: 'x = 7' },
        { text: 'x = 9' },
      ]),
      explanation: '3x = 15, so x = 5.',
      topic: 'algebra',
      subject: 'mathematics',
      difficulty: 2,
      createdById: teacher.id,
    },
    {
      text: 'What is the derivative of x^2 + 3x?',
      type: 'mcq',
      options: JSON.stringify([
        { text: '2x' },
        { text: '2x + 3', isCorrect: true },
        { text: 'x + 3' },
        { text: '2x^2 + 3' },
      ]),
      explanation: 'Power rule: d/dx(x^2)=2x, d/dx(3x)=3. Total: 2x+3.',
      topic: 'calculus',
      subject: 'mathematics',
      difficulty: 4,
      createdById: teacher.id,
    },
    {
      text: 'The sum of angles in a triangle is 180 degrees.',
      type: 'true_false',
      options: JSON.stringify([
        { text: 'True', isCorrect: true },
        { text: 'False' },
      ]),
      explanation: 'Interior angles of any triangle always sum to 180 degrees.',
      topic: 'geometry',
      subject: 'mathematics',
      difficulty: 1,
      createdById: teacher.id,
    },
    {
      text: 'Which condition means a quadratic has no real roots?',
      type: 'mcq',
      options: JSON.stringify([
        { text: 'b^2 - 4ac > 0' },
        { text: 'b^2 - 4ac = 0' },
        { text: 'b^2 - 4ac < 0', isCorrect: true },
        { text: 'a = 0' },
      ]),
      explanation: 'Negative discriminant means no real roots.',
      topic: 'algebra',
      subject: 'mathematics',
      difficulty: 4,
      createdById: teacher.id,
    },
    {
      text: 'Is 0 an even number?',
      type: 'true_false',
      options: JSON.stringify([
        { text: 'True', isCorrect: true },
        { text: 'False' },
      ]),
      explanation: '0 is divisible by 2 with no remainder, so it is even.',
      topic: 'arithmetic',
      subject: 'mathematics',
      difficulty: 1,
      createdById: teacher.id,
    },
    {
      text: 'What is 15% of 200?',
      type: 'mcq',
      options: JSON.stringify([
        { text: '20' },
        { text: '25' },
        { text: '30', isCorrect: true },
        { text: '35' },
      ]),
      explanation: '15/100 x 200 = 30.',
      topic: 'arithmetic',
      subject: 'mathematics',
      difficulty: 2,
      createdById: teacher.id,
    },
    {
      text: 'What is the value of pi rounded to 2 decimal places?',
      type: 'mcq',
      options: JSON.stringify([
        { text: '3.14', isCorrect: true },
        { text: '3.41' },
        { text: '3.12' },
        { text: '3.16' },
      ]),
      explanation: 'Pi is approximately 3.14159, which rounds to 3.14.',
      topic: 'arithmetic',
      subject: 'mathematics',
      difficulty: 1,
      createdById: teacher.id,
    },
    {
      text: 'If f(x) = 2x + 5, what is f(3)?',
      type: 'mcq',
      options: JSON.stringify([
        { text: '10' },
        { text: '11', isCorrect: true },
        { text: '13' },
        { text: '8' },
      ]),
      explanation: 'f(3) = 2(3) + 5 = 6 + 5 = 11.',
      topic: 'algebra',
      subject: 'mathematics',
      difficulty: 2,
      createdById: teacher.id,
    },
  ]);
  console.log('❓ Created 10 questions');

  // ── Quiz ──────────────────────────────────────────────────
  await Quiz.create({
    title: 'Mathematics Fundamentals',
    description: 'An adaptive quiz covering arithmetic, algebra, calculus, and geometry.',
    subject: 'mathematics',
    topics: JSON.stringify(['arithmetic', 'algebra', 'calculus', 'geometry']),
    mode: 'adaptive',
    adaptiveSettings: JSON.stringify({
      totalQuestions: 6,
      startingDifficulty: 2,
      minDifficulty: 1,
      maxDifficulty: 5,
    }),
    timeLimitMinutes: 20,
    passingScore: 60,
    status: 'published',
    createdById: teacher.id,
    showResultsImmediately: true,
    allowReview: true,
    maxAttempts: 3,
  });
  console.log('📋 Created 1 published quiz');

  console.log('\n🎉 Seed complete! Login credentials:');
  console.log('   Teacher  →  teacher@demo.com  /  password123');
  console.log('   Student  →  alice@demo.com    /  password123');
  console.log('   Student  →  bob@demo.com      /  password123');

  process.exit(0);
};

seed().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});