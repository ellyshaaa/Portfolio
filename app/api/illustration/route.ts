import { NextResponse } from "next/server";

const IMAGE_MODELS = ["gemini-3-pro-image", "gemini-2.5-flash-image"];

export async function POST(req: Request) {
  try {
    const { character, scene } = await req.json();

    if (!scene) {
      return NextResponse.json({ error: "Scene is required." }, { status: 400 });
    }

    const prompt = `A children's colouring book page. Black and white line art only: clean bold outlines, no shading, no grey, no colour, pure white background. Simple and friendly, suitable for a young child to colour in with crayons.
Main character (draw exactly this, consistently): ${String(character || "").slice(0, 300)}
Scene: ${String(scene).slice(0, 300)}
No text, no words, no letters anywhere in the image.`;

    for (const model of IMAGE_MODELS) {
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": process.env.GEMINI_API_KEY || "",
          },
          body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseModalities: ["IMAGE"] },
          }),
        }
      );

      if (!res.ok) {
        console.error(`Image error (${model}):`, await res.text());
        continue;
      }

      const data = await res.json();
      const parts = data?.candidates?.[0]?.content?.parts || [];
      const img = parts.find((p: { inlineData?: { data: string; mimeType: string } }) => p.inlineData);

      if (img?.inlineData?.data) {
        return NextResponse.json({
          image: `data:${img.inlineData.mimeType || "image/png"};base64,${img.inlineData.data}`,
        });
      }

      console.error(`Image model ${model} returned no image.`);
    }

    return NextResponse.json({ error: "No illustration available." }, { status: 502 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 });
  }
}
