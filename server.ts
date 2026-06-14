import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import * as dotenv from "dotenv";

// Load local environment variables if available
dotenv.config();

// Ensure the API key is accessible (graceful initialization)
const apiKey = process.env.GEMINI_API_KEY;

let ai: GoogleGenAI | null = null;
if (apiKey) {
  ai = new GoogleGenAI({
    apiKey: apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
} else {
  console.warn("⚠️ [SnaPill Server] WARNING: GEMINI_API_KEY environment variable is not set. Gemini endpoints will return fallback data or instructions.");
}

const app = express();
const PORT = 3000;

// High body limits so smartphone camera pictures can load fine (base64 can be large)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Express API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", firebaseAvailable: false, geminiConfigured: !!apiKey });
});

// Helper to convert base64 payload to clean part for Gemini
function getGeminiImagePart(base64DataUrl: string) {
  // Extract data type and actual base64 bytes
  // e.g., "data:image/png;base64,iVBORw0KGgoAAA..."
  const match = base64DataUrl.match(/^data:([^;]+);base64,(.+)$/);
  if (match) {
    return {
      inlineData: {
        mimeType: match[1],
        data: match[2],
      },
    };
  }
  
  // Return default format or guess
  return {
    inlineData: {
      mimeType: "image/jpeg",
      data: base64DataUrl.replace(/^data:image\/[a-z]+;base64,/, ""),
    },
  };
}

// 🩺 API Endpoint: Prescription Analyzer
app.post("/api/identify/prescription", async (req, res) => {
  const { image } = req.body;

  if (!image) {
    return res.status(400).json({ error: "처방전 이미지 데이터를 찾을 수 없습니다." });
  }

  try {
    if (!ai) {
      throw new Error("Gemini API가 서버에 세팅되어 있지 않습니다. 관리자에게 문의바랍니다.");
    }

    const imagePart = getGeminiImagePart(image);
    
    const prompt = `
      처방전 이미지를 상세하게 분석하여 처방된 개별 의약품 및 처방정보를 추출하고 정확한 의학 정보를 기반으로 설명해줘.
      절대로 임의의 데이터를 생성하지 말고, 이미지에서 판독하기 어렵거나 없는 정보는 비워두거나 안전지침에 기반해서 효능을 설명해줘.
      모든 필드는 한국어로 기재해줘.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: [imagePart, prompt],
      config: {
        systemInstruction: "너는 복약 전문 약사이자 의료 데이터 추출 전문가야. 처방전에 포함된 의료 한자어, 축약어, 영어 명칭을 분석하여 환자가 쉽게 이해할 수 있는 명확한 한국식 약 정보와 복약 안전 주의사항(같이 먹으면 안 되는 음식, 질병 위험, 취침 시간 연관성 등)을 구조화하여 정확한 한국어로 포맷팅해야 해.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            diseaseName: { type: Type.STRING, description: "처방전에 명시된 환자의 추정 질병 혹은 질병 분류기혹(예: 급성 기관지염, 인두염, 또는 판독 불가 시 빈칸)" },
            prescriptionDate: { type: Type.STRING, description: "처방일에 적힌 날짜 (예: 2026-06-14 또는 확인 불가 시 금일 날짜)" },
            institutionName: { type: Type.STRING, description: "의기관명 또는 병원명 (예: 서울튼튼이비인후과의원, 혹은 확인 불가 시 병원/약품 제조처)" },
            drugs: {
              type: Type.ARRAY,
              description: "처방된 개별 의약품 리스트",
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING, description: "의약품명 또는 고유한 상품명 (예: 베아제정, 뮤코펙트정 등)" },
                  ingredients: { type: Type.STRING, description: "주성분 명 및 개별 한 단위 함량 (예: 아세트아미노펜 325mg)" },
                  strength: { type: Type.STRING, description: "함량/규격 (예: 500mg, 1정 등)" },
                  oneDose: { type: Type.STRING, description: "1회 투약량 (예: 1정, 1.5캅셀, 5ml 등)" },
                  dailyFrequency: { type: Type.STRING, description: "1일 투약횟수 (예: 3회, 2회)" },
                  duration: { type: Type.STRING, description: "투약일수 (예: 5일, 7일)" },
                  category: { type: Type.STRING, description: "의약품 분류 효능군 (예: 진해거담제, 해열 소염 진통제)" },
                  efficacy: { type: Type.STRING, description: "해당 약물의 일반적 치료 목적 및 효능 (예: 가래 완화 및 기관지 정화)" },
                  precaution: { type: Type.STRING, description: "환자가 해당 약을 먹을 때 주의해야 할 세부 정보 (예: 졸음 유발, 충분한 물과 복용)" }
                },
                required: ["name", "ingredients", "strength", "oneDose", "dailyFrequency", "duration", "category", "efficacy", "precaution"]
              }
            },
            generalPrecautions: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "전체 처방 의약품 조합 시 주의해야 할 다른 물질(예: 알코올, 카페인, 유제품)과의 병용 충돌 및 복약 시간대 가이드(식사 후 30분 등)를 상세히 담은 환자별 맞춤형 종합 안내사항 3~4개"
            }
          },
          required: ["diseaseName", "prescriptionDate", "institutionName", "drugs", "generalPrecautions"]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, results: parsedData });
    
  } catch (err: any) {
    console.error("Prescription Analysis Error:", err);
    return res.status(500).json({ 
      error: "처방전 사진 분석 중 문제가 발생했습니다.",
      details: err.message || err.toString()
    });
  }
});

// 💊 API Endpoint: Pill Identifier (Front & Back multi-analysis)
app.post("/api/identify/pill", async (req, res) => {
  const { frontImage, backImage, shapeHint, colorHint, textHint } = req.body;

  if (!frontImage && !backImage) {
    return res.status(400).json({ error: "알약 분석을 위한 미지가 존재하지 않습니다. 앞면 또는 뒷면 이미지를 업로드해주세요." });
  }

  try {
    if (!ai) {
      throw new Error("Gemini API가 서버에 세팅되어 있지 않습니다. 관리자에게 문의바랍니다.");
    }

    const contentsParts: any[] = [];
    
    if (frontImage) {
      contentsParts.push(getGeminiImagePart(frontImage));
    }
    if (backImage) {
      contentsParts.push(getGeminiImagePart(backImage));
    }

    const promptText = `
      업로드된 알약의 앞/뒷면 이미지를 입체적으로 관찰하고 검색하여 한국 식약처에 등록된 실제 정명 또는 가장 유사한 기성의약품을 매칭 및 식별해줘.
      
      사용자가 전달한 조건은 다음과 같아:
      - 형태 힌트: ${shapeHint || "없음"}
      - 색상 힌트: ${colorHint || "없음"}
      - 약 식별 번호/문자 힌트: ${textHint || "없음"}
      
      이 기재된 힌트와 알약 표면의 음각 문자(예: 'KD', 'YSP', '▲', 분할선 비율 등), 형태, 색깔을 고루 대조하여 실제 유력 제품 정보를 정확히 산출해야 해.
      만약 완벽히 일치하는 알약이 무엇인지 명확하지 않다면, 사용자가 기재한 표면 음각 및 색상에 가장 걸맞는 대한민국 유통 빈도 1순위 대표 약제(에: 타이레놀(하얀색 타원형), 탁센(초록색 연질캡슐) 등)를 추천하고 정보를 서술해줘.
      
      반드시 다음 응답 스키마에 부합하는 한글 JSON 객체를 리턴해야 해.
    `;

    contentsParts.push({ text: promptText });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contentsParts,
      config: {
        systemInstruction: "너는 식약처 의약품 통합 데이터베이스를 머릿속에 담고 있는 약품 전문 식별 AI야. 알약 표면의 양식, 음각, 글자, 제형 유형을 시각적으로 정확히 감지한 다음 공식 제품명과 복용 방법, 주의해야 할 임상 간독성/위장장애 주의점 등을 풍부한 한국어로 안내해줘.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            pillName: { type: Type.STRING, description: "의약품 제조명 전체 및 용량단위 (예: 아스피린프로텍트정 100mg, 타이레놀정 500mg)" },
            manufacturer: { type: Type.STRING, description: "제조사 또는 수입 회사 상호명 (예: 바이엘코리아(주))" },
            shape: { type: Type.STRING, description: "알약 기하학적 형상 (예: 원형, 타원형, 팔각형, 장방형 등)" },
            color: { type: Type.STRING, description: "알약의 표면 색상 (예: 노란색, 양면 연두색, 흰색 등)" },
            frontMarking: { type: Type.STRING, description: "앞면 음각 글상태/기호 식별 (예: C 분할선 100 또는 무늬)" },
            backMarking: { type: Type.STRING, description: "뒷면 기호/음각 문자 (예: BAYER 심볼 또는 기재 없음)" },
            formulation: { type: Type.STRING, description: "제형 종류 (예: 장용성 정제, 연질캡슐, 필름코팅 서방정 등)" },
            mainIngredients: { type: Type.STRING, description: "주성분 성분명과 함량 (예: 아스피린 100mg)" },
            efficacy: { type: Type.STRING, description: "주요 효능 및 처방 타겟 효과 (예: 혈전 형성 억제 및 뇌졸중 위험 감소)" },
            dosage: { type: Type.STRING, description: "한국 기준 기본 성인 섭취량 가이드 및 섭취 주기 (예: 성인 1일 1회 1정 식후 복용)" },
            warnings: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "이 약물을 복용하는 동안 극히 준수해야 할 위험 상황 경고 3~4가지 (예: 위출혈 유발 가능, 치과 치료 전 일시 중단 필요, 수유 중 금기 등)"
            }
          },
          required: [
            "pillName", "manufacturer", "shape", "color", 
            "frontMarking", "backMarking", "formulation", 
            "mainIngredients", "efficacy", "dosage", "warnings"
          ]
        }
      }
    });

    const parsedData = JSON.parse(response.text || "{}");
    return res.json({ success: true, results: parsedData });

  } catch (err: any) {
    console.error("Pill Identification Error:", err);
    return res.status(500).json({
      error: "알약 앞뒤 분석 및 식별 과정에서 서버 내부 에러가 생겼습니다.",
      details: err.message || err.toString()
    });
  }
});

// 🤖 API Endpoint: General Medical Query Chat (AI 약사 상담)
app.post("/api/ask", async (req, res) => {
  const { question, context } = req.body;

  if (!question) {
    return res.status(400).json({ error: "질문 내용이 없습니다." });
  }

  try {
    if (!ai) {
      throw new Error("Gemini API가 서버에 세팅되어 있지 않습니다. 관리자에게 문의바랍니다.");
    }

    const systemPrompt = `
      너는 '스냅필(SnaPill)' 서비스의 상냥하고 신속한 인공지능 전문 약사야.
      소비자가 약물의 성분, 성질, 복용 시 음식 궁합, 유통기한, 보관방법, 특정 증상에 먹을 수 있는지 여부를 질문할 때 전문적이며서도 환자 친화적으로 한국어로 답변해주어야 해.
      
      답변 구성 시 다음 형태를 권장해:
      1. 친근한 환영과 신속한 메인 답변 요약
      2. 2-3가지 상세 가이드 또는 음식 조합 (예: 같이 먹으면 좋은 영양제, 나쁜 약 등)
      3. 전문 의료인의 진료를 꼭 받으라는 신중한 권고문구 포함
    `;

    const contents = [];
    if (context) {
      contents.push({ text: `참고 정보 (현재 조회중인 약물/처방 데이터): ${JSON.stringify(context)}` });
    }
    contents.push({ text: question });

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: contents,
      config: {
        systemInstruction: systemPrompt,
      }
    });

    return res.json({ success: true, answer: response.text });
  } catch (err: any) {
    console.error("AI Chat Assistant Error:", err);
    return res.status(500).json({
      error: "상담 중 원활하지 않은 에러가 발생했습니다.",
      details: err.message || err.toString()
    });
  }
});


// --- VITE MIDDLEWARE SETUP ---
// Start server in development mode using Vite Middleware, or static folders in production.
async function configureServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("⚡ [SnaPill Server] Vite development middleware loaded.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
    console.log("📦 [SnaPill Server] Production static file server mounted.");
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [SnaPill] Server is running at http://localhost:${PORT}`);
  });
}

configureServer();
