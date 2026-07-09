import { NextResponse } from "next/server";
import ZAI from "z-ai-web-dev-sdk";
import { getCustomer } from "@/lib/data";
import { policies } from "@/lib/data";

export async function POST(req: Request) {
  const body = (await req.json()) as { message: string; customerId?: string; history?: { role: string; content: string }[] };

  // Build context from customer if provided
  let customerContext = "";
  if (body.customerId) {
    const c = getCustomer(body.customerId);
    if (c) {
      customerContext = `
Customer Context:
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

  const systemPrompt = `You are RM Copilot, an AI assistant for bank Relationship Managers at an Indian private bank.
You help RMs analyze customers, recommend products, retrieve policy information, and decide next best actions.

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

  try {
    const zai = await ZAI.create();
    const messages = [
      { role: "system", content: systemPrompt },
      ...(body.history ?? []).map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: body.message },
    ];

    const completion = await zai.chat.completions.create({
      messages,
      temperature: 0.6,
      max_tokens: 800,
    });

    const reply = completion.choices?.[0]?.message?.content ?? "I'm unable to respond right now.";
    return NextResponse.json({ reply, model: completion.model ?? "zai-glm" });
  } catch (e: unknown) {
    const msg = e instanceof Error ? e.message : "Unknown error";
    console.error("Chat API error:", msg);
    return NextResponse.json({
      reply: `I couldn't reach the LLM service. Here's a fallback response based on the bank's knowledge base: For customer-specific advice, please review the policies listed in the RAG Knowledge Base module. Common scenarios: (1) For loan recommendations, check CIBIL ≥ 750 and FOIR ≤ 50%. (2) For wealth advisory, ensure suitability per POL-004. (3) For risk mitigation, follow POL-005 NPA procedures. Error: ${msg}`,
      error: msg,
      fallback: true,
    });
  }
}

