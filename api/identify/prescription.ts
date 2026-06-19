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

  const { image } = req.body;
  if (!image) {
    return res.status(400).json({ error: "처방전 이미지 데이터를 찾을 수 없습니다." });
  }

  if (!ai) {
    return res.status(500).json({ error: "OpenAI API가 서버에 세팅되어 있지 않습니다. 관리자에게 문의바랍니다." });
  }

  try {
    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 복약 전문 약사이자 의료 데이터 추출 전문가야. 처방전에 포함된 의료 한자어, 축약어, 영어 명칭을 분석하여 환자가 쉽게 이해할 수 있는 명확한 한국식 약 정보와 복약 안전 주의사항을 구조화하여 정확한 한국어 JSON으로 반환해야 해.",
        },
        {
          role: "user",
          content: [
            getImagePart(image),
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
}`,
            },
          ],
        },
      ],
    });

    const rawText = response.choices[0]?.message?.content;
    if (!rawText) {
      return res.status(422).json({ error: "AI가 처방전 내용을 인식하지 못했습니다. 더 선명한 이미지로 다시 시도해주세요." });
    }

    let parsedData: any;
    try {
      parsedData = JSON.parse(rawText);
    } catch {
      return res.status(422).json({ error: "AI 응답 파싱에 실패했습니다. 처방전 전체가 포함된 선명한 이미지를 사용해주세요." });
    }

    return res.json({ success: true, results: parsedData });
  } catch (err: any) {
    console.error("Prescription Analysis Error:", err);
    return res.status(500).json({
      error: "처방전 사진 분석 중 문제가 발생했습니다.",
      details: err.message || err.toString(),
    });
  }
}
