import { createGoogleGenerativeAI } from "@ai-sdk/google";
import { generateObject } from "ai";
import { z } from "zod";

const google = createGoogleGenerativeAI({
  apiKey: process.env.GOOGLE_GENERATIVE_AI_API_KEY,
});

export const maxDuration = 30;

export async function POST(req: Request) {
  const { text } = await req.json();

  // Validate API Key exists
  if (!process.env.GOOGLE_GENERATIVE_AI_API_KEY) {
    return new Response(JSON.stringify({ error: "API Key is missing" }), { status: 500 });
  }

  try {
    const result = await generateObject({
      model: google("gemini-3.1-flash-lite-preview"), 
      schema: z.object({
        sentimentIndex: z.number().min(0).max(4).describe("0:행복, 1:슬픔, 2:분노, 3:놀람, 4:평온"),
        analysis: z.string().describe("감성 분석 결과 및 응원 메시지 (한국어)"),
      }),
      prompt: `다음 일기를 분석하여 감정 지수와 분석 결과를 한국어로 답변해줘:\n\n${text}`,
    });

    return Response.json(result.object);
  } catch (error: any) {
    console.error("AI Analysis Error Detailed:", error);
    return new Response(JSON.stringify({ error: error.message || "Analysis failed" }), { 
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
