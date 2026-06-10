// import { createAnthropic } from "@ai-sdk/anthropic";
// import { streamText } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";

export const runtime = "edge";

// Build a rich system prompt from institute context
function buildSystemPrompt(context?: string) {
  return `You are CoachGenie Copilot, an expert AI assistant embedded inside a coaching institute management platform called CoachGenie.

You help institute admins, owners, and coaches with:
- Analytics insights about student performance, attendance, fee collection
- Recommendations for improving batch performance or fee recovery
- Answering questions about specific students, batches, or exams
- Growth strategies for the institute
- Operational advice on scheduling, batch management, lead conversion

You have access to the following institute data context:
${context ?? "No context provided — answer generally."}

Guidelines:
- Be concise and actionable. Lead with the insight, then explain.
- Use ₹ for Indian Rupees. Format large numbers in Indian style (e.g., ₹1.2L, ₹48K).
- When discussing percentages or comparisons, be specific.
- If asked about a specific student or batch, reference them by name.
- Suggest concrete next steps, not just observations.
- Keep responses under 300 words unless a detailed breakdown is explicitly requested.
- Use markdown formatting: **bold** for key metrics, bullet points for lists, and ## headings for sections only when appropriate.
`;
}

export async function POST(req: Request) {
  const { messages, context } = await req.json() as {
    messages: { role: string; content: string }[];
    context?: string;
  };

  const apiKey = process.env.ANTHROPIC_API_KEY;

  // ── Mock fallback if no API key ──────────────────────────────
  if (!apiKey || apiKey === "your_key_here") {
    const lastMsg = messages[messages.length - 1]?.content?.toLowerCase() ?? "";

    const mockResponses: Record<string, string> = {
      attendance: "**Attendance Overview**\n\nYour institute's average attendance this month is **87.4%**, which is above the healthy threshold of 75%.\n\n**Top performers:** Sneha Joshi (96%), Aarav Sharma (94%)\n**Needs attention:** Aryan Singh (62%) — recommend a parent call this week.\n\n**Recommendation:** Schedule a batch attendance review for Math Batch A on Friday — 3 students have dropped below 70% in the last 2 weeks.",
      fee:        "**Fee Collection Summary**\n\n- **Total collected:** ₹2.97L (82% of target)\n- **Outstanding:** ₹66K across 3 invoices\n- **Overdue:** Rohan Mehta (₹18K, 45 days overdue)\n\n**Next actions:**\n1. Send WhatsApp reminder to Rohan's parent today\n2. Priya Patel's Term 2 (₹27K) due in 5 days — send advance notice\n3. Aryan Singh invoice (₹36K) is pending — consider a payment plan discussion",
      student:    "**Student Performance Snapshot**\n\n- **Active students:** 5 of 6 (1 inactive)\n- **Average exam score:** 74%\n- **Top performer:** Sneha Joshi — 91% average across Physics and Chemistry\n- **Most improved:** Rohan Mehta — up 15% from last term\n\n**At-risk:** Aryan Singh has not appeared in any exam yet. Recommend scheduling a one-on-one assessment session.",
      lead:       "**Lead Funnel Insights**\n\n- **7 total leads** in the pipeline\n- **Conversion rate:** 14% (1 enrolled of 7)\n- **Bottleneck:** Demo → Negotiation stage has 3 leads stuck for 10+ days\n\n**Recommendations:**\n1. Follow up with Kavya Nair (Demo Done) — she's been idle 7 days\n2. Offer Aditya Singh a sibling discount to close the negotiation\n3. Schedule 2 more demo classes this week to fill the funnel",
      batch:      "**Batch Performance Analysis**\n\nYour strongest batch is **NEET Bio-Chem** with 100% syllabus completion for Cell Biology.\n\n**Math Batch A** has completed 50% of the syllabus with 3 months remaining — on track.\n\n**Physics Batch A** needs attention: Gravitation and Work & Energy are pending and exams are approaching.\n\n**Recommendation:** Add an extra Saturday session for Physics Batch A for the next 3 weeks.",
      exam:       "**Exam Results Analysis**\n\n- **Unit Test 1 — Math:** Average 37/50 (74%) — healthy\n- **Mid Term — Physics:** Average 86.5/100 (86.5%) — excellent!\n\n**Rankings:**\n1. Sneha Joshi — 91 (Physics)\n2. Aarav Sharma — 82 (Physics), 45 (Math)\n3. Rohan Mehta — 38 (Math)\n\n**Observation:** The gap between top and bottom performers in Math is widening. Consider a remedial session for students below 70%.",
    };

    let response = "**How can I help you today?**\n\nI can answer questions about:\n- 📊 Student performance and attendance\n- 💰 Fee collection and outstanding payments\n- 🎯 Lead conversion and CRM\n- 📚 Batch progress and syllabus\n- 📝 Exam results and rankings\n\nTry asking: *\"How is fee collection this month?\"* or *\"Which students need attention?\"*";

    for (const [key, val] of Object.entries(mockResponses)) {
      if (lastMsg.includes(key) || (key === "fee" && (lastMsg.includes("payment") || lastMsg.includes("invoice") || lastMsg.includes("money")))) {
        response = val;
        break;
      }
    }

    if (lastMsg.includes("hello") || lastMsg.includes("hi") || lastMsg.includes("hey")) {
      response = "Hello! 👋 I'm your CoachGenie AI Copilot. I have full context of your institute — 6 students, 4 batches, 6 invoices, and 2 completed exams.\n\nWhat would you like to know? Try:\n- *\"Summarize today's key alerts\"*\n- *\"Which fees are overdue?\"*\n- *\"How is the lead pipeline?\"*";
    }

    if (lastMsg.includes("alert") || lastMsg.includes("urgent") || lastMsg.includes("today")) {
      response = "**🚨 Today's Key Alerts**\n\n1. **Fee Overdue** — Rohan Mehta: ₹18,000 (45 days overdue). Action: Call parent now.\n2. **Low Attendance** — Aryan Singh: 62% this month. Action: Schedule parent meeting.\n3. **Lead Follow-up** — Kavya Nair has been in 'Demo Done' for 7 days with no activity.\n4. **Syllabus Gap** — Physics Batch A is behind by 2 topics with exams in 3 weeks.\n\n**Recommended priority:** Start with the fee call — ₹18K recovery should take 5 minutes.";
    }

    // Stream the mock response word by word
    const encoder = new TextEncoder();
    const words   = response.split(" ");
    const stream  = new ReadableStream({
      async start(controller) {
        // Format as AI SDK data stream
        for (const word of words) {
          const chunk = `0:${JSON.stringify(word + " ")}\n`;
          controller.enqueue(encoder.encode(chunk));
          await new Promise(r => setTimeout(r, 25));
        }
        controller.enqueue(encoder.encode(`d:{"finishReason":"stop","usage":{"promptTokens":0,"completionTokens":${words.length}}}\n`));
        controller.close();
      },
    });
    return new Response(stream, {
      headers: { "Content-Type": "text/event-stream", "X-Mock": "true" },
    });
  }

  // ── Real Anthropic streaming ─────────────────────────────────
  const result = streamText({
    model: anthropic("claude-sonnet-4-20250514") as any,
    system: buildSystemPrompt(context),
    messages: messages.map(m => ({
      role:    m.role as "user" | "assistant",
      content: m.content,
    })),
    maxOutputTokens: 1024,
  });

  return result.toUIMessageStreamResponse();
}

