"use client";

import { useMemo, useState } from "react";
import Trainer from "./Trainer";
import Link from "next/link";
import {
  SITES,
  dayProfile,
  dailyEnergy,
  sunPosition,
  fixedPanel,
  trackedPanel,
  dateFromDayOfYear,
} from "./solar";

const serif = "font-[family-name:var(--font-instrument)]";

export default function Page() {
  const [siteIdx, setSiteIdx] = useState(0);
  const [day, setDay] = useState(172); // summer solstice
  const [hour, setHour] = useState(12);

  const site = SITES[siteIdx];
  const profile = useMemo(() => dayProfile(site, day), [site, day]);
  const sun = useMemo(() => sunPosition(site, day, hour), [site, day, hour]);

  const fp = fixedPanel(site);
  const tp = trackedPanel(sun);
  const up = sun.elevation > 0;

  const eFixed = dailyEnergy(profile, "fixed");
  const eTracked = dailyEnergy(profile, "tracked");
  const gain = eFixed > 0.001 ? ((eTracked - eFixed) / eFixed) * 100 : 0;

  // --- Sun path chart (azimuth vs elevation) ---
  const W = 680, H = 300, M = { t: 20, r: 20, b: 34, l: 40 };
    const px = (az: number) => Math.round((M.l + (az / 360) * (W - M.l - M.r)) * 100) / 100;
  const py = (el: number) => Math.round((H - M.b - (Math.max(0, el) / 90) * (H - M.t - M.b)) * 100) / 100;
  const path = profile
    .filter((p) => p.elevation > 0)
    .map((p, i) => `${i === 0 ? "M" : "L"}${px(p.azimuth).toFixed(1)},${py(p.elevation).toFixed(1)}`)
    .join(" ");

  // --- Energy chart ---
  const EW = 680, EH = 220, EM = { t: 16, r: 20, b: 30, l: 46 };
  const peak = Math.max(...profile.map((p) => p.tracked), 1);
   const ex = (h: number) => Math.round((EM.l + (h / 24) * (EW - EM.l - EM.r)) * 100) / 100;
  const ey = (v: number) => Math.round((EH - EM.b - (v / peak) * (EH - EM.t - EM.b)) * 100) / 100;
  const line = (key: "fixed" | "tracked") =>
    profile.map((p, i) => `${i === 0 ? "M" : "L"}${ex(p.hour).toFixed(1)},${ey(p[key]).toFixed(1)}`).join(" ");

  const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-5";
  const slider = "w-full accent-[#FFB020]";

  return (
    <div className="min-h-screen bg-[#070B14] text-[#E8EDF7]">
      <main className="mx-auto max-w-4xl px-6 py-12">
        <Link href="/" className="text-sm text-[#7C8BA5] hover:text-white">← Back to portfolio</Link>

        <h1 className={`${serif} mt-8 text-5xl md:text-7xl`}>Sensor-Free Solar Tracker</h1>
        <p className="mt-4 max-w-2xl text-lg text-[#9AA9C2]">
          Most solar trackers need light sensors that drift, foul and fail. This one computes where the sun is from
          date, time and coordinates alone — then points the panel at it.
        </p>

        {/* Controls */}
        <div className="mt-10 grid gap-5 rounded-2xl border border-white/10 bg-white/[0.03] p-6">
          <label className="grid gap-2 text-sm text-[#7C8BA5]">
            Location
            <select
              value={siteIdx}
              onChange={(e) => setSiteIdx(Number(e.target.value))}
              className="rounded-lg border border-white/10 bg-[#0D1422] px-4 py-3 text-[#E8EDF7] outline-none focus:border-[#FFB020]"
            >
              {SITES.map((s, i) => (
                <option key={s.name} value={i}>{s.name}</option>
              ))}
            </select>
          </label>

          <label className="grid gap-2 text-sm text-[#7C8BA5]">
            <span className="flex justify-between">
              Date <span className="text-[#E8EDF7]">{dateFromDayOfYear(day)}</span>
            </span>
            <input type="range" min={1} max={365} value={day} onChange={(e) => setDay(Number(e.target.value))} className={slider} />
          </label>

          <label className="grid gap-2 text-sm text-[#7C8BA5]">
            <span className="flex justify-between">
              Time of day
              <span className="text-[#E8EDF7]">
                {String(Math.floor(hour)).padStart(2, "0")}:{String(Math.round((hour % 1) * 60)).padStart(2, "0")}
              </span>
            </span>
            <input type="range" min={0} max={24} step={0.25} value={hour} onChange={(e) => setHour(Number(e.target.value))} className={slider} />
          </label>
        </div>

        {/* Readout */}
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className={card}>
            <p className="text-xs uppercase tracking-widest text-[#7C8BA5]">Sun elevation</p>
            <p className={`${serif} mt-2 text-4xl ${up ? "text-[#FFB020]" : "text-[#4A5878]"}`}>
              {sun.elevation.toFixed(1)}°
            </p>
            <p className="mt-1 text-sm text-[#7C8BA5]">{up ? `Azimuth ${sun.azimuth.toFixed(0)}°` : "Below horizon"}</p>
          </div>
          <div className={card}>
            <p className="text-xs uppercase tracking-widest text-[#7C8BA5]">Commanded tilt</p>
            <p className={`${serif} mt-2 text-4xl`}>{up ? `${tp.tilt.toFixed(1)}°` : "—"}</p>
            <p className="mt-1 text-sm text-[#7C8BA5]">Fixed panel sits at {fp.tilt.toFixed(0)}°</p>
          </div>
          <div className={card}>
            <p className="text-xs uppercase tracking-widest text-[#7C8BA5]">Energy gain today</p>
            <p className={`${serif} mt-2 text-4xl text-[#5BE3A7]`}>+{gain.toFixed(1)}%</p>
            <p className="mt-1 text-sm text-[#7C8BA5]">{eTracked.toFixed(2)} vs {eFixed.toFixed(2)} kWh/m²</p>
          </div>
        </div>

        {/* Sun path */}
        <h2 className="mt-14 text-xs uppercase tracking-widest text-[#7C8BA5]">Sun path · {dateFromDayOfYear(day)}</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]">
            {[0, 30, 60, 90].map((el) => (
              <g key={el}>
                <line x1={M.l} y1={py(el)} x2={W - M.r} y2={py(el)} stroke="#1E2A44" />
                <text x={M.l - 8} y={py(el) + 4} textAnchor="end" fontSize="11" fill="#4A5878">{el}°</text>
              </g>
            ))}
            {[["N", 0], ["E", 90], ["S", 180], ["W", 270]].map(([lbl, az]) => (
              <text key={lbl as string} x={px(az as number)} y={H - 12} textAnchor="middle" fontSize="11" fill="#4A5878">
                {lbl}
              </text>
            ))}
            <path d={path} fill="none" stroke="#FFB020" strokeWidth="2" strokeOpacity="0.5" />
            {up && (
              <g>
                <circle cx={px(sun.azimuth)} cy={py(sun.elevation)} r="16" fill="#FFB020" opacity="0.18" />
                <circle cx={px(sun.azimuth)} cy={py(sun.elevation)} r="6" fill="#FFB020" />
              </g>
            )}
          </svg>
        </div>

        {/* Panel attitude */}
        <h2 className="mt-14 text-xs uppercase tracking-widest text-[#7C8BA5]">Panel attitude</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {[
            { label: "Tracked", tilt: up ? tp.tilt : 0, color: "#FFB020" },
            { label: "Fixed", tilt: fp.tilt, color: "#4A5878" },
          ].map((p) => (
            <div key={p.label} className={card}>
              <p className="text-sm text-[#7C8BA5]">{p.label} · {p.tilt.toFixed(0)}°</p>
              <svg viewBox="0 0 200 110" className="mt-2 w-full">
                <line x1="20" y1="90" x2="180" y2="90" stroke="#1E2A44" strokeWidth="2" />
                                <g transform={`rotate(${(-p.tilt).toFixed(2)} 100 90)`}>
                  <rect x="55" y="84" width="90" height="7" rx="2" fill={p.color} />
                </g>
                <circle cx="100" cy="90" r="3" fill="#7C8BA5" />
              </svg>
            </div>
          ))}
        </div>

        {/* Energy */}
        <h2 className="mt-14 text-xs uppercase tracking-widest text-[#7C8BA5]">Irradiance captured through the day</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <svg viewBox={`0 0 ${EW} ${EH}`} className="w-full min-w-[520px]">
            {[0, 6, 12, 18, 24].map((h) => (
              <text key={h} x={ex(h)} y={EH - 10} textAnchor="middle" fontSize="11" fill="#4A5878">{h}:00</text>
            ))}
            <line x1={EM.l} y1={ey(0)} x2={EW - EM.r} y2={ey(0)} stroke="#1E2A44" />
                        <text x={EM.l} y={EM.t + 4} textAnchor="start" fontSize="11" fill="#4A5878">{peak.toFixed(0)} W/m²</text>
            <path d={line("fixed")} fill="none" stroke="#4A5878" strokeWidth="2" />
            <path d={line("tracked")} fill="none" stroke="#FFB020" strokeWidth="2.5" />
            <line x1={ex(hour)} y1={EM.t} x2={ex(hour)} y2={EH - EM.b} stroke="#E8EDF7" strokeOpacity="0.3" strokeDasharray="4 4" />
          </svg>
          <div className="mt-2 flex gap-6 text-sm text-[#7C8BA5]">
            <span><span className="mr-2 inline-block h-0.5 w-5 bg-[#FFB020] align-middle" />Tracked</span>
            <span><span className="mr-2 inline-block h-0.5 w-5 bg-[#4A5878] align-middle" />Fixed</span>
          </div>
        </div>

        <section className="mt-16 border-t border-white/10 pt-8 text-[#9AA9C2]">
          <h2 className="text-xs uppercase tracking-widest text-[#7C8BA5]">How it works</h2>
                    <p className="mt-4 max-w-2xl leading-relaxed">
            One caveat worth stating: this model counts direct beam irradiance only. Real installations also collect
            diffuse sky radiation, which is largely angle-independent and so lifts the fixed panel&apos;s baseline. Published
            field results for dual-axis tracking sit nearer 30–40%; the figure above is the clear-sky direct-only upper bound.
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed">
            Solar declination and the equation of time come from Spencer&apos;s Fourier series, which together give true
            solar time at any longitude. From there the hour angle yields the sun&apos;s elevation and azimuth. The panel&apos;s
            optimal attitude is simply the vector pointing back at the sun, and captured irradiance is the dot product of
            that vector with the panel&apos;s normal, scaled by a clear-sky air mass model.
          </p>
          <p className="mt-4 max-w-2xl leading-relaxed">
            Everything above runs in your browser with no network calls. Try Reykjavík in December against Nairobi in
            March , the further from the equator, the more a tracker earns its cost.
          </p>
        </section>
             <Trainer site={site} day={day} hour={hour} />
      </main>
    </div>
  );
}