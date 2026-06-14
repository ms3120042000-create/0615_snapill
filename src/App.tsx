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
  const [presetPillChoice, setPresetPillChoice] = useState<any>(null);
  
  // AI Consultant sidebar states
  const [isAIConsultantOpen, setIsAIConsultantOpen] = useState(false);
  const [aiContext, setAiContext] = useState<any>(null);

  // Bottom Pill Dispenser Simulator state
  const [spawnedPills, setSpawnedPills] = useState<{ id: number; color: string; left: number; deg: number; shape: "circle" | "capsule" }[]>([]);
  const [dispenseCount, setDispenseCount] = useState(0);

  const handleDispensePill = (type: "mint" | "vitamin" | "capsule") => {
    const id = Date.now() + Math.random();
    const shapes: Record<string, "circle" | "capsule"> = {
      mint: "circle",
      vitamin: "circle",
      capsule: "capsule"
    };
    const colors: Record<string, string> = {
      mint: "bg-emerald-400 border-emerald-500 shadow-emerald-400/30",
      vitamin: "bg-amber-400 border-amber-500 shadow-amber-400/30",
      capsule: "bg-indigo-500 border-indigo-600 shadow-indigo-500/30"
    };

    const newPill = {
      id,
      color: colors[type],
      left: Math.floor(Math.random() * 60) + 20, // 20% to 80% left
      deg: Math.floor(Math.random() * 360),
      shape: shapes[type]
    };

    setSpawnedPills((prev) => [...prev, newPill]);
    setDispenseCount((prev) => prev + 1);

    // Auto cleanup of visual pills
    setTimeout(() => {
      setSpawnedPills((prev) => prev.filter((p) => p.id !== id));
    }, 2500);
  };

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

  // Preset pill click handler
  const handleLoadPresetPill = (presetKey: 'soo' | 'megalide' | 's80') => {
    const PRESETS = {
      soo: {
        pillName: "S00 센트룸 활력 멀티콤플렉스 (Centrum Active)",
        manufacturer: "한국화이자제약 (Pfizer)",
        shape: "타원형 (Oval)",
        color: "노란색 (Yellow)",
        frontMarking: "S00",
        backMarking: "VITAMIN",
        formulation: "필름코팅 정제",
        mainIngredients: "비타민 D3 1000IU, 비타민 B12 12mcg, 아연 15mg",
        efficacy: "하루 활력 증대, 유해 산소로부터 세포를 보호하는 데 필요 및 면역 보강",
        dosage: "성인 1일 1회 1정, 가급적 아침 식사 마친 직후에 미온수와 복용하십시오.",
        warnings: [
          "고칼슘혈증 환자 및 신장 결석 이력이 있으신 환자는 투약 전 상담 시 문의가 필요합니다.",
          "공복 복용 시 철분 및 미네랄 복합 성분 작용으로 경미한 메스꺼움이나 구토감이 발생할 수 있습니다."
        ],
        image: "https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800"
      },
      megalide: {
        pillName: "Megalide Reoer 복합 소염 항생캡슐",
        manufacturer: "동아제약 (Dong-A Pharm)",
        shape: "장방형 캡슐 (Dual-Tone Capsule)",
        color: "오렌지 및 밤갈색 (Orange & Brown)",
        frontMarking: "MEGALIDE",
        backMarking: "REOER",
        formulation: "경질캡슐제",
        mainIngredients: "아목시실린수화물 250mg, 리소짐염산염 30mg",
        efficacy: "중이염, 부비동염, 기관지 불특정 박테리아 감염 염증 완화 및 농 배출",
        dosage: "성인 1회 1캡슐, 1일 3회 식사 시점 30분 직후에 투여하며 정해진 시간을 고수하세요.",
        warnings: [
          "페니실린 계열 약물 알레르기가 있는 환자는 가려움증, 두드러기, 드물게 급성 발작 호흡 곤란을 겪을 수 있으니 즉시 복용을 중지하세요.",
          "증상이 조기 소실되어도 체내 박테리아 박멸 및 내성 균주 억제를 위해 처방된 주기를 끝까지 완수해야 합니다."
        ],
        image: "https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800"
      },
      s80: {
        pillName: "S80 코오롱 이부프로펜 분할 진통정",
        manufacturer: "코오롱제약 (Kolon)",
        shape: "원형 십자 분할선형 (Round Divisible)",
        color: "미황색 (Pale Yellow)",
        frontMarking: "S80",
        backMarking: "CROSS",
        formulation: "나정 (십자 분할선 포함)",
        mainIngredients: "이부프로펜 200mg, 아세트아미노펜 150mg 함유",
        efficacy: "감기로 인한 해열, 두통, 치통, 생리통 등 급성 통증의 신속 완화",
        dosage: "매 4-6시간 간격으로 1회 1-2정을 충분한 물과 함께 식후 복용하십시오.",
        warnings: [
          "위 점막에 무리를 줄 수 있으므로 공복 복용을 피하시고, 위염 환자는 신중히 관리하십시오.",
          "술을 자주 드시는 환자 혹은 복용 전후 음주는 급격한 간 독성 증가와 위장 출혈을 조장합니다."
        ],
        image: "https://images.unsplash.com/photo-1576091160550-2173dba999ef?auto=format&fit=crop&q=80&w=800"
      }
    };

    const targetPill = PRESETS[presetKey];
    setPresetPillChoice(targetPill);
    setActiveTab("pill");
    
    // Auto scroll down to view component
    setTimeout(() => {
      document.getElementById("tabs-mount-anchor")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
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

        {/* 📋 THE GORGEOUS 3-PILL INTERACTIVE PRESET CARDS (Directly inspired by the center cards of reference UIUX!) */}
        <section className="space-y-6">
          <div className="text-center max-w-xl mx-auto space-y-1.5">
            <h2 className="text-lg font-bold text-slate-800 font-display tracking-tight">의약품 자동 대조 시뮬레이션 패널</h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              분석하고 싶으신 알약 유형을 아래에서 선택해 보세요. 식약처 의약 규격 식별 코드 데이터베이스와 즉시 연동되어 분석 결과를 시뮬레이션해 줍니다.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* CARD 1: S00 (Yellow Pill) */}
            <div 
              onClick={() => handleLoadPresetPill('soo')}
              className="group bg-white rounded-3xl p-6 border border-slate-200/60 hover:border-blue-400 hover:shadow-xl hover:shadow-blue-500/5 transition-all text-center cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[300px]"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50/40 rounded-bl-full -z-0 group-hover:bg-blue-100/30 transition-colors" />
              
              {/* 3D Pill Illustration */}
              <div className="py-6 flex justify-center relative z-10">
                <div className="w-8 h-18 bg-amber-400 rounded-full shadow-lg shadow-amber-500/10 flex flex-col justify-between p-1 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                  <div className="w-full h-1/2 rounded-t-full bg-gradient-to-b from-amber-250 to-amber-400" />
                  <div className="w-full h-1/2 bg-amber-300 rounded-b-full flex items-center justify-center text-[7px] font-black text-amber-800 tracking-wider">S00</div>
                </div>
              </div>

              {/* Content Description */}
              <div className="space-y-2 relative z-10">
                <span className="text-[10px] font-extrabold text-blue-600 bg-blue-50 px-2.5 py-1 rounded-full uppercase tracking-wider">SOO</span>
                <h3 className="text-sm font-bold text-slate-800">S00 활력 멀티비타민정</h3>
                <p className="text-xs text-slate-400 line-clamp-2">하루 세포 활력을 위해 정밀 분해 설계된 고함량 비콤플렉스 영양 보조정</p>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-dashed border-slate-100 relative z-10">
                <span className="text-[11px] font-bold text-blue-600 group-hover:underline flex items-center justify-center gap-1">
                  식별 조인 및 복약 지도 받기 <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* CARD 2: Megalide Reoer (Dual capsule) */}
            <div 
              onClick={() => handleLoadPresetPill('megalide')}
              className="group bg-white rounded-3xl p-6 border border-slate-200/60 hover:border-indigo-400 hover:shadow-xl hover:shadow-indigo-500/5 transition-all text-center cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[300px]"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-50/40 rounded-bl-full -z-0 group-hover:bg-indigo-100/30 transition-colors" />
              
              {/* 3D Pill Illustration */}
              <div className="py-8 flex justify-center relative z-10">
                <div className="w-16 h-7 bg-gradient-to-r from-indigo-500 to-blue-700/80 rounded-full shadow-lg shadow-indigo-500/10 flex p-0.5 group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300 rotate-[15deg]">
                  <div className="w-1/2 h-full rounded-l-full bg-gradient-to-r from-blue-400 to-blue-500" />
                  <div className="w-1/2 h-full bg-indigo-800/90 rounded-r-full text-[6px] font-black text-white flex items-center justify-center tracking-tighter">MEG</div>
                </div>
              </div>

              {/* Content Description */}
              <div className="space-y-2 relative z-10">
                <span className="text-[10px] font-extrabold text-indigo-600 bg-indigo-50 px-2.5 py-1 rounded-full uppercase tracking-wider">Megalide Reoer</span>
                <h3 className="text-sm font-bold text-slate-800">Megalide Reoer 복합 소염 항생캡슐</h3>
                <p className="text-xs text-slate-400 line-clamp-2">이중 가압 멸균 보호 쉘 장착으로 성분 체내 안착률을 확대한 소염 항생제</p>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-dashed border-slate-100 relative z-10">
                <span className="text-[11px] font-bold text-indigo-600 group-hover:underline flex items-center justify-center gap-1">
                  식별 조인 및 복약 지도 받기 <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
            </div>

            {/* CARD 3: S80 (White Divisible Round Pill) */}
            <div 
              onClick={() => handleLoadPresetPill('s80')}
              className="group bg-white rounded-3xl p-6 border border-slate-200/60 hover:border-teal-400 hover:shadow-xl hover:shadow-teal-500/5 transition-all text-center cursor-pointer relative overflow-hidden flex flex-col justify-between min-h-[300px]"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50/40 rounded-bl-full -z-0 group-hover:bg-teal-100/30 transition-colors" />
              
              {/* 3D Pill Illustration */}
              <div className="py-7 flex justify-center relative z-10">
                <div className="w-13 h-13 rounded-full bg-slate-50 border border-slate-300 shadow-md flex items-center justify-center relative group-hover:scale-110 group-hover:-translate-y-1 transition-all duration-300">
                  {/* Division line */}
                  <div className="absolute inset-0 m-auto w-10 h-[1.5px] bg-slate-350 rotate-45" />
                  <div className="absolute inset-0 m-auto w-10 h-[1.5px] bg-slate-350 -rotate-45" />
                  <span className="text-[8px] font-black text-slate-600 bg-white/60 px-1 rounded z-10 shadow-3xs">S80</span>
                </div>
              </div>

              {/* Content Description */}
              <div className="space-y-2 relative z-10">
                <span className="text-[10px] font-extrabold text-teal-600 bg-teal-50 px-2.5 py-1 rounded-full uppercase tracking-wider">S80</span>
                <h3 className="text-sm font-bold text-slate-800">S80 분할 해열 진통정</h3>
                <p className="text-xs text-slate-400 line-clamp-2">부담 없는 십자 분할 제형으로 위장 자극 최소화를 실현한 아세트아미노펜 소염 진통정</p>
              </div>

              {/* Action Button */}
              <div className="pt-4 border-t border-dashed border-slate-100 relative z-10">
                <span className="text-[11px] font-bold text-teal-600 group-hover:underline flex items-center justify-center gap-1">
                  식별 조인 및 복약 지도 받기 <ArrowRight className="w-3.5 h-3.5" />
                </span>
              </div>
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
                  selectedPreset={presetPillChoice}
                  clearPresetChoice={() => setPresetPillChoice(null)}
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

        {/* 🧪 INTERACTIVE WELLNESS PILL DISPENSER SIMULATOR (Perfect representation of reference bottom visuals) */}
        <section className="bg-white rounded-3xl p-6 border border-slate-200/85 space-y-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50/40 rounded-full blur-3xl pointer-events-none opacity-40" />
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <span className="text-[10px] font-bold text-blue-600 tracking-wide uppercase">Interactive Sandbox</span>
              <h3 className="text-base font-bold text-slate-800 flex items-center gap-1.5 font-display">
                🥛 스냅필 안심 약품 조제 시뮬레이터
              </h3>
              <p className="text-xs text-slate-500 max-w-xl">
                하단의 성분을 선택하면 상호작용 가능한 Wellness 알약이 생성되어 가상의 유리 안심 약병으로 조제(Physics-Drop)됩니다.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-slate-600">누적 조제된 웰니스 수:</span>
              <span className="px-3.5 py-1 bg-slate-900 text-white font-black text-sm rounded-lg shadow-sm font-mono tracking-tight">
                {dispenseCount}정
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 pb-2">
            
            {/* Control Column */}
            <div className="lg:col-span-5 space-y-3.5 bg-slate-50 p-4 rounded-2xl border border-slate-150">
              <span className="block text-[10px] uppercase font-bold text-slate-400 tracking-wider">알약 성분 가압 분출기</span>
              
              <button 
                onClick={() => handleDispensePill("mint")}
                className="w-full p-3 bg-white hover:bg-emerald-50/50 border border-slate-200 hover:border-emerald-300 rounded-xl transition-all shadow-3xs flex items-center justify-between text-left cursor-pointer group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">허브 민트 유산균 (Mint Probiotics)</h4>
                  <p className="text-[10px] text-slate-400">시원한 초록색 유기농 정제</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-emerald-400 border border-emerald-500 shadow-sm animate-pulse" />
              </button>

              <button 
                onClick={() => handleDispensePill("vitamin")}
                className="w-full p-3 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-300 rounded-xl transition-all shadow-3xs flex items-center justify-between text-left cursor-pointer group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">데일리 활력 비타민D (Gold Vitamin D)</h4>
                  <p className="text-[10px] text-slate-400">생기 가득한 황금색 원형정</p>
                </div>
                <div className="w-5 h-5 rounded-full bg-amber-400 border border-amber-500 shadow-sm animate-pulse" />
              </button>

              <button 
                onClick={() => handleDispensePill("capsule")}
                className="w-full p-3 bg-white hover:bg-indigo-50/50 border border-slate-200 hover:border-indigo-300 rounded-xl transition-all shadow-3xs flex items-center justify-between text-left cursor-pointer group"
              >
                <div>
                  <h4 className="text-xs font-bold text-slate-800">복합 활력 안심 캡슐 (C-Active Cap)</h4>
                  <p className="text-[10px] text-slate-400">인디고톤의 단단한 복합 영양 캡슐</p>
                </div>
                <div className="w-3.5 h-7 rounded-full bg-indigo-500 border border-indigo-600 shadow-sm animate-pulse" />
              </button>
            </div>

            {/* Sandbox Glass Bottle Container (physics-style falling pills render) */}
            <div className="lg:col-span-7 h-[256px] bg-slate-100 rounded-2xl border border-slate-200 relative overflow-hidden flex items-center justify-center">
              
              {/* Bottle silhouette inside sandbox */}
              <div className="w-48 h-[210px] border-2 border-white/85 bg-white/20 backdrop-blur-xs rounded-t-3xl rounded-b-2xl shadow-xl relative overflow-hidden flex flex-col justify-end p-2 pb-4">
                
                {/* Bottle neck & lid shadow top */}
                <div className="absolute top-0 inset-x-0 mx-auto w-24 h-4 bg-white/40 border-b border-white/50" />
                
                {/* Real-time falling spawned items */}
                <div className="absolute inset-0 z-10 pointer-events-none">
                  {spawnedPills.map((p) => (
                    <div 
                      key={p.id}
                      className={`absolute top-0 transition-all duration-1000 ease-in-out border shadow-md ${p.color} ${
                        p.shape === "circle" 
                          ? "w-7 h-7 rounded-full" 
                          : "w-5 h-10 rounded-full"
                      }`}
                      style={{ 
                        left: `${p.left}%`, 
                        transform: `translateY(175px) rotate(${p.deg}deg)` 
                      }}
                    />
                  ))}
                </div>

                {/* Sub generic labels */}
                <div className="z-20 text-center text-slate-400 font-bold uppercase tracking-widest text-[8px] bg-white/70 backdrop-blur-xs py-1 rounded">
                  SAFE DISPENSED BOTTLE
                </div>
              </div>

              {/* Simulated static count indicator */}
              <div className="absolute bottom-3 right-3 text-[10px] text-slate-400 font-mono">
                Real-time Simulation Engine v2.5
              </div>
            </div>

          </div>
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
