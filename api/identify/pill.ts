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
}`,
    });

    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 식약처 의약품 통합 데이터베이스를 머릿속에 담고 있는 약품 전문 식별 AI야. 알약 표면의 음각, 글자, 제형 유형을 시각적으로 정확히 감지한 다음 공식 제품명과 복용 방법, 위장장애 주의점 등을 풍부한 한국어 JSON으로 안내해줘.",
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
