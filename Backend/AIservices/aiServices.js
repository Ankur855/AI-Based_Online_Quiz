const OpenAI = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generate a hint for a student who is stuck on a question.
 * Uses GPT to give a nudge without revealing the answer.
 */
const generateHint = async (questionText, options = []) => {
  try {
    const optionsText = options.map((o, i) => `${i + 1}. ${o.text}`).join("\n");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini", // cheap + fast — good for production
      max_tokens: 150,
      messages: [
        {
          role: "system",
          content:
            "You are a helpful tutor. Give a short hint to help a student answer the question without revealing the answer. Be encouraging and concise (2–3 sentences max).",
        },
        {
          role: "user",
          content: `Question: ${questionText}\nOptions:\n${optionsText}\n\nGive a hint:`,
        },
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI generateHint error:", error.message);
    return "Think carefully about the key concepts related to this question.";
  }
};

/**
 * Generate a quiz end summary for a student.
 * Tells them what they did well, what to revise.
 */
const generateFeedbackSummary = async (
  studentName,
  scorePercent,
  topicBreakdown,
  abilityLabel
) => {
  try {
    const topicText = Object.entries(topicBreakdown)
      .map(
        ([topic, data]) =>
          `${topic}: ${data.percent}% (${data.correct}/${data.total})`
      )
      .join(", ");

    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 200,
      messages: [
        {
          role: "system",
          content:
            "You are an encouraging academic coach. Write a short personalised quiz feedback summary (3–4 sentences). Be positive but honest. Suggest specific revision areas.",
        },
        {
          role: "user",
          content: `Student: ${studentName}. Score: ${scorePercent}%. Level: ${abilityLabel}. Topic breakdown: ${topicText}. Write a feedback summary:`,
        },
      ],
    });

    return response.choices[0].message.content.trim();
  } catch (error) {
    console.error("OpenAI generateFeedbackSummary error:", error.message);
    return `You scored ${scorePercent}%. Keep practising to improve your weaker areas!`;
  }
};

/**
 * Classify difficulty of a question (1–5) using AI.
 * Useful when teachers add new questions without setting difficulty manually.
 */
const classifyDifficulty = async (questionText, subject) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 10,
      messages: [
        {
          role: "system",
          content:
            "You are a curriculum expert. Rate the difficulty of the following question on a scale of 1 to 5 where 1=very easy, 3=medium, 5=very hard. Reply with ONLY a single number.",
        },
        {
          role: "user",
          content: `Subject: ${subject}\nQuestion: ${questionText}`,
        },
      ],
    });

    const num = parseInt(response.choices[0].message.content.trim());
    if (num >= 1 && num <= 5) return num;
    return 3; // default to medium if invalid
  } catch (error) {
    console.error("OpenAI classifyDifficulty error:", error.message);
    return 3;
  }
};

/**
 * Generate questions for a teacher.
 * Returns array of question objects ready for saving.
 */
const generateQuestions = async (topic, subject, difficulty, count = 5) => {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      max_tokens: 1500,
      messages: [
        {
          role: "system",
          content: `You are an expert teacher. Generate exactly ${count} multiple-choice questions for a quiz.
Return ONLY a valid JSON array. Each object must have:
- "text": question string
- "options": array of 4 objects with "text" (string) and "isCorrect" (boolean), exactly one isCorrect=true
- "explanation": brief explanation of the correct answer (1–2 sentences)
- "difficulty": number 1–5`,
        },
        {
          role: "user",
          content: `Topic: ${topic}, Subject: ${subject}, Target difficulty: ${difficulty}/5. Generate ${count} MCQ questions.`,
        },
      ],
    });

    const content = response.choices[0].message.content.trim();
    // Strip markdown code fences if present
    const cleaned = content.replace(/```json|```/g, "").trim();
    const questions = JSON.parse(cleaned);
    return { success: true, questions };
  } catch (error) {
    console.error("OpenAI generateQuestions error:", error.message);
    return { success: false, questions: [], error: error.message };
  }
};

module.exports = {
  generateHint,
  generateFeedbackSummary,
  classifyDifficulty,
  generateQuestions,
};
