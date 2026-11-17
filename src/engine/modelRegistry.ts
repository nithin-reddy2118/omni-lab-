import { EXPERIMENTS, getDefaultParams } from './experiments';
import { getRecommendedKitForExperiment } from '../data/labEquipment';
import type { ExperimentDefinition, LabDepartmentId, SafetyLevel } from '../types/science';

export interface ScientificModelEntry {
  modelId: string;
  version: string;
  department: LabDepartmentId;
  subject: string;
  name: string;
  requiredEquipmentIds: string[];
  inputVariables: { key: string; label: string; unit: string; min: number; max: number }[];
  outputVariable: { label: string; symbol: string; unit: string };
  formula: string;
  assumptions: string[];
  limitations: string[];
  safetyClassification: SafetyLevel;
  experiment: ExperimentDefinition;
}

export const MODEL_REGISTRY: ScientificModelEntry[] = EXPERIMENTS.map((exp) => {
  const kit = getRecommendedKitForExperiment(exp.id);
  const sampleOut = exp.calculate(getDefaultParams(exp));
  return {
    modelId: exp.id,
    version: 'v1.2-validated',
    department: kit.department,
    subject: exp.subject,
    name: exp.title,
    requiredEquipmentIds: kit.instrumentIds,
    inputVariables: exp.parameters.map((p) => ({
      key: p.key,
      label: p.label,
      unit: p.unit,
      min: p.min,
      max: p.max,
    })),
    outputVariable: {
      label: sampleOut.primaryLabel,
      symbol: sampleOut.primarySymbol,
      unit: sampleOut.primaryUnit,
    },
    formula: exp.formula,
    assumptions: exp.assumptions,
    limitations: exp.limitations,
    safetyClassification: exp.safetyLevel,
    experiment: exp,
  };
});

export interface ModelSelfTestResult {
  modelId: string;
  name: string;
  passed: boolean;
  detail: string;
}

export function runModelRegistrySelfTests(): ModelSelfTestResult[] {
  const results: ModelSelfTestResult[] = [];

  for (const entry of MODEL_REGISTRY) {
    const defaults = getDefaultParams(entry.experiment);
    const calc = entry.experiment.calculate(defaults);
    const validNumber = Number.isFinite(calc.primaryValue) && calc.curvePoints.length >= 3;
    results.push({
      modelId: entry.modelId,
      name: entry.name,
      passed: validNumber,
      detail: validNumber
        ? `Default ${calc.primarySymbol} = ${calc.primaryValue} ${calc.primaryUnit} (${calc.curvePoints.length} curve pts)`
        : 'Invalid numerical result or empty curve.',
    });
  }

  // Specific physical invariants
  const bpSea = EXPERIMENTS[0].calculate({ pressure: 101.325 }).primaryValue;
  const bpMtn = EXPERIMENTS[0].calculate({ pressure: 50 }).primaryValue;
  results.push({
    modelId: 'boiling-point-invariant',
    name: 'Boiling Point decreases at low pressure',
    passed: bpSea === 100 && bpMtn < 85 && bpMtn > 75,
    detail: `101.325 kPa → ${bpSea} °C; 50 kPa → ${bpMtn} °C`,
  });

  const pend1m = EXPERIMENTS.find((e) => e.id === 'pendulum-period')!.calculate({
    length: 1.0,
    gravity: 9.81,
  }).primaryValue;
  results.push({
    modelId: 'pendulum-invariant',
    name: '1.00 m Earth pendulum period ≈ 2.006 s',
    passed: Math.abs(pend1m - 2.006) < 0.02,
    detail: `Calculated T = ${pend1m} s`,
  });

  const ohm5v10r = EXPERIMENTS.find((e) => e.id === 'voltage-current')!.calculate({
    voltage: 5,
    resistance: 10,
  }).primaryValue;
  results.push({
    modelId: 'ohm-invariant',
    name: 'Ohm’s Law 5 V / 10 Ω = 0.5 A',
    passed: Math.abs(ohm5v10r - 0.5) < 0.001,
    detail: `Calculated I = ${ohm5v10r} A`,
  });

  const titEq = EXPERIMENTS.find((e) => e.id === 'acid-base-titration')!.calculate({
    baseVolume: 25,
    acidMolarity: 0.1,
  }).primaryValue;
  results.push({
    modelId: 'titration-invariant',
    name: 'Equivalence pH = 7.00 at 25 mL 0.1 M NaOH + 25 mL 0.1 M HCl',
    passed: Math.abs(titEq - 7.0) < 0.02,
    detail: `Calculated pH = ${titEq}`,
  });

  const mmHalf = EXPERIMENTS.find((e) => e.id === 'michaelis-menten')!.calculate({
    substrate: 10,
    vMax: 100,
    km: 10,
  }).primaryValue;
  results.push({
    modelId: 'michaelis-menten-invariant',
    name: 'Michaelis–Menten v₀ = 0.5·V_max when [S] = K_m',
    passed: Math.abs(mmHalf - 50) < 0.01,
    detail: `Calculated v₀ = ${mmHalf} µmol/min`,
  });

  const beerAbs = EXPERIMENTS.find((e) => e.id === 'beer-lambert')!.calculate({
    concentration: 1.0,
    epsilon: 1.0,
    pathLength: 1.0,
  }).primaryValue;
  results.push({
    modelId: 'beer-lambert-invariant',
    name: 'Beer–Lambert A = ε·l·c = 1.00 AU',
    passed: Math.abs(beerAbs - 1.0) < 0.001,
    detail: `Calculated A = ${beerAbs} AU`,
  });

  const rcTau = EXPERIMENTS.find((e) => e.id === 'rc-circuit-decay')!.calculate({
    timeMs: 50,
    resistanceKohm: 10,
    capacitanceUf: 5,
  }).primaryValue;
  results.push({
    modelId: 'rc-circuit-invariant',
    name: 'RC Decay at t = τ gives V = 10·e⁻¹ ≈ 3.679 V',
    passed: Math.abs(rcTau - 3.679) < 0.01,
    detail: `Calculated V(τ) = ${rcTau} V`,
  });

  const lens2f = EXPERIMENTS.find((e) => e.id === 'thin-lens-optics')!.calculate({
    objectDistCm: 30,
    focalCm: 15,
  }).primaryValue;
  results.push({
    modelId: 'thin-lens-invariant',
    name: 'Convex Lens at |u| = 2f (30 cm) gives v = +30 cm',
    passed: Math.abs(lens2f - 30.0) < 0.01,
    detail: `Calculated v = ${lens2f} cm`,
  });

  const half3 = EXPERIMENTS.find((e) => e.id === 'half-life-decay')!.calculate({
    timeHours: 18,
    halfLifeHours: 6,
  }).primaryValue;
  results.push({
    modelId: 'half-life-invariant',
    name: 'Half-life after 3·t½ gives 12.50% remaining',
    passed: Math.abs(half3 - 12.5) < 0.01,
    detail: `Calculated N(18 h) = ${half3}%`,
  });

  return results;
}
