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
            "너는 한국 처방전 전문 OCR 엔진이자 복약 전문 약사야. 흐릿하거나 기울어지거나 빛 반사가 있는 저화질 이미지도 최대한 판독해야 해. 한국 표준 처방전 양식(KCD 코드, 약품코드 7자리, 의약품 고시명)을 숙지하고 있으므로 부분적으로만 보이는 글자도 문맥과 약품 DB 지식으로 추론해서 채워줘. 판독이 전혀 불가능한 필드만 빈 문자열로 두고, 나머지는 반드시 한국어로 채워서 JSON을 반환해야 해.",
        },
        {
          role: "user",
          content: [
            getImagePart(image),
            {
              type: "text",
              text: `다음은 한국 병원에서 발급한 처방전 사진이야. 사진 품질이 낮거나 흐려도 최선을 다해 판독해줘.

[판독 지침]
1. 이미지에서 읽을 수 있는 모든 텍스트를 OCR처럼 스캔해.
2. 약품코드(7자리 숫자)가 보이면 해당 코드로 약품명과 성분을 추론해줘.
3. 약품명이 부분적으로만 보여도 한국 처방 의약품 DB 지식으로 완성해줘.
4. 투약일수, 횟수, 용량은 숫자 패턴(예: 1일 3회, 5일분)으로 찾아줘.
5. 병원명은 도장이나 상단 헤더에서 찾아줘.
6. 처방전 양식의 "상병명" 또는 "주상병" 코드/명칭으로 질병명을 찾아줘.
7. 절대 완전히 추측으로 만들지 말고, 이미지에 근거가 있는 정보만 채워줘. 전혀 판독 불가능한 필드만 빈 문자열로 둬.

다음 JSON 구조로 정확히 반환해줘:
{
  "diseaseName": "처방전 상병명 또는 추정 질병명 (예: 급성 기관지염(J20))",
  "prescriptionDate": "처방일 YYYY-MM-DD 형식",
  "institutionName": "의료기관명",
  "drugs": [
    {
      "name": "의약품 전체명 (예: 타이레놀정500mg)",
      "ingredients": "주성분 및 함량 (예: 아세트아미노펜 500mg)",
      "strength": "규격 (예: 500mg)",
      "oneDose": "1회 투약량 (예: 1정)",
      "dailyFrequency": "1일 횟수 (예: 3회)",
      "duration": "처방 기간 (예: 3일)",
      "category": "약효 분류 (예: 해열진통제)",
      "efficacy": "이 약의 효능과 치료 목적",
      "precaution": "복용 시 주의사항"
    }
  ],
  "generalPrecautions": ["이 처방 전체에 대한 복약 주의사항 3~4가지"]
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
