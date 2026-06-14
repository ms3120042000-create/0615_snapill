import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Pill, Sparkles, Heart, Activity, ShieldAlert, CheckCircle2, 
  MousePointer, ArrowUpRight, Award, Compass, RefreshCw, Layers, Sparkle,
  Calendar, Clock, Zap, AlertCircle
} from "lucide-react";

export default function InteractiveReportShowcase() {
  // Mouse hover coordinate offsets for parallax interaction
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Manual interactive controller states
  const [envelopeProgress, setEnvelopeProgress] = useState(0.8); // 0 (fully closed) to 1 (fully open)
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [activeTab, setActiveTab] = useState<"nutrients" | "interrelation" | "schedule">("nutrients");

  // Parallax calculations
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // Range: -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // Range: -0.5 to 0.5
    setMousePos({ x, y });
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
    setMousePos({ x: 0, y: 0 }); // snap back gently to center
  };

  // Autoplay cycle to make the visual showcase incredibly alive on load
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isAutoPlaying) {
      interval = setInterval(() => {
        setEnvelopeProgress((prev) => {
          if (prev >= 1) return 0.1; // reset to closed and open again
          return parseFloat((prev + 0.1).toFixed(2));
        });
      }, 500);
    }
    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Turn off autoplay on manual slider interaction so User has custom agency
  const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsAutoPlaying(false);
    setEnvelopeProgress(parseFloat(e.target.value));
  };

  return (
    <section className="bg-white rounded-[32px] border border-orange-100/50 p-6 md:p-10 shadow-xs relative overflow-hidden flex flex-col xl:flex-row items-stretch justify-between gap-10">
      
      {/* 🔮 LEFT: CREATIVE BRAND INTRO & PLAYGROUND CONTROLLER */}
      <div className="xl:w-5/12 space-y-6 flex flex-col justify-between">
        <div className="space-y-4">
          <div className="inline-flex items-center gap-2 bg-orange-50 border border-orange-200/50 rounded-full px-4 py-1.5 text-orange-700 text-[11px] font-extrabold tracking-wide uppercase">
            <Sparkles className="w-3.5 h-3.5 text-orange-500 animate-spin-slow" />
            <span>Interactive Laboratory</span>
          </div>

          <h2 className="text-2xl md:text-4xl font-display font-black tracking-tight leading-tight text-slate-800">
            마우스를 따라 움직이는<br />
            <span className="bg-gradient-to-r from-orange-600 via-amber-500 to-emerald-600 bg-clip-text text-transparent">종합 복약 인텔리전스</span>
          </h2>

          <p className="text-xs md:text-sm text-slate-500 font-medium leading-relaxed">
            마우스의 미세한 움직임 감지(Parallax Parallax Coordinate Feedback) 및 물리 시뮬레이션을 통해 결합된 입체 약봉지가 펼쳐집니다. 하단의 슬라이더를 스크러빙하거나 버튼을 눌러 개봉해 보세요. 
          </p>
        </div>

        {/* Dynamic Controls box */}
        <div className="p-5 bg-orange-50/45 rounded-2xl border border-orange-100/30 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-extrabold uppercase text-orange-850 tracking-wider flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-orange-500" />
              약봉투 개봉 가압 스크러버 (Interactive Scrub)
            </span>
            <button
              onClick={() => setIsAutoPlaying(!isAutoPlaying)}
              className={`p-1 px-2.5 rounded-full text-[10px] font-black transition-all cursor-pointer flex items-center gap-1 ${
                isAutoPlaying 
                  ? "bg-orange-600 text-white shadow-xs" 
                  : "bg-slate-200 text-slate-600 hover:bg-slate-300"
              }`}
            >
              <RefreshCw className={`w-3 h-3 ${isAutoPlaying ? "animate-spin" : ""}`} />
              {isAutoPlaying ? "자동 시뮬 연동 중" : "수정하기"}
            </button>
          </div>

          <div className="space-y-2">
            <input 
              type="range" 
              min="0.0" 
              max="1" 
              step="0.01" 
              value={envelopeProgress}
              onChange={handleSliderChange}
              className="w-full h-2 bg-orange-100 rounded-lg appearance-none cursor-pointer accent-orange-500 outline-none"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>0% (봉합 밀봉)</span>
              <span className="font-bold text-orange-600">개봉도: {Math.round(envelopeProgress * 100)}%</span>
              <span>100% (리포트 전방 이탈)</span>
            </div>
          </div>

          {/* Quick interactive trigger buttons */}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <button 
              onClick={() => {
                setIsAutoPlaying(false);
                setEnvelopeProgress(0.15);
              }}
              className="py-2.5 bg-white hover:bg-orange-50/30 border border-slate-200 hover:border-orange-350 text-slate-700 text-[11px] font-bold rounded-xl transition-all cursor-pointer text-center"
            >
              🔒 밀봉 접이 모드
            </button>
            <button 
              onClick={() => {
                setIsAutoPlaying(false);
                setEnvelopeProgress(0.95);
              }}
              className="py-2.5 bg-gradient-to-br from-amber-400 to-orange-500 text-white shadow-xs font-black text-[11px] rounded-xl transition-all cursor-pointer text-center flex items-center justify-center gap-1"
            >
              🚀 최고조 개봉 모드
            </button>
          </div>
        </div>

        {/* Key Metrics / Highlights */}
        <div className="grid grid-cols-3 gap-3">
          <div className="p-3 bg-white border border-orange-100/30 rounded-xl space-y-1">
            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Mouse Sensitivity</span>
            <span className="text-xs font-black font-display text-slate-800 flex items-center gap-0.5">
              <Compass className="w-3.5 h-3.5 text-orange-500 animate-pulse" /> 0.05px
            </span>
          </div>

          <div className="p-3 bg-white border border-orange-100/30 rounded-xl space-y-1">
            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Rendering Rate</span>
            <span className="text-xs font-black font-display text-emerald-600">60 FPS Ultra</span>
          </div>

          <div className="p-3 bg-white border border-orange-100/30 rounded-xl space-y-1">
            <span className="block text-[9px] text-slate-400 font-bold uppercase tracking-wider">Physics System</span>
            <span className="text-xs font-black font-display text-orange-600">Framer Spring</span>
          </div>
        </div>
      </div>

      {/* 🧪 RIGHT: AMAZING DYNAMIC MOUSE INTERACTION CANVAS */}
      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={handleMouseLeave}
        className="xl:w-7/12 min-h-[500px] h-auto bg-gradient-to-br from-amber-50/60 to-orange-50/20 rounded-[28px] border border-orange-100/50 p-6 flex flex-col items-center justify-center relative overflow-hidden"
      >
        {/* Subtle background radar circles */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[450px] h-[450px] rounded-full border border-orange-300/40 animate-pulse-gentle" />
          <div className="w-[320px] h-[320px] rounded-full border border-orange-200/50 absolute" />
          <div className="w-[180px] h-[180px] rounded-full border border-orange-100/60 absolute" />
        </div>

        {/* 🧚 FLOATING DELAYED PARALLAX PILL OBJECTS */}
        {/* Object 1: Glassmorphic Capsule Top-Left (Reacts heavily to mouse coordinates!) */}
        <motion.div 
          animate={{ 
            x: mousePos.x * 50,
            y: mousePos.y * 50,
            rotate: isHovered ? mousePos.x * 15 + 12 : 12,
            scale: isHovered ? 1.08 : 1
          }}
          transition={{ type: "spring", stiffness: 120, damping: 25 }}
          className="absolute top-12 left-12 w-20 h-10 rounded-full bg-gradient-to-r from-orange-400 to-amber-400 p-[1.5px] border border-white/60 shadow-lg shadow-orange-500/10 backdrop-blur-md z-30 pointer-events-none flex"
        >
          <div className="w-1/2 h-full bg-orange-500/80 rounded-l-full flex items-center justify-center text-[7px] font-black text-white">SNAP</div>
          <div className="w-1/2 h-full bg-white/75 rounded-r-full flex items-center justify-center text-[7px] font-bold text-orange-700">FIT</div>
        </motion.div>

        {/* Object 2: Mint fresh leaf Center-Right (Slightly alternate mouse reaction direction!) */}
        <motion.div 
          animate={{ 
            x: mousePos.x * -40,
            y: mousePos.y * -40,
            rotate: isHovered ? mousePos.y * -25 - 35 : -35,
            scale: isHovered ? 1.15 : 1
          }}
          transition={{ type: "spring", stiffness: 100, damping: 22 }}
          className="absolute bottom-16 right-12 w-16 h-16 pointer-events-none z-30 opacity-75 animate-float-1"
        >
          {/* Glass Leaf with green glowing drop shadow */}
          <svg viewBox="0 0 100 100" className="w-full h-full fill-emerald-500 text-emerald-400 filter drop-shadow-[0_8px_16px_rgba(16,185,129,0.2)]">
            <path d="M50 10 Q75 25 75 55 Q75 75 50 85 Q25 75 25 55 Q25 25 50 10" />
            <path d="M50 10 L50 85" stroke="white" strokeWidth="3" strokeLinecap="round" />
            <path d="M50 30 Q63 35 68 40 M50 50 Q60 55 64 62 M50 40 Q37 45 32 50 M50 60 Q40 65 36 72" stroke="white" strokeWidth="2.5" strokeLinecap="round" />
          </svg>
        </motion.div>

        {/* Object 3: Mini Yellow Vit-C sphere bouncing (Alternate delay) */}
        <motion.div 
          animate={{ 
            x: mousePos.x * 65,
            y: mousePos.y * -25,
            scale: isHovered ? 1.25 : 1
          }}
          transition={{ type: "spring", stiffness: 140, damping: 18 }}
          className="absolute top-1/4 right-16 w-10 h-10 rounded-full bg-amber-400 border-2 border-white shadow-md shadow-amber-500/20 flex items-center justify-center text-[8px] font-extrabold text-amber-900 z-30 pointer-events-none"
        >
          VitD
        </motion.div>

        {/* Object 4: Mini drop capsule at Bottom-Left */}
        <motion.div 
          animate={{ 
            x: mousePos.x * -25,
            y: mousePos.y * 45,
            scale: isHovered ? 1.1 : 1
          }}
          transition={{ type: "spring", stiffness: 85, damping: 20 }}
          className="absolute bottom-16 left-20 w-8 h-12 rounded-full bg-orange-500 border border-white p-0.5 shadow-sm transform rotate-45 pointer-events-none z-30"
        >
          <div className="w-full h-1/2 bg-white/30 rounded-t-full" />
        </motion.div>


        {/* 📬 ENVELOPE / PAPER SLEEVE GRAPHIC (3D FOLD FLAP) */}
        <div className="w-full max-w-[340px] relative z-20 flex flex-col items-center">
          
          {/* A. Dynamic sliding Health Report Card behind/inside envelope */}
          <motion.div 
            style={{ 
              y: -50 - (envelopeProgress * 150), // slides up when open progress increases
              scale: 0.9 + (envelopeProgress * 0.1),
              opacity: 0.4 + (envelopeProgress * 0.6)
            }}
            transition={{ type: "spring", stiffness: 110, damping: 20 }}
            className="w-[325px] bg-white rounded-3xl p-5 border border-orange-100 shadow-xl relative z-10 transition-shadow duration-300"
          >
            {/* Header portion of the Report Card inside/outside */}
            <div className="flex items-center justify-between border-b border-orange-50 pb-3">
              <div className="flex items-center gap-1.5">
                <div className="w-7 h-7 bg-orange-500 rounded-lg flex items-center justify-center text-white">
                  <Activity className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black tracking-tight text-slate-800 uppercase">Health Management Report</h4>
                  <p className="text-[8px] text-slate-400 font-mono">ID: SN-MEMBER-99</p>
                </div>
              </div>
              <span className="text-[10px] px-2 py-0.5 bg-emerald-50 text-emerald-700 font-black rounded-full leading-none">안심 대조완료</span>
            </div>

            {/* Score Ring Section */}
            <div className="py-4 flex items-center gap-4">
              <div className="relative w-16 h-16 shrink-0 flex items-center justify-center">
                {/* Custom circular progress background */}
                <svg viewBox="0 0 36 36" className="w-full h-full transform -rotate-90">
                  <circle cx="18" cy="18" r="15.915" fill="none" stroke="#F1F5F9" strokeWidth="3" />
                  <motion.circle 
                    cx="18" 
                    cy="18" 
                    r="15.915" 
                    fill="none" 
                    stroke="url(#gradient-accent)" 
                    strokeWidth="3.2" 
                    strokeDasharray="100"
                    animate={{ strokeDashoffset: 100 - (70 + (envelopeProgress * 25)) }} // animates dynamically!
                    transition={{ type: "spring", stiffness: 50, damping: 15 }}
                  />
                  <defs>
                    <linearGradient id="gradient-accent" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#EA580C" />
                      <stop offset="100%" stopColor="#10B981" />
                    </linearGradient>
                  </defs>
                </svg>
                <div className="absolute font-display font-black text-sm text-slate-800">
                  {Math.round(70 + (envelopeProgress * 25))}점
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-[9px] uppercase tracking-wider font-extrabold text-orange-600 block">종합 맞춤 처방 분석 효율</span>
                <p className="text-xs font-black text-slate-700">성분 상충 위험도 극저, 시간별 영양 흡수 설계 최적 등급</p>
              </div>
            </div>

            {/* Switchable Bento-Highlights Toggles inside the report card */}
            <div className="flex gap-1.5 bg-slate-50 p-1 rounded-xl">
              <button 
                onClick={() => setActiveTab("nutrients")}
                className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                  activeTab === "nutrients" 
                    ? "bg-white text-slate-800 shadow-3xs" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                영양 성분
              </button>
              <button 
                onClick={() => setActiveTab("interrelation")}
                className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                  activeTab === "interrelation" 
                    ? "bg-white text-slate-800 shadow-3xs" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                시간대 가이드
              </button>
              <button 
                onClick={() => setActiveTab("schedule")}
                className={`flex-1 py-1.5 text-[9px] font-bold rounded-lg transition-all ${
                  activeTab === "schedule" 
                    ? "bg-white text-slate-800 shadow-3xs" 
                    : "text-slate-400 hover:text-slate-600"
                }`}
              >
                주의 부작용
              </button>
            </div>

            {/* Inner dynamic sub-content container */}
            <div className="mt-3 p-3 bg-orange-50/15 border border-orange-100/30 rounded-xl min-h-[96px] relative overflow-hidden flex flex-col justify-center">
              <AnimatePresence mode="wait">
                {activeTab === "nutrients" && (
                  <motion.div
                    key="tab-nutr"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-orange-500" />
                      <span className="text-[10px] font-black text-slate-800">활성 비타민 B12 및 아연</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      오늘 대조된 알약에서 유효 비타민 B군 시너지가 확인되었습니다. 메스꺼움을 유발할 수 있어 반드시 공복을 피하십시오.
                    </p>
                  </motion.div>
                )}

                {activeTab === "interrelation" && (
                  <motion.div
                    key="tab-inter"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3 text-emerald-500" />
                      <span className="text-[10px] font-black text-slate-800">식후 30분 아침 타임 최적</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      비타민 D 유도 분리 기능은 아침 일광 작용과 연동될 때 최고 흡수율을 발휘합니다. 아침 시간에 조제해 드세요.
                    </p>
                  </motion.div>
                )}

                {activeTab === "schedule" && (
                  <motion.div
                    key="tab-sched"
                    initial={{ opacity: 0, x: -5 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 5 }}
                    className="space-y-1.5"
                  >
                    <div className="flex items-center gap-1 text-orange-700">
                      <AlertCircle className="w-3 h-3 text-orange-600" />
                      <span className="text-[10px] font-black text-slate-800">철분 복량 중화 간섭 주의</span>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-relaxed">
                      우유, 카페인 함유 음료는 철분 결합제 흡수를 방해해 무력하게 만듭니다. 복용 전후 1시간 내 섭취 주의가 요구됩니다.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>

          {/* B. THE APOTHECARY MEMBRANE PARCHMENT ENVELOPE BASE SECTION */}
          <div className="w-[330px] h-32 bg-gradient-to-b from-[#FAF8F4] to-[#F3EFE9] border-x border-b border-[#E1DBCF] rounded-b-2xl relative z-20 flex flex-col justify-end p-4 shadow-xl select-none">
            {/* Elegant horizontal clinical stripe branding */}
            <div className="absolute top-0 inset-x-0 h-1 bg-[#E1DBCF] border-b border-[#FAF8F4]/20" />
            
            {/* Minimal line details representing paper folds */}
            <div className="absolute top-1 left-2 w-1/3 h-[1px] bg-white opacity-40 transform rotate-12" />
            <div className="absolute top-1 right-2 w-1/3 h-[1px] bg-white opacity-40 transform -rotate-12" />

            {/* Front Paper Sleeve Overlapping Overlay (hiding card until slide up) */}
            <div className="absolute inset-x-0 bottom-0 h-20 bg-gradient-to-b from-white/95 to-[#FAF8F4]/98 border-t border-slate-100 rounded-b-2xl z-30 p-3.5 flex flex-col justify-between shadow-xs">
              
              {/* Fake prescription barcode details */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <span className="block text-[8px] uppercase font-bold text-slate-400 tracking-wider">PRESCRIPTION FILE SYSTEM</span>
                  <span className="block text-[8px] tracking-tight font-black text-slate-700">스냅필 안심 인증 약포지 2호</span>
                </div>
                
                {/* Barcode representation */}
                <div className="flex items-stretch gap-[1.5px] h-4">
                  <div className="w-[1.5px] bg-slate-900" />
                  <div className="w-[2.5px] bg-slate-900" />
                  <div className="w-[1px] bg-slate-900" />
                  <div className="w-[4px] bg-slate-900" />
                  <div className="w-[1.5px] bg-slate-900" />
                  <div className="w-[1px] bg-slate-800" />
                  <div className="w-[2px] bg-slate-900" />
                </div>
              </div>

              {/* Holographic secure authentication cross logo */}
              <div className="flex items-center justify-between text-[7px] font-mono text-slate-400">
                <span>VERIFIED BY GEMINI 2.5 HEALTH DATA INTERACTION</span>
                <span>SECURE APOTHECARY</span>
              </div>
            </div>

            {/* C. ENVELOPE FLAP (Using rotateX 3D folding effect depending on progress slider) */}
            {/* Origin at top makes it rotate upwards and back */}
            <motion.div 
              style={{ 
                transformOrigin: "top",
                rotateX: (1 - envelopeProgress) * -145 // 0 degree (closed flap) to -145 degrees (wide open back)
              }}
              className="absolute -top-[52px] inset-x-0 h-[54px] bg-gradient-to-b from-[#ECE8DF] to-[#E2DDD3] border-t border-x border-[#CBC3B5] rounded-t-3xl z-40 shadow-inner overflow-hidden"
            >
              <div className="w-full h-full flex flex-col justify-center items-center p-2">
                {/* Minimal stamp / seal on the envelope flap for raw editorial realism */}
                <div className="w-5 h-5 rounded-full border border-orange-500/20 bg-orange-100/45 flex items-center justify-center">
                  <Heart className="w-2.5 h-2.5 text-orange-500" />
                </div>
                <span className="text-[6px] font-black tracking-widest text-[#9c9485] uppercase mt-1">SNAP & OPEN</span>
              </div>
            </motion.div>

          </div>
        </div>

        {/* Real-time coordinates indicators */}
        <div className="absolute bottom-3 right-3 text-[9px] text-slate-400 font-mono tracking-tight flex items-center gap-1 pointer-events-none">
          <MousePointer className="w-3 h-3 text-orange-500 animate-pulse" />
          <span>Coordinates: ({(mousePos.x * 100).toFixed(0)}%, {(mousePos.y * 100).toFixed(0)}%)</span>
        </div>

      </div>

    </section>
  );
}
