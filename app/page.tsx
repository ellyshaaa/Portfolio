"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const serif = "font-[family-name:var(--font-instrument)]";

const PROJECTS = [
  {
    href: "/kids",
    n: "01",
    title: "Storybook Studio",
    line: "Writes an illustrated children's book pitched to a specific reading level, with vocabulary and activities to match.",
    detail: "The hard part is character consistency — keeping the same dragon recognisable across six generated pages.",
    tag: "LLM · Image generation",
    accent: "#E4572E",
    tint: "#FFF1EC",
  },
  {
    href: "/governance",
    n: "02",
    title: "AI Governance Sandbox",
    line: "Classifies an AI system against the EU AI Act and returns the controls, sign-offs and review cadence that follow.",
    detail: "The classification is deterministic code, never model output. A compliance tool that answers differently twice is worse than none.",
    tag: "Policy · Risk modelling",
    accent: "#2563EB",
    tint: "#EEF4FF",
  },
  {
    href: "/solar",
    n: "03",
    title: "Sensor-Free Solar Tracker",
    line: "Derives panel angles from astronomy alone — no light sensors — then distils the physics into a 1.7 KB neural net.",
    detail: "The network trains live in your browser and recovers the analytic model to within about a degree.",
    tag: "Edge ML · Simulation",
    accent: "#B45309",
    tint: "#FFF8E8",
  },
];

/* ---------- live hero previews ---------- */

function BookPreview({ t }: { t: number }) {
  const page = Math.floor(t / 34) % 3;
  const lines = [3, 4, 3][page];
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full">
      <rect x="18" y="20" width="284" height="164" rx="10" fill="#fff" stroke="#EADFD2" />
      <line x1="160" y1="20" x2="160" y2="184" stroke="#EADFD2" />
      <g style={{ color: "#E4572E" }}>
        <circle cx="90" cy="86" r="26" fill="currentColor" opacity="0.14" />
        <circle cx="90" cy="82" r="13" fill="currentColor" opacity="0.85" />
        <path d="M70 118q20-14 40 0" stroke="currentColor" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <path d="M78 74q12-10 24 0" stroke="#fff" strokeWidth="2" fill="none" strokeLinecap="round" />
      </g>
      {Array.from({ length: lines }).map((_, i) => (
        <rect key={i} x="180" y={70 + i * 17} width={i === lines - 1 ? 60 : 104} height="6" rx="3" fill="#2B2118" opacity="0.14">
          <animate attributeName="opacity" values="0;0.14" dur="0.5s" begin={`${i * 0.12}s`} fill="freeze" />
        </rect>
      ))}
      <text x="180" y="52" fontSize="11" fill="#B3A38F" fontFamily="system-ui">page {page + 1} of 6</text>
    </svg>
  );
}

function RiskPreview({ t }: { t: number }) {
  const step = Math.floor(t / 34) % 3;
  const tiers = [
    { label: "Minimal risk", w: 22, c: "#067647" },
    { label: "Limited risk", w: 52, c: "#B58B00" },
    { label: "High risk", w: 88, c: "#B54708" },
  ];
  const tier = tiers[step];
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full">
      <rect x="18" y="20" width="284" height="164" rx="10" fill="#fff" stroke="#E4E7EC" />
      <text x="38" y="50" fontSize="10" fill="#98A2B3" letterSpacing="1.6" fontFamily="system-ui">CLASSIFICATION</text>
      <text x="38" y="80" fontSize="25" fill={tier.c} fontFamily="Georgia, serif">{tier.label}</text>
      <rect x="38" y="98" width="244" height="7" rx="3.5" fill="#F2F4F7" />
      <rect x="38" y="98" width={244 * (tier.w / 100)} height="7" rx="3.5" fill={tier.c} style={{ transition: "width .8s ease" }} />
      {["Autonomy", "Data", "Oversight"].map((d, i) => (
        <g key={d}>
          <text x="38" y={130 + i * 18} fontSize="10" fill="#667085" fontFamily="system-ui">{d}</text>
          <rect x="110" y={124 + i * 18} width="120" height="5" rx="2.5" fill="#F2F4F7" />
          <rect x="110" y={124 + i * 18} width={120 * ((tier.w / 100) * [0.9, 0.7, 1][i])} height="5" rx="2.5" fill="#344054" style={{ transition: "width .8s ease" }} />
        </g>
      ))}
    </svg>
  );
}

function SolarPreview({ t }: { t: number }) {
  const p = (t % 102) / 102;
  const ang = Math.PI * p;
  const cx = 60 + Math.cos(Math.PI - ang) * 100;
  const cy = 150 - Math.sin(ang) * 88;
  const tilt = (Math.atan2(cx - 160, 150 - cy) * 180) / Math.PI;
  return (
    <svg viewBox="0 0 320 200" className="h-full w-full">
      <rect x="18" y="20" width="284" height="164" rx="10" fill="#0E1626" />
      <path d="M60 150A100 100 0 0 1 260 150" stroke="#FFB020" strokeWidth="1.5" fill="none" opacity="0.25" strokeDasharray="4 5" />
      <circle cx={cx} cy={cy} r="16" fill="#FFB020" opacity="0.16" />
      <circle cx={cx} cy={cy} r="7" fill="#FFB020" />
      <line x1="60" y1="152" x2="260" y2="152" stroke="#2A3550" strokeWidth="2" />
      <g transform={`rotate(${tilt} 160 152)`}>
        <rect x="128" y="146" width="64" height="7" rx="2" fill="#FFB020" />
      </g>
      <circle cx="160" cy="152" r="3" fill="#7C8BA5" />
      <text x="40" y="45" fontSize="10" fill="#5B6B8C" letterSpacing="1.4" fontFamily="system-ui">TRACKING · NO SENSORS</text>
      <text x="234" y="45" fontSize="11" fill="#FFB020" fontFamily="Georgia, serif">{Math.abs(tilt).toFixed(0)}°</text>
    </svg>
  );
}

export default function Home() {
  const [ready, setReady] = useState(false);
  const [t, setT] = useState(0);
  const [active, setActive] = useState(0);
  const [hovered, setHovered] = useState<number | null>(null);

  useEffect(() => setReady(true), []);

  useEffect(() => {
    const id = setInterval(() => setT((x) => x + 1), 60);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    const id = setInterval(() => setActive((a) => (a + 1) % 3), 6000);
    return () => clearInterval(id);
  }, []);

  const rise = (d: number) => ({
    transform: ready ? "translateY(0)" : "translateY(18px)",
    opacity: ready ? 1 : 0,
    transition: `transform .9s cubic-bezier(.2,.7,.3,1) ${d}ms, opacity .9s ease ${d}ms`,
  });

  const previews = [<BookPreview key="b" t={t} />, <RiskPreview key="r" t={t} />, <SolarPreview key="s" t={t} />];
  const cur = PROJECTS[active];

  return (
    <div className="min-h-screen bg-[#FAF7F2] text-[#171410]">
      <main className="mx-auto max-w-6xl px-6 py-8 md:py-10">
        <header className="flex items-center justify-between text-sm" style={rise(0)}>
          <span className="tracking-tight">Ellysha Fatima</span>
          <nav className="flex gap-6 text-[#7A6E60]">
            <a href="mailto:efsfatima@gmail.com" className="transition hover:text-[#171410]">Email</a>
            <a href="https://linkedin.com/in/ellyshafatima" target="_blank" rel="noreferrer" className="transition hover:text-[#171410]">LinkedIn</a>
          </nav>
        </header>

        {/* ---------- hero ---------- */}
        <section className="grid items-center gap-12 pt-16 md:grid-cols-[1.05fr_1fr] md:pt-24">
          <div>
            <div className="inline-flex items-center gap-2.5 rounded-full border border-[#E3DACB] bg-white px-4 py-1.5 text-xs text-[#5C5347]" style={rise(80)}>
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#1E9E6A] opacity-70" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-[#1E9E6A]" />
              </span>
              Open to AI engineering roles
            </div>

            <h1 className={`${serif} mt-7 text-[2.9rem] leading-[1.02] tracking-tight md:text-[4.4rem]`} style={rise(160)}>
              I build AI systems
              <br />
              that people{" "}
              <span className="relative inline-block">
                <span className="relative z-10">actually use</span>
                <span className="absolute inset-x-[-4px] bottom-1 z-0 h-4 md:h-5" style={{ background: `${cur.accent}33`, transition: "background .7s ease" }} />
              </span>
              .
            </h1>

            <p className="mt-8 max-w-lg text-lg leading-relaxed text-[#5C5347]" style={rise(260)}>
              Machine learning is the easy half. The rest is the interface, the failure modes, and the rules an
              organisation needs before it can put any of it in front of real people. That&apos;s the half I work on.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-3" style={rise(340)}>
              <a href="#work" className="rounded-full bg-[#171410] px-6 py-3 text-sm font-medium text-[#FAF7F2] transition hover:bg-[#3A332B]">
                See the work
              </a>
              <a href="mailto:efsfatima@gmail.com" className="rounded-full border border-[#D9CFC0] px-6 py-3 text-sm transition hover:border-[#171410]">
                Get in touch
              </a>
            </div>
          </div>

          {/* live preview */}
          <div style={rise(300)}>
            <div className="relative overflow-hidden rounded-2xl border border-[#E3DACB] shadow-[0_24px_60px_-28px_rgba(23,20,16,0.35)]" style={{ background: cur.tint, transition: "background .7s ease" }}>
              <div className="flex items-center gap-1.5 border-b border-[#E3DACB]/70 px-4 py-2.5">
                <span className="h-2.5 w-2.5 rounded-full bg-[#E3DACB]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#E3DACB]" />
                <span className="h-2.5 w-2.5 rounded-full bg-[#E3DACB]" />
                <span className="ml-3 text-xs text-[#8A7E6E]">{cur.title}</span>
              </div>
              <div className="aspect-[320/200] w-full">{previews[active]}</div>
            </div>

            <div className="mt-4 flex items-center justify-between">
              <p className="text-sm text-[#8A7E6E]">Running live, not a screenshot.</p>
              <div className="flex gap-2">
                {PROJECTS.map((p, i) => (
                  <button
                    key={p.href}
                    onClick={() => setActive(i)}
                    aria-label={p.title}
                    className="h-2 rounded-full transition-all duration-500"
                    style={{ width: i === active ? 28 : 8, background: i === active ? p.accent : "#DCD2C3" }}
                  />
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ---------- work ---------- */}
        <section id="work" className="mt-32 scroll-mt-8 md:mt-44">
          <div className="flex items-baseline justify-between border-b border-[#E3DACB] pb-4">
            <h2 className="text-sm tracking-tight">Selected work</h2>
            <p className="text-sm text-[#8A7E6E]">All live · try them yourself</p>
          </div>

          {PROJECTS.map((p, i) => {
            const on = hovered === i;
            return (
              <Link
                key={p.href}
                href={p.href}
                onMouseEnter={() => { setHovered(i); setActive(i); }}
                onMouseLeave={() => setHovered(null)}
                className="group relative block border-b border-[#E3DACB] px-4 py-10 transition-colors duration-500 md:px-8"
                style={{ background: on ? p.tint : "transparent" }}
              >
                <div className="flex items-start gap-5 md:gap-9">
                  <span className={`${serif} pt-1 text-xl transition-colors duration-300`} style={{ color: on ? p.accent : "#C5B9A7" }}>
                    {p.n}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-1">
                      <h3 className={`${serif} text-3xl transition-colors duration-300 md:text-4xl`} style={{ color: on ? p.accent : "#171410" }}>
                        {p.title}
                      </h3>
                      <span className="text-xs tracking-wide text-[#8A7E6E]">{p.tag}</span>
                    </div>

                    <p className="mt-3 max-w-2xl leading-relaxed text-[#5C5347]">{p.line}</p>

                    <div className="grid grid-rows-[0fr] transition-all duration-500 group-hover:grid-rows-[1fr]">
                      <div className="overflow-hidden">
                        <p className="max-w-2xl pt-3 text-sm leading-relaxed text-[#8A7E6E]">{p.detail}</p>
                      </div>
                    </div>

                    <span className="mt-6 inline-flex items-center gap-2 text-sm transition-colors duration-300" style={{ color: on ? p.accent : "#8A7E6E" }}>
                      Open it
                      <span className="transition-transform duration-300 group-hover:translate-x-1.5">→</span>
                    </span>
                  </div>
                </div>
              </Link>
            );
          })}
        </section>

        <footer className="mt-28 flex flex-wrap items-center justify-between gap-4 pb-16 text-sm text-[#8A7E6E]">
          <span>Ellysha Fatima</span>
          <div className="flex gap-6">
            <a href="mailto:efsfatima@gmail.com" className="transition hover:text-[#171410]">efsfatima@gmail.com</a>
            <a href="https://linkedin.com/in/ellyshafatima" target="_blank" rel="noreferrer" className="transition hover:text-[#171410]">LinkedIn</a>
          </div>
        </footer>
      </main>
    </div>
  );
}