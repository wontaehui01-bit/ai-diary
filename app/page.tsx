"use client";

import { useState } from "react";

export default function Home() {
  const [diaryText, setDiaryText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState("");
  const [sentiment, setSentiment] = useState<number | null>(null);

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
      setResult("죄송합니다. 분석 중 오류가 발생했습니다. 다시 시도해 주세요.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleRestart = () => {
    if (confirm("일기를 초기화하고 다시 작성할까요?")) {
      setDiaryText("");
      setResult("");
      setSentiment(null);
    }
  };

  const handleSave = () => {
    alert("일기가 성공적으로 저장되었습니다!");
  };

  const sentiments = [
    { emoji: "😸", label: "행복" },
    { emoji: "😿", label: "슬픔" },
    { emoji: "😾", label: "분노" },
    { emoji: "🙀", label: "놀람" },
    { emoji: "😽", label: "평온" },
  ];

  return (
    <div className="min-h-screen bg-[#f1f5f9] flex items-center justify-center p-6 text-[#1e293b]">
      <div className="w-full max-w-xl flex flex-col gap-6">
        
        {/* Header Area */}
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-extrabold tracking-tight text-[#2d3a54]">4월 9일</h1>
            <p className="text-[#64748b] mt-1 font-medium">목요일 • 오후 12:02</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex gap-2">
              <button
                onClick={handleRestart}
                className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-sm font-semibold text-gray-500 hover:bg-gray-50 transition-all"
              >
                <span>🔄</span> 재시작
              </button>
              <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-gray-100 shadow-sm text-sm font-semibold text-[#4f46e5] hover:bg-gray-50 transition-all">
                <span>📖</span> 일기 목록
              </button>
            </div>
            <h2 className="text-xl font-bold text-[#2d3a54]">오늘의 일기 회고</h2>
          </div>
        </div>

        {/* Diary Input Area */}
        <div className="bg-white rounded-[2rem] shadow-sm p-8 relative flex flex-col border border-gray-100 min-h-[400px]">
          <textarea
            value={diaryText}
            onChange={(e) => setDiaryText(e.target.value)}
            placeholder="오늘 하루는 어떠셨나요? 당신의 마음을 들려주세요."
            className="flex-1 w-full bg-transparent border-none focus:ring-0 text-lg placeholder-gray-300 resize-none leading-relaxed outline-none"
          />
          <div className="flex justify-end mt-4">
            <button
              onClick={handleAnalyze}
              disabled={isAnalyzing || !diaryText.trim()}
              className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-white font-bold transition-all shadow-lg ${
                isAnalyzing || !diaryText.trim() 
                ? "bg-gray-300 cursor-not-allowed" 
                : "bg-[#7c5eff] hover:bg-[#6b4ef1] hover:translate-y-[-2px] active:translate-y-[0px]"
              }`}
            >
              <span className="text-lg">✨</span>
              {isAnalyzing ? "분석 중..." : "AI 분석하기"}
            </button>
          </div>
        </div>

        {/* Sentiment Emoji Area */}
        <div className="bg-white/60 backdrop-blur-md rounded-[2rem] shadow-sm p-4 border border-white/50 flex justify-around items-center h-24">
          {sentiments.map((item, idx) => (
            <div
              key={idx}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-3xl transition-all duration-500 bg-white/40 shadow-inner ${
                sentiment === idx 
                ? "scale-125 bg-white shadow-md ring-4 ring-[#7c5eff]/10 grayscale-0" 
                : "grayscale opacity-40"
              }`}
            >
              {item.emoji}
            </div>
          ))}
        </div>

        {/* AI Analysis Result Area */}
        {result && (
          <div className="bg-white rounded-[2rem] p-8 border border-gray-100 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-700 flex flex-col gap-4">
            <div>
              <h3 className="text-[#7c5eff] font-bold mb-3 flex items-center gap-2">
                <span>🤖</span> AI 분석 결과
              </h3>
              <p className="text-lg leading-relaxed text-[#2d3a54] font-medium">
                {result}
              </p>
            </div>
            <div className="flex justify-end border-t border-gray-50 pt-4 mt-2">
              <button
                onClick={handleSave}
                className="flex items-center gap-2 px-8 py-3 bg-[#1e293b] text-white rounded-2xl font-bold hover:bg-[#0f172a] transition-all shadow-md active:scale-95"
              >
                <span>💾</span> 일기 저장하기
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
