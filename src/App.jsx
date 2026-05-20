import { useEffect, useMemo, useState } from "react";
import "./index.css";

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuote = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"' && insideQuote && next === '"') {
      cell += '"';
      i++;
    } else if (char === '"') {
      insideQuote = !insideQuote;
    } else if (char === "," && !insideQuote) {
      row.push(cell);
      cell = "";
    } else if ((char === "\n" || char === "\r") && !insideQuote) {
      if (cell || row.length) {
        row.push(cell);
        rows.push(row);
        row = [];
        cell = "";
      }
      if (char === "\r" && next === "\n") i++;
    } else {
      cell += char;
    }
  }

  if (cell || row.length) {
    row.push(cell);
    rows.push(row);
  }

  return rows;
}

export default function App() {
  const [questions, setQuestions] = useState([]);
  const [wrongNotes, setWrongNotes] = useState([]);
  const [year, setYear] = useState("전체 연도");
  const [subject, setSubject] = useState("전체 과목");
  const [mode, setMode] = useState("랜덤");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const savedQuestions = localStorage.getItem("law_ox_questions");
    const savedWrongNotes = localStorage.getItem("law_ox_wrong_notes");

    if (savedQuestions) setQuestions(JSON.parse(savedQuestions));
    if (savedWrongNotes) setWrongNotes(JSON.parse(savedWrongNotes));
  }, []);

  const handleCsvUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();

    reader.onload = (event) => {
      const text = event.target.result;
      const rows = parseCSV(text).filter((r) => r.length > 1);

      const headers = rows[0].map((h) => h.trim());
      const data = rows.slice(1).map((row) => {
        const obj = {};
        headers.forEach((header, index) => {
          obj[header] = row[index]?.trim() || "";
        });
        return obj;
      });

      setQuestions(data);
      localStorage.setItem("law_ox_questions", JSON.stringify(data));
    };

    reader.readAsText(file, "EUC-KR");
  };

  const years = useMemo(() => {
    return ["전체 연도", ...new Set(questions.map((q) => q.year).filter(Boolean))];
  }, [questions]);

  const subjects = useMemo(() => {
    return ["전체 과목", ...new Set(questions.map((q) => q.subject).filter(Boolean))];
  }, [questions]);

  const filteredQuestions = questions.filter((q) => {
    const yearMatch = year === "전체 연도" || q.year === year;
    const subjectMatch = subject === "전체 과목" || q.subject === subject;
    const searchMatch =
      search.trim() === "" ||
      q.question?.includes(search) ||
      q.structure?.includes(search) ||
      q.trap?.includes(search) ||
      q.summary?.includes(search);

    return yearMatch && subjectMatch && searchMatch;
  });

  const currentQuestion = filteredQuestions[0];

  return (
    <div className="app">
      <header className="top">
        <div>
          <h1>법무사 OX 회독앱</h1>
          <p>
            CSV를 올리면 연도별·과목별 랜덤 OX 학습, 해설 확인, 오답노트까지 바로 사용할 수 있습니다.
          </p>
        </div>

        <label className="upload-btn">
          ⬆ CSV 업로드
          <input type="file" accept=".csv" onChange={handleCsvUpload} />
        </label>
      </header>

      <section className="stats">
        <div className="card">
          <span>전체 문항</span>
          <strong>{questions.length}</strong>
        </div>

        <div className="card">
          <span>현재 필터</span>
          <strong>{filteredQuestions.length}</strong>
        </div>

        <div className="card">
          <span>오답노트</span>
          <strong>{wrongNotes.length}</strong>
        </div>

        <div className="card">
          <span>학습 방식</span>
          <div className="mode-box">
            <button
              className={mode === "랜덤" ? "active" : ""}
              onClick={() => setMode("랜덤")}
            >
              랜덤
            </button>
            <button
              className={mode === "순서" ? "active" : ""}
              onClick={() => setMode("순서")}
            >
              순서
            </button>
          </div>
        </div>
      </section>

      <main className="main">
        <section className="question-box">
          <div className="filters">
            <select value={year} onChange={(e) => setYear(e.target.value)}>
              {years.map((y) => (
                <option key={y}>{y}</option>
              ))}
            </select>

            <select value={subject} onChange={(e) => setSubject(e.target.value)}>
              {subjects.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>

            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="지문·해설 검색"
            />
          </div>

          <div className="question-area">
            {currentQuestion ? (
              <div>
                <p className="question-text">{currentQuestion.question}</p>
                <p className="answer-text">정답 : {currentQuestion.answer}</p>
              </div>
            ) : (
              <p>CSV 파일을 업로드하면 문제가 표시됩니다.</p>
            )}
          </div>
        </section>

        <aside className="wrong-box">
          <h2>☑ 오답노트</h2>
          <p>{wrongNotes.length === 0 ? "아직 오답이 없습니다." : `${wrongNotes.length}개 저장됨`}</p>
        </aside>
      </main>
    </div>
  );
}