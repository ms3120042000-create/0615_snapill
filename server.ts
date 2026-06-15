import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import OpenAI from "openai";
import * as dotenv from "dotenv";

// Load local environment variables if available
dotenv.config();

// Ensure the API key is accessible (graceful initialization)
const apiKey = process.env.OPENAI_API_KEY;

let ai: OpenAI | null = null;
if (apiKey) {
  ai = new OpenAI({ apiKey });
} else {
  console.warn("⚠️ [SnaPill Server] WARNING: OPENAI_API_KEY environment variable is not set. OpenAI endpoints will return errors.");
}

const app = express();
const PORT = 3000;

// High body limits so smartphone camera pictures can load fine (base64 can be large)
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

// Express API: Health Check
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", firebaseAvailable: false, openaiConfigured: !!apiKey });
});

// Helper to build OpenAI image_url content part from base64 data URL
function getOpenAIImagePart(base64DataUrl: string): OpenAI.Chat.ChatCompletionContentPartImage {
  return {
    type: "image_url",
    image_url: { url: base64DataUrl, detail: "high" },
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
      throw new Error("OpenAI API가 서버에 세팅되어 있지 않습니다. 관리자에게 문의바랍니다.");
    }

    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "너는 복약 전문 약사이자 의료 데이터 추출 전문가야. 처방전에 포함된 의료 한자어, 축약어, 영어 명칭을 분석하여 환자가 쉽게 이해할 수 있는 명확한 한국식 약 정보와 복약 안전 주의사항을 구조화하여 정확한 한국어 JSON으로 반환해야 해."
        },
        {
          role: "user",
          content: [
            getOpenAIImagePart(image),
            {
              type: "text",
              text: `처방전 이미지를 상세하게 분석하여 처방된 개별 의약품 및 처방정보를 추출하고 정확한 의학 정보를 기반으로 설명해줘.
절대로 임의의 데이터를 생성하지 말고, 이미지에서 판독하기 어렵거나 없는 정보는 빈 문자열로 두거나 안전지침에 기반해서 효능을 설명해줘.
모든 필드는 한국어로 기재해줘.

다음 JSON 구조로 정확히 반환해줘:
{
  "diseaseName": "처방전에 명시된 환자의 추정 질병명 (예: 급성 기관지염)",
  "prescriptionDate": "처방일 (예: 2026-06-14)",
  "institutionName": "의료기관명 또는 병원명",
  "drugs": [
    {
      "name": "의약품명",
      "ingredients": "주성분 명 및 함량 (예: 아세트아미노펜 325mg)",
      "strength": "함량/규격 (예: 500mg)",
      "oneDose": "1회 투약량 (예: 1정)",
      "dailyFrequency": "1일 투약횟수 (예: 3회)",
      "duration": "투약일수 (예: 5일)",
      "category": "의약품 분류 효능군 (예: 해열 소염 진통제)",
      "efficacy": "해당 약물의 치료 목적 및 효능",
      "precaution": "복용 시 주의사항"
    }
  ],
  "generalPrecautions": ["전체 처방 약물 조합 주의사항 3~4개"]
}`
            }
          ]
        }
      ]
    });

    const rawText = response.choices[0]?.message?.content;
    if (!rawText) {
      return res.status(422).json({ error: "AI가 처방전 내용을 인식하지 못했습니다. 더 선명한 이미지로 다시 시도해주세요." });
    }
    let parsedData: any;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      console.error("[SnaPill] OpenAI returned non-JSON text (prescription):", rawText.slice(0, 200));
      return res.status(422).json({ error: "AI 응답 파싱에 실패했습니다. 처방전 전체가 포함된 선명한 이미지를 사용해주세요." });
    }
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
    return res.status(400).json({ error: "알약 분석을 위한 이미지가 존재하지 않습니다. 앞면 또는 뒷면 이미지를 업로드해주세요." });
  }

  try {
    if (!ai) {
      throw new Error("OpenAI API가 서버에 세팅되어 있지 않습니다. 관리자에게 문의바랍니다.");
    }

    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [];

    if (frontImage) userContent.push(getOpenAIImagePart(frontImage));
    if (backImage) userContent.push(getOpenAIImagePart(backImage));

    userContent.push({
      type: "text",
      text: `업로드된 알약의 앞/뒷면 이미지를 입체적으로 관찰하고 한국 식약처에 등록된 실제 제품명 또는 가장 유사한 기성의약품을 매칭 및 식별해줘.

사용자가 전달한 조건:
- 형태 힌트: ${shapeHint || "없음"}
- 색상 힌트: ${colorHint || "없음"}
- 약 식별 번호/문자 힌트: ${textHint || "없음"}

다음 JSON 구조로 정확히 반환해줘:
{
  "pillName": "의약품 제조명 전체 및 용량단위 (예: 타이레놀정 500mg)",
  "manufacturer": "제조사 또는 수입 회사 상호명",
  "shape": "알약 기하학적 형상 (예: 원형, 타원형)",
  "color": "알약의 표면 색상",
  "frontMarking": "앞면 음각 글자/기호",
  "backMarking": "뒷면 음각 글자/기호 (없으면 '없음')",
  "formulation": "제형 종류 (예: 필름코팅정, 연질캡슐)",
  "mainIngredients": "주성분 성분명과 함량",
  "efficacy": "주요 효능 및 처방 타겟 효과",
  "dosage": "한국 기준 기본 성인 섭취량 가이드 및 섭취 주기",
  "warnings": ["복용 시 위험 경고 3~4가지"]
}`
    });

    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content: "너는 식약처 의약품 통합 데이터베이스를 머릿속에 담고 있는 약품 전문 식별 AI야. 알약 표면의 음각, 글자, 제형 유형을 시각적으로 정확히 감지한 다음 공식 제품명과 복용 방법, 위장장애 주의점 등을 풍부한 한국어 JSON으로 안내해줘."
        },
        { role: "user", content: userContent }
      ]
    });

    const rawTextPill = response.choices[0]?.message?.content;
    if (!rawTextPill) {
      return res.status(422).json({ error: "AI가 알약 이미지를 인식하지 못했습니다. 더 선명한 이미지로 다시 시도해주세요." });
    }
    let parsedData: any;
    try {
      parsedData = JSON.parse(rawTextPill);
    } catch {
      console.error("[SnaPill] OpenAI returned non-JSON text (pill):", rawTextPill.slice(0, 200));
      return res.status(422).json({ error: "AI 응답 파싱에 실패했습니다. 더 선명한 알약 이미지를 사용해주세요." });
    }
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
      throw new Error("OpenAI API가 서버에 세팅되어 있지 않습니다. 관리자에게 문의바랍니다.");
    }

    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `너는 '스냅필(SnaPill)' 서비스의 상냥하고 신속한 인공지능 전문 약사야.
소비자가 약물의 성분, 성질, 복용 시 음식 궁합, 유통기한, 보관방법, 특정 증상에 먹을 수 있는지 여부를 질문할 때 전문적이면서도 환자 친화적으로 한국어로 답변해주어야 해.

답변 구성:
1. 친근한 환영과 신속한 메인 답변 요약
2. 2-3가지 상세 가이드 또는 음식 조합 (예: 같이 먹으면 좋은 영양제, 나쁜 약 등)
3. 전문 의료인의 진료를 꼭 받으라는 신중한 권고문구 포함`
      }
    ];

    if (context) {
      messages.push({
        role: "user",
        content: `참고 정보 (현재 조회중인 약물/처방 데이터): ${JSON.stringify(context)}`
      });
      messages.push({ role: "assistant", content: "네, 해당 약물/처방 정보를 참고하여 답변드리겠습니다." });
    }

    messages.push({ role: "user", content: question });

    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      messages,
    });

    return res.json({ success: true, answer: response.choices[0]?.message?.content });
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

  // Global JSON error handler — must come after all routes and middleware
  // Ensures Express body-parser errors (413, 400) return JSON, not HTML
  app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (res.headersSent) return next(err);
    const status = err.status || err.statusCode || 500;
    console.error(`[SnaPill] Express error (${status}):`, err.message || err);
    res.status(status).json({ error: err.message || "서버 오류가 발생했습니다." });
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`🚀 [SnaPill] Server is running at http://localhost:${PORT}`);
  });
}

configureServer();
