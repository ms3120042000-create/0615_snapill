import React, { useState, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  FileText, Upload, Calendar, Building, Sparkles, CheckCircle2, 
  AlertCircle, HelpCircle, RefreshCw, Layers, Plus, ShoppingBag, Eye 
} from "lucide-react";
import { PrescriptionAnalysisResult } from "../types";
import { SAMPLE_PRESCRIPTION_IMAGE, SAMPLE_PRESCRIPTION_DATA } from "../data";

interface PrescriptionAnalyzerProps {
  onAddHistory: (title: string, data: PrescriptionAnalysisResult) => void;
  onOpenAIConsultant: (results: any, initialQuestion?: string) => void;
}

export default function PrescriptionAnalyzer({ onAddHistory, onOpenAIConsultant }: PrescriptionAnalyzerProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<PrescriptionAnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const [addedToHistory, setAddedToHistory] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Convert uploaded image to base64
  const handleImageFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("이미지 형식의 파일만 수록할 수 있습니다.");
      return;
    }
    setError(null);
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setSelectedImage(e.target.result as string);
        setResult(null);
        setAddedToHistory(false);
      }
    };
    reader.onerror = () => {
      setError("파일을 읽어들이는 중 오류가 발생했습니다.");
    };
    reader.readAsDataURL(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleImageFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleImageFile(e.target.files[0]);
    }
  };

  // Run Real Server Analysis
  const runAnalysis = async () => {
    if (!selectedImage) return;
    setAnalyzing(true);
    setError(null);

    try {
      const response = await fetch("/api/identify/prescription", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ image: selectedImage }),
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
        onAddHistory(
          `${resData.results.institutionName || "처방전 분석"} - ${resData.results.diseaseName?.split("(")[0]?.trim() || "질환약"}`, 
          resData.results
        );
        setAddedToHistory(true);
      } else {
        throw new Error("올바른 파싱 결과 데이터를 받지 못했습니다.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "이미지 처리에 실패하였습니다. 더 투명하고 또렷한 조명의 이미지로 다시 시도해보세요.");
    } finally {
      setAnalyzing(false);
    }
  };

  // Skip & load mock sample
  const loadDemoSample = () => {
    setSelectedImage(SAMPLE_PRESCRIPTION_IMAGE);
    setResult(SAMPLE_PRESCRIPTION_DATA);
    onAddHistory("한울가정의학과 처방약 목록", SAMPLE_PRESCRIPTION_DATA);
    setAddedToHistory(true);
    setError(null);
  };

  const resetAll = () => {
    setSelectedImage(null);
    setResult(null);
    setError(null);
    setAddedToHistory(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h2 className="text-xl md:text-2xl font-display font-semibold tracking-tight text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-blue-50 rounded-lg text-blue-600">
              <FileText className="w-5 h-5 md:w-6 md:h-6" />
            </span>
            처방전 사진 분석 (스캔)
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            처방전 사진을 촬영 또는 업로드하면 성분명, 효능, 하루 먹는 주기 및 부작용 정보를 알기 쉽게 번역해 드립니다.
          </p>
        </div>

        <div className="flex gap-2">
          {!result && (
            <button 
              onClick={loadDemoSample}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <Eye className="w-3.5 h-3.5" />
              체험용 샘플 가져오기
            </button>
          )}
          {(selectedImage || result) && (
            <button 
              onClick={resetAll}
              className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-100 transition-colors text-xs font-semibold rounded-lg flex items-center gap-1.5 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              새로 스캔하기
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left column: Image Upload / Capture Section */}
        <div className="lg:col-span-4 space-y-4">
          <div className="font-display font-medium text-slate-700 text-sm flex items-center gap-1.5">
            <span>1단계: 처방전 등록</span>
          </div>

          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`relative rounded-xl border-2 border-dashed transition-all flex flex-col items-center justify-center p-6 text-center h-[340px] overflow-hidden ${
              selectedImage ? "border-blue-200 bg-slate-50" : dragActive ? "border-blue-500 bg-blue-50/50" : "border-slate-200 hover:border-blue-300 bg-white"
            }`}
          >
            {selectedImage ? (
              <div className="absolute inset-0 w-full h-full flex flex-col justify-between p-3 z-10">
                <img 
                  src={selectedImage} 
                  alt="Prescription uploaded" 
                  className="absolute inset-0 w-full h-full object-contain pointer-events-none" 
                />
                <div className="absolute inset-0 bg-slate-900/40" />

                <div className="self-end z-20">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-white/90 hover:bg-white text-slate-800 backdrop-blur-sm shadow-sm transition-all text-xs font-semibold px-2.5 py-1.5 rounded-lg border border-slate-200"
                  >
                    사진 교체
                  </button>
                </div>

                {!result && !analyzing && (
                  <div className="w-full mt-auto z-20 px-2 pb-2">
                    <button
                      onClick={runAnalysis}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow-md hover:shadow-lg transition-all text-sm flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Sparkles className="w-4 h-4" />
                      처방전 즉시 스캔하기
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex flex-col items-center cursor-pointer py-10" onClick={() => fileInputRef.current?.click()}>
                <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center shadow-inner mb-4">
                  <Upload className="w-6 h-6 animate-pulse" />
                </div>
                <p className="text-sm font-semibold text-slate-800">처방전 사진 파일 올리기</p>
                <p className="text-xs text-slate-400 mt-1 max-w-[200px] leading-relaxed">
                  이 영역을 누르거나 처방전 이미지 파일을 끌어다 놓으세요.
                </p>
                <div className="flex items-center gap-2 mt-4">
                  <span className="text-[10px] uppercase font-display font-semibold tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">JPG</span>
                  <span className="text-[10px] uppercase font-display font-semibold tracking-wider text-slate-400 bg-slate-100 px-2 py-0.5 rounded">PNG</span>
                </div>
              </div>
            )}

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInputChange}
              accept="image/*"
              className="hidden"
            />

            {/* Scanning Indicator Overlay */}
            <AnimatePresence>
              {analyzing && (
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="absolute inset-0 bg-slate-950/75 flex flex-col items-center justify-center p-4 z-30"
                >
                  <div className="relative w-28 h-28 flex items-center justify-center border-4 border-blue-500/20 rounded-full">
                    {/* Laser scanning bar */}
                    <motion.div 
                      key="scanner-laser"
                      animate={{ top: ["10%", "90%", "10%"] }}
                      transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                      className="absolute left-1/10 w-[80%] h-0.5 bg-blue-400 shadow-[0_0_12px_4px_rgba(37,99,235,0.8)]"
                    />
                    <Sparkles className="w-10 h-10 text-blue-400 animate-spin" />
                  </div>
                  <h3 className="text-white text-sm font-semibold mt-6 flex items-center gap-2">
                    Gemini AI가 처방전을 읽는 중...
                  </h3>
                  <p className="text-xs text-slate-400 mt-2 text-center max-w-[220px] leading-relaxed">
                    의료용 한자와 약제 성분을 대조하여 안전 가이드를 조립하고 있습니다.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-100 text-red-600 text-xs rounded-xl flex gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <div>
                <p className="font-semibold">오류 안내</p>
                <p className="mt-0.5 leading-relaxed">{error}</p>
              </div>
            </div>
          )}
        </div>

        {/* Right column: Results Section */}
        <div className="lg:col-span-8">
          <div className="font-display font-medium text-slate-700 text-sm mb-4">
            <span>2단계: 분석 결과 상세 {result && <span className="text-blue-600 font-bold ml-1">(식별 완료)</span>}</span>
          </div>

          <div className="min-h-[340px] bg-white rounded-xl border border-slate-200 p-5 shadow-sm flex flex-col justify-between">
            {result ? (
              <div className="space-y-6">
                
                {/* Outpatient Hospital Metadata Card */}
                <div className="p-4 bg-slate-50 border border-slate-100 rounded-xl grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2.5">
                    <Building className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">진료 의료기관</p>
                      <p className="text-sm font-semibold text-slate-800">{result.institutionName || "(미확인)"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4.5 h-4.5 text-slate-400 shrink-0" />
                    <div>
                      <p className="text-[10px] text-slate-400 font-medium">처방/발행일자</p>
                      <p className="text-sm font-semibold text-slate-800">{result.prescriptionDate || "2026-06-14"}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <Layers className="w-4.5 h-4.5 text-blue-500 shrink-0" />
                    <div>
                      <p className="text-[10px] text-blue-500 font-medium">추정 질병/원인명</p>
                      <p className="text-sm font-semibold text-slate-800 truncate" title={result.diseaseName}>
                        {result.diseaseName || "판독 중인 내과 질환"}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Plural Drug Cards Grid */}
                <div className="space-y-4">
                  <h4 className="text-xs font-bold text-slate-400 tracking-wider uppercase flex items-center justify-between">
                    <span>처방 약품 목록 (총 {result.drugs?.length || 0}종)</span>
                    <span className="text-[11px] text-slate-500 normal-case font-normal">약품을 복용 전 상세 성분을 확인해 보세요.</span>
                  </h4>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {result.drugs?.map((drug, index) => (
                      <div key={drug.id || index} className="p-4 bg-white border border-slate-200 hover:border-blue-300 transition-all rounded-xl relative overflow-hidden flex flex-col justify-between group">
                        <div className="absolute top-0 left-0 w-1.5 h-full bg-blue-600" />
                        
                        <div>
                          <div className="flex justify-between items-start gap-2 mb-1 pl-2">
                            <h5 className="font-semibold text-slate-800 text-sm group-hover:text-blue-600 transition-colors leading-snug">
                              {drug.name}
                            </h5>
                          </div>

                          <div className="pl-2 space-y-1.5 mt-2">
                            <p className="text-xs text-slate-500">
                              <span className="font-medium text-slate-700">성분:</span> {drug.ingredients} {drug.strength && `(${drug.strength})`}
                            </p>
                            <p className="text-xs text-slate-500">
                              <span className="font-medium text-slate-700">효능:</span> {drug.efficacy}
                            </p>
                            <p className="text-xs text-slate-750 bg-slate-50 p-1.5 rounded border border-slate-200/50 font-medium">
                              ⚠️ {drug.precaution}
                            </p>
                          </div>
                        </div>

                        {/* Dose Scheduler Badge Strip */}
                        <div className="grid grid-cols-3 gap-1 bg-slate-50 p-1.5 rounded-lg text-center mt-3 ml-2 text-[10px] text-slate-500 border border-slate-100">
                          <div>
                            <span className="block text-slate-400 font-medium">1회 투여</span>
                            <span className="font-semibold text-slate-800">{drug.oneDose}</span>
                          </div>
                          <div className="border-x border-slate-200">
                            <span className="block text-slate-400 font-medium">하루 횟수</span>
                            <span className="font-semibold text-slate-800">{drug.dailyFrequency}</span>
                          </div>
                          <div>
                            <span className="block text-slate-400 font-medium">처방 기간</span>
                            <span className="font-semibold text-blue-600">{drug.duration}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comprehensive Alerts Guide */}
                <div className="p-4 bg-blue-50/70 rounded-xl border border-blue-100">
                  <h5 className="text-sm font-bold text-blue-800 flex items-center gap-1.5 mb-3">
                    <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    스냅필 종합 복약 가이드 및 주의사항
                  </h5>
                  <ul className="space-y-2">
                    {result.generalPrecautions?.map((prec, i) => (
                      <li key={i} className="text-xs text-slate-700 flex items-start gap-1.5 leading-relaxed">
                        <span className="text-blue-500 mt-1 shrink-0">•</span>
                        <span>{prec}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Interactive Consultation / History Saving Trigger */}
                <div className="flex flex-col md:flex-row gap-2 pt-2">
                  <button
                    onClick={() => onOpenAIConsultant(result, "처방전에 위장약이나 항생제가 포함되어 있는데 식후 바로 먹어야 하나요?")}
                    className="flex-1 py-3 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 cursor-pointer border border-indigo-200/50"
                  >
                    <Sparkles className="w-4 h-4" />
                    AI 약사에게 식습관 연관 복용상담 구하기
                  </button>

                  {addedToHistory && (
                    <div className="py-2 px-3 text-blue-600 bg-blue-50 text-xs font-semibold rounded-xl flex items-center justify-center gap-1.5 border border-blue-200">
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                      내 복약 수첩 기록 저장됨
                    </div>
                  )}
                </div>

              </div>
            ) : (
              <div className="flex flex-col items-center justify-center text-center py-10 my-auto text-slate-400">
                <FileText className="w-14 h-14 text-slate-200 mb-3" />
                <p className="text-sm font-semibold text-slate-600">등록된 수집 분석표가 없습니다</p>
                <p className="text-xs text-slate-400 max-w-[280px] mt-1 leading-relaxed">
                  왼쪽 창에서 처방전을 업로드하거나 <span className="text-blue-500 font-semibold underline cursor-pointer" onClick={loadDemoSample}>체험용 샘플 들여오기</span>를 클릭하여 결과 포맷을 시연해 보세요.
                </p>
                
                {/* Visual grid aid */}
                <div className="flex gap-1.5 mt-5">
                  <div className="w-8 h-2 bg-slate-100 rounded-full" />
                  <div className="w-3 h-2 bg-slate-100 rounded-full" />
                  <div className="w-12.5 h-2 bg-slate-100 rounded-full" />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
