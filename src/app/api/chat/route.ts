import { NextResponse } from "next/server";
import { getCustomer } from "@/lib/data";
import { policies } from "@/lib/data";

/**
 * Chat API for IDBI SARTHI RM Copilot.
 *
 * AI provider priority:
 *   1. Groq API (https://api.groq.com/openai/v1/chat/completions) — set GROQ_API_KEY in .env.local
 *   2. z-ai-web-dev-sdk (fallback if GROQ_API_KEY is not configured)
 *
 * To enable Groq:
 *   1. Create a free key at https://console.groq.com/keys
 *   2. Create or edit /home/z/my-project/.env.local and add:
 *        GROQ_API_KEY=gsk_your_key_here
 *   3. Optional: override the model with GROQ_MODEL=llama-3.3-70b-versatile
 *   4. Restart the dev server (the file is auto-loaded by Next.js)
 */

const GROQ_API_KEY = process.env.GROQ_API_KEY ?? process.env.GROQ_API_KEY_ENV ?? "";
const GROQ_MODEL = process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
const GROQ_ENDPOINT = "https://api.groq.com/openai/v1/chat/completions";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

async function callGroq(messages: ChatMessage[]): Promise<string> {
  const res = await fetch(GROQ_ENDPOINT, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages,
      temperature: 0.6,
      max_tokens: 800,
    }),
  });
  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`Groq API ${res.status}: ${txt.slice(0, 300)}`);
  }
  const data = await res.json();
  const reply = data?.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Empty reply from Groq");
  return reply;
}

async function callZaiFallback(messages: ChatMessage[]): Promise<string> {
  // Lazy import to avoid breaking build if SDK is unavailable
  const ZAIModule = await import("z-ai-web-dev-sdk");
  const ZAI = (ZAIModule as { default?: unknown; ZAI?: unknown }).default ?? (ZAIModule as { ZAI?: unknown }).ZAI;
  const zai = await (ZAI as { create: () => Promise<unknown> }).create();
  const completion = await (zai as { chat: { completions: { create: (opts: Record<string, unknown>) => Promise<{ choices: { message: { content?: string } }[] }> } } }).chat.completions.create({
    messages,
    temperature: 0.6,
    max_tokens: 800,
  });
  return completion?.choices?.[0]?.message?.content ?? "I'm unable to respond right now.";
}

export async function POST(req: Request) {
  const body = (await req.json()) as { message: string; customerId?: string; history?: { role: string; content: string }[] };

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

  const policyDigest = policies.map(p => `- ${p.id} ${p.title}: ${p.summary}`).join("\n");

  const systemPrompt = `You are IDBI SARTHI, an AI assistant for Relationship Managers at IDBI Bank (a leading Indian private sector bank).
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

  const messages: ChatMessage[] = [
    { role: "system", content: systemPrompt },
    ...(body.history ?? []).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    { role: "user", content: body.message },
  ];

  // Try Groq first; fall back to z-ai-web-dev-sdk
  if (GROQ_API_KEY) {
    try {
      const reply = await callGroq(messages);
      return NextResponse.json({ reply, model: `groq/${GROQ_MODEL}`, provider: "groq" });
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      console.error("Groq chat error:", msg);
      // Fall through to fallback
      try {
        const reply = await callZaiFallback(messages);
        return NextResponse.json({
          reply,
          model: "zai-fallback",
          provider: "zai-fallback",
          warning: `Groq call failed (${msg}); used fallback.`,
        });
      } catch (e2: unknown) {
        const msg2 = e2 instanceof Error ? e2.message : "Unknown error";
        return NextResponse.json({
          reply: `I couldn't reach the AI service. Groq error: ${msg}. Fallback error: ${msg2}. Please check GROQ_API_KEY in .env.local.`,
          error: msg2,
          fallback: true,
        }, { status: 503 });
      }
    }
  }

  // No Groq key configured — use z-ai-web-dev-sdk fallback
  try {
    const reply = await callZaiFallback(messages);
    return NextResponse.json({
      reply,
      model: "zai-default",
      provider: "zai-default",
      warning: "GROQ_API_KEY not set. Using built-in fallback LLM. Add GROQ_API_KEY to .env.local to enable Groq.",
    });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    return NextResponse.json({
      reply: `I couldn't reach any AI service. Error: ${msg}. To enable chat: create /home/z/my-project/.env.local with GROQ_API_KEY=gsk_your_key (get one at https://console.groq.com/keys).`,
      error: msg,
      fallback: true,
    }, { status: 503 });
  }
}

// Helpful status endpoint
export async function GET() {
  return NextResponse.json({
    provider: GROQ_API_KEY ? "groq" : "zai-default",
    model: GROQ_API_KEY ? `groq/${GROQ_MODEL}` : "zai-fallback",
    groqConfigured: !!GROQ_API_KEY,
    hint: GROQ_API_KEY ? "" : "Set GROQ_API_KEY in .env.local to enable Groq.",
  });
}
