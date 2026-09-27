// Solar position and irradiance model.
// Panel angles are derived from astronomy alone: no light sensors required.

const DEG = Math.PI / 180;
const RAD = 180 / Math.PI;

export type Site = { name: string; lat: number; lng: number; tz: number };

export const SITES: Site[] = [
  { name: "New Brunswick, NJ", lat: 40.49, lng: -74.45, tz: -5 },
  { name: "San Francisco, CA", lat: 37.77, lng: -122.42, tz: -8 },
  { name: "Islamabad, Pakistan", lat: 33.68, lng: 73.05, tz: 5 },
  { name: "Reykjavík, Iceland", lat: 64.15, lng: -21.94, tz: 0 },
  { name: "Nairobi, Kenya", lat: -1.29, lng: 36.82, tz: 3 },
  { name: "Sydney, Australia", lat: -33.87, lng: 151.21, tz: 10 },
];

/** Spencer (1971) Fourier series. Returns radians. */
export function declination(dayOfYear: number): number {
  const g = (2 * Math.PI * (dayOfYear - 1)) / 365;
  return (
    0.006918 -
    0.399912 * Math.cos(g) +
    0.070257 * Math.sin(g) -
    0.006758 * Math.cos(2 * g) +
    0.000907 * Math.sin(2 * g) -
    0.002697 * Math.cos(3 * g) +
    0.00148 * Math.sin(3 * g)
  );
}

/** Correction between clock time and true solar time. Returns minutes. */
export function equationOfTime(dayOfYear: number): number {
  const g = (2 * Math.PI * (dayOfYear - 1)) / 365;
  return (
    229.18 *
    (0.000075 +
      0.001868 * Math.cos(g) -
      0.032077 * Math.sin(g) -
      0.014615 * Math.cos(2 * g) -
      0.040849 * Math.sin(2 * g))
  );
}

export type SunPos = { elevation: number; azimuth: number };

/** Sun elevation and azimuth (degrees, azimuth clockwise from north). */
export function sunPosition(site: Site, dayOfYear: number, localHour: number): SunPos {
  const decl = declination(dayOfYear);
  const eot = equationOfTime(dayOfYear);

  // Clock time -> true solar time.
  const lstm = 15 * site.tz;
  const solarHour = localHour + (4 * (site.lng - lstm) + eot) / 60;
  const H = (solarHour - 12) * 15 * DEG; // hour angle

  const lat = site.lat * DEG;
  const sinEl =
    Math.sin(lat) * Math.sin(decl) + Math.cos(lat) * Math.cos(decl) * Math.cos(H);
  const elevation = Math.asin(Math.max(-1, Math.min(1, sinEl)));

  const cosAz =
    (Math.sin(decl) * Math.cos(lat) - Math.cos(decl) * Math.sin(lat) * Math.cos(H)) /
    Math.max(1e-6, Math.cos(elevation));
  let azimuth = Math.acos(Math.max(-1, Math.min(1, cosAz))) * RAD;
  if (H > 0) azimuth = 360 - azimuth; // afternoon: sun is west of north

  return { elevation: elevation * RAD, azimuth };
}

/**
 * Cosine of the angle between the sun and the panel's normal.
 * Computed as a dot product of unit vectors in local East-North-Up coordinates.
 */
export function cosIncidence(
  sunEl: number,
  sunAz: number,
  tilt: number,
  panelAz: number
): number {
  const el = sunEl * DEG;
  const sa = sunAz * DEG;
  const t = tilt * DEG;
  const pa = panelAz * DEG;

  const sun = [Math.cos(el) * Math.sin(sa), Math.cos(el) * Math.cos(sa), Math.sin(el)];
  const normal = [Math.sin(t) * Math.sin(pa), Math.sin(t) * Math.cos(pa), Math.cos(t)];

  return Math.max(0, sun[0] * normal[0] + sun[1] * normal[1] + sun[2] * normal[2]);
}

/** Clear-sky direct normal irradiance (Meinel). W/m². */
export function clearSkyDNI(elevationDeg: number): number {
  if (elevationDeg <= 3) return 0;
  const airMass = 1 / Math.sin(elevationDeg * DEG);
  return 1000 * Math.pow(0.7, Math.pow(airMass, 0.678));
}

/** Fixed panel: tilted at latitude, facing the equator. */
export function fixedPanel(site: Site) {
  return { tilt: Math.abs(site.lat), azimuth: site.lat >= 0 ? 180 : 0 };
}

/** Dual-axis tracker: aim straight at the sun. */
export function trackedPanel(sun: SunPos) {
  return { tilt: Math.max(0, 90 - sun.elevation), azimuth: sun.azimuth };
}

export type Sample = {
  hour: number;
  elevation: number;
  azimuth: number;
  fixed: number;
  tracked: number;
};

/** Sample the whole day every 10 minutes. */
export function dayProfile(site: Site, dayOfYear: number): Sample[] {
  const out: Sample[] = [];
  const fp = fixedPanel(site);

  for (let m = 0; m <= 24 * 60; m += 10) {
    const hour = m / 60;
    const sun = sunPosition(site, dayOfYear, hour);
    const dni = clearSkyDNI(sun.elevation);
    const tp = trackedPanel(sun);

    out.push({
      hour,
      elevation: sun.elevation,
      azimuth: sun.azimuth,
      fixed: dni * cosIncidence(sun.elevation, sun.azimuth, fp.tilt, fp.azimuth),
      tracked: dni * cosIncidence(sun.elevation, sun.azimuth, tp.tilt, tp.azimuth),
    });
  }
  return out;
}

/** Integrate a day's profile into kWh/m² using the trapezoidal rule. */
export function dailyEnergy(profile: Sample[], key: "fixed" | "tracked"): number {
  let sum = 0;
  for (let i = 1; i < profile.length; i++) {
    sum += ((profile[i][key] + profile[i - 1][key]) / 2) * (10 / 60);
  }
  return sum / 1000;
}

export function dateFromDayOfYear(day: number): string {
  const d = new Date(2025, 0, 1);
  d.setDate(day);
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric" });
}