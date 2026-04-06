import { useState } from "react";

const SYSTEM_PROMPT = `You are a trivia quiz master. Generate a multiple choice trivia question on any general knowledge topic (science, history, geography, sports, entertainment, food, nature, technology, etc).

Respond ONLY in JSON format with no extra text or markdown:
{
  "question": "The question text",
  "options": ["A) option1", "B) option2", "C) option3", "D) option4"],
  "answer": "A",
  "explanation": "Brief fun explanation of why this is correct (1-2 sentences)",
  "category": "Category name",
  "difficulty": "Easy" | "Medium" | "Hard"
}

Rules:
- Make questions interesting and varied across all topics
- Never repeat the same question
- The correct answer letter must match exactly one of the options
- Keep options roughly similar in length
- Make wrong answers plausible but clearly incorrect
- Difficulty should vary: mix Easy, Medium and Hard`;

const TOTAL_QUESTIONS = 10;

const categoryEmoji = {
  Science: "🔬", History: "📜", Geography: "🌍", Sports: "⚽",
  Entertainment: "🎬", Food: "🍕", Nature: "🌿", Technology: "💻",
  Music: "🎵", Art: "🎨", default: "🧠"
};

export default function TriviaQuiz() {
  const [phase, setPhase] = useState("start");
  const [question, setQuestion] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selected, setSelected] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [score, setScore] = useState(0);
  const [questionNum, setQuestionNum] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [history, setHistory] = useState([]);
  const [askedQuestions, setAskedQuestions] = useState([]);
