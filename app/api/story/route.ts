import { NextResponse } from "next/server";
import { SAMPLE_STORY } from "./sample";

const MODELS = ["gemini-3.6-flash", "gemini-3.8-flash"];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

export async function POST(req: Request) {
  try {
    const { age, topic, name } = await req.json();

    if (!age || !topic) {
      return NextResponse.json({ error: "Age and topic are required." }, { status: 400 });
    }

    const ageNum = Math.min(Math.max(Number(age), 3), 10);
    const safeTopic = String(topic).slice(0, 100);
    const safeName = name ? String(name).slice(0, 30) : "";

    const system = `You are an award-winning picture book author. You write warm, funny, vivid stories for young children, like the best books on a library shelf.
Style rules:
- Use sensory details: sounds, colors, textures, smells.
- Include a little dialogue and at least one fun sound word or repeated phrase kids can say out loud.
- Give the main character a clear feeling at the start and a small, satisfying change by the end.
- Never start with "Once upon a time". Keep everything gentle: nothing scary or violent.
- Match vocabulary and sentence length precisely to the child's age.
Respond ONLY with valid JSON. No markdown, no extra text.`;

    const user = `Write a 6-page picture book for a ${ageNum}-year-old about: ${safeTopic}.
${safeName ? `The main character is named ${safeName}.` : "Invent a memorable name for the main character."}

Return JSON with exactly this shape:
{
  "title": "a catchy, playful title",
  "readingLevel": "one sentence on the reading level targeted and how (sentence length, word types)",
  "character": "one sentence describing exactly how the main character looks: species, colors, clothing, distinctive features",
  "pages": [{ "text": "the page text", "scene": "one sentence describing the illustration for this page" }],
  "moral": "one short, gentle takeaway in kid language",
  "vocabulary": [{ "word": "a word from the story", "meaning": "simple kid-friendly definition" }],
  "exercises": [{ "question": "an activity or question", "type": "comprehension or creative or counting or drawing" }]
}
Include exactly 6 pages, 4 vocabulary words, and 4 exercises, one of each type.`;

    const body = (model: string) =>
      JSON.stringify({
        model,
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
        temperature: 0.9,
      });

    // Try each model, retrying a few times when the service is overloaded.
    for (const model of MODELS) {
      for (let attempt = 0; attempt < 3; attempt++) {
        const res = await fetch(
          "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
            },
            body: body(model),
          }
        );

        if (res.ok) {
          const data = await res.json();
          const story = JSON.parse(data.choices[0].message.content);
          return NextResponse.json(story);
        }

        const text = await res.text();
        console.error(`Gemini error (${model}, attempt ${attempt + 1}):`, text);

        // 503 = overloaded, 429 = rate limited. Both are worth retrying.
        const retryable = res.status === 503 || res.status === 429;
        if (!retryable) break; // a real error: move on to the next model

        await sleep(1000 * Math.pow(2, attempt)); // 1s, then 2s, then 4s
      }
    }

       // Both models are overloaded. Show a saved example so the demo still works.
    return NextResponse.json({ ...SAMPLE_STORY, isSample: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}