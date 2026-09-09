import OpenAI from "openai";
import { NextResponse } from "next/server";

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const prompt = `
You are an expert YouTube growth coach.

Analyze this channel data:

Views: ${body.views}
Subscribers: ${body.subscribers}
Watch Time: ${body.watchTime}
CTR: ${body.ctr}

Give:
1. A short diagnosis
2. Three strengths
3. Three weaknesses
4. Three actionable recommendations

Be concise, practical, and specific.
`;

    const response = await client.responses.create({
      model: "gpt-5.6-luna",
      input: prompt,
    });

    return NextResponse.json({
      result: response.output_text,
    });
  } catch (error) {
    console.error("AI Coach error:", error);

    return NextResponse.json(
      { error: "Failed to generate AI analysis." },
      { status: 500 }
    );
  }
}