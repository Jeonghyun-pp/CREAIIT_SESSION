import { requireAdmin } from "@/lib/auth-guard";
import { errorResponse, successResponse, AppError } from "@/lib/errors";
import OpenAI from "openai";
import { z } from "zod";

const requestSchema = z.object({
  prompt: z.string().min(1, "프롬프트를 입력해주세요"),
  sessionTitle: z.string().optional(),
  sessionSummary: z.string().optional(),
});

const blockSchema = z.object({
  title: z.string(),
  description: z.string(),
  startTime: z.string(),
  endTime: z.string(),
});

export async function POST(req: Request) {
  try {
    await requireAdmin();

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      throw new AppError("CONFIG", "OPENAI_API_KEY가 설정되지 않았습니다.", 500);
    }

    const body = await req.json();
    const parsed = requestSchema.safeParse(body);
    if (!parsed.success) {
      throw new AppError("VALIDATION", parsed.error.issues[0].message);
    }

    const { prompt, sessionTitle, sessionSummary } = parsed.data;

    const openai = new OpenAI({ apiKey });

    const systemMessage = `너는 학회 세션 일정을 생성하는 도우미야.
사용자의 요청을 바탕으로 세션 일정 블록을 JSON 배열로 반환해.

각 블록 형식:
{
  "title": "일정 제목",
  "description": "상세 설명",
  "startTime": "HH:mm",
  "endTime": "HH:mm"
}

규칙:
- 시간은 24시간 형식 (예: "14:00")
- 쉬는 시간도 포함
- description은 해당 시간에 할 구체적인 활동 설명
- 시간순으로 정렬
- JSON 배열만 반환 (다른 텍스트 없이)`;

    const userMessage = [
      prompt,
      sessionTitle ? `세션 제목: ${sessionTitle}` : "",
      sessionSummary ? `세션 요약: ${sessionSummary}` : "",
    ]
      .filter(Boolean)
      .join("\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: userMessage },
      ],
      temperature: 0.7,
    });

    const content = completion.choices[0]?.message?.content?.trim() || "[]";

    // JSON 파싱 — 코드 블록 감싸진 경우 처리
    let jsonStr = content;
    const fenceMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (fenceMatch) {
      jsonStr = fenceMatch[1].trim();
    }

    let blocks: unknown;
    try {
      blocks = JSON.parse(jsonStr);
    } catch {
      throw new AppError("PARSE", "AI 응답을 파싱할 수 없습니다. 다시 시도해주세요.", 422);
    }

    const result = z.array(blockSchema).safeParse(blocks);
    if (!result.success) {
      throw new AppError("PARSE", "AI 응답 형식이 올바르지 않습니다. 다시 시도해주세요.", 422);
    }

    return successResponse(result.data);
  } catch (err) {
    return errorResponse(err);
  }
}
