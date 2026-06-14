import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Pill, ClipboardList, Sparkles, MessageCircle, RefreshCw, 
  Trash2, ShieldCheck, HeartPulse, Search, PlusCircle, ArrowRight, ExternalLink 
} from "lucide-react";

import { MedicationHistoryItem } from "./types";
import PrescriptionAnalyzer from "./components/PrescriptionAnalyzer";
import PillScanner from "./components/PillScanner";
import MedicationReminders from "./components/MedicationReminders";
import AIConsultant from "./components/AIConsultant";
import InteractiveReportShowcase from "./components/InteractiveReportShowcase";

export default function App() {
  const [activeTab, setActiveTab] = useState<"prescription" | "pill" | "scheduler">("prescription");
  const [history, setHistory] = useState<MedicationHistoryItem[]>([]);
  
  // AI Consultant sidebar states
  const [isAIConsultantOpen, setIsAIConsultantOpen] = useState(false);
  const [aiContext, setAiContext] = useState<any>(null);

  // Load history on mount
  useEffect(() => {
    const savedHistory = localStorage.getItem("snapill_history");
    if (savedHistory) {
      setHistory(JSON.parse(savedHistory));
    } else {
      // Add first introductory mock history item
      const initialHistory: MedicationHistoryItem[] = [
        {
          id: "hist-init-1",
          timestamp: new Date().toLocaleString("ko-KR"),
          type: "pill",
          title: "S00 센트룸 활력 멀티콤플렉스 (가이드 참고용)"
        }
      ];
      setHistory(initialHistory);
      localStorage.setItem("snapill_history", JSON.stringify(initialHistory));
    }
  }, []);

  const handleAddHistory = (title: string, data: any) => {
    const isPill = 'pillName' in data;
    const newItem: MedicationHistoryItem = {
      id: `hist-${Date.now()}`,
      timestamp: new Date().toLocaleString("ko-KR"),
      type: isPill ? "pill" : "prescription",
      title: title,
      prescriptionData: isPill ? undefined : data,
      pillData: isPill ? data : undefined
    };

    const updated = [newItem, ...history].slice(0, 10); // Limit to top 10 items
    setHistory(updated);
    localStorage.setItem("snapill_history", JSON.stringify(updated));
    setAiContext(data); // Pre-load as next chatbot consultation context
  };

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem("snapill_history");
  };

  const triggerAIChatWithContext = (contextItem: any, questionString?: string) => {
    setAiContext(contextItem);
    setIsAIConsultantOpen(true);
  };

  return (
    <div className="min-h-screen flex flex-col justify-between font-sans relative antialiased text-slate-800 bg-[#f8fafc] grid-paper selection:bg-blue-100 selection:text-blue-950">
      
      {/* 🧭 NAVIGATION HEADER */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200/80 shadow-xs px-4 md:px-8 py-3.5">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
          
          {/* Brand Logo & Slogan */}
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/25">
              <Pill className="w-5.5 h-5.5" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-bold font-display tracking-tight text-slate-800">snapill<span className="text-blue-600">.</span></span>
                <span className="text-[10px] bg-blue-50 text-blue-600 font-extrabold px-1.5 py-0.5 rounded-full leading-none">스냅필</span>
              </div>
              <p className="text-[9px] text-slate-400 font-medium">스마트 알약 식별 및 처방 가이드</p>
            </div>
          </div>

          {/* Tab Navigation Controls */}
          <nav className="hidden md:flex items-center gap-1.5 bg-slate-50 p-1.5 rounded-full border border-slate-200/55 shadow-2xs">
            <button
              onClick={() => setActiveTab("prescription")}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "prescription" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              처방전 사진 분석
            </button>
            <button
              onClick={() => setActiveTab("pill")}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "pill" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              }`}
            >
              <Pill className="w-3.5 h-3.5" />
              알약 앞뒤 식별기
            </button>
            <button
              onClick={() => setActiveTab("scheduler")}
              className={`px-5 py-2 text-xs font-bold rounded-full transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "scheduler" 
                  ? "bg-blue-600 text-white shadow-sm" 
                  : "text-slate-500 hover:text-slate-800 hover:bg-white"
              }`}
            >
              <ClipboardList className="w-3.5 h-3.5" />
              내 복약 수첩
            </button>
          </nav>

          {/* Utility Quick Button */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsAIConsultantOpen(!isAIConsultantOpen)}
              className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-full shadow-md shadow-blue-500/10 transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5" />
              <span>AI 약사 상담소</span>
            </button>
          </div>
        </div>
      </header>

      {/* 📱 MOBILE NAVIGATION BAR */}
      <div className="md:hidden sticky top-14.5 z-45 bg-white border-b border-slate-200 p-2 flex gap-1 justify-around">
        <button
          onClick={() => setActiveTab("prescription")}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeTab === "prescription" ? "bg-blue-50 text-blue-600" : "text-slate-500"
          }`}
        >
          <FileText className="w-4 h-4" />
          처방전
        </button>
        <button
          onClick={() => setActiveTab("pill")}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeTab === "pill" ? "bg-blue-50 text-blue-600" : "text-slate-500"
          }`}
        >
          <Pill className="w-4 h-4" />
          알약 식별
        </button>
        <button
          onClick={() => setActiveTab("scheduler")}
          className={`flex-1 py-2 text-[11px] font-bold rounded-lg transition-all flex flex-col items-center justify-center gap-1 cursor-pointer ${
            activeTab === "scheduler" ? "bg-blue-50 text-blue-600" : "text-slate-500"
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          복약 수첩
        </button>
      </div>

      {/* 🚀 MAIN BODY DASHBOARD */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 md:px-8 py-4 md:py-8 space-y-12">
        
        {/* 🏥 CLINICAL HIGH-TECH HERO BANNER */}
        <section className="bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 text-white rounded-[24px] p-6 md:p-10 shadow-xl relative overflow-hidden border border-slate-800">
          {/* Glowing blue/teal orbs */}
          <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-10 left-10 w-44 h-44 bg-blue-600/10 rounded-full blur-2xl pointer-events-none" />

          <div className="max-w-2xl space-y-4 relative z-10">
            <span className="inline-block px-4 py-1.5 bg-blue-500/20 text-blue-400 rounded-full text-xs font-bold tracking-wider uppercase">
              Advanced AI Pill Recognition & Prescription Analysis
            </span>
            <h1 className="text-3xl md:text-5xl font-display font-black tracking-tight leading-tight md:leading-snug">
              처방전과 알약,<br/>
              <span className="text-blue-500 font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-teal-400">스냅 한 번</span>으로 복용 안심 대조
            </h1>
            <p className="text-xs md:text-sm text-slate-300 font-medium leading-relaxed">
              복잡하고 알기 어려웠던 처방 조제 정보와 낱개 알약의 실물을 전공 약학 데이터 모델링(Gemini V2 API)으로 즉시 대조 분석합니다. 어떤 약이든 스냅하세요!
            </p>

            <div className="flex gap-2.5 pt-2">
              <button 
                onClick={() => {
                  setActiveTab("prescription");
                  setTimeout(() => {
                    document.getElementById("tabs-mount-anchor")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }} 
                className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 font-bold text-xs text-white rounded-xl shadow-lg shadow-blue-500/25 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <span>처방전 사진 분석하기</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button 
                onClick={() => {
                  setActiveTab("pill");
                  setTimeout(() => {
                    document.getElementById("tabs-mount-anchor")?.scrollIntoView({ behavior: "smooth" });
                  }, 100);
                }} 
                className="px-5 py-2.5 bg-white/10 hover:bg-white/15 text-slate-200 border border-white/10 hover:text-white font-bold text-xs rounded-full transition-all cursor-pointer"
              >
                알약 식별 촬영기
              </button>
            </div>
          </div>
        </section>

        {/* Anchor point to scroll down on interactive tabs clicks */}
        <div id="tabs-mount-anchor" className="scroll-mt-20" />

        {/* 🛠️ ACTIVE TABS WRAPPER (PRISTINE CONTENT TRANSITIONS) */}
        <div className="p-1 min-h-[440px]">
          <AnimatePresence mode="wait">
            {activeTab === "prescription" && (
              <motion.div
                key="tab-prescription"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PrescriptionAnalyzer 
                  onAddHistory={handleAddHistory} 
                  onOpenAIConsultant={triggerAIChatWithContext} 
                />
              </motion.div>
            )}

            {activeTab === "pill" && (
              <motion.div
                key="tab-pill"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <PillScanner 
                  onAddHistory={handleAddHistory} 
                  onOpenAIConsultant={triggerAIChatWithContext} 
                />
              </motion.div>
            )}

            {activeTab === "scheduler" && (
              <motion.div
                key="tab-scheduler"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <MedicationReminders />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* 📜 RECENT SCANS LOGS SECTION */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="font-display font-bold text-sm text-slate-800 flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-blue-600" />
                최근 약품 분석 및 식별 히스토리
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">최근 상세 분석 이력은 브라우저 보안 저장소(localStorage)에 귀속되어 안전하게 저장됩니다.</p>
            </div>
            {history.length > 0 && (
              <button 
                onClick={clearHistory}
                className="text-xs text-rose-500 hover:text-rose-700 font-bold flex items-center gap-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                이력 전부 비우기
              </button>
            )}
          </div>

          {history.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {history.map((item, index) => (
                <div key={item.id || index} className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-blue-300 hover:bg-blue-50/5 transition-colors">
                  <div className="space-y-1 overflow-hidden">
                    <div className="flex items-center gap-1.5">
                      <span className={`text-[9px] px-2 py-0.5 rounded-full font-extrabold uppercase leading-none ${
                        item.type === "pill" ? "bg-blue-100 text-blue-700" : "bg-emerald-100 text-emerald-700"
                      }`}>
                        {item.type === "pill" ? "알약식별" : "처방전조회"}
                      </span>
                      <span className="text-[10px] text-slate-400 font-mono">{item.timestamp}</span>
                    </div>
                    <p className="text-xs font-bold text-slate-705 truncate" title={item.title}>
                      {item.title}
                    </p>
                  </div>

                  <button
                    onClick={() => {
                      // Move tab to highlight and pre-populate AI Assistant with chosen context
                      if (item.pillData) {
                        setAiContext(item.pillData);
                        setActiveTab("pill");
                      } else if (item.prescriptionData) {
                        setAiContext(item.prescriptionData);
                        setActiveTab("prescription");
                      }
                      setIsAIConsultantOpen(true);
                    }}
                    className="p-1 px-3 bg-white border border-slate-200 hover:border-blue-500 hover:text-blue-600 hover:shadow-xs text-[10px] font-bold text-slate-500 rounded-lg transition-all cursor-pointer shrink-0"
                  >
                    AI 약사 피드백
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center text-slate-400 text-xs font-semibold">
              이전 분석 이력이 비어있습니다. 위의 스캐너 탭에서 사진 분석을 시작해 보세요.
            </div>
          )}
        </section>



      </main>

      {/* 🔮 SLIDE-OVER AI PHARMACIST CABINET */}
      <AIConsultant 
        isOpen={isAIConsultantOpen} 
        onClose={() => setIsAIConsultantOpen(false)} 
        scannedContext={aiContext}
      />

      {/* 🏥 BOTTOM CLINICAL FOOTER */}
      <footer className="bg-slate-900 text-slate-400 border-t border-slate-800 px-4 md:px-8 py-8 mt-12 text-center text-xs space-y-4">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          
          <div className="text-left space-y-1">
            <h4 className="font-display font-black text-white text-sm">snapill<span className="text-blue-500">.</span></h4>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xl">
              본 서비스는 처방 의약품 이미지 형태와 인공지능 분석 가이드를 연동해 제공하는 건강 관리 보조 도우미 사이트입니다. 
              정확한 진단 및 약물의 위해 치료 방향성은 주치의 혹은 약전문인과의 직접 상담 및 검진을 우선시하여야 합니다.
            </p>
          </div>

          <div className="flex gap-4 text-[11px] font-medium transition-colors shrink-0">
            <span className="text-blue-500 flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4" />
              식약처 기준 AI 데이터 적용 완료
            </span>
          </div>
        </div>

        <div className="border-t border-slate-800/80 pt-4 text-[10px] text-slate-600">
          © {new Date().getFullYear()} snapill Inc. All clinical guidelines protected. Built with Gemini Multimodal Flash integration.
        </div>
      </footer>

    </div>
  );
}
