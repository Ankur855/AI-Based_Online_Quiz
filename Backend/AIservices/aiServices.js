const { GoogleGenerativeAI } = require("@google/generative-ai");

// Initialize Gemini client
// Get your free API key from: https://aistudio.google.com/app/apikey
const genAI = new GoogleGenerativeAI(process.env.OPENAI_API_KEY);

// Use gemini-1.5-flash — fast, free tier, very capable
const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

/**
 * Helper: send a prompt to Gemini and get text back
 */
const ask = async (prompt) => {
  const result = await model.generateContent(prompt);
  return result.response.text().trim();
};

/**
 * Generate a hint for a student who is stuck.
 * Gives a nudge without revealing the answer.
 */
const generateHint = async (questionText, options = []) => {
  try {
    const optionsText = options
      .map((o, i) => `${i + 1}. ${o.text || o}`)
      .join("\n");

    const prompt = `You are a helpful tutor. A student is stuck on this question:

Question: ${questionText}
Options:
${optionsText}

Give a short hint (2-3 sentences max) that helps them think in the right direction WITHOUT revealing the correct answer. Be encouraging and concise.`;

    return await ask(prompt);
  } catch (error) {
    console.error("Gemini generateHint error:", error.message);
    return "Think carefully about the key concepts related to this question.";
  }
};

/**
 * Generate a personalised feedback summary after quiz completion.
 */
const generateFeedbackSummary = async (
  studentName,
  scorePercent,
  topicBreakdown,
  abilityLabel
) => {
  try {
    const topicText = Object.entries(topicBreakdown || {})
      .map(
        ([topic, data]) =>
          `${topic}: ${data.percent}% (${data.correct}/${data.total})`
      )
      .join(", ");

    const prompt = `You are an encouraging academic coach. Write a short personalised quiz feedback summary in 3-4 sentences.

Student: ${studentName}
Score: ${scorePercent}%
Level: ${abilityLabel}
Topic performance: ${topicText || "Not available"}

Be positive but honest. Mention specific topics to revise if score is below 70%. Keep it warm and motivating.`;

    return await ask(prompt);
  } catch (error) {
    console.error("Gemini generateFeedbackSummary error:", error.message);
    return `You scored ${scorePercent}%. Keep practising to improve your weaker areas!`;
  }
};

/**
 * Classify difficulty of a question on a scale of 1-5.
 * Used when teacher adds a question without setting difficulty.
 */
const classifyDifficulty = async (questionText, subject) => {
  try {
    const prompt = `You are a curriculum expert. Rate the difficulty of this ${subject} question on a scale of 1 to 5.
1 = very easy, 2 = easy, 3 = medium, 4 = hard, 5 = very hard.

Question: ${questionText}

Reply with ONLY a single digit number between 1 and 5. Nothing else.`;

    const response = await ask(prompt);
    const num = parseInt(response.replace(/\D/g, ""), 10);
    return num >= 1 && num <= 5 ? num : 3;
  } catch (error) {
    console.error("Gemini classifyDifficulty error:", error.message);
    return 3; // default to medium
  }
};

/**
 * Generate MCQ questions for a teacher.
 * Returns array of question objects ready to save in DB.
 */
const generateQuestions = async (topic, subject, difficulty, count = 5) => {
  try {
    const prompt = `You are an expert teacher. Generate exactly ${count} multiple-choice questions about "${topic}" in ${subject}.
Target difficulty: ${difficulty}/5 (1=very easy, 5=very hard).

Return ONLY a valid JSON array. No markdown, no explanation, no backticks.
Each object must have exactly these fields:
- "text": the question string
- "options": array of exactly 4 objects, each with "text" (string) and "isCorrect" (boolean). Exactly one must have isCorrect: true
- "explanation": one sentence explaining the correct answer
- "difficulty": number from 1 to 5

Example format:
[
  {
    "text": "What is 2+2?",
    "options": [
      {"text": "3", "isCorrect": false},
      {"text": "4", "isCorrect": true},
      {"text": "5", "isCorrect": false},
      {"text": "6", "isCorrect": false}
    ],
    "explanation": "2+2 equals 4 by basic addition.",
    "difficulty": 1
  }
]

Now generate ${count} questions about ${topic}:`;

    const response = await ask(prompt);

    // Strip any accidental markdown code fences
    const cleaned = response
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    const questions = JSON.parse(cleaned);

    if (!Array.isArray(questions)) {
      throw new Error("Gemini did not return an array");
    }

    return { success: true, questions };
  } catch (error) {
    console.error("Gemini generateQuestions error:", error.message);
    return { success: false, questions: [], error: error.message };
  }
};

module.exports = {
  generateHint,
  generateFeedbackSummary,
  classifyDifficulty,
  generateQuestions,
};
