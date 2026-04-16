"use client";

import { useState, useEffect } from "react";

interface DiaryEntry {
  datetime: string;
  diary: string;
}

export default function Home() {
  const [diaryText, setDiaryText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [sentiment, setSentiment] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  // 일기 목록 모달 관련 상태
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [diaryList, setDiaryList] = useState<DiaryEntry[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(false);

  // 헤더에 표시될 날짜 정보
  const [headerDate, setHeaderDate] = useState("");
  const [headerDay, setHeaderDay] = useState("");

  // 초기 날짜 설정
  useEffect(() => {
    const today = new Date();
    setHeaderDate(today.toLocaleDateString("ko-KR", { month: "long", day: "numeric" }));
    setHeaderDay(today.toLocaleDateString("ko-KR", { weekday: "long", hour: "numeric", minute: "2-digit" }));
  }, []);

  // AI 감정 분석
  const handleAnalyze = async () => {
    if (!diaryText.trim()) return;
    setIsAnalyzing(true);
    setResult("");
    setSentiment(null);
    try {
      const response = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: diaryText }),
      });
      if (!response.ok) throw new Error("Analysis failed");
      const data = await response.json();
      setResult(data.analysis);
      setSentiment(data.sentimentIndex);
    } catch (error) {
      console.error(error);
      setResult("죄송합니다. 분석 중 오류가 발생했습니다.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // 구글 시트 저장
  const handleSave = async () => {
    if (!diaryText.trim()) return;
    const gasUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
    if (!gasUrl) {
      alert(".env.local 파일에 NEXT_PUBLIC_APPS_SCRIPT_URL을 설정해 주세요!");
      return;
    }
    setIsSaving(true);
    try {
      await fetch(gasUrl, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify({
          datetime: new Date().toLocaleString("ko-KR"),
          diary: diaryText,
        }),
      });
      alert("일기가 구글 시트에 성공적으로 저장되었습니다!");
      setDiaryText("");
      setResult("");
      setSentiment(null);
      // 저장 후 목록 갱신을 위해 모달이 닫혀있더라도 데이터는 초기화하지 않음
    } catch (error) {
      console.error("Save Error:", error);
      alert("저장 중 오류가 발생했습니다.");
    } finally {
      setIsSaving(false);
    }
  };

  // 일기 목록 가져오기
  const handleOpenList = async () => {
    const gasUrl = process.env.NEXT_PUBLIC_APPS_SCRIPT_URL;
    if (!gasUrl) return alert("URL이 설정되지 않았습니다.");

    setIsModalOpen(true);
    setIsLoadingList(true);
    try {
      const response = await fetch(gasUrl);
      const data = await response.json();
      setDiaryList(data);
    } catch (error) {
      console.error("Fetch List Error:", error);
    } finally {
      setIsLoadingList(false);
    }
  };

  // 특정 일기 선택 시 메인 화면에 적용
  const handleSelectDiary = (entry: DiaryEntry) => {
    setDiaryText(entry.diary);
    
    // 날짜 형식 분리 시도 (일반적으로 "2026. 4. 16. 오후 2:00:00" 형태)
    try {
      const parts = entry.datetime.split(". ");
      if (parts.length >= 3) {
        setHeaderDate(`${parts[1]}월 ${parts[2]}일`);
        setHeaderDay(`${entry.datetime.split(" ").slice(3).join(" ")}`);
      } else {
        setHeaderDate(entry.datetime);
      }
    } catch (e) {
      setHeaderDate(entry.datetime);
    }

    setResult(""); // 기존 분석 결과 초기화
    setSentiment(null);
    setIsModalOpen(false);
  };

  const sentiments = [
    { emoji: "😸", label: "행복" }, { emoji: "😿", label: "슬픔" },
    { emoji: "😾", label: "분노" }, { emoji: "🙀", label: "놀람" },
    { emoji: "😽", label: "평온" },
  ];

  return (
    <div 
      className="relative min-h-screen flex items-center justify-center p-6 text-[#1e293b] bg-cover bg-center bg-no-repeat overflow-hidden font-sans"
      style={{ backgroundImage: "url('/background.png')" }}
    >
      <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]"></div>

      <div className="w-full max-w-xl flex flex-col gap-6 relative z-10 transition-all">
        {/* Header */}
        <div className="flex justify-between items-end drop-shadow-md">
          <div className="bg-white/30 backdrop-blur-md p-5 rounded-[2rem] border border-white/40">
            <h1 className="text-4xl font-black tracking-tight text-[#2d3a54]">{headerDate}</h1>
            <p className="text-[#4b5563] mt-1 font-bold">{headerDay}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-xl border border-white/50 shadow-sm text-sm font-bold text-gray-500 hover:bg-white transition-all"
              >
                <span>🔄</span> 재시작
              </button>
              <button 
                onClick={handleOpenList}
                className="flex items-center gap-2 px-4 py-2 bg-white/80 backdrop-blur rounded-xl border border-white/50 shadow-sm text-sm font-bold text-[#4f46e5] hover:bg-white transition-all"
              >
                <span>📖</span> 일기 목록
              </button>
            </div>
          </div>
        </div>

        {/* Input Area */}
        <div className="bg-white/85 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 border border-white/50 min-h-[380px] flex flex-col">
          <textarea
            value={diaryText}
            onChange={(e) => setDiaryText(e.target.value)}
            placeholder="오늘의 소소한 일상을 적어보세요..."
            className="flex-1 w-full bg-transparent border-none focus:ring-0 text-xl placeholder-gray-400 resize-none font-medium leading-relaxed outline-none"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !diaryText.trim()}
              className={`px-8 py-4 rounded-2xl text-white font-black shadow-xl transition-all ${
                isAnalyzing || !diaryText.trim() ? "bg-gray-400" : "bg-indigo-600 hover:bg-indigo-700 active:scale-95"
              }`}
            >
              {isAnalyzing ? "🧐 분석 중..." : "✨ AI 감정 분석"}
            </button>
          </div>
        </div>

        {/* Sentiment */}
        <div className="bg-white/50 backdrop-blur-xl rounded-[2rem] shadow-xl p-5 border border-white/40 flex justify-between">
          {sentiments.map((item, idx) => (
            <div
              key={idx}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all shadow-sm ${
                sentiment === idx ? "scale-125 bg-white shadow-md ring-4 ring-indigo-500/20 grayscale-0" : "grayscale opacity-30 bg-white/20"
              }`}
            >
              {item.emoji}
            </div>
          ))}
        </div>

        {/* Result Area */}
        {result && (
          <div className="bg-white/95 backdrop-blur-2xl rounded-[2.5rem] p-8 border border-white/50 shadow-2xl animate-in fade-in slide-in-from-bottom-8">
            <h3 className="text-indigo-600 font-black text-xl mb-4">🤖 AI의 따뜻한 한마디</h3>
            <p className="text-lg leading-relaxed text-[#2d3a54] font-semibold">{result}</p>
            <div className="flex justify-end pt-4 mt-6 border-t border-gray-100">
              <button
                onClick={handleSave}
                disabled={isSaving}
                className={`px-10 py-4 rounded-2xl font-black text-white shadow-xl active:scale-95 ${
                  isSaving ? "bg-gray-500" : "bg-gray-900 hover:bg-black"
                }`}
              >
                {isSaving ? "⏳ 저장 중..." : "💾 구글 시트에 저장하기"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Diary List Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setIsModalOpen(false)}></div>
          <div className="bg-white/90 backdrop-blur-2xl w-full max-w-lg rounded-[2.5rem] shadow-3xl relative z-10 flex flex-col max-h-[80vh] border border-white">
            <div className="p-8 border-b border-gray-100 flex justify-between items-center">
              <h2 className="text-2xl font-black text-[#1e293b]">과거의 기록들</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-2xl opacity-50 hover:opacity-100">✕</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
              {isLoadingList ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-400 font-bold">
                  <div className="animate-spin text-3xl mb-2">⏳</div>
                  기록을 불러오는 중...
                </div>
              ) : diaryList.length === 0 ? (
                <div className="text-center py-20 text-gray-400 font-bold">저장된 일기가 없습니다. 😿</div>
              ) : (
                diaryList.map((entry, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelectDiary(entry)}
                    className="w-full text-left bg-white/50 hover:bg-white p-6 rounded-3xl border border-gray-100 shadow-sm transition-all hover:translate-y-[-2px] active:scale-95 group"
                  >
                    <div className="text-xs font-black text-indigo-500 mb-2 uppercase tracking-wider">{entry.datetime}</div>
                    <div className="text-[#2d3a54] font-medium line-clamp-2 leading-relaxed">{entry.diary}</div>
                    <div className="mt-3 text-xs text-gray-300 font-bold group-hover:text-indigo-400 transition-colors">클릭하여 불러오기 →</div>
                  </button>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
