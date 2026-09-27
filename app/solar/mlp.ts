// A tiny MLP distilled from the analytic solar model.
// Goal: replace trig + Fourier series with ~435 parameters that fit on a microcontroller.

import { SITES, sunPosition, type Site } from "./solar";

const ARCH = [6, 16, 16, 3]; // 6 inputs -> two hidden layers -> [elevation, sin(az), cos(az)]

export type Layer = {
  w: number[][]; b: number[];
  mw: number[][]; vw: number[][];
  mb: number[]; vb: number[];
};
export type Net = { layers: Layer[]; t: number };

export const PARAM_COUNT = ARCH.slice(1).reduce(
  (sum, n, i) => sum + n * ARCH[i] + n, 0
);

/** Deterministic RNG so training runs are reproducible. */
export function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 4294967296);
}

function gauss(rand: () => number) {
  const u = Math.max(1e-9, rand());
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * rand());
}

export function createNet(seed = 42): Net {
  const rand = rng(seed);
  const layers: Layer[] = [];
  for (let l = 1; l < ARCH.length; l++) {
    const inN = ARCH[l - 1], outN = ARCH[l];
    const scale = Math.sqrt(2 / (inN + outN)); // Xavier
    layers.push({
      w: Array.from({ length: outN }, () => Array.from({ length: inN }, () => gauss(rand) * scale)),
      b: new Array(outN).fill(0),
      mw: Array.from({ length: outN }, () => new Array(inN).fill(0)),
      vw: Array.from({ length: outN }, () => new Array(inN).fill(0)),
      mb: new Array(outN).fill(0),
      vb: new Array(outN).fill(0),
    });
  }
  return { layers, t: 0 };
}

/** Cyclical encoding: the model never sees a discontinuity at midnight or New Year. */
export function features(site: Site, day: number, hour: number): number[] {
  const d = (2 * Math.PI * day) / 365;
  const h = (2 * Math.PI * hour) / 24;
  return [
    Math.sin(d), Math.cos(d),
    Math.sin(h), Math.cos(h),
    site.lat / 90,
    (site.lng - 15 * site.tz) / 30, // offset from the timezone meridian
  ];
}

export function forward(net: Net, x: number[]): number[][] {
  const acts: number[][] = [x];
  net.layers.forEach((layer, l) => {
    const last = l === net.layers.length - 1;
    const prev = acts[l];
    const out = layer.b.map((bias, j) => {
      let s = bias;
      for (let i = 0; i < prev.length; i++) s += prev[i] * layer.w[j][i];
      return last ? s : Math.tanh(s);
    });
    acts.push(out);
  });
  return acts;
}

export function predict(net: Net, site: Site, day: number, hour: number) {
  const out = forward(net, features(site, day, hour))[net.layers.length];
  const az = (Math.atan2(out[1], out[2]) * 180) / Math.PI;
  return { elevation: out[0] * 90, azimuth: (az + 360) % 360 };
}

export type Row = { x: number[]; y: number[] };

/** Sample daylight moments. Noise simulates imperfect field readings. */
export function makeBatch(rand: () => number, n: number, noiseDeg = 0): Row[] {
  const rows: Row[] = [];
  while (rows.length < n) {
    const site = SITES[Math.floor(rand() * SITES.length)];
    const day = 1 + Math.floor(rand() * 365);
    const hour = rand() * 24;
    const sun = sunPosition(site, day, hour);
    if (sun.elevation <= 5) continue; // panels are parked at night

    const el = sun.elevation + (noiseDeg ? gauss(rand) * noiseDeg : 0);
    const az = sun.azimuth + (noiseDeg ? gauss(rand) * noiseDeg : 0);
    const azR = (az * Math.PI) / 180;

    rows.push({ x: features(site, day, hour), y: [el / 90, Math.sin(azR), Math.cos(azR)] });
  }
  return rows;
}

/** One Adam step over a batch. Returns MSE. */
export function trainStep(net: Net, batch: Row[], lr = 0.01): number {
  const L = net.layers.length;
  const gw = net.layers.map((l) => l.w.map((r) => r.map(() => 0)));
  const gb = net.layers.map((l) => l.b.map(() => 0));
  let loss = 0;

  for (const { x, y } of batch) {
    const acts = forward(net, x);
    const deltas: number[][] = new Array(L);

    deltas[L - 1] = acts[L].map((o, j) => {
      const e = o - y[j];
      loss += e * e;
      return 2 * e;
    });

    for (let l = L - 2; l >= 0; l--) {
      const next = net.layers[l + 1];
      const a = acts[l + 1];
      deltas[l] = a.map((ai, i) => {
        let s = 0;
        for (let j = 0; j < next.b.length; j++) s += next.w[j][i] * deltas[l + 1][j];
        return s * (1 - ai * ai); // tanh derivative
      });
    }

    for (let l = 0; l < L; l++) {
      const inp = acts[l];
      for (let j = 0; j < net.layers[l].b.length; j++) {
        gb[l][j] += deltas[l][j];
        for (let i = 0; i < inp.length; i++) gw[l][j][i] += deltas[l][j] * inp[i];
      }
    }
  }

  net.t += 1;
  const b1 = 0.9, b2 = 0.999, eps = 1e-8, N = batch.length;
  const c1 = 1 - Math.pow(b1, net.t), c2 = 1 - Math.pow(b2, net.t);

  net.layers.forEach((layer, l) => {
    for (let j = 0; j < layer.b.length; j++) {
      for (let i = 0; i < layer.w[j].length; i++) {
        const g = gw[l][j][i] / N;
        layer.mw[j][i] = b1 * layer.mw[j][i] + (1 - b1) * g;
        layer.vw[j][i] = b2 * layer.vw[j][i] + (1 - b2) * g * g;
        layer.w[j][i] -= (lr * (layer.mw[j][i] / c1)) / (Math.sqrt(layer.vw[j][i] / c2) + eps);
      }
      const g = gb[l][j] / N;
      layer.mb[j] = b1 * layer.mb[j] + (1 - b1) * g;
      layer.vb[j] = b2 * layer.vb[j] + (1 - b2) * g * g;
      layer.b[j] -= (lr * (layer.mb[j] / c1)) / (Math.sqrt(layer.vb[j] / c2) + eps);
    }
  });

  return loss / (N * 3);
}

/** Mean absolute error in degrees against the noiseless analytic model. */
export function evaluate(net: Net, seed = 999, n = 400) {
  const rand = rng(seed);
  let elErr = 0, azErr = 0, count = 0;

  while (count < n) {
    const site = SITES[Math.floor(rand() * SITES.length)];
    const day = 1 + Math.floor(rand() * 365);
    const hour = rand() * 24;
    const truth = sunPosition(site, day, hour);
    if (truth.elevation <= 5) continue;

    const p = predict(net, site, day, hour);
    elErr += Math.abs(p.elevation - truth.elevation);
    azErr += Math.abs(((p.azimuth - truth.azimuth + 540) % 360) - 180); // circular
    count++;
  }
  return { elevationMAE: elErr / count, azimuthMAE: azErr / count };
}