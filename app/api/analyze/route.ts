import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { checkRateLimit } from "@/lib/rate-limit";
import type { DocumentAnalysis } from "@/types";

interface ErrorResponse {
  readonly error: string;
}

const SYSTEM_PROMPT = `You are a document analysis expert. Analyze the provided document text and return ONLY a valid JSON object with no markdown formatting, no backticks, no explanation text — just raw JSON.

The JSON must conform to this exact structure:
{
  "summary": "Brief 2-3 sentence summary of the document",
  "documentType": "contract" | "invoice" | "report" | "letter" | "legal" | "financial" | "other",
  "keyEntities": [{ "name": string, "type": string, "confidence": number (0-1), "context": string }],
  "keyDates": [{ "date": "YYYY-MM-DD", "description": string, "importance": "high" | "medium" | "low" }],
  "financialItems": [{ "description": string, "amount": number, "currency": string, "category": "payment" | "penalty" | "total" | "discount" }],
  "obligations": [{ "party": string, "description": string, "deadline": "YYYY-MM-DD", "status": "active" | "completed" | "pending" | "overdue" }],
  "riskFlags": [{ "title": string, "description": string, "severity": "high" | "medium" | "low" }],
  "keyTerms": [{ "term": string, "definition": string, "category": string }],
  "actionItems": [string]
}

Return ONLY the JSON object. No markdown. No backticks. No additional text.`;

const MAX_TEXT_LENGTH = 80_000;

function stripBackticks(text: string): string {
  let cleaned = text.trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/m, "").replace(/```\s*$/m, "");
  }
  return cleaned.trim();
}

function getClientIp(request: Request): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0].trim() ?? "unknown";
}

export async function POST(
  request: Request
): Promise<NextResponse<DocumentAnalysis | ErrorResponse>> {
  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "ANTHROPIC_API_KEY is not configured. Please set your API key." },
        { status: 500 }
      );
    }

    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body." },
        { status: 400 }
      );
    }

    const rawText = typeof body.text === "string" ? body.text.trim() : "";
    const text = rawText.slice(0, MAX_TEXT_LENGTH);

    if (!text) {
      return NextResponse.json(
        { error: "Text content is required for analysis." },
        { status: 400 }
      );
    }

    const ip = getClientIp(request);
    const rateCheck = checkRateLimit(ip);

    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Please try again later." },
        {
          status: 429,
          headers: { "Retry-After": String(rateCheck.retryAfter) },
        }
      );
    }

    const client = new Anthropic({ apiKey });
    const message = await client.messages.create({
      model: "claude-sonnet-4-5-20250514",
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
      messages: [
        {
          role: "user",
          content: `Analyze the following document:\n\n${text}`,
        },
      ],
    });

    const firstContent = message.content[0];
    if (!firstContent || firstContent.type !== "text") {
      return NextResponse.json(
        { error: "Unexpected response format from AI service." },
        { status: 500 }
      );
    }

    const responseText = firstContent.text;
    const cleanedJson = stripBackticks(responseText);

    try {
      const analysis: DocumentAnalysis = JSON.parse(cleanedJson);
      return NextResponse.json(analysis);
    } catch (parseError) {
      return NextResponse.json(
        {
          error:
            "Failed to parse AI response as JSON. The model returned an invalid format.",
        },
        { status: 500 }
      );
    }
  } catch {
    return NextResponse.json(
      { error: "Analysis failed. Please try again." },
      { status: 500 }
    );
  }
}
