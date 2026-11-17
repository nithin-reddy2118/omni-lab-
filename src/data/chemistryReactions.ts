import { interpolateWaterBoilingPoint } from '../engine/experiments';
import type { SafetyLevel } from '../types/science';

export interface ChemistryBenchReactionOutcome {
  id: string;
  title: string;
  equation: string;
  safetyLevel: SafetyLevel;
  blocked: boolean;
  blockReason?: string;
  isActiveReaction: boolean;
  isBoiling: boolean;
  vesselTempC: number;
  targetBoilingC: number | null;
  liquidColorHex: string;
  liquidOpacity: number;
  gasEvolution: {
    active: boolean;
    formula: string;
    name: string;
    colorHex: string;
    rate01: number;
  };
  condensationActive: boolean;
  precipitateOrDeposit: {
    active: boolean;
    description: string;
    colorHex: string;
  };
  phEstimate: number | null;
  visualObservations: string[];
  particleLevelExplanation: string;
  scientificLimitationNote: string;
}

export interface ChemistryInteractionInput {
  vesselInstrumentIds: string[];
  heaterPresent: boolean;
  heaterNearVessel: boolean;
  heaterPowerW: number;
  condenserLinked: boolean;
  substanceIds: string[];
  reagentAmountsMl?: Record<string, number>;
  pressureKpa: number;
  liveTempC: number;
  isRunning: boolean;
}

const HEATABLE_VESSELS = new Set([
  'chem-beaker',
  'chem-test-tubes',
  'chem-conical-flask',
  'chem-crucible',
]);

export function evaluateBenchChemistryInteraction(
  input: ChemistryInteractionInput
): ChemistryBenchReactionOutcome {
  const hasHeatableVessel = input.vesselInstrumentIds.some((id) => HEATABLE_VESSELS.has(id));
  const subs = new Set(input.substanceIds);

  // Safety Guard: Check incompatible / hazardous combinations explicitly first
  const hasStrongAcid = subs.has('chem-sub-hcl') || subs.has('chem-sub-h2so4');
  const hasStrongOxidizerOrPeroxide = subs.has('chem-sub-h2o2') || subs.has('chem-sub-kmno4');
  const hasClosedOrUnsupportedHeatWithH2 =
    subs.has('chem-sub-h2') && input.heaterPresent && input.heaterNearVessel;

  if (hasClosedOrUnsupportedHeatWithH2) {
    return {
      id: 'safety-stop-h2-heat',
      title: 'Safety Guardian Stop: Flammable Gas Near Heating Source',
      equation: 'Simulation halted (H₂ is flammable)',
      safetyLevel: 'RED',
      blocked: true,
      blockReason:
        'Hydrogen gas (H₂) must NEVER be positioned near an active burner or hot plate. Move the heating source away or remove H₂.',
      isActiveReaction: false,
      isBoiling: false,
      vesselTempC: 25,
      targetBoilingC: null,
      liquidColorHex: '#38BDF8',
      liquidOpacity: 0.2,
      gasEvolution: { active: false, formula: '', name: '', colorHex: 'transparent', rate01: 0 },
      condensationActive: false,
      precipitateOrDeposit: { active: false, description: '', colorHex: 'transparent' },
      phEstimate: null,
      visualObservations: ['Heating halted by Safety Guardian due to flammable gas proximity.'],
      particleLevelExplanation:
        'Safety interlock prevented thermal ignition energy from contacting hydrogen molecules.',
      scientificLimitationNote: 'Flammable gases are restricted from thermal bench heating.',
    };
  }

  if (subs.has('chem-sub-h2so4') && subs.has('chem-sub-na') ) {
    return {
      id: 'safety-stop-violent',
      title: 'Safety Guardian Stop: Hazardous Combination',
      equation: 'Halted for classroom safety',
      safetyLevel: 'RED',
      blocked: true,
      blockReason:
        'Combining reactive alkali metals with concentrated acid creates uncontrolled exothermic energy and is blocked in school labs.',
      isActiveReaction: false,
      isBoiling: false,
      vesselTempC: 25,
      targetBoilingC: null,
      liquidColorHex: '#CBD5E1',
      liquidOpacity: 0.35,
      gasEvolution: { active: false, formula: '', name: '', colorHex: 'transparent', rate01: 0 },
      condensationActive: false,
      precipitateOrDeposit: { active: false, description: '', colorHex: 'transparent' },
      phEstimate: null,
      visualObservations: ['Simulation blocked by Safety Guardian.'],
      particleLevelExplanation: 'Uncontrolled rapid proton transfer poses severe thermal/splash danger.',
      scientificLimitationNote: 'Only validated safe educational models execute.',
    };
  }

  if (hasStrongAcid && hasStrongOxidizerOrPeroxide && input.heaterNearVessel && input.isRunning) {
    return {
      id: 'safety-stop-oxidizer-acid-heat',
      title: 'Safety Guardian Stop: Heating Acid + Strong Oxidizer',
      equation: 'Simulation halted (Teacher Supervision Required)',
      safetyLevel: 'RED',
      blocked: true,
      blockReason:
        'Heating strong acid mixed with strong oxidizers/peroxides can cause rapid oxygen release or splattering and is blocked.',
      isActiveReaction: false,
      isBoiling: false,
      vesselTempC: input.liveTempC,
      targetBoilingC: null,
      liquidColorHex: '#FDE68A',
      liquidOpacity: 0.45,
      gasEvolution: { active: false, formula: '', name: '', colorHex: 'transparent', rate01: 0 },
      condensationActive: false,
      precipitateOrDeposit: { active: false, description: '', colorHex: 'transparent' },
      phEstimate: 1.5,
      visualObservations: ['Thermal source disabled because acid + oxidizer heating is restricted.'],
      particleLevelExplanation: 'Thermal energy accelerates peroxide/oxidizer decomposition.',
      scientificLimitationNote: 'Use room-temperature validated catalysis models instead.',
    };
  }

  // 1. Copper(II) Sulfate + Iron Displacement: Fe(s) + CuSO4(aq) -> FeSO4(aq) + Cu(s)
  if (subs.has('chem-sub-cuso4') && subs.has('chem-sub-fe')) {
    const warmed = input.heaterPresent && input.heaterNearVessel && input.isRunning;
    const temp = warmed ? Math.min(65, input.liveTempC) : 25;
    const progress = input.isRunning ? Math.min(1, (temp - 24) / 25 + 0.45) : 0.25;
    return {
      id: 'fe-cuso4-displacement',
      title: 'Single Displacement: Iron + Copper(II) Sulfate',
      equation: 'Fe(s) + CuSO₄(aq) → FeSO₄(aq) + Cu(s)',
      safetyLevel: 'GREEN',
      blocked: false,
      isActiveReaction: input.isRunning,
      isBoiling: false,
      vesselTempC: temp,
      targetBoilingC: 100.8,
      liquidColorHex: progress > 0.65 ? '#A7F3D0' : '#38BDF8',
      liquidOpacity: 0.65,
      gasEvolution: { active: false, formula: '', name: '', colorHex: 'transparent', rate01: 0 },
      condensationActive: false,
      precipitateOrDeposit: {
        active: true,
        description: 'Reddish-brown metallic Copper (Cu) deposits onto the iron filings.',
        colorHex: '#B45309',
      },
      phEstimate: 4.8,
      visualObservations: [
        'Deep sky-blue CuSO₄ solution gradually turns pale green (FeSO₄ formed).',
        'Reddish-brown metallic copper coats the submerged iron surface.',
        'No toxic gas is evolved (single metal displacement in aqueous solution).',
      ],
      particleLevelExplanation:
        'More reactive iron atoms donate two electrons to Cu²⁺ ions (Fe → Fe²⁺ + 2e⁻; Cu²⁺ + 2e⁻ → Cu), precipitating solid copper while Fe²⁺ enters solution.',
      scientificLimitationNote: 'Colour shift rate is idealized visually; stoichiometry follows Fe:Cu = 1:1.',
    };
  }

  // 2. Acid + Base Neutralisation (HCl + NaOH) with optional Indicator & quantitative stoichiometry
  if (
    (subs.has('chem-sub-hcl') || subs.has('chem-sub-ch3cooh')) &&
    (subs.has('chem-sub-naoh') || subs.has('chem-sub-nahco3'))
  ) {
    const isCarbonate = subs.has('chem-sub-nahco3');
    const hasPheno = subs.has('chem-sub-phenolphthalein');
    const hasUniversal = subs.has('chem-sub-universal');
    const vAcidMl = Math.max(1, input.reagentAmountsMl?.['chem-sub-hcl'] ?? input.reagentAmountsMl?.['chem-sub-ch3cooh'] ?? 25);
    const vBaseMl = Math.max(1, input.reagentAmountsMl?.['chem-sub-naoh'] ?? input.reagentAmountsMl?.['chem-sub-nahco3'] ?? 25);
    const cAcid = 0.5;
    const cBase = 0.5;
    const nH = cAcid * (vAcidMl / 1000);
    const nOH = cBase * (vBaseMl / 1000);
    const totalL = (vAcidMl + vBaseMl) / 1000;
    const diff = nH - nOH;
    const kw = 1e-14;
    let computedPh = 7.0;
    if (!isCarbonate) {
      if (Math.abs(diff) < 1e-9) {
        computedPh = 7.0;
      } else if (diff > 0) {
        const cH = diff / totalL;
        const h = 0.5 * (cH + Math.sqrt(cH * cH + 4 * kw));
        computedPh = Number((-Math.log10(h)).toFixed(2));
      } else {
        const cOH = Math.abs(diff) / totalL;
        const oh = 0.5 * (cOH + Math.sqrt(cOH * cOH + 4 * kw));
        computedPh = Number((14 + Math.log10(oh)).toFixed(2));
      }
    }
    const reactedMol = Math.min(nH, nOH);
    const deltaT = Number(Math.min(12, (reactedMol * 57300) / Math.max(10, (vAcidMl + vBaseMl) * 4.184)).toFixed(2));
    const colorHex = hasPheno
      ? computedPh >= 8.2
        ? '#EC4899'
        : '#E0F2FE'
      : hasUniversal
        ? computedPh < 4.5
          ? '#EF4444'
          : computedPh < 6.4
            ? '#F59E0B'
            : computedPh <= 7.8
              ? '#10B981'
              : '#4F46E5'
        : '#E0F2FE';

    return {
      id: isCarbonate ? 'acid-bicarbonate' : 'acid-base-neutralisation',
      title: isCarbonate
        ? 'Acid + Hydrogen Carbonate Reaction'
        : 'Acid–Base Neutralisation (HCl + NaOH)',
      equation: isCarbonate
        ? 'HCl(aq) + NaHCO₃(s) → NaCl(aq) + H₂O(l) + CO₂(g)'
        : 'HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)  (ΔH = −57.3 kJ/mol)',
      safetyLevel: 'AMBER',
      blocked: false,
      isActiveReaction: input.isRunning,
      isBoiling: false,
      vesselTempC: input.isRunning ? Number((25.0 + deltaT).toFixed(1)) : 25.0,
      targetBoilingC: 100.5,
      liquidColorHex: colorHex,
      liquidOpacity: 0.62,
      gasEvolution: isCarbonate && input.isRunning
        ? {
            active: true,
            formula: 'CO₂',
            name: 'Carbon Dioxide (colourless)',
            colorHex: '#E2E8F0',
            rate01: 0.72,
          }
        : { active: false, formula: '', name: '', colorHex: 'transparent', rate01: 0 },
      condensationActive: false,
      precipitateOrDeposit: { active: false, description: '', colorHex: 'transparent' },
      phEstimate: computedPh,
      visualObservations: isCarbonate
        ? [
            'Vigorous effervescence of colourless CO₂ bubbles.',
            `Solution approaches neutral pH (~${computedPh.toFixed(2)}) as acid is consumed.`,
          ]
        : [
            `Mixed ${vAcidMl.toFixed(0)} mL (0.5 M acid) + ${vBaseMl.toFixed(0)} mL (0.5 M base) → pH ${computedPh.toFixed(2)}.`,
            hasUniversal
              ? `Universal Indicator reflects pH ${computedPh.toFixed(2)} (${computedPh < 6.4 ? 'acidic red-amber' : computedPh <= 7.8 ? 'neutral emerald green' : 'alkaline indigo'}).`
              : hasPheno
                ? `Phenolphthalein is ${computedPh >= 8.2 ? 'magenta-pink (alkaline endpoint pH ≥ 8.2)' : 'colourless (pH < 8.2)'}.`
                : 'Clear aqueous NaCl solution forms; add Phenolphthalein or Universal Indicator to track endpoint colour.',
            `Exothermic neutralisation enthalpy raises virtual temperature by +${deltaT.toFixed(2)} °C.`,
          ],
      particleLevelExplanation:
        'Hydronium ions (H₃O⁺) and hydroxide ions (OH⁻) combine exothermically (ΔH = −57.3 kJ/mol) to form neutral water molecules; Na⁺ and Cl⁻ remain spectator ions.',
      scientificLimitationNote: 'Assumes equimolar dilute virtual concentrations (0.5 mol/L) and ideal heat capacity c ≈ 4.184 J/(g·°C).',
    };
  }

  // 3. Marble Chips (CaCO3) + Dilute HCl -> CaCl2 + H2O + CO2(g)
  if (subs.has('chem-sub-caco3') && subs.has('chem-sub-hcl')) {
    const temp = input.heaterPresent && input.heaterNearVessel && input.isRunning
      ? Math.min(75, input.liveTempC)
      : 25;
    const rateFactor = Math.min(1, 0.35 + (temp - 25) / 80);
    return {
      id: 'caco3-hcl-kinetics',
      title: 'Calcium Carbonate + Dilute HCl (CO₂ Evolution)',
      equation: 'CaCO₃(s) + 2HCl(aq) → CaCl₂(aq) + H₂O(l) + CO₂(g)',
      safetyLevel: 'AMBER',
      blocked: false,
      isActiveReaction: input.isRunning,
      isBoiling: false,
      vesselTempC: temp,
      targetBoilingC: 100.4,
      liquidColorHex: '#E0F2FE',
      liquidOpacity: 0.45,
      gasEvolution: input.isRunning
        ? {
            active: true,
            formula: 'CO₂',
            name: 'Carbon Dioxide (colourless bubbles)',
            colorHex: '#F1F5F9',
            rate01: rateFactor,
          }
        : { active: false, formula: '', name: '', colorHex: 'transparent', rate01: 0 },
      condensationActive: false,
      precipitateOrDeposit: {
        active: true,
        description: 'White CaCO₃ marble chips slowly dissolve during reaction.',
        colorHex: '#F8FAFC',
      },
      phEstimate: 2.1,
      visualObservations: [
        'Colourless CO₂ gas bubbles rise from the white CaCO₃ surface.',
        input.heaterNearVessel
          ? 'Warming increases collision frequency (Arrhenius effect), speeding up CO₂ bubbling.'
          : 'Steady room-temperature bubbling.',
        'No coloured smoke or artificial colour shift occurs.',
      ],
      particleLevelExplanation:
        'Higher temperature increases kinetic energy of H⁺ ions, raising successful collisions above activation energy Ea against the carbonate lattice.',
      scientificLimitationNote: 'Valid for dilute aqueous acid (≤ 2.0 mol/L).',
    };
  }

  // 4. Heating Aqueous Copper(II) Sulfate (or Hydrated CuSO4)
  if (subs.has('chem-sub-cuso4') && !subs.has('chem-sub-fe')) {
    const boilC = interpolateWaterBoilingPoint(input.pressureKpa);
    const boilingNow =
      hasHeatableVessel &&
      input.heaterPresent &&
      input.heaterNearVessel &&
      input.isRunning &&
      input.liveTempC >= boilC - 0.1;

    return {
      id: 'cuso4-heating',
      title: 'Heating Aqueous Copper(II) Sulfate Solution',
      equation: 'CuSO₄(aq) + heat → CuSO₄·5H₂O(s) (concentration) + H₂O(g)',
      safetyLevel: 'GREEN',
      blocked: false,
      isActiveReaction: input.heaterNearVessel && input.isRunning,
      isBoiling: boilingNow,
      vesselTempC: input.heaterNearVessel ? input.liveTempC : 25,
      targetBoilingC: boilC,
      liquidColorHex: '#0284C7',
      liquidOpacity: 0.72,
      gasEvolution: boilingNow
        ? {
            active: true,
            formula: 'H₂O(g)',
            name: 'Water Vapour (steam)',
            colorHex: '#F8FAFC',
            rate01: 0.65,
          }
        : { active: false, formula: '', name: '', colorHex: 'transparent', rate01: 0 },
      condensationActive: boilingNow && input.condenserLinked,
      precipitateOrDeposit: {
        active: boilingNow,
        description: 'Blue CuSO₄·5H₂O crystals begin forming as solvent evaporates.',
        colorHex: '#0369A1',
      },
      phEstimate: 4.5,
      visualObservations: [
        'Bright blue Cu²⁺ aqueous colour persists cleanly.',
        boilingNow
          ? `Water solvent boils at ${boilC.toFixed(1)} °C, releasing clear water vapour only.`
          : 'No vapour or colour change below solvent boiling point.',
        input.condenserLinked && boilingNow
          ? 'Condenser cools rising H₂O vapour back into clear liquid distillate.'
          : 'Connect a Liebig condenser to collect pure water distillate.',
      ],
      particleLevelExplanation:
        'Hexaaquacopper(II) ions [Cu(H₂O)₆]²⁺ absorb red-orange wavelengths, giving blue colour. Heating increases solvent vapour escape without forming toxic gases.',
      scientificLimitationNote: 'Over-heating anhydrous white CuSO₄ past 200 °C is omitted in wet aqueous model.',
    };
  }

  // 5. Default: Pure Distilled Water / Aqueous Salt Solution (e.g., H2O or NaCl) heating model
  const targetBoilC = interpolateWaterBoilingPoint(input.pressureKpa);
  const isHeatingActive =
    hasHeatableVessel && input.heaterPresent && input.heaterNearVessel && input.isRunning;
  const isBoiling = isHeatingActive && input.liveTempC >= targetBoilC - 0.1;

  const hasAcidOnly = subs.has('chem-sub-hcl') || subs.has('chem-sub-ch3cooh');
  const hasBaseOnly = subs.has('chem-sub-naoh');
  const hasUniversal = subs.has('chem-sub-universal');
  const hasPheno = subs.has('chem-sub-phenolphthalein');

  let liquidColorHex = '#38BDF8';
  let phEstimate: number | null = 7.0;
  if (hasAcidOnly) {
    phEstimate = subs.has('chem-sub-hcl') ? 1.3 : 2.9;
    liquidColorHex = hasUniversal ? '#EF4444' : '#E0F2FE';
  } else if (hasBaseOnly) {
    phEstimate = 13.0;
    liquidColorHex = hasPheno ? '#EC4899' : hasUniversal ? '#6366F1' : '#E0F2FE';
  } else if (hasUniversal) {
    liquidColorHex = '#10B981';
  }

  return {
    id: subs.has('chem-sub-nacl') ? 'aqueous-nacl-heating' : 'pure-water-thermal',
    title:
      subs.size === 0
        ? 'Empty Glassware Vessel (Load a Virtual Substance)'
        : hasAcidOnly
          ? 'Aqueous Acid Solution'
          : hasBaseOnly
            ? 'Aqueous Alkaline Solution'
            : 'Pure Distilled Water (IAPWS-IF97 Phase Model)',
    equation: isBoiling
      ? 'H₂O(l) → H₂O(g)   [P_vap(T) = P_ext]'
      : 'H₂O(l) + Q → H₂O(l) (ΔT = Q / mc)',
    safetyLevel: 'GREEN',
    blocked: false,
    isActiveReaction: isHeatingActive,
    isBoiling,
    vesselTempC: isHeatingActive || input.liveTempC > 25.1 ? input.liveTempC : 25,
    targetBoilingC: targetBoilC,
    liquidColorHex,
    liquidOpacity: subs.size === 0 ? 0.1 : 0.55,
    gasEvolution: isBoiling
      ? {
          active: true,
          formula: 'H₂O(g)',
          name: 'Water Vapour Bubbles',
          colorHex: '#F8FAFC',
          rate01: Math.min(1, input.heaterPowerW / 800),
        }
      : { active: false, formula: '', name: '', colorHex: 'transparent', rate01: 0 },
    condensationActive: isBoiling && input.condenserLinked,
    precipitateOrDeposit: { active: false, description: '', colorHex: 'transparent' },
    phEstimate,
    visualObservations: [
      !hasHeatableVessel
        ? 'Place a Test Tube, Borosilicate Beaker, or Conical Flask on the workbench.'
        : !input.heaterPresent
          ? 'Vessel is at room temperature (25.0 °C). Add a Hot Plate or Burner from the Heating Rack to warm it.'
          : !input.heaterNearVessel
            ? 'Move the Test Tube / Beaker closer to the Heating Source (or add a Thermal link) to transfer heat.'
            : isBoiling
              ? `Boiling reached at ${targetBoilC.toFixed(2)} °C (${input.pressureKpa.toFixed(1)} kPa). Vapour pressure equals external pressure.`
              : `Heating in progress: ${input.liveTempC.toFixed(1)} °C → target ${targetBoilC.toFixed(2)} °C. No boiling bubbles until T reaches T_boil.`,
    ],
    particleLevelExplanation: isBoiling
      ? 'Water molecules throughout the bulk liquid possess enough kinetic energy to overcome intermolecular hydrogen bonds and external pressure, forming rising H₂O vapour bubbles.'
      : 'Thermal energy increases average molecular kinetic energy (½mv² ∝ T), causing faster random motion without bulk phase change below the boiling point.',
    scientificLimitationNote:
      'Only scientifically validated substances and thermal transitions are simulated; unknown combinations do not produce invented reactions.',
  };
}
