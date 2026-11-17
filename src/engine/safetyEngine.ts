import type { SafetyEvaluation, SafetyLevel } from '../types/science';

const RED_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\b(explosive|detonat|bomb|tnt|nitroglycerin|rdx|c4|pipe\s*bomb|molotov|thermite|gunpowder|black\s*powder)\b/i,
    reason: 'Energetic, explosive, or incendiary materials are strictly prohibited.',
  },
  {
    pattern: /\b(poison|cyanide|ricin|sarin|nerve\s*agent|arsenic|phosgene|mustard\s*gas|chlorine\s*gas|bleach\s*(and|with|\+)\s*ammonia)\b/i,
    reason: 'Toxic gas generation or lethal chemical agents are strictly blocked.',
  },
  {
    pattern: /\b(methamphetamine|fentanyl|lsd|synthesize\s+drug|illicit\s+drug|narcotic)\b/i,
    reason: 'Illicit chemical synthesis instructions are strictly prohibited.',
  },
  {
    pattern: /\b(mains\s*electricity|wall\s*outlet|220\s*v|230\s*v|240\s*v|120\s*v\s*ac|high\s*voltage\s*capacitor|microwave\s*transformer|taser|electrocut)\b/i,
    reason: 'Mains AC electricity or lethal high-voltage DIY experiments are blocked for student safety.',
  },
  {
    pattern: /\b(hydrofluoric|concentrated\s*sulfuric|fuming\s*nitric|aqua\s*regia|piranha\s*solution|white\s*phosphorus|sodium\s*metal\s*in\s*water|potassium\s*metal)\b/i,
    reason: 'Highly corrosive, pyrophoric, or violently reactive chemicals are restricted.',
  },
  {
    pattern: /\b(radioactive|uranium|plutonium|x-ray\s*tube|laser\s*weapon|biological\s*weapon|pathogen\s*culture|anthrax)\b/i,
    reason: 'Ionizing radiation, biological hazards, or weaponized systems are strictly blocked.',
  },
  {
    pattern: /\b(exact\s*ratio|step[-\s]*by[-\s]*step\s*mix|mixing\s*sequence|grams\s*of\s*potassium\s*nitrate|boil\s*acid)\b/i,
    reason: 'Actionable hazardous mixing sequences, quantities, or ratios cannot be provided.',
  },
];

const AMBER_PATTERNS: { pattern: RegExp; reason: string }[] = [
  {
    pattern: /\b(acid|base|alkali|hydrochloric|vinegar\s*and\s*baking|ph\s*test|titration|reagent|chemical)\b/i,
    reason: 'Chemical substances require teacher supervision and virtual-first modelling.',
  },
  {
    pattern: /\b(heat|boil|burner|flame|hot\s*plate|pressure\s*cooker|steam|pressurized)\b/i,
    reason: 'Thermal or pressurized apparatus requires adult or teacher supervision in physical labs.',
  },
  {
    pattern: /\b(battery|circuit|resistor|voltage|current|laser|uv\s*light|magnet|soldering)\b/i,
    reason: 'Electrical or optical components require low-voltage DC limits and teacher review.',
  },
  {
    pattern: /\b(microscope|bacteria|yeast|mold|fermentation|soil\s*sample|pond\s*water)\b/i,
    reason: 'Biological samples require standard classroom hygiene and teacher review.',
  },
];

const BYPASS_PATTERNS = [
  /\b(ignore\s+(all\s+)?safety|bypass\s+safety|for\s+a\s+novel|fictional\s+only|educational\s+purposes\s+only\s+give\s+exact|pretend\s+i\s+am\s+a\s+chemist|i\s+take\s+full\s+responsibility|disclaimer)\b/i,
];

const UNKNOWN_SUBSTANCE_PATTERNS = [
  /\b(unknown\s+(liquid|powder|chemical|substance|gas|crystal|mixture)|unlabeled\s+(bottle|jar|vial)|mystery\s+(powder|chemical|liquid)|found\s+chemical)\b/i,
];

const PII_PATTERNS = [
  /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/,
  /\b(street|avenue|road|lane|school\s+name|my\s+address|phone\s+number)\b/i,
];

export function containsPersonalInfo(text: string): boolean {
  return PII_PATTERNS.some((p) => p.test(text));
}

export function sanitizePublicText(text: string): string {
  return text
    .replace(/[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g, '[redacted-contact]')
    .replace(/\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g, '[redacted-number]');
}

export function evaluateSafety(input: string): SafetyEvaluation {
  const trimmed = input.trim();
  const bypassAttemptDetected = BYPASS_PATTERNS.some((p) => p.test(trimmed));
  const unknownSubstanceDetected = UNKNOWN_SUBSTANCE_PATTERNS.some((p) => p.test(trimmed));

  const redHits = RED_PATTERNS.filter((r) => r.pattern.test(trimmed)).map((r) => r.reason);
  const amberHits = AMBER_PATTERNS.filter((a) => a.pattern.test(trimmed)).map((a) => a.reason);

  const disclaimer =
    'Safety guidance cannot guarantee physical safety. Always follow local school laboratory rules and qualified teacher supervision.';

  if (redHits.length > 0) {
    return {
      level: 'RED',
      title: 'Restricted — Hazardous Content Blocked',
      summary:
        'This request involves high-risk materials, dangerous conditions, or actionable hazardous instructions and cannot be generated or simulated as a physical procedure.',
      reasons: [
        ...redHits,
        ...(bypassAttemptDetected
          ? ['Disclaimers or hypothetical framing cannot override Student Safety Guardian restrictions.']
          : []),
        ...(unknownSubstanceDetected
          ? ['Unknown or unlabeled substances must never be assumed safe.']
          : []),
      ],
      requiredActions: [
        'Do not attempt physical mixing, heating, or high-voltage assembly.',
        'Use the Virtual Lab mathematical simulations to study safe underlying scientific laws.',
      ],
      safeVirtualAlternative:
        'Explore Reaction Kinetics (Arrhenius), Low-Voltage DC Ohm’s Law (max 12V virtual), or Virtual Acid pH Dilution curves safely inside Virtual Lab.',
      bypassAttemptDetected,
      unknownSubstanceDetected,
      disclaimer,
    };
  }

  if (unknownSubstanceDetected) {
    return {
      level: 'AMBER',
      title: 'Unknown Substance — Teacher Review Required',
      summary:
        'Unknown or unlabeled substances are conservatively treated as potentially hazardous and are never assumed safe.',
      reasons: [
        'Unknown substances cannot be classified as low risk.',
        ...(bypassAttemptDetected
          ? ['Student disclaimers cannot bypass laboratory safety verification.']
          : []),
      ],
      requiredActions: [
        'Never smell, taste, touch, or mix an unlabeled substance.',
        'Notify a qualified teacher or laboratory supervisor immediately.',
      ],
      safeVirtualAlternative:
        'Model known, validated solutions in the Virtual Lab (e.g., Water Density or Idealised Strong Acid pH Curve).',
      bypassAttemptDetected,
      unknownSubstanceDetected,
      disclaimer,
    };
  }

  if (amberHits.length > 0 || bypassAttemptDetected) {
    return {
      level: 'AMBER',
      title: 'Supervised Learning — Teacher Review Required',
      summary:
        'This topic involves thermal, chemical, biological, or electrical concepts that require teacher review before any physical classroom activity.',
      reasons: [
        ...amberHits,
        ...(bypassAttemptDetected
          ? ['Safety rules remain active regardless of framing or disclaimers.']
          : []),
      ],
      requiredActions: [
        'Run the mathematical model in the Virtual Lab first.',
        'Obtain teacher approval and wear required PPE for any supervised classroom demonstration.',
      ],
      safeVirtualAlternative:
        'Test parameters safely in the Virtual Lab using validated physical equations without physical exposure.',
      bypassAttemptDetected,
      unknownSubstanceDetected,
      disclaimer,
    };
  }

  return {
    level: 'GREEN',
    title: 'Low-Risk Educational Exploration',
    summary:
      'Suitable for virtual simulation and standard low-risk classroom inquiry with normal precautions.',
    reasons: ['No restricted reagents, high voltages, pressurized hazards, or unknown substances detected.'],
    requiredActions: ['Observe standard classroom etiquette and verify assumptions in the Scientific Trust Centre.'],
    safeVirtualAlternative: 'Proceed directly with Virtual Lab simulation and prediction testing.',
    bypassAttemptDetected: false,
    unknownSubstanceDetected: false,
    disclaimer,
  };
}

export function getSafetyBadgeMeta(level: SafetyLevel): {
  label: string;
  colorClass: string;
  bgClass: string;
  borderClass: string;
} {
  switch (level) {
    case 'RED':
      return {
        label: 'RED · Blocked / Unsafe',
        colorClass: 'text-rose-800',
        bgClass: 'bg-rose-50',
        borderClass: 'border-rose-200',
      };
    case 'AMBER':
      return {
        label: 'AMBER · Teacher Review Required',
        colorClass: 'text-amber-800',
        bgClass: 'bg-amber-50',
        borderClass: 'border-amber-200',
      };
    default:
      return {
        label: 'GREEN · Low-Risk Educational',
        colorClass: 'text-emerald-800',
        bgClass: 'bg-emerald-50',
        borderClass: 'border-emerald-200',
      };
  }
}
