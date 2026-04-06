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
  const [askedQuestions, setAskedQuestions] = useState([]);const fetchQuestion = async () => {
    setLoading(true);
    setSelected(null);
    setRevealed(false);
    try {
      const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: SYSTEM_PROMPT,
          messages: [{
            role: "user",
            content: `Generate a unique trivia question. Previously asked topics to avoid: ${askedQuestions.slice(-5).join(", ") || "none"}`
          }]
        })
      });
      const data = await response.json();
      const text = data.content?.[0]?.text || "{}";
      const clean = text.replace(/```json|```/g, "").trim();
      const parsed = JSON.parse(clean);
      setQuestion(parsed);
      setAskedQuestions(prev => [...prev, parsed.category]);
    } catch {
      setQuestion(null);
    }
    setLoading(false);
  };

  const startGame = async () => {
    setScore(0);
    setQuestionNum(1);
    setStreak(0);
    setBestStreak(0);
    setHistory([]);
    setAskedQuestions([]);
    setPhase("playing");
    await fetchQuestion();
  };

  const handleSelect = (opt) => {
    if (revealed || loading) return;
    setSelected(opt);
  };

  const handleReveal = () => {
    if (!selected || revealed) return;
    setRevealed(true);
    const letter = selected.split(")")[0].trim();
    const correct = letter === question.answer;
    const points = correct ? (question.difficulty === "Hard" ? 30 : question.difficulty === "Medium" ? 20 : 10) : 0;
    const newStreak = correct ? streak + 1 : 0;
    setStreak(newStreak);
    setBestStreak(prev => Math.max(prev, newStreak));
    setScore(prev => prev + points);
    setHistory(prev => [...prev, { question: question.question, correct, category: question.category }]);
  };

  const handleNext = async () => {
    if (questionNum >= TOTAL_QUESTIONS) {
      setPhase("result");
      return;
    }
    setQuestionNum(prev => prev + 1);
    await fetchQuestion();
  };

  const getOptionStyle = (opt) => {
    const letter = opt.split(")")[0].trim();
    const isSelected = selected === opt;
    const isCorrect = letter === question?.answer;
    if (!revealed) {
      return {
        ...styles.option,
        background: isSelected ? "rgba(100,180,255,0.15)" : "rgba(255,255,255,0.03)",
        borderColor: isSelected ? "rgba(100,180,255,0.6)" : "rgba(255,255,255,0.1)",
        color: isSelected ? "#88ccff" : "rgba(255,255,255,0.8)",
      };
    }
    if (isCorrect) return { ...styles.option, background: "rgba(0,220,100,0.15)", borderColor: "#00dc64", color: "#00ff88" };
    if (isSelected && !isCorrect) return { ...styles.option, background: "rgba(255,50,80,0.15)", borderColor: "#ff3350", color: "#ff6680" };
    return { ...styles.option, opacity: 0.4 };
  };

  const emoji = categoryEmoji[question?.category] || categoryEmoji.default;
  const correctCount = history.filter(h => h.correct).length;
  const grade = correctCount >= 9 ? "S" : correctCount >= 7 ? "A" : correctCount >= 5 ? "B" : correctCount >= 3 ? "C" : "D";
  const gradeColor = { S: "#ffd700", A: "#00ff88", B: "#4488ff", C: "#ffaa00", D: "#ff3355" }[grade];

  if (phase === "start") return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={styles.bigEmoji}>🧠</div>
        <h1 style={styles.title}>TRIVIA MASTER</h1>
        <p style={styles.sub}>AI-Generated General Knowledge Quiz</p>
        <div style={styles.infoRow}>
          {["10 Questions", "Mixed Topics", "AI Powered"].map(t => (
            <span key={t} style={styles.badge}>{t}</span>
          ))}
        </div>
        <div style={styles.pointsInfo}>
          <div style={styles.pointRow}><span>🟢 Easy</span><span>10 pts</span></div>
          <div style={styles.pointRow}><span>🟡 Medium</span><span>20 pts</span></div>
          <div style={styles.pointRow}><span>🔴 Hard</span><span>30 pts</span></div>
        </div>
        <button onClick={startGame} style={styles.startBtn}>🚀 Start Quiz</button>
      </div>
      <style>{css}</style>
    </div>
  );

  if (phase === "result") return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={{ fontSize: 56, marginBottom: 8 }}>{grade === "S" ? "🏆" : grade === "A" ? "🌟" : grade === "B" ? "👏" : "💪"}</div>
        <h2 style={{ ...styles.title, color: gradeColor }}>GRADE {grade}</h2>
        <p style={styles.sub}>Quiz Complete!</p>
        <div style={styles.scoreCircle}>
          <div style={{ fontSize: 36, fontWeight: "bold", color: gradeColor }}>{score}</div>
          <div style={{ color: "rgba(255,255,255,0.4)", fontSize: 12 }}>points</div>
        </div>
        <div style={styles.statsGrid}>
          <div style={styles.statItem}><div style={styles.statNum}>{correctCount}/{TOTAL_QUESTIONS}</div><div style={styles.statLbl}>Correct</div></div>
          <div style={styles.statItem}><div style={styles.statNum}>{bestStreak}🔥</div><div style={styles.statLbl}>Best Streak</div></div>
        </div>
        <div style={{ width: "100%", marginBottom: 20 }}>
          {history.map((h, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
              <span>{h.correct ? "✅" : "❌"}</span>
              <span style={{ color: "rgba(255,255,255,0.5)", fontSize: 11, flex: 1, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.question}</span>
              <span style={{ fontSize: 10, color: "rgba(255,255,255,0.3)" }}>{categoryEmoji[h.category] || "🧠"}</span>
            </div>
          ))}
        </div>
        <button onClick={startGame} style={styles.startBtn}>🔄 Play Again</button>
      </div>
      <style>{css}</style>
    </div>return (
    <div style={styles.root}>
      <div style={styles.card}>
        <div style={styles.progressRow}>
          <span style={styles.qNum}>Q{questionNum}/{TOTAL_QUESTIONS}</span>
          <div style={styles.progressBg}>
            <div style={{ ...styles.progressFill, width: `${((questionNum - 1) / TOTAL_QUESTIONS) * 100}%` }} />
          </div>
          <span style={styles.scoreDisplay}>⭐ {score}</span>
        </div>
        {streak >= 2 && <div style={styles.streakBanner}>🔥 {streak} Streak!</div>}
        {loading ? (
          <div style={styles.loadingBox}>
            <div style={styles.spinner} />
            <p style={{ color: "rgba(255,255,255,0.4)", marginTop: 16, fontSize: 13 }}>Generating question...</p>
          </div>
        ) : question ? (
          <>
            <div style={styles.metaRow}>
              <span style={styles.catBadge}>{emoji} {question.category}</span>
              <span style={{
                ...styles.diffBadge,
                color: question.difficulty === "Hard" ? "#ff6680" : question.difficulty === "Medium" ? "#ffaa44" : "#00cc66",
                borderColor: question.difficulty === "Hard" ? "#ff3355" : question.difficulty === "Medium" ? "#ff8800" : "#00aa44",
              }}>{question.difficulty}</span>
            </div>
            <p style={styles.questionText}>{question.question}</p>
            <div style={styles.optionsGrid}>
              {question.options?.map((opt, i) => (
                <button key={i} onClick={() => handleSelect(opt)} style={getOptionStyle(opt)}>{opt}</button>
              ))}
            </div>
            {revealed && (
              <div style={styles.explanation}>
                <span style={{ fontSize: 16 }}>{selected?.split(")")[0].trim() === question.answer ? "✅" : "❌"}</span>
                <p style={{ margin: 0, fontSize: 13, color: "rgba(255,255,255,0.7)", lineHeight: 1.6 }}>{question.explanation}</p>
              </div>
            )}
            <div style={{ display: "flex", gap: 10, width: "100%", marginTop: 8 }}>
              {!revealed ? (
                <button onClick={handleReveal} disabled={!selected} style={{
                  ...styles.actionBtn,
                  opacity: selected ? 1 : 0.4,
                  cursor: selected ? "pointer" : "not-allowed",
                  background: "linear-gradient(135deg, rgba(100,180,255,0.2), rgba(60,100,255,0.15))",
                  borderColor: "rgba(100,180,255,0.4)",
                  color: "#88ccff",
                }}>Check Answer</button>
              ) : (
                <button onClick={handleNext} style={{
                  ...styles.actionBtn,
                  background: "linear-gradient(135deg, rgba(0,200,100,0.2), rgba(0,150,80,0.15))",
                  borderColor: "rgba(0,200,100,0.4)",
                  color: "#00ee77",
                }}>{questionNum >= TOTAL_QUESTIONS ? "See Results 🏆" : "Next Question →"}</button>
              )}
            </div>
          </>
        ) : (
          <p style={{ color: "rgba(255,100,100,0.7)" }}>Failed to load question. Try again.</p>
        )}
      </div>
      <style>{css}</style>
    </div>
  );
}

const css = `
  @keyframes spin { to { transform: rotate(360deg); } }
  @keyframes fadeIn { from { opacity:0; transform:translateY(6px); } to { opacity:1; transform:translateY(0); } }
  @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.5; } }
`;

const styles = {
  root: { minHeight: "100vh", background: "linear-gradient(135deg, #050510 0%, #0a0520 50%, #050510 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16, fontFamily: "'Segoe UI', Tahoma, sans-serif" },
  card: { width: "100%", maxWidth: 480, background: "rgba(15,12,30,0.97)", border: "1px solid rgba(120,100,255,0.2)", borderRadius: 20, padding: "28px 24px", boxShadow: "0 0 60px rgba(80,60,255,0.08), 0 20px 60px rgba(0,0,0,0.8)", display: "flex", flexDirection: "column", alignItems: "center", gap: 16, animation: "fadeIn 0.4s ease" },
  bigEmoji: { fontSize: 64, lineHeight: 1 },
  title: { fontSize: 28, fontWeight: "900", color: "#a080ff", letterSpacing: 4, margin: 0, textAlign: "center" },
  sub: { color: "rgba(255,255,255,0.4)", fontSize: 13, margin: 0, letterSpacing: 1 },
  infoRow: { display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "center" },
  badge: { padding: "4px 12px", borderRadius: 20, background: "rgba(120,100,255,0.15)", border: "1px solid rgba(120,100,255,0.3)", color: "#c0b0ff", fontSize: 11, letterSpacing: 1 },
  pointsInfo: { width: "100%", background: "rgba(255,255,255,0.03)", borderRadius: 10, padding: "12px 16px", display: "flex", flexDirection: "column", gap: 6 },
  pointRow: { display: "flex", justifyContent: "space-between", color: "rgba(255,255,255,0.6)", fontSize: 13 },
  startBtn: { padding: "14px 32px", borderRadius: 10, border: "1px solid rgba(120,100,255,0.5)", background: "linear-gradient(135deg, rgba(120,80,255,0.25), rgba(80,50,200,0.15))", color: "#c0b0ff", fontSize: 16, fontWeight: "bold", cursor: "pointer", letterSpacing: 1, width: "100%", fontFamily: "inherit" },
  progressRow: { display: "flex", alignItems: "center", gap: 10, width: "100%" },
  qNum: { color: "rgba(255,255,255,0.5)", fontSize: 12, whiteSpace: "nowrap" },
  progressBg: { flex: 1, height: 4, background: "rgba(255,255,255,0.08)", borderRadius: 2, overflow: "hidden" },
  progressFill: { height: "100%", background: "linear-gradient(90deg, #7050ff, #a080ff)", borderRadius: 2, transition: "width 0.4s ease" },
  scoreDisplay: { color: "#a080ff", fontSize: 13, fontWeight: "bold", whiteSpace: "nowrap" },
  streakBanner: { background: "rgba(255,140,0,0.15)", border: "1px solid rgba(255,140,0,0.3)", color: "#ffaa44", borderRadius: 20, padding: "4px 16px", fontSize: 13, fontWeight: "bold", animation: "pulse 1s infinite" },
  metaRow: { display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" },
  catBadge: { color: "rgba(255,255,255,0.5)", fontSize: 12 },
  diffBadge: { fontSize: 11, border: "1px solid", borderRadius: 20, padding: "2px 10px" },
  questionText: { color: "#fff", fontSize: 16, lineHeight: 1.7, textAlign: "center", margin: 0, fontWeight: "500" },
  optionsGrid: { display: "flex", flexDirection: "column", gap: 8, width: "100%" },
  option: { padding: "12px 16px", borderRadius: 10, border: "1px solid", textAlign: "left", cursor: "pointer", fontSize: 14, fontFamily: "inherit", transition: "all 0.2s", lineHeight: 1.5 },
  explanation: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 10, padding: "12px 14px", display: "flex", gap: 10, alignItems: "flex-start", width: "100%", animation: "fadeIn 0.3s ease" },
  actionBtn: { flex: 1, padding: "13px", borderRadius: 10, border: "1px solid", fontSize: 14, fontWeight: "bold", cursor: "pointer", fontFamily: "inherit" },
  loadingBox: { display: "flex", flexDirection: "column", alignItems: "center", padding: "40px 0" },
  spinner: { width: 40, height: 40, border: "3px solid rgba(120,100,255,0.2)", borderTop: "3px solid #a080ff", borderRadius: "50%", animation: "spin 0.8s linear infinite" },
  scoreCircle: { background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "50%", width: 100, height: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" },
  statsGrid: { display: "flex", gap: 16, width: "100%" },
  statItem: { flex: 1, background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: "14px", textAlign: "center" },
  statNum: { fontSize: 24, fontWeight: "bold", color: "#a080ff" },
  statLbl: { color: "rgba(255,255,255,0.4)", fontSize: 11, marginTop: 4 },
};
  );
