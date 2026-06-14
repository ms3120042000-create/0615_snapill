import React, { useState, useEffect, useRef } from "react";
import { 
  Sparkles, Send, Bot, User, HelpCircle, Heart, ShieldAlert, Coffee, Ban, X, Trash2
} from "lucide-react";

interface Message {
  id: string;
  sender: "user" | "bot";
  text: string;
}

interface AIConsultantProps {
  isOpen: boolean;
  onClose: () => void;
  scannedContext: any; // Context of the last scanned prescription or pill
}

const QUICK_QUESTIONS = [
  { text: "☕ 커피나 차와 약을 같이 삼켜도 될까요?", val: "방금 본 약들을 커피, 녹차, 티베트 차 등 카페인 음료와 함께 복용해도 부작용 위험이나 흡수 저하가 없는지 과학적 기전 위주로 알려주세요." },
  { text: "🥛 우유나 유제품과 함께 복용해도 되나요?", val: "칼슘 수치가 높은 우유, 요플레 등의 유제품과 같이 약을 먹었을 때 상호 작용이나 약효 반감이 우려되는 품목이 있는지 진단해줘." },
  { text: "🕒 '식후 30분' 수칙은 꼭 지켜야 하나요?", val: "일반적으로 감기약, 소염진통제, 항생제를 복용 시 왜 식후 30분 또는 식사 뒤 바로 복용하라고 하는지, 공복 복용 시 일어날 수 있는 점에 대해 알려줘." },
  { text: "💊 남은 감기약 보관 방법과 유통 기한은?", val: "처방 받은 남은 조제 알약과 물약 시럽의 안전한 상온/냉장 보관 방법 및 위생적으로 처분해야 하는 권유 기한에 대해 약사로서 조언해줘." }
];

export default function AIConsultant({ isOpen, onClose, scannedContext }: AIConsultantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "msg-welcome",
      sender: "bot",
      text: "안녕하세요! 스냅필(SnaPill) 스마트 AI 상담 약사입니다. 무엇이든 편하게 여쭤보세요. (예: 음식 연관 부작용, 복용 시간 수칙 등)"
    }
  ]);
  const [inputVal, setInputVal] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // When context shifts, insert a prompt contextual hint if empty
  useEffect(() => {
    if (scannedContext && messages.length === 1) {
      setMessages(prev => [
        ...prev,
        {
          id: `context-hint-${Date.now()}`,
          sender: "bot",
          text: `🔍 환자 분석 컨텍스트로 [${scannedContext.pillName || scannedContext.diseaseName || "최근 스캔 기록"}]의 약물 정보가 준비되었습니다. 이에 맞춰 정교한 수칙을 물어보실 수 있습니다.`
        }
      ]);
    }
  }, [scannedContext]);

  // Handle scroll trigger
  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const handleSendMessage = async (textToSend: string) => {
    if (!textToSend.trim()) return;
    const userMsg: Message = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInputVal("");
    setLoading(true);

    try {
      const response = await fetch("/api/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          question: textToSend,
          context: scannedContext ? scannedContext : null
        })
      });

      if (!response.ok) {
        throw new Error("상담을 가져오지 못했습니다.");
      }

      const data = await response.json();
      if (data.success && data.answer) {
        setMessages(prev => [
          ...prev,
          {
            id: `bot-${Date.now()}`,
            sender: "bot",
            text: data.answer
          }
        ]);
      } else {
        throw new Error("답변 형식이 유효하지 않습니다.");
      }
    } catch (e: any) {
      setMessages(prev => [
        ...prev,
        {
          id: `bot-err-${Date.now()}`,
          sender: "bot",
          text: "죄송합니다. 서버 통신 상태가 일정하지 않아 약사 상담 답변을 수집하지 못했습니다. 잠시 후 재응답을 요청해주세요."
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([
      {
        id: `clear-${Date.now()}`,
        sender: "bot",
        text: "상담 내역이 안전하게 초기화되었습니다. 약물 복용 조합에 관해 새로운 질문을 기재해보세요."
      }
    ]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-full sm:w-[460px] bg-white border-l border-slate-200 z-50 shadow-2xl flex flex-col justify-between overflow-hidden animate-slide-in">
      {/* Consultant Header */}
      <div className="p-4 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="bg-white/10 p-1.5 rounded-lg">
            <Bot className="w-5 h-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-display font-bold text-sm">SnaPill 스마트 AI 전문 상담소</h3>
            <p className="text-[10px] text-slate-400">실시간 약사 대화 및 건강 비서</p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button 
            onClick={clearChat}
            className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors border border-transparent hover:border-slate-800"
            title="상담 비우기"
          >
            <Trash2 className="w-4 h-4" />
          </button>
          <button 
            onClick={onClose}
            className="p-1 hover:bg-white/10 text-slate-400 hover:text-white rounded transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages viewport */}
      <div className="flex-1 p-4 overflow-y-auto bg-slate-50 space-y-4">
        {messages.map((msg) => (
          <div 
            key={msg.id}
            className={`flex gap-2.5 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
          >
            {/* Avatar avatar */}
            <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
              msg.sender === "user" ? "bg-blue-50 text-blue-600 font-bold" : "bg-slate-200 text-slate-700"
            }`}>
              {msg.sender === "user" ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
            </div>

            {/* Content bubble */}
            <div className={`p-3 rounded-2xl text-xs leading-relaxed ${
              msg.sender === "user" 
                ? "bg-blue-600 text-white rounded-tr-none shadow-sm font-semibold" 
                : "bg-white text-slate-800 border border-slate-150 rounded-tl-none shadow-sm font-medium"
              }`}
            >
              <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-2.5 max-w-[85%]">
            <div className="w-8 h-8 rounded-full bg-slate-200 text-slate-600 flex items-center justify-center shrink-0 animate-bounce">
              <Bot className="w-4 h-4" />
            </div>
            <div className="p-3 rounded-2xl bg-white border border-slate-150 rounded-tl-none text-xs text-slate-400 flex items-center gap-1.5 shadow-sm">
              <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-ping" />
              <span>AI 약사가 대조군 답변을 연동하는 중...</span>
            </div>
          </div>
        )}
        <div ref={scrollRef} />
      </div>

      {/* Suggested Fast Actions */}
      <div className="p-3 bg-white border-t border-slate-100 space-y-2">
        <p className="text-[10px] text-slate-400 font-bold tracking-tight uppercase flex items-center gap-1">
          <HelpCircle className="w-3.5 h-3.5 text-blue-500" />
          자주 묻는 궁금증 즉시 물어보기
        </p>
        <div className="flex flex-col gap-1.5 max-h-[140px] overflow-y-auto pr-1">
          {QUICK_QUESTIONS.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.val)}
              disabled={loading}
              className="w-full text-left text-[11px] text-slate-600 bg-slate-50 hover:bg-slate-100 hover:text-blue-600 border border-slate-200 rounded-lg p-2 transition-colors cursor-pointer text-ellipsis overflow-hidden whitespace-nowrap"
            >
              {q.text}
            </button>
          ))}
        </div>
      </div>

      {/* Send Message Form */}
      <div className="p-3 bg-slate-100 border-t border-slate-200 flex gap-2">
        <input 
          type="text" 
          value={inputVal}
          onChange={(e) => setInputVal(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputVal)}
          placeholder={loading ? "준비 완료 대기 중..." : "AI 약사에게 추가 부작용 질문하기..."}
          disabled={loading}
          className="flex-1 bg-white border border-slate-200 outline-none px-3.5 py-2.5 rounded-xl text-xs font-semibold text-slate-800 focus:border-blue-500 shadow-inner"
        />
        <button
          onClick={() => handleSendMessage(inputVal)}
          disabled={loading || !inputVal.trim()}
          className="p-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl shadow-md transition-colors cursor-pointer"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
