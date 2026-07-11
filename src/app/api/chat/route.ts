import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/data";
import { policies } from "@/lib/data";
import { llmComplete, llmConfigured, activeLlmProvider } from "@/lib/llm";
import { GEMINI_MODEL, geminiConfigured } from "@/lib/gemini";
import { GROQ_TEXT_MODEL, groqConfigured } from "@/lib/groq";

/**
 * Chat API for IDBI SARTHI RM Copilot.
 *
 * Provider priority (via src/lib/llm.ts): Gemini → Groq.
 * Set GEMINI_API_KEY (blueprint's provider) and/or GROQ_API_KEY in .env.local.
 */

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

const MAX_HISTORY = 10;
const MAX_MESSAGE_LEN = 4000;

export async function POST(req: Request) {
  let body: { message?: string; customerId?: string; history?: { role: string; content: string }[] };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid or empty JSON body" }, { status: 400 });
  }
  if (typeof body.message !== "string" || body.message.trim().length === 0) {
    return NextResponse.json({ error: "message is required" }, { status: 400 });
  }
  body.message = body.message.slice(0, MAX_MESSAGE_LEN);

  // Build context from customer if provided
  let customerContext = "";
  if (body.customerId) {
    const c = getCustomer(body.customerId);
    if (c) {
      customerContext = `
Customer Context (Customer ID: ${c.id}):
- Name: ${c.name}, Age: ${c.age}, Segment: ${c.segment}, City: ${c.city}
- Monthly Income: INR ${c.monthlyIncome.toLocaleString("en-IN")}
- Total Savings: INR ${c.totalSavings.toLocaleString("en-IN")}
- Total Investments: INR ${c.totalInvestments.toLocaleString("en-IN")}
- Outstanding Debt: INR ${c.outstandingDebt.toLocaleString("en-IN")}
- Credit Utilization: ${(c.creditUtilization * 100).toFixed(0)}%
- EMI Burden: ${(c.emiBurden * 100).toFixed(0)}%
- Products Held: ${c.numProducts}
- KYC Status: ${c.kycStatus}
- Digital Engagement: ${(c.digitalEngagement * 100).toFixed(0)}%
- NPA Flag: ${c.npaFlag ? "Yes" : "No"}
`;
    }
  }

  const policyDigest = policies.map((p) => `- ${p.id} ${p.title}: ${p.summary}`).join("\n");

  const systemPrompt = `You are IDBI SARTHI, an AI assistant for Relationship Managers at IDBI Bank.
SARTHI stands for "Smart AI Relationship & Trust Hub Intelligence". You help RMs analyze customers, recommend products, retrieve policy information, and decide next best actions.

Style:
- Be concise, professional, and decisive
- Use INR currency formatting (e.g., INR 5,00,000)
- Reference policy IDs (POL-001 etc.) and scheme IDs (SCH-001 etc.) when relevant
- If customer context is provided, tailor advice to that specific customer
- If you don't know, say so — do not fabricate numbers

Available Policies (for reference):
${policyDigest}

${customerContext || "No specific customer selected."}

Respond in 4-8 sentences unless asked for more detail.`;

  // Sanitize client-supplied history: only user/assistant roles (never trust a
  // client "system" role — prevents prompt-injection); cap to recent turns.
  const safeHistory: ChatMessage[] = (Array.isArray(body.history) ? body.history : [])
    .filter((m) => m && typeof m.content === "string" && (m.role === "user" || m.role === "assistant"))
    .slice(-MAX_HISTORY)
    .map((m) => ({ role: m.role as "user" | "assistant", content: m.content.slice(0, MAX_MESSAGE_LEN) }));

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...safeHistory,
    { role: "user", content: body.message },
  ];

  if (!llmConfigured()) {
    return NextResponse.json(
      {
        reply:
          "Chat is not configured. Add GEMINI_API_KEY (recommended) or GROQ_API_KEY to .env.local and restart the dev server to enable AI responses.",
        fallback: true,
      },
      { status: 503 }
    );
  }

  try {
    const { text, provider } = await llmComplete(messages, { temperature: 0.6, maxTokens: 800 });
    const model = provider === "gemini" ? `gemini/${GEMINI_MODEL}` : `groq/${GROQ_TEXT_MODEL}`;
    return NextResponse.json({ reply: text, provider, model });
  } catch (e) {
    console.error("Chat error:", (e as Error).message);
    return NextResponse.json(
      { reply: "I couldn't reach the AI service right now. Please try again shortly.", fallback: true },
      { status: 503 }
    );
  }
}

// Helpful status endpoint
export async function GET() {
  const provider = activeLlmProvider();
  return NextResponse.json({
    provider,
    geminiConfigured: geminiConfigured(),
    groqConfigured: groqConfigured(),
    model: provider === "gemini" ? `gemini/${GEMINI_MODEL}` : provider === "groq" ? `groq/${GROQ_TEXT_MODEL}` : "none",
    hint: provider === "none" ? "Set GEMINI_API_KEY or GROQ_API_KEY in .env.local." : "",
  });
}
