import Link from "next/link";

const projects = [
  {
    href: "/kids",
    title: "Storybook Studio",
    line: "Generates a printable illustrated storybook with age-matched exercises in under 60 seconds.",
    tag: "LLM · Image gen · PDF",
  },
  {
    href: "/governance",
    title: "AI Governance Sandbox",
    line: "Drafts NIST- and EU AI Act-aligned risk assessments and usage policies for small organizations.",
    tag: "Policy · RAG · Compliance",
  },
  {
    href: "/solar",
    title: "Sensor-Free Solar Tracker",
    line: "Predicts optimal panel angles from location and time alone — no hardware sensors required.",
    tag: "ML · Simulation · Energy",
  },
];

export default function Home() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16 md:py-24">
      <header className="flex items-center justify-between text-sm text-neutral-400">
        <span className="text-[#EDEDED]">Ellysha Fatima</span>
        <nav className="flex gap-5">
          <a href="mailto:efsfatima@gmail.com" className="hover:text-white transition">Email</a>
          <a href="https://linkedin.com/in/ellyshafatima" target="_blank" className="hover:text-white transition">LinkedIn</a>
        </nav>
      </header>

      <section className="mt-24 md:mt-32">
        <h1 className="font-[family-name:var(--font-instrument)] text-4xl md:text-6xl leading-tight max-w-3xl">
          I build AI systems people outside engineering can actually use.
        </h1>
        <p className="mt-6 max-w-xl text-neutral-400 leading-relaxed">
          MS Computer Science at Rutgers, AI and Machine Learning. Currently building automation and AI governance systems. Graduating December 2026.
        </p>
        <p className="mt-10 text-sm text-neutral-500">
          Three things I have built. All live, all yours to try.
        </p>
      </section>

      <section className="mt-10 grid gap-4">
        {projects.map((p) => (
          <Link key={p.href} href={p.href} className="group block rounded-xl border border-neutral-800 bg-neutral-950 p-6 md:p-8 transition hover:border-neutral-600">
            <div className="flex items-baseline justify-between gap-4">
              <h2 className="text-xl md:text-2xl">{p.title}</h2>
              <span className="text-xs text-neutral-600 whitespace-nowrap">{p.tag}</span>
            </div>
            <p className="mt-3 max-w-2xl text-neutral-400 leading-relaxed">{p.line}</p>
            <span className="mt-4 inline-block text-sm text-neutral-500 group-hover:text-white transition">
              Try it →
            </span>
          </Link>
        ))}
      </section>

      <footer className="mt-24 border-t border-neutral-900 pt-8 text-sm text-neutral-500">
        Built with Next.js. New Jersey, USA.
      </footer>
    </main>
  );
}