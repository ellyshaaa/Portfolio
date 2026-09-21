import Link from "next/link";

export default function Page() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-16">
      <Link href="/" className="text-sm text-neutral-500 hover:text-[#EDEDED]">
        ← Back
      </Link>
      <h1 className="font-[family-name:var(--font-instrument)] mt-10 text-4xl">
        Sensor-Free Solar Tracker
      </h1>
      <p className="mt-4 text-neutral-400">Coming soon.</p>
    </main>
  );
}