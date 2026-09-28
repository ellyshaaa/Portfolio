// Deterministic AI risk classification.
// Encodes publicly documented obligations from the EU AI Act and the NIST AI RMF (1.0).
// No model is involved: identical inputs always produce an identical assessment.

export type OptionId = string;

export type Question = {
  id: string;
  prompt: string;
  help?: string;
  options: { id: OptionId; label: string; score: number; note?: string }[];
};

export type Dimension = {
  id: string;
  title: string;
  blurb: string;
  questions: Question[];
};

/** Deployment contexts drawn from EU AI Act Annex III high-risk areas. */
export const DOMAINS = [
  { id: "internal", label: "Internal productivity", annexIII: false },
  { id: "marketing", label: "Marketing & communications", annexIII: false },
  { id: "service", label: "Customer or beneficiary service", annexIII: false },
  { id: "hiring", label: "Hiring, promotion or termination", annexIII: true, cite: "Annex III(4)" },
  { id: "education", label: "Education or training access", annexIII: true, cite: "Annex III(3)" },
  { id: "essential", label: "Access to essential services or benefits", annexIII: true, cite: "Annex III(5)" },
  { id: "credit", label: "Creditworthiness or insurance pricing", annexIII: true, cite: "Annex III(5)(b)" },
  { id: "health", label: "Health, safety or clinical decisions", annexIII: true, cite: "Annex III(5)" },
  { id: "justice", label: "Law enforcement or legal processes", annexIII: true, cite: "Annex III(6)" },
] as const;

export const DIMENSIONS: Dimension[] = [
  {
    id: "autonomy",
    title: "Autonomy",
    blurb: "How much human judgement stands between the system and the outcome.",
    questions: [
      {
        id: "decision",
        prompt: "What does the system's output do?",
        options: [
          { id: "draft", label: "Produces a draft a person edits", score: 0 },
          { id: "recommend", label: "Recommends; a person decides", score: 2 },
          { id: "default", label: "Sets a default a person may override", score: 4, note: "Overrides are rarely exercised in practice; treat as near-autonomous." },
          { id: "acts", label: "Acts without review", score: 6 },
        ],
      },
      {
        id: "reversible",
        prompt: "If the output is wrong, can it be undone?",
        options: [
          { id: "trivial", label: "Trivially, before anyone sees it", score: 0 },
          { id: "effort", label: "With effort, within days", score: 2 },
          { id: "hard", label: "Only partially; someone is already affected", score: 4 },
          { id: "no", label: "Not meaningfully", score: 6 },
        ],
      },
    ],
  },
  {
    id: "data",
    title: "Data",
    blurb: "What the system is fed and where that data travels.",
    questions: [
      {
        id: "sensitivity",
        prompt: "What is the most sensitive data involved?",
        options: [
          { id: "public", label: "Public or synthetic only", score: 0 },
          { id: "internal", label: "Internal business data", score: 1 },
          { id: "personal", label: "Personal data (names, contact, history)", score: 3 },
          { id: "special", label: "Special-category data (health, biometric, beliefs, minors)", score: 6, note: "GDPR Art. 9 conditions apply before processing." },
        ],
      },
      {
        id: "residency",
        prompt: "Where is the data processed?",
        options: [
          { id: "onprem", label: "Self-hosted or on-premises", score: 0 },
          { id: "contracted", label: "Vendor under a signed DPA, no training on our data", score: 1 },
          { id: "vendor", label: "Commercial vendor, terms not reviewed", score: 4 },
          { id: "consumer", label: "Consumer tool with a personal account", score: 6, note: "Shadow AI: the most common uncontrolled exposure." },
        ],
      },
    ],
  },
  {
    id: "people",
    title: "Affected people",
    blurb: "Who bears the consequences, and whether they chose to be there.",
    questions: [
      {
        id: "subjects",
        prompt: "Who is most affected by the output?",
        options: [
          { id: "staff", label: "Our own staff, in low-stakes work", score: 0 },
          { id: "public", label: "General public or customers", score: 2 },
          { id: "clients", label: "Service recipients who depend on us", score: 4 },
          { id: "vulnerable", label: "Minors, patients, or people in crisis", score: 6 },
        ],
      },
      {
        id: "disclosure",
        prompt: "Do affected people know AI is involved?",
        help: "EU AI Act Art. 50 requires disclosure for systems interacting with people or generating synthetic content.",
        options: [
          { id: "clear", label: "Disclosed clearly at the point of interaction", score: 0 },
          { id: "buried", label: "Mentioned in a policy document somewhere", score: 2 },
          { id: "none", label: "Not disclosed", score: 4 },
        ],
      },
    ],
  },
  {
    id: "oversight",
    title: "Oversight",
    blurb: "Whether anyone would notice if it started going wrong.",
    questions: [
      {
        id: "evaluation",
        prompt: "How was quality established before deployment?",
        options: [
          { id: "tested", label: "Tested against a labelled set, results documented", score: 0 },
          { id: "pilot", label: "Informal pilot with spot checks", score: 2 },
          { id: "vibes", label: "It looked good in a few examples", score: 4 },
        ],
      },
      {
        id: "monitoring",
        prompt: "What happens after launch?",
        options: [
          { id: "logged", label: "Outputs logged, reviewed on a schedule", score: 0 },
          { id: "complaints", label: "We'd hear about it if someone complained", score: 3 },
          { id: "nothing", label: "No monitoring in place", score: 5 },
        ],
      },
    ],
  },
];

/** Art. 5 prohibited practices. Any one of these is a hard stop. */
export const PROHIBITED = [
  { id: "social", label: "Scores people's trustworthiness from unrelated behaviour", cite: "Art. 5(1)(c)" },
  { id: "emotion", label: "Infers emotions in the workplace or in education", cite: "Art. 5(1)(f)" },
  { id: "biometric", label: "Categorises people by biometrics to infer race, beliefs or orientation", cite: "Art. 5(1)(g)" },
  { id: "scraping", label: "Builds facial recognition databases by untargeted scraping", cite: "Art. 5(1)(e)" },
  { id: "manipulate", label: "Exploits age, disability or hardship to distort behaviour", cite: "Art. 5(1)(b)" },
] as const;

export type Tier = "prohibited" | "high" | "limited" | "minimal";

export type Control = { id: string; text: string; source: string; fn: "GOVERN" | "MAP" | "MEASURE" | "MANAGE" };

export type Result = {
  tier: Tier;
  score: number;
  maxScore: number;
  rationale: string[];
  dimensionScores: { id: string; title: string; score: number; max: number }[];
  controls: Control[];
  approvers: string[];
  reviewCadence: string;
};

export const MAX_SCORE = DIMENSIONS.reduce(
  (t, d) => t + d.questions.reduce((s, q) => s + Math.max(...q.options.map((o) => o.score)), 0),
  0
);

export function classify(
  domainId: string,
  answers: Record<string, string>,
  prohibitedFlags: string[]
): Result {
  const rationale: string[] = [];
  const domain = DOMAINS.find((d) => d.id === domainId) || DOMAINS[0];

  // Dimension scoring
  const dimensionScores = DIMENSIONS.map((d) => {
    let score = 0;
    let max = 0;
    for (const q of d.questions) {
      max += Math.max(...q.options.map((o) => o.score));
      const chosen = q.options.find((o) => o.id === answers[q.id]);
      if (chosen) {
        score += chosen.score;
        if (chosen.note) rationale.push(chosen.note);
      }
    }
    return { id: d.id, title: d.title, score, max };
  });

  const score = dimensionScores.reduce((t, d) => t + d.score, 0);

  // Gate 1: prohibited practices override everything.
  if (prohibitedFlags.length > 0) {
    const cites = prohibitedFlags
      .map((f) => PROHIBITED.find((p) => p.id === f)?.cite)
      .filter(Boolean)
      .join(", ");
    return {
      tier: "prohibited",
      score,
      maxScore: MAX_SCORE,
      rationale: [`Matches a practice prohibited outright under EU AI Act ${cites}. No control set makes this deployable in the EU.`],
      dimensionScores,
      controls: [
        { id: "stop", text: "Do not deploy. Document the decision and the reasoning.", source: "EU AI Act Art. 5", fn: "GOVERN" },
        { id: "alt", text: "Identify whether the underlying need can be met without inferring protected characteristics.", source: "NIST AI RMF MAP 1.1", fn: "MAP" },
      ],
      approvers: ["Legal counsel", "Executive director or CEO"],
      reviewCadence: "Not applicable",
    };
  }

  // Gate 2: Annex III domains are high-risk by deployment context, regardless of score.
  let tier: Tier;
  if (domain.annexIII) {
    tier = "high";
    rationale.unshift(
      `${domain.label} falls within EU AI Act ${"cite" in domain ? domain.cite : "Annex III"}, which classifies this deployment context as high-risk irrespective of how the system is built.`
    );
  } else if (score >= 26) {
    tier = "high";
    rationale.unshift("Scored in the high band on autonomy, data sensitivity and oversight combined.");
  } else if (score >= 12) {
    tier = "limited";
    rationale.unshift("Moderate exposure: meaningful consequences, but with human judgement or reversibility available.");
  } else {
    tier = "minimal";
    rationale.unshift("Low exposure: reversible outputs, non-sensitive data, human in the loop.");
  }

  // Transparency obligation is independent of tier.
  if (answers.disclosure === "none" || answers.disclosure === "buried") {
    rationale.push("Art. 50 transparency obligations apply wherever people interact with the system or receive AI-generated content.");
  }

  return {
    tier,
    score,
    maxScore: MAX_SCORE,
    rationale,
    dimensionScores,
    controls: controlsFor(tier, answers, domain.annexIII),
    approvers: approversFor(tier),
    reviewCadence:
      tier === "high" ? "Quarterly, plus re-assessment on any model or vendor change" :
      tier === "limited" ? "Every six months" : "Annually",
  };
}

function controlsFor(tier: Tier, a: Record<string, string>, annexIII: boolean): Control[] {
  const c: Control[] = [
    { id: "inventory", text: "Record the system in an AI inventory with an accountable owner named.", source: "NIST AI RMF GOVERN 1.3", fn: "GOVERN" },
    { id: "purpose", text: "Write down the intended use and the uses explicitly ruled out.", source: "NIST AI RMF MAP 1.1", fn: "MAP" },
  ];

  if (a.sensitivity === "personal" || a.sensitivity === "special") {
    c.push({ id: "dpa", text: "Confirm a data processing agreement is in place and that inputs are excluded from vendor training.", source: "GDPR Art. 28", fn: "GOVERN" });
    c.push({ id: "minimise", text: "Strip identifiers that the task does not require before sending data to the model.", source: "NIST AI RMF MAP 2.3", fn: "MAP" });
  }
  if (a.sensitivity === "special") {
    c.push({ id: "dpia", text: "Complete a data protection impact assessment before processing begins.", source: "GDPR Art. 35", fn: "MEASURE" });
  }
  if (a.residency === "consumer") {
    c.push({ id: "shadow", text: "Move off personal accounts onto a governed workspace; personal accounts leave no audit trail.", source: "NIST AI RMF GOVERN 1.5", fn: "GOVERN" });
  }
  if (a.disclosure !== "clear") {
    c.push({ id: "disclose", text: "Disclose AI involvement at the point of interaction, in plain language.", source: "EU AI Act Art. 50", fn: "MANAGE" });
  }
  if (a.decision === "acts" || a.decision === "default") {
    c.push({ id: "hitl", text: "Insert a human review step with authority and time to actually reject the output.", source: "EU AI Act Art. 14", fn: "MANAGE" });
  }
  if (a.evaluation !== "tested") {
    c.push({ id: "eval", text: "Build a labelled evaluation set from real cases and record baseline accuracy before launch.", source: "NIST AI RMF MEASURE 2.3", fn: "MEASURE" });
  }
  if (a.monitoring !== "logged") {
    c.push({ id: "monitor", text: "Log inputs and outputs, and sample them on a schedule for quality and drift.", source: "NIST AI RMF MEASURE 2.4", fn: "MEASURE" });
  }
  if (a.subjects === "vulnerable" || a.subjects === "clients") {
    c.push({ id: "appeal", text: "Give affected people a named route to contest an outcome and reach a human.", source: "EU AI Act Art. 86", fn: "MANAGE" });
  }

  if (tier === "high" || annexIII) {
    c.push(
      { id: "riskmgmt", text: "Operate a documented risk management system across the system's lifecycle.", source: "EU AI Act Art. 9", fn: "GOVERN" },
      { id: "bias", text: "Test error rates separately across the groups the system affects, not just in aggregate.", source: "EU AI Act Art. 10 · NIST MEASURE 2.11", fn: "MEASURE" },
      { id: "records", text: "Retain automatic logs for the period required, sufficient to reconstruct a decision.", source: "EU AI Act Art. 12", fn: "MANAGE" },
      { id: "incident", text: "Define an incident procedure with a named owner and a kill switch.", source: "NIST AI RMF MANAGE 4.1", fn: "MANAGE" }
    );
  }

  return c;
}

function approversFor(tier: Tier): string[] {
  if (tier === "high") return ["System owner", "Data protection lead", "Legal counsel", "Executive sponsor"];
  if (tier === "limited") return ["System owner", "Data protection lead"];
  return ["System owner"];
}

export const TIER_META: Record<Tier, { label: string; color: string; summary: string }> = {
  prohibited: { label: "Prohibited", color: "#B42318", summary: "Cannot be deployed in the EU under any control set." },
  high: { label: "High risk", color: "#B54708", summary: "Deployable, but only with documented controls, testing and oversight." },
  limited: { label: "Limited risk", color: "#B58B00", summary: "Transparency obligations apply; proportionate controls are enough." },
  minimal: { label: "Minimal risk", color: "#067647", summary: "Routine deployment. Baseline hygiene applies." },
};