"use client";

import { useEffect, useRef, useState } from "react";
import { sunPosition, type Site } from "./solar";
import { createNet, makeBatch, trainStep, evaluate, predict, rng, PARAM_COUNT, type Net } from "./mlp";

const serif = "font-[family-name:var(--font-instrument)]";
const TOTAL_STEPS = 1500;
const STEPS_PER_TICK = 15;

export default function Trainer({ site, day, hour }: { site: Site; day: number; hour: number }) {
  const netRef = useRef<Net | null>(null);
  const randRef = useRef(rng(7));
  const [step, setStep] = useState(0);
  const [losses, setLosses] = useState<number[]>([]);
  const [mae, setMae] = useState<{ elevationMAE: number; azimuthMAE: number } | null>(null);
  const [running, setRunning] = useState(false);
  const [trained, setTrained] = useState(false);

  useEffect(() => {
    if (!running) return;
    const id = setInterval(() => {
      const net = netRef.current;
      if (!net) return;

      let last = 0;
      setStep((s) => {
        for (let i = 0; i < STEPS_PER_TICK; i++) {
          // Decay the learning rate so the late steps settle instead of bouncing.
          const progress = (s + i) / TOTAL_STEPS;
          const lr = 0.02 * (1 - 0.95 * progress);
          last = trainStep(net, makeBatch(randRef.current, 48, 0.4), lr);
        }
        setLosses((prev) => [...prev, last]);

        const next = s + STEPS_PER_TICK;
        if (next >= TOTAL_STEPS) {
          setRunning(false);
          setTrained(true);
          setMae(evaluate(net));
        }
        return next;
      });
    }, 16);
    return () => clearInterval(id);
  }, [running]);

  function start() {
    netRef.current = createNet(42);
    randRef.current = rng(7);
    setLosses([]);
    setStep(0);
    setMae(null);
    setTrained(false);
    setRunning(true);
  }

  const truth = sunPosition(site, day, hour);
  const guess = trained && netRef.current ? predict(netRef.current, site, day, hour) : null;

  // loss curve, log scale
  const W = 680, H = 160, M = { t: 12, r: 16, b: 24, l: 52 };
  const logs = losses.map((l) => Math.log10(Math.max(l, 1e-6)));
  const hi = logs.length ? Math.max(...logs) : 0;
  const lo = logs.length ? Math.min(...logs) : -4;
  const lx = (i: number) =>
    Math.round((M.l + (i / Math.max(1, TOTAL_STEPS / STEPS_PER_TICK - 1)) * (W - M.l - M.r)) * 100) / 100;
  const ly = (v: number) =>
    Math.round((H - M.b - ((v - lo) / Math.max(1e-6, hi - lo)) * (H - M.t - M.b)) * 100) / 100;
  const curve = logs.map((v, i) => `${i === 0 ? "M" : "L"}${lx(i)},${ly(v)}`).join(" ");

  const card = "rounded-2xl border border-white/10 bg-white/[0.03] p-5";

  return (
    <section className="mt-16 border-t border-white/10 pt-10">
      <h2 className="text-xs uppercase tracking-widest text-[#7C8BA5]">
        Learned controller · trains in your browser
      </h2>
      <p className="mt-4 max-w-2xl leading-relaxed text-[#9AA9C2]">
        The analytic model above is exact, but it costs trig and a Fourier series on every update , awkward on a
        microcontroller with no floating-point unit. So here a {PARAM_COUNT}-parameter neural network is distilled from
        it, trained on noisy readings to see whether it can recover the true physics. Nothing is precomputed; it trains
        live when you press the button.
      </p>

      <div className="mt-6 flex flex-wrap items-center gap-4">
        <button
          onClick={start}
          disabled={running}
          className="rounded-full bg-[#FFB020] px-6 py-3 font-medium text-[#070B14] transition hover:brightness-110 disabled:opacity-40"
        >
          {running ? "Training..." : trained ? "Retrain from scratch" : "Train the model"}
        </button>
        <span className="text-sm text-[#7C8BA5]">
          {step} / {TOTAL_STEPS} steps · Adam · batch 48 · decaying LR
        </span>
      </div>

      {losses.length > 0 && (
        <div className="mt-6 overflow-x-auto rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full min-w-[520px]">
            <text x={M.l - 8} y={M.t + 10} textAnchor="end" fontSize="11" fill="#4A5878">
              1e{hi.toFixed(0)}
            </text>
            <text x={M.l - 8} y={H - M.b} textAnchor="end" fontSize="11" fill="#4A5878">
              1e{lo.toFixed(0)}
            </text>
            <line x1={M.l} y1={H - M.b} x2={W - M.r} y2={H - M.b} stroke="#1E2A44" />
            <path d={curve} fill="none" stroke="#5BE3A7" strokeWidth="2" />
            <text x={W - M.r} y={H - 6} textAnchor="end" fontSize="11" fill="#4A5878">
              training loss (log scale)
            </text>
          </svg>
        </div>
      )}

      {mae && (
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          <div className={card}>
            <p className="text-xs uppercase tracking-widest text-[#7C8BA5]">Elevation error</p>
            <p className={`${serif} mt-2 text-4xl text-[#5BE3A7]`}>{mae.elevationMAE.toFixed(2)}°</p>
            <p className="mt-1 text-sm text-[#7C8BA5]">MAE on 400 held-out samples</p>
          </div>
          <div className={card}>
            <p className="text-xs uppercase tracking-widest text-[#7C8BA5]">Azimuth error</p>
            <p className={`${serif} mt-2 text-4xl text-[#5BE3A7]`}>{mae.azimuthMAE.toFixed(2)}°</p>
            <p className="mt-1 text-sm text-[#7C8BA5]">Circular MAE, unseen dates</p>
          </div>
          <div className={card}>
            <p className="text-xs uppercase tracking-widest text-[#7C8BA5]">Model size</p>
            <p className={`${serif} mt-2 text-4xl`}>{PARAM_COUNT * 4} B</p>
            <p className="mt-1 text-sm text-[#7C8BA5]">{PARAM_COUNT} float32 parameters</p>
          </div>
        </div>
      )}

      {guess && (
        <div className="mt-6 rounded-2xl border border-white/10 bg-white/[0.03] p-5">
          <p className="text-xs uppercase tracking-widest text-[#7C8BA5]">At the moment selected above</p>
          <div className="mt-4 grid gap-6 sm:grid-cols-2">
            <div>
              <p className="text-sm text-[#7C8BA5]">Analytic (ground truth)</p>
              <p className={`${serif} mt-1 text-2xl`}>
                {truth.elevation.toFixed(2)}° · {truth.azimuth.toFixed(1)}°
              </p>
            </div>
            <div>
              <p className="text-sm text-[#7C8BA5]">Learned network</p>
              <p className={`${serif} mt-1 text-2xl text-[#FFB020]`}>
                {guess.elevation.toFixed(2)}° · {guess.azimuth.toFixed(1)}°
              </p>
            </div>
          </div>
          <p className="mt-4 text-sm text-[#7C8BA5]">
            Move the date and time sliders to test it on moments it never saw during training.
          </p>
        </div>
      )}

      <p className="mt-8 max-w-2xl text-sm leading-relaxed text-[#7C8BA5]">
        Two choices matter here. Day and hour are fed in as sine and cosine pairs, so the network never sees a
        discontinuity at midnight or at New Year. And azimuth is predicted as a sine and cosine rather than an angle,
        which avoids the model being punished for the jump between 359° and 1°. Without those, the same architecture
        stalls around 20° of error.
      </p>
      <p className="mt-4 max-w-2xl text-sm leading-relaxed text-[#7C8BA5]">
        Where it is weakest: near sunrise and sunset. An earlier version trained only above 5° elevation and drifted
        by 6° or more at dawn, because it was extrapolating outside its training range. Sampling down to −5° fixed
        that. Accuracy is still lowest at shallow angles, which is tolerable here since a panel captures little energy
        with the sun on the horizon.
      </p>
    </section>
  );
}