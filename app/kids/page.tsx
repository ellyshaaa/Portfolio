"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Story = {
  isSample?: boolean;
  title: string;
  readingLevel: string;
  character: string;
  pages: { text: string; scene: string }[];
  moral: string;
  vocabulary: { word: string; meaning: string }[];
  exercises: { question: string; type: string }[];
};

const THEMES = [
  { emoji: "🐉", label: "Dragons", topic: "a shy dragon who learns to fly" },
  { emoji: "🚀", label: "Space", topic: "a little astronaut who visits a friendly moon" },
  { emoji: "🦕", label: "Dinosaurs", topic: "a baby dinosaur looking for the perfect snack" },
  { emoji: "🌊", label: "Ocean", topic: "a curious octopus who wants to paint" },
  { emoji: "🧁", label: "Bakery", topic: "a mouse who bakes the world's tiniest cake" },
  { emoji: "🌳", label: "Forest", topic: "a sleepy owl who can't fall asleep at night" },
];

const LOADING = [
  "Sharpening the crayons...",
  "Asking the characters to take their places...",
  "Painting the sky a nicer blue...",
  "Finding the perfect words...",
  "Turning the pages...",
];

const PAGE_COLORS = ["#FFE3D3", "#DDF0E4", "#DCE8FA", "#FFF1C9", "#EADFF7", "#FFDDE6"];
const serif = "font-[family-name:var(--font-instrument)]";

export default function Page() {
  const [age, setAge] = useState("6");
  const [topic, setTopic] = useState(THEMES[0].topic);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState(0);
  const [story, setStory] = useState<Story | null>(null);
  const [page, setPage] = useState(0);
  const [images, setImages] = useState<Record<number, string>>({});
  const [imgLoading, setImgLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!loading) return;
    const id = setInterval(() => setMsg((m) => (m + 1) % LOADING.length), 1800);
    return () => clearInterval(id);
  }, [loading]);

  useEffect(() => {
    if (!story || page >= story.pages.length || images[page]) return;
    let cancelled = false;
    setImgLoading(true);
    fetch("/api/illustration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ character: story.character, scene: story.pages[page].scene }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled && d.image) setImages((prev) => ({ ...prev, [page]: d.image }));
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setImgLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [story, page, images]);

  async function generate() {
    setLoading(true);
    setMsg(0);
    setError("");
    setStory(null);
    try {
      const res = await fetch("/api/story", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ age, topic, name }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Something went wrong.");
      setStory(data);
      setPage(0);
      setImages({});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong.");
    } finally {
      setLoading(false);
    }
  }

  function surprise() {
    const t = THEMES[Math.floor(Math.random() * THEMES.length)];
    setTopic(t.topic);
  }

  const field = "w-full rounded-2xl border border-[#E8DCC8] bg-[#FFFDF8] px-4 py-3 outline-none focus:border-[#2B2118]";
  const label = "grid gap-2 text-sm font-medium text-[#8A7A68]";
  const total = story ? story.pages.length + 1 : 0;
  const onStoryPage = story ? page < story.pages.length : false;

  return (
    <div className="min-h-screen bg-[#FBF6EC] text-[#2B2118]">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm text-[#8A7A68] hover:text-[#2B2118]">← Back to portfolio</Link>

        <h1 className={`${serif} mt-8 text-5xl md:text-7xl`}>Storybook Studio</h1>
        <p className="mt-4 max-w-xl text-lg text-[#6B5B4B]">
          Tell it who the story is for. It writes a picture book pitched to their exact reading level, with new words and activities at the end.
        </p>

        <div className="mt-10 rounded-3xl bg-white p-6 md:p-8 shadow-lg ring-1 ring-[#E8DCC8]">
          <p className="text-sm font-medium text-[#8A7A68]">Pick a world</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {THEMES.map((t) => (
              <button
                key={t.label}
                onClick={() => setTopic(t.topic)}
                className={`rounded-full border px-4 py-2 text-sm transition ${
                  topic === t.topic ? "border-[#2B2118] bg-[#2B2118] text-[#FBF6EC]" : "border-[#E8DCC8] hover:border-[#2B2118]"
                }`}
              >
                {t.emoji} {t.label}
              </button>
            ))}
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-[1fr_2fr_1fr]">
            <label className={label}>
              Age
              <select value={age} onChange={(e) => setAge(e.target.value)} className={field}>
                {[3, 4, 5, 6, 7, 8, 9, 10].map((a) => (
                  <option key={a} value={a}>{a} years</option>
                ))}
              </select>
            </label>
            <label className={label}>
              The story is about
              <input value={topic} onChange={(e) => setTopic(e.target.value)} maxLength={100} className={field} />
            </label>
            <label className={label}>
              Hero&apos;s name
              <input value={name} onChange={(e) => setName(e.target.value)} maxLength={30} placeholder="Optional" className={field} />
            </label>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-3">
            <button
              onClick={generate}
              disabled={loading || !topic}
              className="rounded-full bg-[#E4572E] px-7 py-3 font-medium text-white transition hover:scale-[1.03] hover:bg-[#D24A22] disabled:opacity-40 disabled:hover:scale-100"
            >
              ✨ Make my book
            </button>
            <button onClick={surprise} className="rounded-full px-5 py-3 text-sm text-[#6B5B4B] hover:text-[#2B2118]">
              🎲 Surprise me
            </button>
          </div>

          {error && <p className="mt-4 text-sm text-red-600">{error}</p>}
        </div>

        {loading && (
          <div className="mt-20 text-center">
            <div className="text-6xl animate-bounce">📖</div>
            <p className={`${serif} mt-6 text-3xl`}>{LOADING[msg]}</p>
          </div>
        )}

        {story && !loading && (
          <section className="mt-16">
            <div className="text-center">
              <p className="text-xs uppercase tracking-[0.2em] text-[#8A7A68]">A story for age {age}</p>
              <h2 className={`${serif} mt-3 text-4xl md:text-6xl`}>{story.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-sm text-[#8A7A68]">{story.readingLevel}</p>
              {story.isSample && (
                <p className="mx-auto mt-4 max-w-md rounded-full bg-[#FFF1C9] px-4 py-2 text-sm text-[#6B5B4B]">
                  The live generator is busy — here&apos;s a saved example book.
                </p>
              )}
            </div>

            <div className="mt-10 overflow-hidden rounded-3xl bg-white shadow-lg ring-1 ring-[#E8DCC8]">
              {onStoryPage ? (
                <div className="grid md:grid-cols-2">
                  <div
                    className="flex min-h-[340px] items-center justify-center p-6"
                    style={{ background: PAGE_COLORS[page % PAGE_COLORS.length] }}
                  >
                    {images[page] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={images[page]}
                        alt={story.pages[page].scene}
                        className="max-h-[420px] w-full rounded-2xl bg-white object-contain shadow-sm"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-3 text-center">
                        <span className={`text-4xl ${imgLoading ? "animate-pulse" : ""}`}>🖍️</span>
                        <p className="max-w-xs text-sm italic text-[#6B5B4B]">
                          {imgLoading ? "Drawing this page..." : story.pages[page].scene}
                        </p>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center p-8 md:p-12">
                    <p className={`${serif} text-2xl md:text-3xl leading-snug`}>{story.pages[page].text}</p>
                    <p className="mt-8 text-sm text-[#B3A38F]">{page + 1} / {story.pages.length}</p>
                  </div>
                </div>
              ) : (
                <div className="p-8 md:p-12">
                  <p className={`${serif} text-center text-5xl md:text-6xl`}>The End</p>
                  <p className="mx-auto mt-4 max-w-md text-center text-lg text-[#6B5B4B]">{story.moral}</p>

                  <h3 className="mt-14 text-xs font-medium uppercase tracking-[0.2em] text-[#8A7A68]">New words</h3>
                  <div className="mt-4 grid gap-3 sm:grid-cols-2">
                    {story.vocabulary.map((v, i) => (
                      <div key={v.word} className="rounded-2xl p-5" style={{ background: PAGE_COLORS[i % PAGE_COLORS.length] }}>
                        <p className={`${serif} text-2xl`}>{v.word}</p>
                        <p className="mt-1 text-[#6B5B4B]">{v.meaning}</p>
                      </div>
                    ))}
                  </div>

                  <h3 className="mt-14 text-xs font-medium uppercase tracking-[0.2em] text-[#8A7A68]">Activities</h3>
                  <ol className="mt-4 grid gap-8">
                    {story.exercises.map((ex, i) => (
                      <li key={i}>
                        <p className="text-lg">
                          <span className="mr-2 font-medium text-[#E4572E]">{i + 1}.</span>
                          {ex.question}
                        </p>
                        {ex.type === "drawing" ? (
                          <div className="mt-3 h-44 rounded-2xl border-2 border-dashed border-[#E8DCC8]" />
                        ) : (
                          <div className="mt-6 grid gap-6">
                            <div className="h-px bg-[#E8DCC8]" />
                            <div className="h-px bg-[#E8DCC8]" />
                          </div>
                        )}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>

            <div className="mt-6 flex items-center justify-between">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="rounded-full px-5 py-2 text-sm ring-1 ring-[#E8DCC8] transition hover:ring-[#2B2118] disabled:opacity-30"
              >
                ← Back
              </button>
              <div className="flex gap-2">
                {Array.from({ length: total }).map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setPage(i)}
                    aria-label={`Go to page ${i + 1}`}
                    className={`h-2.5 rounded-full transition-all ${i === page ? "w-8 bg-[#E4572E]" : "w-2.5 bg-[#E8DCC8]"}`}
                  />
                ))}
              </div>
              <button
                onClick={() => setPage((p) => Math.min(total - 1, p + 1))}
                disabled={page === total - 1}
                className="rounded-full px-5 py-2 text-sm ring-1 ring-[#E8DCC8] transition hover:ring-[#2B2118] disabled:opacity-30"
              >
                Next →
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}