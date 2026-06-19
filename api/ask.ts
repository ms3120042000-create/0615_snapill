import OpenAI from "openai";

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};

const apiKey = process.env.OPENAI_API_KEY;
const ai = apiKey ? new OpenAI({ apiKey }) : null;

export default async function handler(req: any, res: any) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const { question, context } = req.body;

  if (!question) {
    return res.status(400).json({ error: "질문 내용이 없습니다." });
  }

  if (!ai) {
    return res.status(500).json({ error: "OpenAI API가 서버에 세팅되어 있지 않습니다. 관리자에게 문의바랍니다." });
  }

  try {
    const messages: OpenAI.Chat.ChatCompletionMessageParam[] = [
      {
        role: "system",
        content: `너는 '스냅필(SnaPill)' 서비스의 상냥하고 신속한 인공지능 전문 약사야.
소비자가 약물의 성분, 성질, 복용 시 음식 궁합, 유통기한, 보관방법, 특정 증상에 먹을 수 있는지 여부를 질문할 때 전문적이면서도 환자 친화적으로 한국어로 답변해주어야 해.

답변 구성:
1. 친근한 환영과 신속한 메인 답변 요약
2. 2-3가지 상세 가이드 또는 음식 조합 (예: 같이 먹으면 좋은 영양제, 나쁜 약 등)
3. 전문 의료인의 진료를 꼭 받으라는 신중한 권고문구 포함`,
      },
    ];

    if (context) {
      messages.push({
        role: "user",
        content: `참고 정보 (현재 조회중인 약물/처방 데이터): ${JSON.stringify(context)}`,
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
      details: err.message || err.toString(),
    });
  }
}
