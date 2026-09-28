import { NextResponse } from "next/server";

const MODELS = ["gemini-3.6-flash", "gemini-3.8-flash"];

export async function POST(req: Request) {
  try {
    const { domain, tier, rationale, controls } = await req.json();

    const prompt = `Write one paragraph of policy language for an organization's AI usage policy, then a short bulleted list of the obligations.

Deployment context: ${domain}
Risk classification (already decided, do not change it): ${tier}
Reasoning: ${(rationale || []).join(" ")}
Required controls: ${(controls || []).join(" | ")}

Rules: plain professional English, no jargon, no hedging, under 180 words total. Do not restate the classification reasoning. Do not add obligations that are not listed. Write it so a board member with no technical background understands what the organization is committing to.Write the paragraph, then the obligations as plain lines each starting with "- ". Never use asterisks, markdown, bold or headings.` ;

    for (const model of MODELS) {
      const res = await fetch("https://generativelanguage.googleapis.com/v1beta/openai/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify({
          model,
          messages: [{ role: "user", content: prompt }],
          temperature: 0.4,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        return NextResponse.json({ text: data.choices[0].message.content });
      }
      console.error(`Policy error (${model}):`, await res.text());
    }

    return NextResponse.json({ text: "" }, { status: 200 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ text: "" }, { status: 200 });
  }
}