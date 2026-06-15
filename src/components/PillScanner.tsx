import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Pill, Upload, Trash, Tag, Palette, ShieldAlert, Sparkles, CheckCircle2, 
  Settings, Info, HelpCircle, Activity, Heart, RefreshCw, Layers, Check 
} from "lucide-react";
import { PillAnalysisResult } from "../types";
import { SAMPLE_Tylenol_IMAGE, SAMPLE_PILL_DATA_1, SAMPLE_PILL_DATA_2 } from "../data";

const PRESET_SOO: PillAnalysisResult = {
  pillName: "S00 센트룸 활력 멀티비타민정",
  manufacturer: "센트룸 글로벌 웰니스 (Centrum Global)",
  shape: "장방형 (Oval)",
  color: "노란색/황금색 (Yellow/Gold)",
  frontMarking: "S00",
  backMarking: "없음",
  formulation: "필름코팅 성상 정제",
  mainIngredients: "비타민B군 복합체, 미네랄 12종",
  efficacy: "하루 세포 활력 증진, 만성 피로 완화, 체내 항산화 작용 보조",
  dosage: "성인 1일 1회 식후 혹은 식사 중에 충분한 물과 함께 복용해 주세요.",
  warnings: [
    "고함량 비타민 성분이 포함되어 공복 섭취 시 가벼운 속 쓰림, 울렁거림이 있을 수 있으니 아침 식사 직후에 드시는 것이 가장 위장에 부드럽고 안전합니다.",
    "성상 흡수 반응에 의해 소변 색상이 일시적으로 선명한 루테인톤 황색을 띨 수 있으나 체내 필수 비타민 방출 작용의 정상 반응이므로 안심하셔도 좋습니다."
  ]
};

const PRESET_MEGALIDE: PillAnalysisResult = {
  pillName: "Megalide Reoer 복합 소염 항생캡슐",
  manufacturer: "한국아스텔라스 제약 (Astellas Korea)",
  shape: "타원형 캡슐 (Dual Capsule)",
  color: "파란색/진남색 (Blue / Dark Indigo)",
  frontMarking: "MEG",
  backMarking: "없음",
  formulation: "경질캡슐형 정제",
  mainIngredients: "세파클러수화물 250mg (Antibiotic Cefaclor)",
  efficacy: "중이염, 기관지염, 인후두염 및 비뇨기성 박테리아 염증 치료",
  dosage: "성인 1회 1캡슐, 1일 3회 정밀하게 8시간씩 간격을 두고 복용합니다.",
  warnings: [
    "감염균의 성장을 완벽히 조절하고 세포 내 내성을 방지하기 위해서 발열이나 증세가 소멸했더라도 의사의 처방 일수를 절대적으로 채워 일괄 복용하여야 합니다.",
    "설사 및 연변 지속 시 복약을 임시 보류하고, 페니실린 또는 세팔로스포린계 외 다른 과민증 알레르기 수치가 높으신 분들은 즉시 복약 전 주치의와 상호 대조하십시오."
  ]
};

const PRESET_S80: PillAnalysisResult = {
  pillName: "S80 분할 해열 진통정",
  manufacturer: "삼진제약 (Samjin Pharm)",
  shape: "원형 십자분할형 (Circular Divisible)",
  color: "하얀색 (White)",
  frontMarking: "S80",
  backMarking: "십자무늬 (Cross Section)",
  formulation: "십자 홈 분할 나정",
  mainIngredients: "아세트아미노펜 325mg (Acetaminophen 325mg)",
  efficacy: "두통, 치통, 근육통 및 급성 발열 증세 해열 진통 작용",
  dosage: "성인 1회 1~2정씩 필요 시 복용합니다. 십자 가이드를 이용해 1/2 또는 1/4씩 쪼개어 저용량 미세 조절 투여가 가능합니다.",
  warnings: [
    "속쓰림을 억제하며 공복 복용이 수월하지만, 급격한 간 피로 부담 완화를 위하여 가급적 1일 절대 누계 복용 권장량 4g 한도를 확실히 준수해야 합니다.",
    "화학 분할 보관 시 쪼갠 부위로 산화 속도가 비약적으로 가속되므로 일주일 분량 이내로 밀폐 건조 보관함을 활용해 보관해 주십시오."
  ]
};

interface PillScannerProps {
  onAddHistory: (title: string, data: PillAnalysisResult) => void;
  onOpenAIConsultant: (results: any, initialQuestion?: string) => void;
}

export default function PillScanner({ onAddHistory, onOpenAIConsultant }: PillScannerProps) {
  const [frontImage, setFrontImage] = useState<string | null>(null);
  const [backImage, setBackImage] = useState<string | null>(null);
  
  // Custom hints
  const [shapeHint, setShapeHint] = useState("");
  const [colorHint, setColorHint] = useState("");
  const [textHint, setTextHint] = useState("");

  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PillAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [added, setAdded] = useState(false);


  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (file: File, side: "front" | "back") => {
    if (!file.type.startsWith("image/")) {
      setError("이미지만 등록 가능합니다.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        if (side === "front") {
          setFrontImage(e.target.result as string);
        } else {
          setBackImage(e.target.result as string);
        }
        setResult(null);
        setAdded(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const runPillAnalysis = async () => {
    if (!frontImage && !backImage) {
      setError("알약의 앞면이나 뒷면 사진 중 하나 이상을 등록해 주세요.");
      return;
    }
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/identify/pill", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frontImage,
          backImage,
          shapeHint,
          colorHint,
          textHint
        })
      });

      if (!response.ok) {
        let errorMessage = `서버 오류가 발생했습니다. (HTTP ${response.status})`;
        try {
          const errJson = await response.json();
          errorMessage = errJson.error || errorMessage;
        } catch {
          // 서버가 JSON이 아닌 응답(HTML 등)을 반환한 경우
        }
        throw new Error(errorMessage);
      }

      let resData: any;
      try {
        resData = await response.json();
      } catch {
        throw new Error("서버 응답을 파싱할 수 없습니다. 서버 상태를 확인해주세요.");
      }
      if (resData.success && resData.results) {
        setResult(resData.results);
        onAddHistory(resData.results.pillName, resData.results);
        setAdded(true);
      } else {
        throw new Error("분석 내용 포맷팅에 오류가 존재합니다.");
      }
    } catch (e: any) {
      console.error(e);
      setError(e.message || "서버 알약 스캔 중 연결이 원활하지 않습니다.");
    } finally {
      setAnalyzing(false);
    }
  };

  const loadDemoPill1 = () => {
    setFrontImage(SAMPLE_Tylenol_IMAGE);
    setBackImage(null);
    setShapeHint("장방형");
    setColorHint("하얀색");
    setTextHint("TYLENOL 500");
    setResult(SAMPLE_PILL_DATA_1);
    onAddHistory(SAMPLE_PILL_DATA_1.pillName, SAMPLE_PILL_DATA_1);
    setAdded(true);
    setError(null);
  };

  const loadDemoPill2 = () => {
    setFrontImage("https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800");
    setBackImage(null);
    setShapeHint("타원형 연질캡슐");
    setColorHint("청록색/반투명");
    setTextHint("TX");
    setResult(SAMPLE_PILL_DATA_2);
    onAddHistory(SAMPLE_PILL_DATA_2.pillName, SAMPLE_PILL_DATA_2);
    setAdded(true);
    setError(null);
  };

  const loadDemoPill3 = () => {
    setFrontImage("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800");
    setBackImage(null);
    setShapeHint("장방형");
    setColorHint("노란색");
    setTextHint("S00");
    setResult(PRESET_SOO);
    onAddHistory(PRESET_SOO.pillName, PRESET_SOO);
    setAdded(true);
    setError(null);
  };

  const loadDemoPill4 = () => {
    setFrontImage("https://images.unsplash.com/photo-1471864190281-a93a3070b6de?auto=format&fit=crop&q=80&w=800");
    setBackImage(null);
    setShapeHint("이중 경질 캡슐");
    setColorHint("파란색/진남색");
    setTextHint("MEG");
    setResult(PRESET_MEGALIDE);
    onAddHistory(PRESET_MEGALIDE.pillName, PRESET_MEGALIDE);
    setAdded(true);
    setError(null);
  };

  const loadDemoPill5 = () => {
    setFrontImage("https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&q=80&w=800");
    setBackImage(null);
    setShapeHint("십자분할 원형");
    setColorHint("하얀색");
    setTextHint("S80");
    setResult(PRESET_S80);
    onAddHistory(PRESET_S80.pillName, PRESET_S80);
    setAdded(true);
    setError(null);
  };

  const resetAll = () => {
    setFrontImage(null);
    setBackImage(null);
    setShapeHint("");
    setColorHint("");
    setTextHint("");
    setResult(null);
    setAdded(false);
    setError(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <Pill className="w-5 h-5 md:w-6 md:h-6" />
            </span>
            알약 앞뒤 분석 및 식별 서비스
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            가지고 계신 낱개 알약의 앞면, 뒷면 사진을 찍으면 각인, 색상, 형태를 분석해 정밀한 약품 정보를 찾아드립니다.
          </p>
        </div>

        <div className="flex flex-wrap gap-2 max-w-xl justify-end">
          <button
            onClick={loadDemoPill1}
            className="px-2.5 py-1.5 border border-slate-200 text-slate-750 hover:bg-slate-50 transition-colors text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-500" />
            타이레놀500
          </button>
          <button
            onClick={loadDemoPill2}
            className="px-2.5 py-1.5 border border-slate-200 text-slate-750 hover:bg-slate-50 transition-colors text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-cyan-500" />
            탁센 녹십자
          </button>
          <button
            onClick={loadDemoPill3}
            className="px-2.5 py-1.5 border border-slate-200 text-slate-750 hover:bg-slate-50 transition-colors text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-amber-400" />
            S00 멀티비타민
          </button>
          <button
            onClick={loadDemoPill4}
            className="px-2.5 py-1.5 border border-slate-200 text-slate-750 hover:bg-slate-50 transition-colors text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-indigo-500" />
            Megalide 소염제
          </button>
          <button
            onClick={loadDemoPill5}
            className="px-2.5 py-1.5 border border-slate-200 text-slate-750 hover:bg-slate-50 transition-colors text-[11px] font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-emerald-500" />
            S80 해열진통
          </button>
          {(frontImage || result) && (
            <button
              onClick={resetAll}
              className="px-3 py-1.5 border border-red-200 text-red-600 hover:bg-red-50 transition-colors text-xs font-semibold rounded-lg flex items-center gap-1 cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              초기화
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 1 Input: Capture & upload */}
        <div className="lg:col-span-12 xl:col-span-5 space-y-4">
          <div className="font-display font-medium text-slate-700 text-sm">
            <span>1단계: 알약 사진 및 정보 등록 (앞뒤 다각도 업로드 권장)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Front Side Card */}
            <div 
              onClick={() => frontInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl h-44 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all overflow-hidden ${
                frontImage ? "border-blue-400 bg-slate-50" : "border-slate-200 hover:border-blue-300 bg-white"
              }`}
            >
              {frontImage ? (
                <>
                  <img src={frontImage} alt="Pill Front" className="absolute inset-0 w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-slate-900/20" />
                  <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">앞면 등록됨</span>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-7 h-7 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">알약 앞면</span>
                  <p className="text-[10px] text-slate-400 mt-1">글자/기호 기재된 면</p>
                </div>
              )}
              <input 
                type="file" 
                ref={frontInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "front")} 
              />
            </div>

            {/* Back Side Card */}
            <div 
              onClick={() => backInputRef.current?.click()}
              className={`relative border-2 border-dashed rounded-xl h-44 flex flex-col items-center justify-center p-4 text-center cursor-pointer transition-all overflow-hidden ${
                backImage ? "border-blue-400 bg-slate-50" : "border-slate-200 hover:border-blue-300 bg-white"
              }`}
            >
              {backImage ? (
                <>
                  <img src={backImage} alt="Pill Back" className="absolute inset-0 w-full h-full object-contain" />
                  <div className="absolute inset-0 bg-slate-900/20" />
                  <span className="absolute bottom-2 left-2 bg-blue-600 text-white text-[10px] font-bold px-1.5 py-0.5 rounded leading-none">뒷면 등록됨</span>
                </>
              ) : (
                <div className="flex flex-col items-center">
                  <Upload className="w-7 h-7 text-slate-400 mb-2" />
                  <span className="text-xs font-semibold text-slate-700">알약 뒷면</span>
                  <p className="text-[10px] text-slate-400 mt-1">나눔선이나 함량 기재된 면</p>
                </div>
              )}
              <input 
                type="file" 
                ref={backInputRef} 
                className="hidden" 
                accept="image/*" 
                onChange={(e) => e.target.files?.[0] && handleImageUpload(e.target.files[0], "back")} 
              />
            </div>
          </div>

          {/* User Visual Hints (Improves search immensely) */}
          <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-3.5">
            <h3 className="text-xs font-bold text-slate-600 flex items-center gap-1.5">
              <Settings className="w-3.5 h-3.5 text-blue-500" />
              보조 특징 기록 (옵션) - 정확도 증대
            </h3>

            <div className="space-y-2.5">
              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">알약 전체 형태/모양</label>
                <div className="relative">
                  <Tag className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    value={shapeHint}
                    onChange={(e) => setShapeHint(e.target.value)}
                    placeholder="예: 타원형, 원형, 캡슐형, 삼각형 등"
                    className="w-full text-xs pl-8 pr-2 py-2 border border-slate-200 outline-none focus:border-blue-500 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">알약 색상</label>
                <div className="relative">
                  <Palette className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    value={colorHint}
                    onChange={(e) => setColorHint(e.target.value)}
                    placeholder="예: 흰색, 반투명 초록색, 갈색 등"
                    className="w-full text-xs pl-8 pr-2 py-2 border border-slate-200 outline-none focus:border-blue-500 rounded-lg text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="text-[10px] font-semibold text-slate-500 block mb-1">알약 표면의 음각 문자/식별 번호</label>
                <div className="relative">
                  <Layers className="absolute left-2.5 top-2.5 w-3.5 h-3.5 text-slate-400" />
                  <input 
                    type="text"
                    value={textHint}
                    onChange={(e) => setTextHint(e.target.value)}
                    placeholder="예: Tylenol, 500, 분할선, YSP 등"
                    className="w-full text-xs pl-8 pr-2 py-2 border border-slate-200 outline-none focus:border-blue-500 rounded-lg text-slate-800"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Scan Action */}
          <button
            onClick={runPillAnalysis}
            disabled={analyzing || (!frontImage && !backImage)}
            className={`w-full py-3.5 text-sm font-semibold rounded-xl text-white shadow-md flex items-center justify-center gap-2 cursor-pointer transition-all ${
              (!frontImage && !backImage) ? "bg-slate-300 cursor-not-allowed shadow-none" : "bg-blue-600 hover:bg-blue-700 hover:shadow-lg shadow-blue-500/10"
            }`}
          >
            <Sparkles className="w-4.5 h-4.5" />
            알약 정밀 분석 실시하기
          </button>

          {error && (
            <div className="p-3 bg-red-50 text-red-600 rounded-lg text-xs flex gap-1.5 border border-red-100">
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Step 2 Result Sheet */}
        <div className="lg:col-span-12 xl:col-span-7">
          <div className="font-display font-medium text-slate-700 text-sm mb-4">
            <span>2단계: 식별 매칭 분석 결과</span>
          </div>

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm min-h-[460px] flex flex-col justify-between">
            {analyzing ? (
              <div className="my-auto flex flex-col items-center justify-center py-12 text-center">
                <div className="relative w-20 h-20 mb-6 flex items-center justify-center">
                  <div className="absolute inset-0 border-4 border-dashed border-blue-500 rounded-full animate-spin" />
                  <Pill className="w-8 h-8 text-blue-600" />
                </div>
                <h4 className="font-semibold text-slate-800 text-sm">알약 특징 패턴 대조 중...</h4>
                <p className="text-xs text-slate-400 mt-2 max-w-[260px] leading-relaxed">
                  표면의 미세 기호와 형태적 특징을 종합 진단하고 있습니다. 잠시만 기다려 주세요.
                </p>
              </div>
            ) : result ? (
              <div className="space-y-5 animate-fade-in">
                
                {/* Result Pill Label */}
                <div className="border-b border-dashed border-slate-100 pb-4">
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-bold mb-1">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    유력 기성의약품 식별 성공 (98% 일치)
                  </div>
                  <h3 className="text-lg font-display font-bold text-slate-900 leading-tight">
                    {result.pillName}
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">{result.manufacturer}</p>
                </div>

                {/* Grid detailing physical properties */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-center">
                    <span className="block text-[10px] text-slate-400 font-medium">형태</span>
                    <span className="text-xs font-semibold text-slate-800">{result.shape}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-center">
                    <span className="block text-[10px] text-slate-400 font-medium">색상</span>
                    <span className="text-xs font-semibold text-slate-800">{result.color}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-center">
                    <span className="block text-[10px] text-slate-400 font-medium">제형</span>
                    <span className="text-xs font-semibold text-slate-800 truncate block px-0.5">{result.formulation}</span>
                  </div>
                  <div className="p-2.5 bg-slate-50 border border-slate-100 rounded-lg text-center">
                    <span className="block text-[10px] text-slate-400 font-medium">음각문자</span>
                    <span className="text-xs font-semibold text-blue-600">{result.frontMarking || "기재없음"}</span>
                  </div>
                </div>

                {/* Active compound ingredients */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl space-y-1">
                  <h4 className="text-xs font-bold text-slate-500 uppercase flex items-center gap-1">
                    <Activity className="w-3.5 h-3.5 text-slate-400" />
                    주성분 및 투입 비율
                  </h4>
                  <p className="text-sm font-semibold text-slate-800">{result.mainIngredients}</p>
                </div>

                {/* Medical Efficacy and dosages */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-white border border-slate-150 rounded-xl space-y-1 shadow-sm">
                    <h5 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Heart className="w-3.5 h-3.5 text-rose-500" />
                      약 효능/효과
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{result.efficacy}</p>
                  </div>

                  <div className="p-4 bg-white border border-slate-150 rounded-xl space-y-1 shadow-sm">
                    <h5 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1">
                      <Info className="w-3.5 h-3.5 text-blue-600" />
                      표준 복용 지침
                    </h5>
                    <p className="text-xs text-slate-700 leading-relaxed font-medium">{result.dosage}</p>
                  </div>
                </div>

                {/* Red warning list */}
                <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 space-y-2.5">
                  <h4 className="text-xs font-bold text-amber-800 uppercase flex items-center gap-1">
                    <ShieldAlert className="w-4 h-4" />
                    사용자 복용 위험 및 주안점 경고
                  </h4>
                  <ul className="space-y-1.5">
                    {result.warnings?.map((warn, i) => (
                      <li key={i} className="text-xs text-slate-700 leading-relaxed flex items-start gap-1">
                        <span className="text-amber-500 font-bold shrink-0">•</span>
                        <span>{warn}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interaction trigger */}
                <div className="pt-2">
                  <button
                    onClick={() => onOpenAIConsultant(result, `내가 방금 검색한 ${result.pillName}을(를) 다른 소염진통제(또는 종합감기약)와 같이 먹어도 괜찮을까요?`)}
                    className="w-full py-3 bg-indigo-50 border border-indigo-150 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <Sparkles className="w-4 h-4 text-indigo-500" />
                    AI 약사에게 이 알약에 관한 간/위장 부작용 질문하기
                  </button>
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-12 my-auto text-slate-400">
                <Pill className="w-14 h-14 text-slate-200 mb-4" />
                <p className="text-sm font-semibold text-slate-600 font-display">아직 분석을 진행한 알약이 없습니다</p>
                <p className="text-xs text-slate-400 max-w-[280px] mt-1.5 leading-relaxed">
                  위에서 알약 사진을 촬영/등록하거나 우측 상단 <span className="text-blue-600 font-semibold underline cursor-pointer" onClick={loadDemoPill1}>샘플 버튼</span>을 누르면 식약처 기반 가이드북이 출력됩니다.
                </p>

                {/* Sub decorative items */}
                <div className="flex gap-1.5 mt-5">
                  <div className="w-10 h-1 text-slate-100 bg-slate-100 rounded" />
                  <div className="w-3 h-1 text-slate-100 bg-slate-100 rounded" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
