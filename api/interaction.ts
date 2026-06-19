import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: { sizeLimit: "1mb" },
  },
};

const apiKey = process.env.OPENAI_API_KEY;
const ai = apiKey ? new OpenAI({ apiKey }) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { drugs } = req.body;

  if (!drugs || !Array.isArray(drugs) || drugs.length === 0) {
    return res.status(400).json({ error: "약물 목록이 없습니다." });
  }

  if (!ai) {
    return res.status(500).json({ error: "OpenAI API가 설정되지 않았습니다." });
  }

  try {
    const response = await ai.chat.completions.create({
      model: "gpt-4o",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "system",
          content:
            "너는 약물 상호작용 전문 약사야. 주어진 약물 조합에서 위험한 상호작용을 정확히 분석하고 환자가 이해하기 쉬운 한국어로 경고 및 권고사항을 JSON으로 반환해야 해. 실제 임상 근거가 있는 상호작용만 보고하고, 근거 없는 과도한 경고는 하지 마.",
        },
        {
          role: "user",
          content: `다음 약물들의 상호작용을 체크해줘:\n${drugs.map((d: any, i: number) => `${i + 1}. ${d.name} (성분: ${d.ingredients || "불명"})`).join("\n")}

다음 JSON 구조로 반환해줘:
{
  "riskLevel": "high | medium | low | none 중 하나 (전체 위험도)",
  "interactions": [
    {
      "drugs": ["약물A명", "약물B명"],
      "severity": "high | medium | low",
      "description": "어떤 상호작용이 발생하는지 쉬운 한국어로",
      "recommendation": "환자에게 권장하는 행동"
    }
  ],
  "summary": "전반적인 복약 안전 요약 (2~3문장)"
}

상호작용이 전혀 없으면 interactions는 빈 배열로, riskLevel은 'none'으로 반환해줘.`,
        },
      ],
    });

    const rawText = response.choices[0]?.message?.content;
    if (!rawText) {
      return res.status(422).json({ error: "AI 응답이 없습니다." });
    }

    let result: any;
    try {
      result = JSON.parse(rawText);
    } catch {
      return res.status(422).json({ error: "AI 응답 파싱에 실패했습니다." });
    }

    return res.json({ success: true, result });
  } catch (err: any) {
    console.error("Interaction Check Error:", err);
    return res.status(500).json({
      error: "상호작용 체크 중 오류가 발생했습니다.",
      details: err.message,
    });
  }
}
