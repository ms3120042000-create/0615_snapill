import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "50mb",
    },
  },
};

const apiKey = process.env.OPENAI_API_KEY;
const ai = apiKey ? new OpenAI({ apiKey }) : null;

function getImagePart(base64DataUrl: string): OpenAI.Chat.ChatCompletionContentPartImage {
  return {
    type: "image_url",
    image_url: { url: base64DataUrl, detail: "high" },
  };
}

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { frontImage, backImage, shapeHint, colorHint, textHint } = req.body;

  if (!frontImage && !backImage) {
    return res.status(400).json({ error: "알약 분석을 위한 이미지가 존재하지 않습니다. 앞면 또는 뒷면 이미지를 업로드해주세요." });
  }

  if (!ai) {
    return res.status(500).json({ error: "OpenAI API가 서버에 세팅되어 있지 않습니다. 관리자에게 문의바랍니다." });
  }

  try {
    const userContent: OpenAI.Chat.ChatCompletionContentPart[] = [];

    if (frontImage) userContent.push(getImagePart(frontImage));
    if (backImage) userContent.push(getImagePart(backImage));

    userContent.push({
      type: "text",
      text: `알약 이미지를 분석하고 한국 식약처에 등록된 실제 의약품을 식별해줘.

사용자 힌트:
- 형태: ${shapeHint || "없음"}
- 색상: ${colorHint || "없음"}
- 각인/식별 번호: ${textHint || "없음"}

[필수 작성 규칙]
1. 이미지에서 각인 문자나 약품명을 읽었다면, mainIngredients·efficacy·dosage·warnings는 반드시 의약품 DB 지식으로 채워줘.
2. 이미지에 성분이 적혀 있지 않아도 약품명이 확인됐으면 공식 정보로 채워야 해. 절대 빈 문자열로 두지 마.
3. 약품명조차 전혀 판독 불가인 경우에만 "판독 불가"라고 써줘.
4. warnings는 항상 3가지 이상 작성해줘.

다음 JSON 구조로 반환해줘:
{
  "pillName": "의약품 전체명 및 용량 (예: 타이레놀정 500mg)",
  "manufacturer": "제조사명",
  "shape": "형태 (예: 원형, 타원형)",
  "color": "색상",
  "frontMarking": "앞면 각인 문자/기호",
  "backMarking": "뒷면 각인 (없으면 '없음')",
  "formulation": "제형 (예: 필름코팅정)",
  "mainIngredients": "주성분명과 함량 — 약품명 확인 시 반드시 작성",
  "efficacy": "효능 및 치료 목적 — 약품명 확인 시 반드시 작성",
  "dosage": "성인 복용 방법 및 주기 — 약품명 확인 시 반드시 작성",
  "warnings": ["주의사항 3~4가지 — 반드시 작성"]
}`,
    });

    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 식약처 의약품 통합 데이터베이스를 머릿속에 담고 있는 약품 전문 식별 AI야. 알약 표면의 음각, 글자, 제형 유형을 시각적으로 정확히 감지해. 중요: 이미지에서 약품명이나 각인 문자를 식별했다면 mainIngredients·efficacy·dosage·warnings는 반드시 너의 의약품 지식으로 채워줘. 이미지에 성분이 안 보인다고 빈 문자열로 두면 안 돼. 약품명이 확인된 경우엔 공식 약품 정보 기반으로 반드시 작성하고, 정말 약품명조차 판독 불가인 경우에만 빈 값으로 둬. 모든 내용은 풍부한 한국어로 작성해.",
        },
        { role: "user", content: userContent },
      ],
    });

    const rawText = response.choices[0]?.message?.content;
    if (!rawText) {
      return res.status(422).json({ error: "AI가 알약 이미지를 인식하지 못했습니다. 더 선명한 이미지로 다시 시도해주세요." });
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      return res.status(422).json({ error: "AI 응답 파싱에 실패했습니다. 더 선명한 알약 이미지를 사용해주세요." });
    }

    return res.json({ success: true, results: parsedData });
  } catch (err: any) {
    console.error("Pill Identification Error:", err);
    return res.status(500).json({
      error: "알약 앞뒤 분석 및 식별 과정에서 서버 내부 에러가 생겼습니다.",
      details: err.message || err.toString(),
    });
  }
}
