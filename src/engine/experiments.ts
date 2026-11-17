import type {
  CustomCalcTemplate,
  CustomExperimentDefinition,
  ExperimentCalculationResult,
  ExperimentDefinition,
  GraphPoint,
} from '../types/science';

// Validated Water Saturation Pressure vs Boiling Temperature Dataset (IAPWS-IF97 reference points)
// Range: 10 kPa to 500 kPa — strictly no extrapolation outside this validated table.
const WATER_SATURATION_TABLE: { pKpa: number; tempC: number }[] = [
  { pKpa: 10.0, tempC: 45.81 },
  { pKpa: 15.0, tempC: 53.97 },
  { pKpa: 20.0, tempC: 60.06 },
  { pKpa: 25.0, tempC: 64.97 },
  { pKpa: 30.0, tempC: 69.10 },
  { pKpa: 40.0, tempC: 75.87 },
  { pKpa: 50.0, tempC: 81.33 },
  { pKpa: 60.0, tempC: 85.94 },
  { pKpa: 70.0, tempC: 89.95 },
  { pKpa: 80.0, tempC: 93.50 },
  { pKpa: 90.0, tempC: 96.71 },
  { pKpa: 100.0, tempC: 99.62 },
  { pKpa: 101.325, tempC: 100.00 },
  { pKpa: 110.0, tempC: 102.31 },
  { pKpa: 125.0, tempC: 105.99 },
  { pKpa: 150.0, tempC: 111.37 },
  { pKpa: 175.0, tempC: 116.06 },
  { pKpa: 200.0, tempC: 120.23 },
  { pKpa: 250.0, tempC: 127.43 },
  { pKpa: 300.0, tempC: 133.55 },
  { pKpa: 350.0, tempC: 138.88 },
  { pKpa: 400.0, tempC: 143.63 },
  { pKpa: 450.0, tempC: 147.93 },
  { pKpa: 500.0, tempC: 151.86 },
];

export function interpolateWaterBoilingPoint(pressureKpa: number): number {
  const clamped = Math.min(500, Math.max(10, pressureKpa));
  for (let i = 0; i < WATER_SATURATION_TABLE.length - 1; i++) {
    const a = WATER_SATURATION_TABLE[i];
    const b = WATER_SATURATION_TABLE[i + 1];
    if (clamped >= a.pKpa && clamped <= b.pKpa) {
      // Logarithmic pressure interpolation mirrors Clausius-Clapeyron smoothness between close nodes
      const lnP = Math.log(clamped);
      const lnA = Math.log(a.pKpa);
      const lnB = Math.log(b.pKpa);
      const t = (lnP - lnA) / (lnB - lnA);
      return Number((a.tempC + t * (b.tempC - a.tempC)).toFixed(2));
    }
  }
  return WATER_SATURATION_TABLE[WATER_SATURATION_TABLE.length - 1].tempC;
}

const roundTo = (n: number, decimals = 3): number => {
  const factor = Math.pow(10, decimals);
  return Math.round(n * factor) / factor;
};

export const EXPERIMENTS: ExperimentDefinition[] = [
  {
    id: 'boiling-point',
    number: 1,
    title: 'Boiling Point vs External Pressure',
    shortTitle: 'Boiling Point vs Pressure',
    subject: 'Physics & Thermodynamics',
    principle:
      'A liquid boils when its saturation vapour pressure equals the surrounding external pressure.',
    explanation:
      'At sea level (101.325 kPa), pure water boils at 100.00 °C. On high mountains where atmospheric pressure drops, water molecules escape into vapour at lower temperatures. Inside a sealed pressure vessel above 101.325 kPa, water must reach a higher temperature before its vapour pressure matches the external load.',
    learningObjective:
      'Determine how external pressure changes the boiling temperature of pure water using a validated saturation-pressure dataset.',
    hypothesis:
      'Decreasing external pressure lowers the boiling point of water, while increasing external pressure raises it nonlinearly.',
    independentVariable: 'External Pressure (P) in kPa',
    dependentVariable: 'Boiling Temperature (Tb) in °C',
    controlledVariables: ['Substance (pure H₂O)', 'Atmospheric gas composition', 'Zero dissolved solutes'],
    formula: 'P_sat(T_b) = P_ext (Clausius–Clapeyron / IAPWS-IF97 Saturation Table)',
    formulaDescription:
      'Uses validated IAPWS-IF97 saturation pressure nodes from 10 kPa to 500 kPa with Clausius–Clapeyron log-pressure interpolation.',
    unitsSummary: 'Pressure: kPa · Boiling Temperature: °C · Altitude Estimate: m',
    parameters: [
      {
        key: 'pressure',
        label: 'External Pressure',
        symbol: 'P',
        unit: 'kPa',
        min: 10,
        max: 500,
        step: 0.5,
        defaultValue: 101.325,
        description: 'Surrounding atmospheric or chamber pressure (validated range: 10–500 kPa).',
      },
    ],
    assumptions: [
      'Pure distilled water with zero dissolved salts or impurities.',
      'Thermodynamic equilibrium at the liquid-vapour interface.',
      'No superheating or nucleation delay in the container.',
    ],
    limitations: [
      'Strictly valid only between 10 kPa and 500 kPa; does not extrapolate outside this range.',
      'Does not model dissolved solutes (boiling-point elevation) or altitude temperature lapse rates.',
    ],
    validityRange: '10.0 kPa ≤ P ≤ 500.0 kPa (45.81 °C to 151.86 °C)',
    safetyLevel: 'AMBER',
    safetyNote:
      'Virtual model only. Pressurized vessels and boiling liquids pose burn and rupture risks in physical labs and require teacher supervision.',
    references: [
      {
        title: 'NIST Chemistry WebBook — Water Saturation Properties',
        source: 'NIST Standard Reference Database',
        url: 'https://webbook.nist.gov/chemistry/fluid/',
      },
      {
        title: 'IAPWS-IF97 Industrial Formulation for Water and Steam',
        source: 'International Association for the Properties of Water and Steam',
        url: 'https://iapws.org/relguide/IF97-Rev.html',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'External Pressure (kPa) applied above the water surface.',
      yAxisMeaning: 'Equilibrium Boiling Temperature (°C) of pure water.',
      relationship: 'Monotonic nonlinear positive relationship (concave upward curve).',
      trend: 'Boiling point rises steeply at low pressures (10–100 kPa) and flattens slightly at higher pressures.',
      slopeMeaning: 'dT/dP indicates sensitivity of boiling temperature to pressure changes (larger at lower pressures).',
      conclusion: 'Water does not have a single fixed boiling point of 100 °C—it depends directly on external pressure.',
      limitations: 'Valid strictly within 10–500 kPa for pure water.',
    },
    predictionPrompt: 'If external pressure drops to 50 kPa (roughly 5,500 m elevation), what happens to the boiling point?',
    predictionOptions: [
      { id: 'bp-1', label: 'It drops near 81 °C', valueHint: 81.33 },
      { id: 'bp-2', label: 'It stays at 100 °C', valueHint: 100 },
      { id: 'bp-3', label: 'It rises above 120 °C', valueHint: 120 },
    ],
    predictionExpectedHint: 'At 50 kPa, water boils at approximately 81.33 °C.',
    calculate: (params) => {
      const p = Math.min(500, Math.max(10, params.pressure ?? 101.325));
      const tb = interpolateWaterBoilingPoint(p);
      const tbK = roundTo(tb + 273.15, 2);
      const approxAltM = p <= 101.325 ? Math.round(44330 * (1 - Math.pow(p / 101.325, 0.1903))) : 0;
      const curvePoints: GraphPoint[] = WATER_SATURATION_TABLE.map((pt) => ({
        x: pt.pKpa,
        y: pt.tempC,
        label: `${pt.pKpa} kPa → ${pt.tempC} °C`,
      }));
      return {
        primaryValue: tb,
        primaryLabel: 'Boiling Temperature',
        primarySymbol: 'T_b',
        primaryUnit: '°C',
        secondaryMetrics: [
          { label: 'Absolute Temperature', symbol: 'T_K', value: tbK, unit: 'K' },
          { label: 'Equivalent Altitude', symbol: 'h', value: approxAltM, unit: 'm' },
          { label: 'Delta vs Sea Level', symbol: 'ΔT', value: roundTo(tb - 100, 2), unit: '°C' },
        ],
        calculationSteps: [
          `1. Clamp input pressure within validated range [10, 500] kPa: P = ${p} kPa.`,
          `2. Locate bracketing IAPWS-IF97 saturation nodes around P = ${p} kPa.`,
          `3. Apply Clausius–Clapeyron log-pressure interpolation between bounding saturation points.`,
          `4. Result: T_b = ${tb} °C (${tbK} K).`,
        ],
        curvePoints,
        xAxisLabel: 'External Pressure',
        xAxisUnit: 'kPa',
        yAxisLabel: 'Boiling Temperature',
        yAxisUnit: '°C',
        validityNote: 'Validated IAPWS-IF97 lookup range: 10 kPa – 500 kPa (no extrapolation).',
      };
    },
  },
  {
    id: 'acid-ph',
    number: 2,
    title: 'Acid Concentration vs pH',
    shortTitle: 'Acid Concentration vs pH',
    subject: 'Chemistry',
    principle: 'For an idealised strong monoprotic acid, pH equals the negative base-10 logarithm of hydronium concentration: pH = −log₁₀([H⁺]).',
    explanation:
      'The pH scale is logarithmic: every 10-fold dilution of a strong monoprotic acid increases pH by 1 unit. This virtual module explores idealised aqueous dissociation without physical chemical exposure.',
    learningObjective:
      'Observe the logarithmic relationship between molar acid concentration and pH in an idealised strong monoprotic acid.',
    hypothesis: 'Increasing [H⁺] by a factor of 10 decreases pH by exactly 1.00 unit.',
    independentVariable: 'Molar Concentration ([H⁺]) in mol/L',
    dependentVariable: 'pH (dimensionless)',
    controlledVariables: ['Temperature (25 °C / 298.15 K)', 'Complete monoprotic dissociation', 'Ideal activity coefficient γ = 1'],
    formula: 'pH = -log₁₀([H⁺])',
    formulaDescription: 'Idealised strong monoprotic acid model assuming complete dissociation and unit activity coefficient.',
    unitsSummary: 'Concentration: mol/L (M) · pH: dimensionless',
    parameters: [
      {
        key: 'concentration',
        label: 'Acid Concentration [H⁺]',
        symbol: '[H⁺]',
        unit: 'mol/L',
        min: 0.0001,
        max: 1.0,
        step: 0.0001,
        defaultValue: 0.001,
        description: 'Idealised molar concentration (0.0001 to 1.0000 mol/L).',
        options: [
          { label: '0.0001 mol/L (10⁻⁴ M)', value: 0.0001 },
          { label: '0.001 mol/L (10⁻³ M)', value: 0.001 },
          { label: '0.01 mol/L (10⁻² M)', value: 0.01 },
          { label: '0.1 mol/L (10⁻¹ M)', value: 0.1 },
          { label: '1.0 mol/L (1 M)', value: 1.0 },
        ],
      },
    ],
    assumptions: [
      'Complete 100% dissociation (strong monoprotic acid assumption).',
      'Activity coefficient equals 1 (concentrated ionic interactions neglected).',
      'Water auto-ionization (10⁻⁷ mol/L) is negligible within the 10⁻⁴ to 1.0 mol/L range.',
    ],
    limitations: [
      'Real concentrated acids (>0.1 mol/L) deviate due to ionic activity coefficients (Debye–Hückel).',
      'Weak acids require Ka equilibrium calculations, not this strong-acid equation.',
      'Virtual model only — never handle concentrated acids outside certified supervision.',
    ],
    validityRange: '0.0001 mol/L ≤ [H⁺] ≤ 1.0 mol/L at 25 °C',
    safetyLevel: 'AMBER',
    safetyNote:
      'Virtual chemistry simulation only. No physical acid handling or dilution instructions are provided.',
    references: [
      {
        title: 'IUPAC Compendium of Chemical Terminology — Definition of pH',
        source: 'IUPAC Gold Book',
        url: 'https://goldbook.iupac.org/terms/view/P04524',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Molar Concentration [H⁺] (mol/L).',
      yAxisMeaning: 'Idealised pH value (0 to 4 in this concentration band).',
      relationship: 'Logarithmic inverse relationship.',
      trend: 'pH drops rapidly as concentration grows from 0.0001 to 0.05 mol/L, then changes more gradually.',
      slopeMeaning: 'Each decade (×10) increase in [H⁺] shifts pH down by 1.00 unit.',
      conclusion: 'pH compresses orders-of-magnitude changes in hydrogen ion concentration into a compact linear scale.',
      limitations: 'Activity effects cause real high-concentration measurements to differ slightly from ideal −log₁₀([H⁺]).',
    },
    predictionPrompt: 'At a concentration of 0.001 mol/L (10⁻³ M), what is the idealised pH?',
    predictionOptions: [
      { id: 'ph-1', label: 'pH = 1.00', valueHint: 1 },
      { id: 'ph-2', label: 'pH = 3.00', valueHint: 3 },
      { id: 'ph-3', label: 'pH = 7.00', valueHint: 7 },
    ],
    predictionExpectedHint: '−log₁₀(0.001) = −log₁₀(10⁻³) = 3.00.',
    calculate: (params) => {
      const c = Math.min(1.0, Math.max(0.0001, params.concentration ?? 0.001));
      const ph = roundTo(-Math.log10(c), 3);
      const poh = roundTo(14 - ph, 3);
      const sampleConcs = [0.0001, 0.0005, 0.001, 0.002, 0.005, 0.01, 0.02, 0.05, 0.1, 0.25, 0.5, 1.0];
      const curvePoints: GraphPoint[] = sampleConcs.map((conc) => ({
        x: conc,
        y: roundTo(-Math.log10(conc), 3),
      }));
      return {
        primaryValue: ph,
        primaryLabel: 'Idealised pH',
        primarySymbol: 'pH',
        primaryUnit: 'pH units',
        secondaryMetrics: [
          { label: 'Idealised pOH (25 °C)', symbol: 'pOH', value: poh, unit: 'units' },
          { label: 'Hydronium Concentration', symbol: '[H⁺]', value: c, unit: 'mol/L' },
        ],
        calculationSteps: [
          `1. Input concentration: [H⁺] = ${c} mol/L.`,
          `2. Compute base-10 logarithm: log₁₀(${c}) = ${roundTo(Math.log10(c), 4)}.`,
          `3. Apply pH = −log₁₀([H⁺]) = ${ph}.`,
        ],
        curvePoints,
        xAxisLabel: 'Concentration [H⁺]',
        xAxisUnit: 'mol/L',
        yAxisLabel: 'Idealised pH',
        yAxisUnit: 'pH',
        validityNote: 'Idealised strong monoprotic model; valid 10⁻⁴ to 1.0 mol/L at 25 °C.',
      };
    },
  },
  {
    id: 'reaction-rate',
    number: 3,
    title: 'Temperature vs Reaction Rate (Arrhenius)',
    shortTitle: 'Temp vs Reaction Rate',
    subject: 'Chemistry & Kinetics',
    principle: 'Rate constant k grows exponentially with temperature according to the Arrhenius equation: k = A × exp(−Ea / RT).',
    explanation:
      'Higher temperature increases the fraction of colliding molecules whose kinetic energy exceeds the activation barrier Ea. Using a reference temperature of 293.15 K (20 °C), you can observe how quickly relative reaction rate rises.',
    learningObjective:
      'Model how temperature and activation energy govern relative chemical reaction rates via the Arrhenius equation.',
    hypothesis: 'Raising temperature or lowering activation energy increases the rate constant exponentially.',
    independentVariable: 'Temperature (T) in Kelvin',
    dependentVariable: 'Relative Reaction Rate (k / k_ref)',
    controlledVariables: ['Gas constant R = 8.3145 J/(mol·K)', 'Reference temperature T_ref = 293.15 K', 'Constant reactant concentrations'],
    formula: 'k = A · exp(−Eₐ / (R·T))',
    formulaDescription: 'Arrhenius rate law with universal gas constant R = 8.31446 J/(mol·K).',
    unitsSummary: 'Temperature: K · Activation Energy: kJ/mol · Relative Rate: × (dimensionless)',
    parameters: [
      {
        key: 'temperature',
        label: 'Reaction Temperature',
        symbol: 'T',
        unit: 'K',
        min: 273.15,
        max: 373.15,
        step: 1,
        defaultValue: 303.15,
        description: 'Reaction temperature in Kelvin (273.15 K = 0 °C to 373.15 K = 100 °C).',
      },
      {
        key: 'ea',
        label: 'Activation Energy',
        symbol: 'Eₐ',
        unit: 'kJ/mol',
        min: 20,
        max: 100,
        step: 1,
        defaultValue: 50,
        description: 'Minimum energy barrier required for reaction (default 50 kJ/mol).',
      },
      {
        key: 'tRef',
        label: 'Reference Temperature',
        symbol: 'T_ref',
        unit: 'K',
        min: 273.15,
        max: 333.15,
        step: 1,
        defaultValue: 293.15,
        description: 'Baseline temperature for relative rate comparison (default 293.15 K).',
      },
    ],
    assumptions: [
      'Activation energy Ea and pre-exponential factor A are temperature-independent over 273–373 K.',
      'Single elementary barrier governs the observed reaction rate.',
      'Concentrations remain constant when comparing rate constants.',
    ],
    limitations: [
      'Enzymatic reactions denature at high temperatures and deviate from Arrhenius.',
      'Diffusion-limited or multi-step mechanisms show non-Arrhenius curvature.',
    ],
    validityRange: '273.15 K ≤ T ≤ 373.15 K, 20 ≤ Ea ≤ 100 kJ/mol',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe mathematical kinetics model with no physical heating hazards.',
    references: [
      {
        title: 'IUPAC Gold Book — Arrhenius Equation',
        source: 'International Union of Pure and Applied Chemistry',
        url: 'https://goldbook.iupac.org/terms/view/A00446',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Temperature T in Kelvin (K).',
      yAxisMeaning: 'Relative Reaction Rate compared to T_ref (dimensionless ratio k/k_ref).',
      relationship: 'Exponential positive growth.',
      trend: 'With Ea = 50 kJ/mol near room temperature, a +10 K rise roughly doubles the reaction rate.',
      slopeMeaning: 'Steeper upward curvature indicates higher activation energy Ea.',
      conclusion: 'Small increases in thermal energy dramatically multiply the population of molecules surpassing Ea.',
      limitations: 'Assumes constant Ea and no phase change or catalyst degradation.',
    },
    predictionPrompt: 'With Ea = 50 kJ/mol and T_ref = 293.15 K, roughly what happens when T rises by 10 K to 303.15 K?',
    predictionOptions: [
      { id: 'rr-1', label: 'Relative rate stays near 1.0×', valueHint: 1 },
      { id: 'rr-2', label: 'Relative rate nearly doubles (~1.99×)', valueHint: 1.99 },
      { id: 'rr-3', label: 'Relative rate increases 10×', valueHint: 10 },
    ],
    predictionExpectedHint: 'At 303.15 K with Ea = 50 kJ/mol, k / k_ref ≈ 1.97×.',
    calculate: (params) => {
      const R = 8.314462618;
      const T = Math.min(373.15, Math.max(273.15, params.temperature ?? 303.15));
      const eaKj = Math.min(100, Math.max(20, params.ea ?? 50));
      const tRef = Math.min(333.15, Math.max(273.15, params.tRef ?? 293.15));
      const eaJ = eaKj * 1000;
      const A = 1e10;
      const k = A * Math.exp(-eaJ / (R * T));
      const kRef = A * Math.exp(-eaJ / (R * tRef));
      const relativeRate = roundTo(k / kRef, 3);
      const curvePoints: GraphPoint[] = [];
      for (let temp = 273.15; temp <= 373.15; temp += 5) {
        const kt = A * Math.exp(-eaJ / (R * temp));
        curvePoints.push({
          x: roundTo(temp, 2),
          y: roundTo(kt / kRef, 3),
        });
      }
      return {
        primaryValue: relativeRate,
        primaryLabel: 'Relative Reaction Rate',
        primarySymbol: 'k/k₀',
        primaryUnit: '× baseline',
        secondaryMetrics: [
          { label: 'Temperature (°C)', symbol: 'T_°C', value: roundTo(T - 273.15, 2), unit: '°C' },
          { label: 'Rate Constant (A=10¹⁰)', symbol: 'k', value: Number(k.toPrecision(4)), unit: 's⁻¹' },
        ],
        calculationSteps: [
          `1. Convert Eₐ = ${eaKj} kJ/mol = ${eaJ} J/mol; R = 8.3145 J/(mol·K).`,
          `2. Compute exponent at T = ${T} K: −Eₐ/(R·T) = ${roundTo(-eaJ / (R * T), 4)}.`,
          `3. Compute exponent at T_ref = ${tRef} K: −Eₐ/(R·T_ref) = ${roundTo(-eaJ / (R * tRef), 4)}.`,
          `4. Relative rate k / k_ref = exp(−Eₐ/R · (1/T − 1/T_ref)) = ${relativeRate}×.`,
        ],
        curvePoints,
        xAxisLabel: 'Temperature',
        xAxisUnit: 'K',
        yAxisLabel: 'Relative Reaction Rate',
        yAxisUnit: '×',
        validityNote: 'Arrhenius single-barrier kinetics valid from 273.15 K to 373.15 K.',
      };
    },
  },
  {
    id: 'pendulum-period',
    number: 4,
    title: 'Pendulum Length vs Time Period',
    shortTitle: 'Pendulum Length vs Period',
    subject: 'Physics & Mechanics',
    principle: 'For small oscillations, a simple pendulum’s period depends only on length and gravitational acceleration: T = 2π√(L/g).',
    explanation:
      'Surprisingly, mass does not appear in the simple pendulum period formula. Increasing length L makes the swing slower, while stronger gravity g pulls the bob back faster. You can plot both T vs L and T² vs L in the Graphs tab.',
    learningObjective:
      'Verify the square-root dependence of pendulum period on length and inspect the linear relationship between L and T².',
    hypothesis: 'Quadrupling pendulum length doubles the time period, and T² is directly proportional to L.',
    independentVariable: 'Pendulum Length (L) in m',
    dependentVariable: 'Time Period (T) in s',
    controlledVariables: ['Small release angle (< 15°)', 'Point-mass bob approximation', 'Zero air drag or pivot friction'],
    formula: 'T = 2π √(L / g)',
    formulaDescription: 'Small-angle simple harmonic oscillation formula.',
    unitsSummary: 'Length: m · Gravity: m/s² · Period: s · Period²: s²',
    parameters: [
      {
        key: 'length',
        label: 'Pendulum Length',
        symbol: 'L',
        unit: 'm',
        min: 0.1,
        max: 5.0,
        step: 0.05,
        defaultValue: 1.0,
        description: 'Distance from pivot to center of mass (0.1 to 5.0 m).',
      },
      {
        key: 'gravity',
        label: 'Gravitational Acceleration',
        symbol: 'g',
        unit: 'm/s²',
        min: 1.62,
        max: 24.79,
        step: 0.01,
        defaultValue: 9.81,
        description: 'Local gravity (Earth 9.81, Moon 1.62, Mars 3.72, Jupiter 24.79 m/s²).',
        options: [
          { label: 'Earth (9.81 m/s²)', value: 9.81 },
          { label: 'Moon (1.62 m/s²)', value: 1.62 },
          { label: 'Mars (3.72 m/s²)', value: 3.72 },
          { label: 'Jupiter (24.79 m/s²)', value: 24.79 },
        ],
      },
    ],
    assumptions: [
      'Small oscillation amplitude (θ < 15°) so sin(θ) ≈ θ.',
      'Massless, inextensible string and point-mass bob.',
      'No air resistance or pivot damping.',
    ],
    limitations: [
      'Large swing angles require elliptic integral corrections (period becomes longer).',
      'Extended rigid rods behave as physical pendulums requiring moment of inertia.',
    ],
    validityRange: '0.1 m ≤ L ≤ 5.0 m, 1.62 ≤ g ≤ 24.79 m/s², θ < 15°',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe classical mechanics simulation.',
    references: [
      {
        title: 'OpenStax University Physics — The Simple Pendulum',
        source: 'OpenStax / Rice University',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Pendulum Length L (m).',
      yAxisMeaning: 'Oscillation Time Period T (s), or T² (s²) when secondary curve is toggled.',
      relationship: 'Square-root curve for T vs L; straight line through origin for T² vs L.',
      trend: 'Increasing L slows the swing; slope of T² vs L equals 4π²/g.',
      slopeMeaning: 'From the slope of T² vs L, one can experimentally measure local gravity g = 4π² / slope.',
      conclusion: 'Time period scales with √L and inversely with √g, independent of bob mass.',
      limitations: 'Breaks down for large angles (> 15°) or heavy strings.',
    },
    predictionPrompt: 'For a 1.00 m pendulum on Earth (g = 9.81 m/s²), what is the period of one full swing?',
    predictionOptions: [
      { id: 'pp-1', label: '1.00 second', valueHint: 1.0 },
      { id: 'pp-2', label: '2.01 seconds', valueHint: 2.01 },
      { id: 'pp-3', label: '6.28 seconds', valueHint: 6.28 },
    ],
    predictionExpectedHint: 'T = 2π√(1 / 9.81) ≈ 2.006 s ≈ 2.01 s.',
    calculate: (params) => {
      const L = Math.min(5.0, Math.max(0.1, params.length ?? 1.0));
      const g = Math.min(24.79, Math.max(1.62, params.gravity ?? 9.81));
      const T = roundTo(2 * Math.PI * Math.sqrt(L / g), 3);
      const tSquared = roundTo(T * T, 3);
      const freq = roundTo(1 / T, 3);
      const curvePoints: GraphPoint[] = [];
      for (let len = 0.2; len <= 5.01; len += 0.3) {
        const lVal = roundTo(len, 2);
        const tVal = roundTo(2 * Math.PI * Math.sqrt(lVal / g), 3);
        curvePoints.push({
          x: lVal,
          y: tVal,
          secondaryY: roundTo(tVal * tVal, 3),
        });
      }
      return {
        primaryValue: T,
        primaryLabel: 'Time Period',
        primarySymbol: 'T',
        primaryUnit: 's',
        secondaryMetrics: [
          { label: 'Period Squared', symbol: 'T²', value: tSquared, unit: 's²' },
          { label: 'Frequency', symbol: 'f', value: freq, unit: 'Hz' },
        ],
        calculationSteps: [
          `1. Input Length L = ${L} m, Gravity g = ${g} m/s².`,
          `2. Ratio L / g = ${roundTo(L / g, 4)} s².`,
          `3. Square root √(L / g) = ${roundTo(Math.sqrt(L / g), 4)} s.`,
          `4. T = 2π × ${roundTo(Math.sqrt(L / g), 4)} = ${T} s (T² = ${tSquared} s²).`,
        ],
        curvePoints,
        xAxisLabel: 'Pendulum Length',
        xAxisUnit: 'm',
        yAxisLabel: 'Time Period (T)',
        yAxisUnit: 's',
        secondaryCurveLabel: 'Length vs Period² (T²)',
        secondaryYAxisLabel: 'Period Squared (T²)',
        secondaryYAxisUnit: 's²',
        validityNote: 'Small-angle approximation (θ < 15°), frictionless ideal pendulum.',
      };
    },
  },
  {
    id: 'force-acceleration',
    number: 5,
    title: 'Force vs Acceleration (Newton’s 2nd Law)',
    shortTitle: 'Force vs Acceleration',
    subject: 'Physics & Dynamics',
    principle: 'Net force equals mass times acceleration: F = m·a, so a = F / m.',
    explanation:
      'For a constant mass, acceleration increases linearly with net applied force. Increasing mass increases inertia, reducing acceleration for the same applied force.',
    learningObjective:
      'Verify the direct proportionality between net force and acceleration and inverse proportionality with mass.',
    hypothesis: 'Doubling net force doubles acceleration when mass is held constant.',
    independentVariable: 'Net Force (F) in N',
    dependentVariable: 'Acceleration (a) in m/s²',
    controlledVariables: ['Constant inertial mass m', 'Frictionless surface', 'Non-relativistic speeds'],
    formula: 'a = F / m',
    formulaDescription: 'Newton’s Second Law of Motion for constant non-relativistic mass.',
    unitsSummary: 'Force: N · Mass: kg · Acceleration: m/s²',
    parameters: [
      {
        key: 'force',
        label: 'Net Applied Force',
        symbol: 'F',
        unit: 'N',
        min: 0,
        max: 100,
        step: 0.5,
        defaultValue: 5,
        description: 'Net unbalanced force acting on the object (0 to 100 N).',
      },
      {
        key: 'mass',
        label: 'Object Mass',
        symbol: 'm',
        unit: 'kg',
        min: 0.2,
        max: 50,
        step: 0.2,
        defaultValue: 1,
        description: 'Inertial mass of the body (0.2 to 50 kg).',
      },
    ],
    assumptions: [
      'Constant inertial mass (no mass loss such as rocket fuel burn).',
      'Zero opposing friction or aerodynamic drag.',
      'Velocities far below the speed of light.',
    ],
    limitations: [
      'Real surfaces introduce static and kinetic friction reducing net force.',
      'Variable-mass systems require F = d(mv)/dt.',
    ],
    validityRange: '0 ≤ F ≤ 100 N, 0.2 ≤ m ≤ 50 kg',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe classical dynamics simulation.',
    references: [
      {
        title: 'OpenStax University Physics — Newton’s Second Law',
        source: 'OpenStax / Rice University',
        url: 'https://openstax.org/books/university-physics-volume-1/pages/5-3-newtons-second-law',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Net Force F (Newtons).',
      yAxisMeaning: 'Resulting Acceleration a (m/s²).',
      relationship: 'Direct linear proportion passing through (0, 0).',
      trend: 'Every 1 N increase adds 1/m m/s² of acceleration.',
      slopeMeaning: 'The slope da/dF equals 1/m (inverse mass).',
      conclusion: 'Acceleration is directly proportional to net force and inversely proportional to mass.',
      limitations: 'Assumes no friction and constant mass.',
    },
    predictionPrompt: 'If a 12 N net force acts on a 3 kg dynamics trolley on a frictionless track, what is its acceleration?',
    predictionOptions: [
      { id: 'fa-1', label: '0.25 m/s²', valueHint: 0.25 },
      { id: 'fa-2', label: '4.0 m/s²', valueHint: 4.0 },
      { id: 'fa-3', label: '9.81 m/s²', valueHint: 9.81 },
    ],
    predictionExpectedHint: 'a = F / m = 12 N / 3 kg = 4.00 m/s².',
    calculate: (params) => {
      const F = Math.min(100, Math.max(0, params.force ?? 5));
      const m = Math.min(50, Math.max(0.2, params.mass ?? 1));
      const a = roundTo(F / m, 3);
      const vAfter5s = roundTo(a * 5, 2);
      const curvePoints: GraphPoint[] = [];
      for (let fVal = 0; fVal <= 100; fVal += 10) {
        curvePoints.push({
          x: fVal,
          y: roundTo(fVal / m, 3),
        });
      }
      return {
        primaryValue: a,
        primaryLabel: 'Acceleration',
        primarySymbol: 'a',
        primaryUnit: 'm/s²',
        secondaryMetrics: [
          { label: 'Speed after 5 s (v₀=0)', symbol: 'v₅', value: vAfter5s, unit: 'm/s' },
          { label: 'Inverse Mass (Slope)', symbol: '1/m', value: roundTo(1 / m, 3), unit: 'kg⁻¹' },
        ],
        calculationSteps: [
          `1. Input Net Force F = ${F} N, Mass m = ${m} kg.`,
          `2. Apply Newton’s Second Law: a = F / m = ${F} / ${m} = ${a} m/s².`,
          `3. From rest over 5 s: v = a·t = ${vAfter5s} m/s.`,
        ],
        curvePoints,
        xAxisLabel: 'Net Force',
        xAxisUnit: 'N',
        yAxisLabel: 'Acceleration',
        yAxisUnit: 'm/s²',
        validityNote: 'Constant mass, zero friction, classical non-relativistic regime.',
      };
    },
  },
  {
    id: 'voltage-current',
    number: 6,
    title: 'Voltage vs Current (Ohm’s Law)',
    shortTitle: 'Voltage vs Current',
    subject: 'Physics & Circuits',
    principle: 'Across an ohmic conductor at constant temperature, current is proportional to voltage: V = I·R, so I = V / R.',
    explanation:
      'Ohm’s Law connects electrical potential difference (Voltage), current flow (Amperes), and opposition to flow (Resistance). This virtual DC circuit caps voltage safely at 24 V.',
    learningObjective:
      'Examine the linear V–I characteristic of an ohmic resistor in a safe low-voltage DC circuit.',
    hypothesis: 'Increasing DC voltage increases current linearly, while doubling resistance halves the current.',
    independentVariable: 'DC Voltage (V) in Volts',
    dependentVariable: 'Electric Current (I) in Amperes',
    controlledVariables: ['Ohmic resistance R', 'Constant conductor temperature', 'Low-voltage DC only'],
    formula: 'V = I · R  (I = V / R)',
    formulaDescription: 'Ohmic conductor linear relationship in safe low-voltage DC regime.',
    unitsSummary: 'Voltage: V · Resistance: Ω · Current: A · Power: W',
    parameters: [
      {
        key: 'voltage',
        label: 'DC Supply Voltage',
        symbol: 'V',
        unit: 'V',
        min: 0,
        max: 24,
        step: 0.5,
        defaultValue: 5,
        description: 'Safe low-voltage DC supply (0 to 24 V).',
      },
      {
        key: 'resistance',
        label: 'Resistor Value',
        symbol: 'R',
        unit: 'Ω',
        min: 1,
        max: 1000,
        step: 1,
        defaultValue: 10,
        description: 'Ohmic resistance in Ohms (1 to 1000 Ω).',
      },
    ],
    assumptions: [
      'Ideal ohmic resistor whose resistance does not drift with heating.',
      'Zero internal resistance in the DC power source and connecting wires.',
      'Steady-state DC operation.',
    ],
    limitations: [
      'Non-ohmic components (diodes, filament bulbs) do not follow a constant R.',
      'High currents can overheat real physical resistors if power rating is exceeded.',
      'Never connect experiments to mains AC electricity.',
    ],
    validityRange: '0 ≤ V ≤ 24 V DC, 1 ≤ R ≤ 1000 Ω',
    safetyLevel: 'AMBER',
    safetyNote:
      'Low-voltage DC virtual simulation only (max 24 V). Never experiment with mains AC outlets.',
    references: [
      {
        title: 'OpenStax University Physics — Ohm’s Law',
        source: 'OpenStax / Rice University',
        url: 'https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Applied DC Voltage V (Volts).',
      yAxisMeaning: 'Circuit Current I (Amperes).',
      relationship: 'Linear direct proportion through the origin.',
      trend: 'Higher resistance produces a shallower I vs V line.',
      slopeMeaning: 'The slope dI/dV equals conductance G = 1/R (Siemens).',
      conclusion: 'For an ohmic resistor at constant temperature, V/I remains constant and equals R.',
      limitations: 'Fails for semiconductors, LEDs, or overheated wires.',
    },
    predictionPrompt: 'With a 5 V DC supply across a 10 Ω resistor, what current flows?',
    predictionOptions: [
      { id: 'vc-1', label: '0.50 A', valueHint: 0.5 },
      { id: 'vc-2', label: '2.00 A', valueHint: 2.0 },
      { id: 'vc-3', label: '50.0 A', valueHint: 50.0 },
    ],
    predictionExpectedHint: 'I = V / R = 5 V / 10 Ω = 0.50 A.',
    calculate: (params) => {
      const V = Math.min(24, Math.max(0, params.voltage ?? 5));
      const R = Math.min(1000, Math.max(1, params.resistance ?? 10));
      const I = roundTo(V / R, 4);
      const P = roundTo(V * I, 3);
      const curvePoints: GraphPoint[] = [];
      for (let v = 0; v <= 24; v += 2) {
        curvePoints.push({
          x: v,
          y: roundTo(v / R, 4),
        });
      }
      return {
        primaryValue: I,
        primaryLabel: 'Electric Current',
        primarySymbol: 'I',
        primaryUnit: 'A',
        secondaryMetrics: [
          { label: 'Electrical Power', symbol: 'P', value: P, unit: 'W' },
          { label: 'Conductance', symbol: 'G', value: roundTo(1 / R, 4), unit: 'S' },
        ],
        calculationSteps: [
          `1. Input DC Voltage V = ${V} V, Resistance R = ${R} Ω.`,
          `2. Compute Current: I = V / R = ${V} / ${R} = ${I} A.`,
          `3. Compute Power dissipated: P = V · I = ${P} W.`,
        ],
        curvePoints,
        xAxisLabel: 'DC Voltage',
        xAxisUnit: 'V',
        yAxisLabel: 'Current',
        yAxisUnit: 'A',
        validityNote: 'Safe low-voltage DC ohmic model (0–24 V); excludes self-heating drift.',
      };
    },
  },
  {
    id: 'mass-volume-density',
    number: 7,
    title: 'Mass vs Volume and Density',
    shortTitle: 'Mass, Volume & Density',
    subject: 'Physics & Materials',
    principle: 'Density is an intensive property relating mass and volume: ρ = m / V, so m = ρ · V.',
    explanation:
      'While mass and volume both depend on sample size, their ratio—density—stays characteristic of a pure homogeneous material at a given temperature and pressure.',
    learningObjective:
      'Determine how mass scales linearly with volume and identify materials by the slope of Mass vs Volume.',
    hypothesis: 'For a homogeneous material, mass increases linearly with volume and the slope m/V equals density ρ.',
    independentVariable: 'Sample Volume (V) in cm³',
    dependentVariable: 'Mass (m) in g',
    controlledVariables: ['Material purity', 'Reference temperature (4 °C for water, 20 °C for solids)', 'Zero internal air voids'],
    formula: 'ρ = m / V  ⇒  m = ρ · V',
    formulaDescription: 'Linear mass-volume relation for uniform density materials.',
    unitsSummary: 'Density: g/cm³ · Volume: cm³ · Mass: g',
    parameters: [
      {
        key: 'density',
        label: 'Material Density',
        symbol: 'ρ',
        unit: 'g/cm³',
        min: 0.2,
        max: 19.3,
        step: 0.01,
        defaultValue: 1.0,
        description: 'Material density (Water ≈ 1.00 g/cm³ near 4 °C).',
        options: [
          { label: 'Pure Water (1.00 g/cm³ near 4°C)', value: 1.0 },
          { label: 'Ice (0.917 g/cm³)', value: 0.917 },
          { label: 'Ethanol (0.789 g/cm³)', value: 0.789 },
          { label: 'Aluminum (2.70 g/cm³)', value: 2.7 },
          { label: 'Iron (7.87 g/cm³)', value: 7.87 },
          { label: 'Copper (8.96 g/cm³)', value: 8.96 },
        ],
      },
      {
        key: 'volume',
        label: 'Sample Volume',
        symbol: 'V',
        unit: 'cm³',
        min: 5,
        max: 500,
        step: 5,
        defaultValue: 50,
        description: 'Volume of the sample (5 to 500 cm³).',
      },
    ],
    assumptions: [
      'Uniform homogeneous sample with zero air pockets or cavities.',
      'Constant temperature and atmospheric pressure (thermal expansion neglected).',
    ],
    limitations: [
      'Gases and porous materials vary strongly with pressure and compaction.',
      'Water density peaks near 4 °C (~1.000 g/cm³) and decreases slightly at warmer room temperatures (~0.997 g/cm³ at 25 °C).',
    ],
    validityRange: '5 ≤ V ≤ 500 cm³, 0.2 ≤ ρ ≤ 19.3 g/cm³',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe material property and measurement simulation.',
    references: [
      {
        title: 'NIST — Properties of Water and Common Solids',
        source: 'National Institute of Standards and Technology',
        url: 'https://www.nist.gov/',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Sample Volume V (cm³).',
      yAxisMeaning: 'Calculated Mass m (grams).',
      relationship: 'Direct linear relationship passing through the origin.',
      trend: 'Denser materials produce steeper lines.',
      slopeMeaning: 'The slope dm/dV equals the material density ρ in g/cm³.',
      conclusion: 'Mass and volume are extensive properties, whereas their ratio ρ is an intensive material signature.',
      limitations: 'Temperature fluctuations alter density via thermal expansion.',
    },
    predictionPrompt: 'What is the mass of 50 cm³ of pure water near 4 °C (ρ ≈ 1.00 g/cm³)?',
    predictionOptions: [
      { id: 'mv-1', label: '25.0 g', valueHint: 25 },
      { id: 'mv-2', label: '50.0 g', valueHint: 50 },
      { id: 'mv-3', label: '100.0 g', valueHint: 100 },
    ],
    predictionExpectedHint: 'm = ρ × V = 1.00 g/cm³ × 50 cm³ = 50.0 g.',
    calculate: (params) => {
      const rho = Math.min(19.3, Math.max(0.2, params.density ?? 1.0));
      const V = Math.min(500, Math.max(5, params.volume ?? 50));
      const m = roundTo(rho * V, 2);
      const densityKgM3 = roundTo(rho * 1000, 1);
      const curvePoints: GraphPoint[] = [];
      for (let vol = 0; vol <= 500; vol += 50) {
        curvePoints.push({
          x: vol,
          y: roundTo(rho * vol, 2),
        });
      }
      return {
        primaryValue: m,
        primaryLabel: 'Sample Mass',
        primarySymbol: 'm',
        primaryUnit: 'g',
        secondaryMetrics: [
          { label: 'SI Density', symbol: 'ρ_SI', value: densityKgM3, unit: 'kg/m³' },
          { label: 'Buoyancy in Water', symbol: 'ρ/ρ_w', value: roundTo(rho / 1.0, 3), unit: 'specific gravity' },
        ],
        calculationSteps: [
          `1. Input Material Density ρ = ${rho} g/cm³, Volume V = ${V} cm³.`,
          `2. Compute Mass: m = ρ · V = ${rho} × ${V} = ${m} g.`,
          `3. Specific gravity relative to water (1.0 g/cm³): ${roundTo(rho, 3)}.`,
        ],
        curvePoints,
        xAxisLabel: 'Volume',
        xAxisUnit: 'cm³',
        yAxisLabel: 'Mass',
        yAxisUnit: 'g',
        validityNote: 'Homogeneous non-porous sample at reference temperature.',
      };
    },
  },
  {
    id: 'light-distance',
    number: 8,
    title: 'Distance vs Light Intensity',
    shortTitle: 'Distance vs Light Intensity',
    subject: 'Physics & Optics',
    principle: 'Light from an isotropic point source spreads across spherical shells of area 4πr², so intensity obeys the inverse-square law: I ∝ 1/r².',
    explanation:
      'Doubling the distance from a small point light source spreads the same energy over 4 times the area, reducing relative intensity to 25%.',
    learningObjective:
      'Quantify how relative irradiance drops with the square of distance from an ideal point source.',
    hypothesis: 'Doubling observation distance reduces light intensity to one-quarter (25%) of its value.',
    independentVariable: 'Observation Distance (r) in m',
    dependentVariable: 'Relative Light Intensity (I) in %',
    controlledVariables: ['Reference distance r₀ = 1 m', 'Reference intensity I₀ = 100%', 'Zero scattering or absorption'],
    formula: 'I = I₀ · (r₀ / r)²',
    formulaDescription: 'Geometric inverse-square attenuation for an isotropic point source in vacuum/clear air.',
    unitsSummary: 'Distance: m · Relative Intensity: %',
    parameters: [
      {
        key: 'distance',
        label: 'Observation Distance',
        symbol: 'r',
        unit: 'm',
        min: 0.5,
        max: 10,
        step: 0.1,
        defaultValue: 2.0,
        description: 'Distance from point source to sensor (0.5 to 10.0 m).',
      },
      {
        key: 'refDistance',
        label: 'Reference Distance',
        symbol: 'r₀',
        unit: 'm',
        min: 0.5,
        max: 2.0,
        step: 0.1,
        defaultValue: 1.0,
        description: 'Baseline calibration distance where intensity is 100% (default 1.0 m).',
      },
    ],
    assumptions: [
      'Ideal point light source emitting uniformly in all directions.',
      'No atmospheric absorption, haze, or wall reflections.',
      'Sensor surface oriented perpendicular to incoming rays.',
    ],
    limitations: [
      'Collimated lasers and large area panels do not obey simple 1/r² at short distances.',
      'Indoor wall reflections add ambient light above the inverse-square prediction.',
    ],
    validityRange: '0.5 m ≤ r ≤ 10.0 m (far-field point source)',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe optical geometry simulation.',
    references: [
      {
        title: 'NASA — Inverse Square Law of Light',
        source: 'NASA Imagine the Universe',
        url: 'https://imagine.gsfc.nasa.gov/science/toolbox/emspectrum1.html',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Distance r from the light source (m).',
      yAxisMeaning: 'Relative Intensity I (%) compared to I₀ = 100% at r₀.',
      relationship: 'Inverse-square decay (I ∝ 1/r²).',
      trend: 'Intensity falls rapidly between 0.5 m and 3 m, then approaches zero asymptotically.',
      slopeMeaning: 'Steep negative slope near the source reflects rapid geometric spreading of light energy.',
      conclusion: 'Light intensity decreases as the square of distance because spherical surface area grows as r².',
      limitations: 'Requires point-like source and zero stray reflections.',
    },
    predictionPrompt: 'At r₀ = 1 m (100% intensity), what is the relative intensity at r = 2 m?',
    predictionOptions: [
      { id: 'li-1', label: '50%', valueHint: 50 },
      { id: 'li-2', label: '25%', valueHint: 25 },
      { id: 'li-3', label: '12.5%', valueHint: 12.5 },
    ],
    predictionExpectedHint: 'I = 100% × (1 / 2)² = 25.00%.',
    calculate: (params) => {
      const r = Math.min(10, Math.max(0.5, params.distance ?? 2.0));
      const r0 = Math.min(2.0, Math.max(0.5, params.refDistance ?? 1.0));
      const i0 = 100;
      const intensity = roundTo(i0 * Math.pow(r0 / r, 2), 2);
      const curvePoints: GraphPoint[] = [];
      for (let dist = 0.5; dist <= 10.01; dist += 0.5) {
        const dVal = roundTo(dist, 2);
        curvePoints.push({
          x: dVal,
          y: roundTo(i0 * Math.pow(r0 / dVal, 2), 2),
        });
      }
      return {
        primaryValue: intensity,
        primaryLabel: 'Relative Intensity',
        primarySymbol: 'I',
        primaryUnit: '%',
        secondaryMetrics: [
          { label: 'Inverse Square Factor', symbol: '(r₀/r)²', value: roundTo(Math.pow(r0 / r, 2), 4), unit: 'ratio' },
          { label: 'Spread Area Multiplier', symbol: '(r/r₀)²', value: roundTo(Math.pow(r / r0, 2), 2), unit: '× area' },
        ],
        calculationSteps: [
          `1. Reference I₀ = 100% at r₀ = ${r0} m; Observation r = ${r} m.`,
          `2. Compute ratio r₀ / r = ${roundTo(r0 / r, 4)}.`,
          `3. Square the ratio: (r₀ / r)² = ${roundTo(Math.pow(r0 / r, 2), 4)}.`,
          `4. I = 100% × ${roundTo(Math.pow(r0 / r, 2), 4)} = ${intensity}%.`,
        ],
        curvePoints,
        xAxisLabel: 'Distance',
        xAxisUnit: 'm',
        yAxisLabel: 'Relative Intensity',
        yAxisUnit: '%',
        validityNote: 'Point source with negligible reflections or scattering.',
      };
    },
  },
  {
    id: 'photosynthesis-rate',
    number: 9,
    title: 'Light Intensity vs Photosynthesis',
    shortTitle: 'Light vs Photosynthesis',
    subject: 'Biology & Ecology',
    principle: 'Under saturating irradiance, modelled photosynthetic rate follows a rectangular hyperbola: P = P_max · I / (K + I).',
    explanation:
      'At low light, photosynthesis rises almost linearly with photon flux. As light approaches and exceeds the half-saturation constant K, Calvin cycle enzymes and CO₂ diffusion limit further acceleration until rate plateaus near P_max.',
    learningObjective:
      'Explore light-saturation kinetics in photosynthesis and identify limiting factors beyond light intensity.',
    hypothesis: 'Photosynthesis increases with light at first, reaches half of P_max when I = K, and then saturates.',
    independentVariable: 'Light Intensity (I) in µmol/m²/s',
    dependentVariable: 'Modelled Photosynthesis Rate (P) in relative units',
    controlledVariables: ['Maximum capacity P_max', 'Half-saturation constant K', 'Ambient CO₂ and optimal leaf temperature'],
    formula: 'P = P_max · I / (K + I)',
    formulaDescription: 'Michaelis–Menten / rectangular hyperbolic light-response curve.',
    unitsSummary: 'Light Intensity (PAR): µmol/m²/s · Rate P: relative units',
    parameters: [
      {
        key: 'intensity',
        label: 'Light Intensity (PAR)',
        symbol: 'I',
        unit: 'µmol/m²/s',
        min: 0,
        max: 2000,
        step: 25,
        defaultValue: 200,
        description: 'Photosynthetically active photon flux density (0 to 2000 µmol/m²/s).',
      },
      {
        key: 'pMax',
        label: 'Maximum Rate (P_max)',
        symbol: 'P_max',
        unit: 'rel. units',
        min: 2,
        max: 30,
        step: 1,
        defaultValue: 10,
        description: 'Asymptotic biochemical capacity (default 10 relative units).',
      },
      {
        key: 'kHalf',
        label: 'Half-Saturation Constant (K)',
        symbol: 'K',
        unit: 'µmol/m²/s',
        min: 50,
        max: 600,
        step: 25,
        defaultValue: 200,
        description: 'Light level yielding 50% of P_max (default 200 µmol/m²/s).',
      },
    ],
    assumptions: [
      'Gross photosynthesis starts at zero in darkness (basal dark respiration not subtracted).',
      'CO₂ supply, water availability, and temperature remain non-limiting and constant.',
      'No photoinhibition damage at high irradiance.',
    ],
    limitations: [
      'Real leaves experience photorespiration, dark respiration (light compensation point), and photoinhibition under extreme sunlight.',
      'Changing temperature or CO₂ concentration alters both P_max and K.',
    ],
    validityRange: '0 ≤ I ≤ 2000 µmol/m²/s, simplified hyperbolic biological model',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe plant physiology simulation.',
    references: [
      {
        title: 'Khan Academy / Campbell Biology — Factors Affecting Photosynthesis',
        source: 'Open Educational Biology Reference',
        url: 'https://www.khanacademy.org/science/biology/photosynthesis-in-plants',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Photosynthetically Active Light Intensity I (µmol/m²/s).',
      yAxisMeaning: 'Modelled Photosynthesis Rate P (relative units).',
      relationship: 'Saturating rectangular hyperbola.',
      trend: 'Steep linear climb when I ≪ K, passing through P_max/2 at I = K, then flattening toward P_max.',
      slopeMeaning: 'Initial slope P_max/K reflects photosynthetic quantum efficiency at low light.',
      conclusion: 'Light stops being the limiting factor once photosystems saturate; CO₂ or enzyme kinetics then cap the rate.',
      limitations: 'Omits dark respiration offset and extreme-light photoinhibition.',
    },
    predictionPrompt: 'When P_max = 10, K = 200 µmol/m²/s, and I = 200 µmol/m²/s, what is the modelled rate P?',
    predictionOptions: [
      { id: 'phrate-1', label: '2.5 relative units', valueHint: 2.5 },
      { id: 'phrate-2', label: '5.0 relative units', valueHint: 5.0 },
      { id: 'phrate-3', label: '10.0 relative units', valueHint: 10.0 },
    ],
    predictionExpectedHint: 'When I = K, P = P_max × K / (2K) = P_max / 2 = 5.00 relative units.',
    calculate: (params) => {
      const I = Math.min(2000, Math.max(0, params.intensity ?? 200));
      const pMax = Math.min(30, Math.max(2, params.pMax ?? 10));
      const K = Math.min(600, Math.max(50, params.kHalf ?? 200));
      const P = roundTo((pMax * I) / (K + I), 3);
      const pctMax = roundTo((P / pMax) * 100, 1);
      const curvePoints: GraphPoint[] = [];
      for (let light = 0; light <= 2000; light += 100) {
        curvePoints.push({
          x: light,
          y: roundTo((pMax * light) / (K + light), 3),
        });
      }
      return {
        primaryValue: P,
        primaryLabel: 'Photosynthesis Rate',
        primarySymbol: 'P',
        primaryUnit: 'rel. units',
        secondaryMetrics: [
          { label: 'Capacity Reached', symbol: 'P/P_max', value: pctMax, unit: '%' },
          { label: 'Half-Saturation Light', symbol: 'K', value: K, unit: 'µmol/m²/s' },
        ],
        calculationSteps: [
          `1. Input Light I = ${I} µmol/m²/s, P_max = ${pMax}, K = ${K} µmol/m²/s.`,
          `2. Denominator K + I = ${K + I} µmol/m²/s.`,
          `3. P = (${pMax} × ${I}) / ${K + I} = ${P} relative units (${pctMax}% of P_max).`,
        ],
        curvePoints,
        xAxisLabel: 'Light Intensity (PAR)',
        xAxisUnit: 'µmol/m²/s',
        yAxisLabel: 'Photosynthesis Rate',
        yAxisUnit: 'rel. units',
        validityNote: 'Simplified Michaelis–Menten response; omits respiration & photoinhibition.',
      };
    },
  },
  {
    id: 'newtons-cooling',
    number: 10,
    title: 'Newton’s Law of Cooling',
    shortTitle: 'Newton’s Law of Cooling',
    subject: 'Physics & Heat Transfer',
    principle: 'An object cools at a rate proportional to its temperature difference with the surroundings: T(t) = T_a + (T₀ − T_a)·exp(−k·t).',
    explanation:
      'A hot cup of water cools fastest right after being poured because (T₀ − T_a) is largest. As its temperature approaches room temperature T_a, the temperature gap shrinks and cooling slows exponentially.',
    learningObjective:
      'Model exponential thermal equilibration toward ambient temperature and compute instantaneous temperature over time.',
    hypothesis: 'The temperature difference (T − T_a) decays exponentially with time constant 1/k.',
    independentVariable: 'Elapsed Time (t) in minutes',
    dependentVariable: 'Object Temperature T(t) in °C',
    controlledVariables: ['Ambient temperature T_a', 'Initial temperature T₀', 'Constant convective cooling coefficient k'],
    formula: 'T(t) = Tₐ + (T₀ − Tₐ) · exp(−k · t)',
    formulaDescription: 'Lumped-capacitance exponential cooling toward constant ambient temperature T_a.',
    unitsSummary: 'Temperature: °C · Time: min · Cooling Constant k: min⁻¹',
    parameters: [
      {
        key: 't0',
        label: 'Initial Temperature',
        symbol: 'T₀',
        unit: '°C',
        min: 30,
        max: 100,
        step: 1,
        defaultValue: 80,
        description: 'Starting temperature of the object (30 to 100 °C).',
      },
      {
        key: 'ta',
        label: 'Ambient Temperature',
        symbol: 'Tₐ',
        unit: '°C',
        min: 0,
        max: 40,
        step: 1,
        defaultValue: 25,
        description: 'Surrounding room temperature (0 to 40 °C).',
      },
      {
        key: 'k',
        label: 'Cooling Constant',
        symbol: 'k',
        unit: 'min⁻¹',
        min: 0.01,
        max: 0.25,
        step: 0.005,
        defaultValue: 0.05,
        description: 'Lumped heat-transfer constant (default 0.05 min⁻¹).',
      },
      {
        key: 'time',
        label: 'Elapsed Time',
        symbol: 't',
        unit: 'min',
        min: 0,
        max: 120,
        step: 1,
        defaultValue: 20,
        description: 'Time elapsed since t = 0 (0 to 120 min).',
      },
    ],
    assumptions: [
      'Uniform internal temperature throughout the object (low Biot number).',
      'Constant surrounding air temperature T_a.',
      'Heat transfer coefficient k stays constant (convection dominates over radiation/evaporation).',
    ],
    limitations: [
      'Rapid evaporation or strong radiant cooling (Stefan–Boltzmann T⁴) alters k at high temperatures.',
      'Phase changes (freezing/condensation) pause temperature drop while latent heat releases.',
    ],
    validityRange: '0 ≤ t ≤ 120 min, 0 ≤ T_a ≤ 40 °C, 30 ≤ T₀ ≤ 100 °C',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe mathematical thermal decay simulation.',
    references: [
      {
        title: 'OpenStax Calculus / Physics — Newton’s Law of Cooling',
        source: 'OpenStax',
        url: 'https://openstax.org/books/calculus-volume-2/pages/4-3-separable-equations',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Elapsed Time t (minutes).',
      yAxisMeaning: 'Object Temperature T(t) in °C.',
      relationship: 'Exponential decay asymptotically approaching ambient temperature T_a.',
      trend: 'Fastest drop in early minutes; flattens as T(t) nears T_a.',
      slopeMeaning: 'Instantaneous slope dT/dt = −k(T − T_a) equals the cooling rate in °C/min.',
      conclusion: 'Thermal equilibrium is approached exponentially, governed by the cooling constant k.',
      limitations: 'Assumes constant k and negligible evaporative cooling.',
    },
    predictionPrompt: 'Starting at 80 °C in a 25 °C room with k = 0.05 min⁻¹, what is T after 20 minutes?',
    predictionOptions: [
      { id: 'nc-1', label: '25.0 °C (room temp)', valueHint: 25 },
      { id: 'nc-2', label: '45.2 °C', valueHint: 45.23 },
      { id: 'nc-3', label: '60.0 °C', valueHint: 60 },
    ],
    predictionExpectedHint: 'T(20) = 25 + (80 − 25)·exp(−1) = 25 + 55 × 0.3679 ≈ 45.23 °C.',
    calculate: (params) => {
      const t0 = Math.min(100, Math.max(30, params.t0 ?? 80));
      const ta = Math.min(40, Math.max(0, params.ta ?? 25));
      const k = Math.min(0.25, Math.max(0.01, params.k ?? 0.05));
      const time = Math.min(120, Math.max(0, params.time ?? 20));
      const temp = roundTo(ta + (t0 - ta) * Math.exp(-k * time), 2);
      const halfLife = roundTo(Math.LN2 / k, 1);
      const coolingRate = roundTo(-k * (temp - ta), 3);
      const curvePoints: GraphPoint[] = [];
      for (let t = 0; t <= 120; t += 5) {
        curvePoints.push({
          x: t,
          y: roundTo(ta + (t0 - ta) * Math.exp(-k * t), 2),
        });
      }
      return {
        primaryValue: temp,
        primaryLabel: 'Temperature T(t)',
        primarySymbol: 'T(t)',
        primaryUnit: '°C',
        secondaryMetrics: [
          { label: 'Instantaneous Cooling Rate', symbol: 'dT/dt', value: coolingRate, unit: '°C/min' },
          { label: 'Thermal Half-Time', symbol: 't½', value: halfLife, unit: 'min' },
        ],
        calculationSteps: [
          `1. Excess temperature at t = 0: ΔT₀ = T₀ − Tₐ = ${t0} − ${ta} = ${roundTo(t0 - ta, 2)} °C.`,
          `2. Decay factor at t = ${time} min: exp(−${k} × ${time}) = ${roundTo(Math.exp(-k * time), 4)}.`,
          `3. T(${time}) = ${ta} + ${roundTo(t0 - ta, 2)} × ${roundTo(Math.exp(-k * time), 4)} = ${temp} °C.`,
        ],
        curvePoints,
        xAxisLabel: 'Elapsed Time',
        xAxisUnit: 'min',
        yAxisLabel: 'Temperature',
        yAxisUnit: '°C',
        validityNote: 'Lumped-capacitance model with constant ambient temperature and negligible evaporation.',
      };
    },
  },
  {
    id: 'acid-base-titration',
    number: 11,
    title: 'Strong Acid–Base Neutralisation Titration',
    shortTitle: 'Acid–Base Titration',
    subject: 'Chemistry & Stoichiometry',
    principle: 'Hydrochloric acid neutralises sodium hydroxide in a 1:1 molar ratio (HCl + NaOH → NaCl + H₂O, ΔH = −57.3 kJ/mol). Beyond equivalence, excess OH⁻ drives pH steeply through pH 7.00.',
    explanation:
      'At constant acid molarity and volume, added strong base neutralises H⁺ ions linearly until the stoichiometric equivalence point (n_acid = n_base), where pH = 7.00 at 25 °C and enthalpy evolves 57.3 kJ per mole of water formed.',
    learningObjective:
      'Model titration curves, calculate excess [H⁺] or [OH⁻], predict equivalence volume V_eq, and quantify neutralisation heat.',
    hypothesis: 'pH changes slowly until approaching the equivalence volume V_eq, jumps sharply across pH 7, and phenolphthalein turns pink above pH 8.2.',
    independentVariable: 'Volume of NaOH Titrant Added (V_b) in mL',
    dependentVariable: 'Solution pH at 25 °C',
    controlledVariables: ['25.0 mL of 0.10 M HCl analyte', '0.10 M NaOH titrant', '25 °C water self-ionization Kw = 10⁻¹⁴'],
    formula: 'pH = −log₁₀([H⁺])  |  Equivalence: Cₐ·Vₐ = C_b·V_b',
    formulaDescription: 'Exact strong acid–strong base charge-balance titration equation with enthalpy of neutralisation ΔH = −57.3 kJ/mol.',
    unitsSummary: 'Volume: mL · Concentration: mol/L (M) · Heat: J',
    parameters: [
      {
        key: 'baseVolume',
        label: 'NaOH Titrant Added (0.10 M)',
        symbol: 'V_b',
        unit: 'mL',
        min: 0,
        max: 50,
        step: 0.5,
        defaultValue: 15,
        description: 'Volume of 0.10 M NaOH added to 25.0 mL of 0.10 M HCl (0 to 50 mL).',
      },
      {
        key: 'acidMolarity',
        label: 'HCl Concentration (25 mL)',
        symbol: 'Cₐ',
        unit: 'mol/L',
        min: 0.05,
        max: 0.25,
        step: 0.01,
        defaultValue: 0.1,
        description: 'Initial molar concentration of 25.0 mL HCl (0.05 to 0.25 M).',
      },
    ],
    assumptions: [
      'Both HCl and NaOH are 100% dissociated strong electrolytes at 25 °C (Kw = 1.0×10⁻¹⁴).',
      'Activity coefficients approximated as γ = 1 in dilute aqueous solution.',
      'Instantaneous mixing with negligible heat loss to glass walls.',
    ],
    limitations: [
      'Weak acids (e.g., CH₃COOH) create buffer regions and equivalence pH > 7, requiring pKa equilibrium instead.',
      'High ionic strength (> 0.2 M) shifts real electrode readings slightly via Debye–Hückel activity effects.',
    ],
    validityRange: '0 ≤ V_b ≤ 50 mL, 0.05 ≤ Cₐ ≤ 0.25 M, 25 °C aqueous reference',
    safetyLevel: 'AMBER',
    safetyNote: 'Use virtual burette first; physical 0.1 M HCl and NaOH require splash goggles, gloves, and teacher supervision.',
    references: [
      {
        title: 'NIST / IUPAC Acid–Base Equilibria & Enthalpy of Neutralisation',
        source: 'IUPAC Gold Book / Quantitative Analytical Chemistry',
        url: 'https://goldbook.iupac.org/',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Added 0.10 M NaOH Volume V_b (mL).',
      yAxisMeaning: 'Measured Solution pH (0–14 scale).',
      relationship: 'Sigmoidal titration S-curve with steepest slope at equivalence V_eq.',
      trend: 'pH remains acidic (< 3) until within ~2 mL of equivalence, jumps through 7.00 at equivalence, then levels near 12–13.',
      slopeMeaning: 'Peak derivative dpH/dV marks the stoichiometric equivalence endpoint.',
      conclusion: 'One-to-one stoichiometry predicts V_eq = (Cₐ × 25.0 mL) / 0.10 M.',
      limitations: 'Assumes strong monoprotic acid and strong base only.',
    },
    predictionPrompt: 'How many mL of 0.10 M NaOH exactly neutralises 25.0 mL of 0.10 M HCl to pH 7.00?',
    predictionOptions: [
      { id: 'tit-1', label: '12.5 mL', valueHint: 12.5 },
      { id: 'tit-2', label: '25.0 mL', valueHint: 25.0 },
      { id: 'tit-3', label: '50.0 mL', valueHint: 50.0 },
    ],
    predictionExpectedHint: 'Cₐ·Vₐ = C_b·V_b → 0.10 × 25.0 = 0.10 × V_b → V_b = 25.0 mL.',
    calculate: (params) => {
      const vb = Math.min(50, Math.max(0, params.baseVolume ?? 15));
      const ca = Math.min(0.25, Math.max(0.05, params.acidMolarity ?? 0.1));
      const va = 25.0; // mL HCl
      const cb = 0.1; // M NaOH

      const computePhAt = (vBaseMl: number) => {
        const na = (ca * va) / 1000;
        const nb = (cb * vBaseMl) / 1000;
        const totalVolL = (va + vBaseMl) / 1000;
        const diff = na - nb; // positive => excess H+, negative => excess OH-
        // Solve exact quadratic [H+] - Kw/[H+] = diff / totalVolL with Kw = 1e-14
        const cNet = diff / totalVolL;
        const kw = 1e-14;
        const hPlus = 0.5 * (cNet + Math.sqrt(cNet * cNet + 4 * kw));
        return roundTo(-Math.log10(hPlus), 2);
      };

      const ph = computePhAt(vb);
      const eqVol = roundTo((ca * va) / cb, 2);
      const molesReacted = Math.min((ca * va) / 1000, (cb * vb) / 1000);
      const heatReleasedJ = roundTo(molesReacted * 57300, 1);

      const curvePoints: GraphPoint[] = [];
      for (let v = 0; v <= 50; v += 2) {
        curvePoints.push({ x: v, y: computePhAt(v) });
      }
      // Ensure exact equivalence point appears cleanly
      if (eqVol >= 0 && eqVol <= 50 && !curvePoints.some((p) => Math.abs(p.x - eqVol) < 0.01)) {
        curvePoints.push({ x: eqVol, y: computePhAt(eqVol) });
        curvePoints.sort((a, b) => a.x - b.x);
      }

      return {
        primaryValue: ph,
        primaryLabel: 'Solution pH (25 °C)',
        primarySymbol: 'pH',
        primaryUnit: 'pH',
        secondaryMetrics: [
          { label: 'Equivalence Volume', symbol: 'V_eq', value: eqVol, unit: 'mL NaOH' },
          { label: 'Neutralisation Heat (ΔH)', symbol: 'Q', value: heatReleasedJ, unit: 'J' },
        ],
        calculationSteps: [
          `1. Initial Acid Moles: n(HCl) = ${ca} M × 0.025 L = ${roundTo((ca * va) / 1000, 5)} mol.`,
          `2. Added Base Moles: n(NaOH) = ${cb} M × ${roundTo(vb / 1000, 5)} L = ${roundTo((cb * vb) / 1000, 5)} mol.`,
          `3. Equivalence Volume V_eq = (${ca} × 25.0) / ${cb} = ${eqVol} mL.`,
          `4. Exact aqueous charge balance yields pH = ${ph} (${ph < 7 ? 'Acidic' : ph === 7 ? 'Neutral Equivalence' : 'Alkaline — Phenolphthalein Pink'}).`,
        ],
        curvePoints,
        xAxisLabel: 'NaOH Titrant Volume',
        xAxisUnit: 'mL',
        yAxisLabel: 'Solution pH',
        yAxisUnit: 'pH',
        validityNote: 'Strong acid–strong base charge balance with Kw = 1.0×10⁻¹⁴ at 25 °C.',
      };
    },
  },
  {
    id: 'michaelis-menten',
    number: 12,
    title: 'Enzyme Kinetics (Michaelis–Menten)',
    shortTitle: 'Enzyme Kinetics',
    subject: 'Biotechnology & Biochemistry',
    principle: 'Initial enzymatic reaction velocity saturates hyperbolically with substrate concentration: v₀ = (V_max · [S]) / (K_m + [S]).',
    explanation:
      'When substrate concentration [S] is low, active sites are empty and rate rises nearly linearly. As [S] approaches and exceeds the Michaelis constant K_m, enzymes saturate toward asymptotic V_max.',
    learningObjective:
      'Relate substrate concentration [S], affinity constant K_m, and maximum turnover velocity V_max for Higher Education Biochemistry & Research.',
    hypothesis: 'Reaction rate reaches exactly 50% of V_max when substrate [S] equals K_m, regardless of V_max magnitude.',
    independentVariable: 'Substrate Concentration [S] in mmol/L (mM)',
    dependentVariable: 'Initial Reaction Velocity (v₀) in µmol/min',
    controlledVariables: ['Constant active enzyme concentration [E]₀', 'Buffered pH 7.0', 'Constant temperature 37 °C'],
    formula: 'v₀ = (V_max · [S]) / (K_m + [S])',
    formulaDescription: 'Briggs–Haldane steady-state Michaelis–Menten enzyme kinetics equation.',
    unitsSummary: '[S]: mM · K_m: mM · v₀, V_max: µmol/min',
    parameters: [
      {
        key: 'substrate',
        label: 'Substrate Concentration [S]',
        symbol: '[S]',
        unit: 'mM',
        min: 0,
        max: 100,
        step: 1,
        defaultValue: 20,
        description: 'Initial substrate concentration in millimolar (0 to 100 mM).',
      },
      {
        key: 'vMax',
        label: 'Maximum Velocity (V_max)',
        symbol: 'V_max',
        unit: 'µmol/min',
        min: 10,
        max: 200,
        step: 5,
        defaultValue: 100,
        description: 'Asymptotic enzyme turnover rate when fully saturated (10 to 200 µmol/min).',
      },
      {
        key: 'km',
        label: 'Michaelis Constant (K_m)',
        symbol: 'K_m',
        unit: 'mM',
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 10,
        description: 'Substrate concentration at half-maximal velocity (1 to 50 mM).',
      },
    ],
    assumptions: [
      'Steady-state enzyme-substrate complex [ES] concentration during initial velocity measurement.',
      'Substrate concentration [S] >> total enzyme concentration [E]₀.',
      'No competitive/non-competitive inhibitors or substrate inhibition.',
    ],
    limitations: [
      'Allosteric enzymes follow sigmoidal Hill kinetics rather than simple hyperbolic curves.',
      'High substrate levels may exhibit substrate inhibition in vivo.',
    ],
    validityRange: '0 ≤ [S] ≤ 100 mM, 1 ≤ K_m ≤ 50 mM, initial linear phase (< 10% substrate consumed)',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe biochemical mathematical simulation.',
    references: [
      {
        title: 'Enzyme Kinetics — Briggs–Haldane & Michaelis–Menten Formalism',
        source: 'IUBMB Biochemical Nomenclature',
        url: 'https://iubmb.qmul.ac.uk/',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Substrate Concentration [S] (mM).',
      yAxisMeaning: 'Initial Velocity v₀ (µmol/min).',
      relationship: 'Rectangular hyperbola saturating asymptotically at V_max.',
      trend: 'First-order slope near [S] = 0 transitions to zero-order plateau as [S] >> K_m.',
      slopeMeaning: 'Initial slope dv₀/d[S] ≈ V_max / K_m measures catalytic efficiency.',
      conclusion: 'At [S] = K_m, velocity is strictly 0.5 · V_max.',
      limitations: 'Idealized steady state with fixed temperature and pH.',
    },
    predictionPrompt: 'If V_max = 100 µmol/min and K_m = 10 mM, what is velocity v₀ when [S] = 10 mM?',
    predictionOptions: [
      { id: 'mm-1', label: '25 µmol/min', valueHint: 25 },
      { id: 'mm-2', label: '50 µmol/min', valueHint: 50 },
      { id: 'mm-3', label: '100 µmol/min', valueHint: 100 },
    ],
    predictionExpectedHint: 'v₀ = (100 × 10) / (10 + 10) = 1000 / 20 = 50 µmol/min.',
    calculate: (params) => {
      const s = Math.min(100, Math.max(0, params.substrate ?? 20));
      const vMax = Math.min(200, Math.max(10, params.vMax ?? 100));
      const km = Math.min(50, Math.max(1, params.km ?? 10));
      const v0 = roundTo((vMax * s) / (km + s), 2);
      const satPct = roundTo((s / (km + s)) * 100, 1);

      const curvePoints: GraphPoint[] = [];
      for (let x = 0; x <= 100; x += 5) {
        curvePoints.push({ x, y: roundTo((vMax * x) / (km + x), 2) });
      }

      return {
        primaryValue: v0,
        primaryLabel: 'Initial Velocity v₀',
        primarySymbol: 'v₀',
        primaryUnit: 'µmol/min',
        secondaryMetrics: [
          { label: 'Active Site Saturation', symbol: 'θ', value: satPct, unit: '%' },
          { label: 'Catalytic Ratio (V_max/K_m)', symbol: 'k', value: roundTo(vMax / km, 2), unit: 'µmol/(min·mM)' },
        ],
        calculationSteps: [
          `1. Given V_max = ${vMax} µmol/min, K_m = ${km} mM, [S] = ${s} mM.`,
          `2. Compute v₀ = (${vMax} × ${s}) / (${km} + ${s}) = ${roundTo(vMax * s, 2)} / ${km + s} = ${v0} µmol/min.`,
          `3. Fractional enzyme saturation: ${satPct}% of active sites occupied.`,
        ],
        curvePoints,
        xAxisLabel: 'Substrate [S]',
        xAxisUnit: 'mM',
        yAxisLabel: 'Velocity v₀',
        yAxisUnit: 'µmol/min',
        validityNote: 'Briggs–Haldane steady-state regime without competitive inhibition.',
      };
    },
  },
  {
    id: 'beer-lambert',
    number: 13,
    title: 'UV-Vis Spectrophotometry (Beer–Lambert Law)',
    shortTitle: 'Beer–Lambert UV-Vis',
    subject: 'Analytical Chemistry & Molecular Biology',
    principle: 'Monochromatic optical absorbance scales linearly with molar absorptivity ε, path length l, and solute concentration c: A = ε · l · c, while transmittance decays exponentially T = 10^(−A).',
    explanation:
      'Benchtop spectrophotometers quantify DNA, proteins, or coloured metal ions by measuring light attenuated through a 1 cm cuvette relative to a solvent blank.',
    learningObjective:
      'Connect molar concentration and optical absorbance, understand Beer–Lambert linear calibration ranges, and convert Absorbance to % Transmittance.',
    hypothesis: 'Doubling chromophore concentration doubles Absorbance A while reducing % Transmittance logarithmically.',
    independentVariable: 'Sample Concentration (c) in mmol/L (mM)',
    dependentVariable: 'Optical Absorbance (A)',
    controlledVariables: ['Cuvette path length l = 1.00 cm', 'Monochromatic wavelength λ', 'Molar absorptivity ε (L/(mmol·cm))'],
    formula: 'A = ε · l · c  |  %T = 100 · 10^(−A)',
    formulaDescription: 'Beer–Lambert optical attenuation law for dilute homogeneous solutions.',
    unitsSummary: 'A: AU (dimensionless) · c: mM · l: cm · %T: %',
    parameters: [
      {
        key: 'concentration',
        label: 'Solute Concentration (c)',
        symbol: 'c',
        unit: 'mM',
        min: 0,
        max: 2.0,
        step: 0.05,
        defaultValue: 0.5,
        description: 'Analyte molar concentration in mM (0 to 2.0 mM).',
      },
      {
        key: 'epsilon',
        label: 'Molar Absorptivity (ε)',
        symbol: 'ε',
        unit: 'mM⁻¹·cm⁻¹',
        min: 0.1,
        max: 2.0,
        step: 0.1,
        defaultValue: 1.0,
        description: 'Extinction coefficient per mM per cm (0.1 to 2.0).',
      },
      {
        key: 'pathLength',
        label: 'Cuvette Path Length (l)',
        symbol: 'l',
        unit: 'cm',
        min: 0.5,
        max: 2.0,
        step: 0.5,
        defaultValue: 1.0,
        description: 'Optical cuvette thickness (standard 1.0 cm).',
      },
    ],
    assumptions: [
      'Strictly monochromatic collimated beam with zero stray light.',
      'Dilute solution with non-interacting chromophore molecules (linearity limit A ≤ ~1.5).',
      'Solvent blank subtracted prior to measurement.',
    ],
    limitations: [
      'Above A > 1.5–2.0 AU, stray light and aggregation cause negative curvature.',
      'Light-scattering turbid microbial suspensions deviate from true Beer–Lambert absorption.',
    ],
    validityRange: '0 ≤ c ≤ 2.0 mM (highest photometric precision within 0.1 ≤ A ≤ 1.2 AU)',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe optical spectrophotometry simulation.',
    references: [
      {
        title: 'NIST / IUPAC Molecular Absorption Spectrometry Guidelines',
        source: 'IUPAC Compendium of Analytical Nomenclature',
        url: 'https://goldbook.iupac.org/',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Analyte Concentration c (mM).',
      yAxisMeaning: 'Absorbance A (AU).',
      relationship: 'Direct linear proportionality through the origin.',
      trend: 'Absorbance rises linearly with slope ε · l.',
      slopeMeaning: 'The slope dA/dc equals ε · l (calibration sensitivity factor).',
      conclusion: 'Unknown concentration c is solved directly as A / (ε · l) inside the linear instrumental window.',
      limitations: 'Chemical association or high stray light bends calibration curves above A ≈ 1.5.',
    },
    predictionPrompt: 'If ε = 1.0 mM⁻¹·cm⁻¹, l = 1.0 cm, and c = 1.0 mM, what is Absorbance A and % Transmittance?',
    predictionOptions: [
      { id: 'bl-1', label: 'A = 1.0 AU, %T = 10%', valueHint: 1.0 },
      { id: 'bl-2', label: 'A = 0.5 AU, %T = 50%', valueHint: 0.5 },
      { id: 'bl-3', label: 'A = 2.0 AU, %T = 1%', valueHint: 2.0 },
    ],
    predictionExpectedHint: 'A = 1.0 × 1.0 × 1.0 = 1.0 AU, and %T = 100 × 10⁻¹ = 10.0%.',
    calculate: (params) => {
      const c = Math.min(2.0, Math.max(0, params.concentration ?? 0.5));
      const eps = Math.min(2.0, Math.max(0.1, params.epsilon ?? 1.0));
      const l = Math.min(2.0, Math.max(0.5, params.pathLength ?? 1.0));
      const abs = roundTo(eps * l * c, 3);
      const transPct = roundTo(100 * Math.pow(10, -abs), 2);

      const curvePoints: GraphPoint[] = [];
      for (let x = 0; x <= 2.01; x += 0.2) {
        const cx = roundTo(x, 2);
        curvePoints.push({ x: cx, y: roundTo(eps * l * cx, 3) });
      }

      return {
        primaryValue: abs,
        primaryLabel: 'Optical Absorbance (A)',
        primarySymbol: 'A',
        primaryUnit: 'AU',
        secondaryMetrics: [
          { label: 'Transmittance (%T)', symbol: '%T', value: transPct, unit: '%' },
          { label: 'Linear Regime Status (≤ 1.5 AU)', symbol: 'A/1.5', value: roundTo(abs / 1.5, 2), unit: 'fraction' },
        ],
        calculationSteps: [
          `1. Beer–Lambert inputs: ε = ${eps} mM⁻¹cm⁻¹, l = ${l} cm, c = ${c} mM.`,
          `2. Absorbance: A = ${eps} × ${l} × ${c} = ${abs} AU.`,
          `3. Transmittance: %T = 100 × 10^(−${abs}) = ${transPct}%.`,
        ],
        curvePoints,
        xAxisLabel: 'Concentration c',
        xAxisUnit: 'mM',
        yAxisLabel: 'Absorbance A',
        yAxisUnit: 'AU',
        validityNote: abs > 1.5 ? 'Warning: A > 1.5 AU approaches real spectrophotometer non-linear stray-light limits.' : 'Within optimal linear spectrophotometric regime.',
      };
    },
  },
  {
    id: 'bacterial-growth',
    number: 14,
    title: 'Microbial Growth Curve (Logistic Model)',
    shortTitle: 'Microbial Growth',
    subject: 'Microbiology & Population Biology',
    principle: 'In finite culture media, a microbial population starts with exponential growth rate r and slows smoothly toward carrying capacity K: N(t) = K / (1 + ((K − N₀)/N₀)e^(−rt)).',
    explanation:
      'Batch microbiology cultures pass from exponential division (doubling time g = ln(2)/r) into nutrient-limited stationary equilibrium at carrying capacity K.',
    learningObjective:
      'Analyze exponential doubling vs carrying-capacity saturation in non-pathogenic model cultures cleanly and safely.',
    hypothesis: 'Growth rate dp/dt peaks when population reaches exactly half of carrying capacity (N = K/2).',
    independentVariable: 'Incubation Time (t) in hours',
    dependentVariable: 'Cell Density N(t) in ×10⁶ CFU/mL',
    controlledVariables: ['Initial inoculum N₀ = 1 ×10⁶ CFU/mL', 'Constant broth volume & 37 °C agitation', 'Carrying capacity K'],
    formula: 'N(t) = K / [1 + ((K − N₀)/N₀)·e^(−r·t)]',
    formulaDescription: 'Verhulst continuous logistic growth curve for closed batch microbial broth.',
    unitsSummary: 'Time: h · Density N(t): ×10⁶ CFU/mL · Rate r: h⁻¹',
    parameters: [
      {
        key: 'timeHours',
        label: 'Incubation Time (t)',
        symbol: 't',
        unit: 'h',
        min: 0,
        max: 24,
        step: 0.5,
        defaultValue: 6,
        description: 'Elapsed incubation time in hours (0 to 24 h).',
      },
      {
        key: 'growthRate',
        label: 'Intrinsic Growth Rate (r)',
        symbol: 'r',
        unit: 'h⁻¹',
        min: 0.1,
        max: 1.5,
        step: 0.05,
        defaultValue: 0.6,
        description: 'Specific exponential growth constant (0.1 to 1.5 h⁻¹).',
      },
      {
        key: 'carryingK',
        label: 'Carrying Capacity (K)',
        symbol: 'K',
        unit: '×10⁶ CFU/mL',
        min: 20,
        max: 200,
        step: 10,
        defaultValue: 100,
        description: 'Nutrient-limited stationary density (20 to 200 ×10⁶ CFU/mL).',
      },
    ],
    assumptions: [
      'Closed nutrient-limited batch flask (no death phase or toxic metabolite accumulation modelled past saturation).',
      'Lag phase duration omitted (t = 0 starts in active log growth).',
      'Strictly educational population model; zero biological hazards simulated.',
    ],
    limitations: [
      'Real batch cultures include a lag phase before division and a death/decline phase after stationary depletion.',
      'Diauxic growth on mixed sugars creates two-step curves not captured by single-resource logistic equations.',
    ],
    validityRange: '0 ≤ t ≤ 24 h, 0.1 ≤ r ≤ 1.5 h⁻¹, N₀ = 1.0 ×10⁶ CFU/mL',
    safetyLevel: 'AMBER',
    safetyNote: 'Conceptual educational biosafety population model only; real culturing requires sterile autoclaving and Class II supervision.',
    references: [
      {
        title: 'Microbial Population Dynamics — Logistic & Monod Kinetics',
        source: 'ASM Education Reference',
        url: 'https://asm.org/',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Incubation Time t (hours).',
      yAxisMeaning: 'Cell Density N(t) (×10⁶ CFU/mL).',
      relationship: 'Sigmoidal S-curve rising exponentially then asymptoting to K.',
      trend: 'Inflection point of maximum division speed occurs at N = K/2.',
      slopeMeaning: 'Slope dN/dt = r·N·(1 − N/K) vanishes as N approaches K.',
      conclusion: 'Higher growth rate r shortens doubling time g = ln(2)/r, reaching stationary phase sooner.',
      limitations: 'Omits initial lag phase and long-term cell lysis.',
    },
    predictionPrompt: 'With intrinsic growth rate r = 0.693 h⁻¹, roughly what is the early exponential doubling time g = ln(2)/r?',
    predictionOptions: [
      { id: 'bg-1', label: '0.5 hours', valueHint: 0.5 },
      { id: 'bg-2', label: '1.0 hour', valueHint: 1.0 },
      { id: 'bg-3', label: '3.0 hours', valueHint: 3.0 },
    ],
    predictionExpectedHint: 'g = ln(2) / r ≈ 0.693 / 0.693 = 1.00 hour.',
    calculate: (params) => {
      const tH = Math.min(24, Math.max(0, params.timeHours ?? 6));
      const r = Math.min(1.5, Math.max(0.1, params.growthRate ?? 0.6));
      const K = Math.min(200, Math.max(20, params.carryingK ?? 100));
      const N0 = 1.0;

      const evalN = (tVal: number) =>
        roundTo(K / (1 + ((K - N0) / N0) * Math.exp(-r * tVal)), 2);

      const currentN = evalN(tH);
      const doublingH = roundTo(Math.log(2) / r, 2);

      const curvePoints: GraphPoint[] = [];
      for (let t = 0; t <= 24; t += 1.5) {
        curvePoints.push({ x: t, y: evalN(t) });
      }

      return {
        primaryValue: currentN,
        primaryLabel: 'Cell Density N(t)',
        primarySymbol: 'N',
        primaryUnit: '×10⁶ CFU/mL',
        secondaryMetrics: [
          { label: 'Exponential Doubling Time', symbol: 'g', value: doublingH, unit: 'hours' },
          { label: 'Capacity Reached', symbol: 'N/K', value: roundTo((currentN / K) * 100, 1), unit: '%' },
        ],
        calculationSteps: [
          `1. Initial N₀ = ${N0}×10⁶ CFU/mL, r = ${r} h⁻¹, K = ${K}×10⁶ CFU/mL.`,
          `2. Early doubling time g = ln(2)/r = ${doublingH} h.`,
          `3. At t = ${tH} h: N(t) = ${currentN}×10⁶ CFU/mL (${roundTo((currentN / K) * 100, 1)}% of carrying capacity).`,
        ],
        curvePoints,
        xAxisLabel: 'Incubation Time',
        xAxisUnit: 'h',
        yAxisLabel: 'Population Density',
        yAxisUnit: '×10⁶ CFU/mL',
        validityNote: 'Continuous closed-batch logistic growth excluding lag and decline phases.',
      };
    },
  },
  {
    id: 'rc-circuit-decay',
    number: 15,
    title: 'RC Circuit Capacitor Discharge & Time Constant',
    shortTitle: 'RC Time Constant',
    subject: 'Electronics & Physics',
    principle: 'A charged capacitor discharges through a series resistor exponentially according to V(t) = V₀ · exp(−t / (R·C)), where τ = R·C is the characteristic RC time constant.',
    explanation:
      'In every RC timing circuit or low-pass filter, capacitor voltage drops to 36.79% (1/e) of its initial value after one time constant τ = R·C seconds.',
    learningObjective:
      'Compute RC time constant τ = R·C, inspect exponential capacitor voltage decay, and connect resistor/capacitor sizing to circuit timing.',
    hypothesis: 'Doubling resistance R or capacitance C doubles the time constant τ and slows discharge proportionately.',
    independentVariable: 'Elapsed Discharge Time (t) in ms',
    dependentVariable: 'Capacitor Voltage V(t) in Volts',
    controlledVariables: ['Ideal zero-leakage capacitor', 'Constant temperature metal-film resistor', 'Initial voltage V₀ = 10 V'],
    formula: 'V(t) = V₀ · exp(−t / (R·C))  |  τ = R·C',
    formulaDescription: 'First-order series RC transient discharge law.',
    unitsSummary: 'Voltage: V · Resistance: kΩ · Capacitance: µF · Time: ms',
    parameters: [
      {
        key: 'timeMs',
        label: 'Elapsed Time (t)',
        symbol: 't',
        unit: 'ms',
        min: 0,
        max: 250,
        step: 5,
        defaultValue: 50,
        description: 'Time elapsed after switch moves to discharge loop (0 to 250 ms).',
      },
      {
        key: 'resistanceKohm',
        label: 'Series Resistance (R)',
        symbol: 'R',
        unit: 'kΩ',
        min: 1,
        max: 100,
        step: 1,
        defaultValue: 10,
        description: 'Discharge resistor in kilo-ohms (1 to 100 kΩ).',
      },
      {
        key: 'capacitanceUf',
        label: 'Capacitance (C)',
        symbol: 'C',
        unit: 'µF',
        min: 1,
        max: 20,
        step: 0.5,
        defaultValue: 5,
        description: 'Capacitor value in microfarads (1 to 20 µF).',
      },
    ],
    assumptions: [
      'Ideal capacitor with zero dielectric leakage and zero equivalent series resistance (ESR).',
      'Initial capacitor voltage fixed safely at V₀ = 10.0 V DC.',
      'High-impedance oscilloscope probe (10 MΩ) draws negligible measurement current.',
    ],
    limitations: [
      'Electrolytic capacitors exhibit ±20% real manufacturing tolerance and slow dielectric absorption.',
      'Higher frequencies introduce parasitic wire inductance not included in ideal RC models.',
    ],
    validityRange: '0 ≤ t ≤ 250 ms, 1 ≤ R ≤ 100 kΩ, 1 ≤ C ≤ 20 µF, low-voltage 10 V DC safe loop',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe low-voltage (10 V DC) capacitor transient simulation.',
    references: [
      {
        title: 'All About Circuits / MIT OCW — RC Time Constant & First-Order Transients',
        source: 'MIT OpenCourseWare 6.002',
        url: 'https://ocw.mit.edu/',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Elapsed Time t (ms).',
      yAxisMeaning: 'Capacitor Voltage V(t) (V).',
      relationship: 'Exponential decay from 10.0 V toward 0 V governed by τ = R·C.',
      trend: 'At t = τ, V(τ) = 3.68 V; by t = 5τ, > 99.3% of stored charge has discharged.',
      slopeMeaning: 'Initial tangent line at t = 0 intersects the zero-voltage axis at exactly t = τ.',
      conclusion: 'Time constant τ = R(kΩ)·C(µF) directly gives characteristic timing in milliseconds.',
      limitations: 'Idealized lumped passive component model.',
    },
    predictionPrompt: 'If R = 10 kΩ and C = 5 µF (τ = 50 ms), what fraction of V₀ = 10.0 V remains at t = 50 ms?',
    predictionOptions: [
      { id: 'rc-1', label: '5.00 V (50%)', valueHint: 5.0 },
      { id: 'rc-2', label: '3.68 V (36.8%)', valueHint: 3.68 },
      { id: 'rc-3', label: '0.00 V (fully discharged)', valueHint: 0.0 },
    ],
    predictionExpectedHint: 'τ = 10 kΩ × 5 µF = 50 ms. At t = τ, V = 10 · exp(−1) ≈ 3.68 V.',
    calculate: (params) => {
      const tMs = Math.min(250, Math.max(0, params.timeMs ?? 50));
      const rKohm = Math.min(100, Math.max(1, params.resistanceKohm ?? 10));
      const cUf = Math.min(20, Math.max(1, params.capacitanceUf ?? 5));
      const v0 = 10.0;
      const tauMs = roundTo(rKohm * cUf, 2); // kΩ * µF = ms directly
      const voltage = roundTo(v0 * Math.exp(-tMs / tauMs), 3);
      const energyUj = roundTo(0.5 * cUf * voltage * voltage, 2);

      const curvePoints: GraphPoint[] = [];
      for (let t = 0; t <= 250; t += 10) {
        curvePoints.push({ x: t, y: roundTo(v0 * Math.exp(-t / tauMs), 3) });
      }

      return {
        primaryValue: voltage,
        primaryLabel: 'Capacitor Voltage V(t)',
        primarySymbol: 'V(t)',
        primaryUnit: 'V',
        secondaryMetrics: [
          { label: 'Time Constant (τ = R·C)', symbol: 'τ', value: tauMs, unit: 'ms' },
          { label: 'Remaining Stored Energy', symbol: 'E', value: energyUj, unit: 'µJ' },
        ],
        calculationSteps: [
          `1. Time Constant τ = ${rKohm} kΩ × ${cUf} µF = ${tauMs} ms.`,
          `2. Decay exponent: −t / τ = −${tMs} / ${tauMs} = ${roundTo(-tMs / tauMs, 4)}.`,
          `3. V(${tMs} ms) = 10.0 × exp(${roundTo(-tMs / tauMs, 4)}) = ${voltage} V.`,
        ],
        curvePoints,
        xAxisLabel: 'Elapsed Time',
        xAxisUnit: 'ms',
        yAxisLabel: 'Capacitor Voltage',
        yAxisUnit: 'V',
        validityNote: 'Ideal first-order series RC discharge from 10.0 V initial charge.',
      };
    },
  },
  {
    id: 'thin-lens-optics',
    number: 16,
    title: 'Convex Lens Formula & Magnification',
    shortTitle: 'Thin Lens Optics',
    subject: 'Physics & Optics',
    principle: 'For a thin converging lens of focal length f and object distance u < 0 (real object in New Cartesian sign convention), the real/virtual image forms at v given by 1/f = 1/v − 1/u, with linear magnification m = v / u.',
    explanation:
      'Moving a lit object closer to a convex lens pushes the focused screen image farther back and magnifies it until u = −f, where emerging rays become parallel.',
    learningObjective:
      'Verify the Gaussian Thin Lens Equation 1/f = 1/v − 1/u, determine image distance v, and interpret inverted vs erect magnification.',
    hypothesis: 'When object distance |u| = 2f, a sharp real inverted image of equal size (|m| = 1.00) forms at v = +2f.',
    independentVariable: 'Object Distance Magnitude |u| (cm)',
    dependentVariable: 'Image Distance v (cm)',
    controlledVariables: ['Thin biconvex crown glass lens', 'Paraxial rays close to principal axis', 'Focal length f'],
    formula: '1/f = 1/v − 1/u  |  m = v / u',
    formulaDescription: 'Gaussian thin-lens refraction equation using NCERT/ISO New Cartesian sign convention (u < 0).',
    unitsSummary: 'Distances f, |u|, v: cm · Magnification m: dimensionless',
    parameters: [
      {
        key: 'objectDistCm',
        label: 'Object Distance |u|',
        symbol: '|u|',
        unit: 'cm',
        min: 18,
        max: 100,
        step: 1,
        defaultValue: 30,
        description: 'Distance from lit object to optical center (kept beyond focal length f = 15 cm for real image formation).',
      },
      {
        key: 'focalCm',
        label: 'Lens Focal Length (f)',
        symbol: 'f',
        unit: 'cm',
        min: 5,
        max: 17,
        step: 1,
        defaultValue: 15,
        description: 'Converging lens focal length in cm (5 to 17 cm).',
      },
    ],
    assumptions: [
      'Thin lens thickness negligible compared to f, u, v.',
      'Monochromatic paraxial approximation avoiding spherical and chromatic aberration.',
      'Real-image regime (|u| > f) so image can be caught cleanly on a viewing screen.',
    ],
    limitations: [
      'Thick lenses or wide-aperture beams exhibit spherical aberration and blurred focal planes.',
      'When |u| ≤ f, real screen focus disappears (rays diverge into a virtual upright image).',
    ],
    validityRange: '18 ≤ |u| ≤ 100 cm, 5 ≤ f ≤ 17 cm (guaranteed |u| > f real-image screen focus)',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe optical bench visible ray lamp simulation.',
    references: [
      {
        title: 'OpenStax University Physics — Thin Lenses & Ray Optics',
        source: 'OpenStax Physics Vol. 3',
        url: 'https://openstax.org/books/university-physics-volume-3/pages/2-4-thin-lenses',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Object Distance |u| (cm).',
      yAxisMeaning: 'Real Image Distance v (cm).',
      relationship: 'Hyperbolic reciprocity: v rises steeply as |u| approaches focal length f.',
      trend: 'At |u| = 2f, v = 2f; as |u| → ∞, v → f.',
      slopeMeaning: 'Steep gradient near |u| → f explains why close macro focusing requires large lens travel.',
      conclusion: 'Measured values verify 1/f = 1/v + 1/|u| consistently across all paraxial positions.',
      limitations: 'Paraxial thin-lens domain (|u| > f) only.',
    },
    predictionPrompt: 'With focal length f = 15 cm and object placed at |u| = 30 cm (= 2f), where does the sharp real image form?',
    predictionOptions: [
      { id: 'tl-1', label: 'v = 15 cm', valueHint: 15 },
      { id: 'tl-2', label: 'v = 30 cm (m = −1)', valueHint: 30 },
      { id: 'tl-3', label: 'v = 60 cm', valueHint: 60 },
    ],
    predictionExpectedHint: '1/v = 1/f − 1/|u| = 1/15 − 1/30 = 1/30 → v = +30.0 cm, inverted with m = −1.00.',
    calculate: (params) => {
      const f = Math.min(17, Math.max(5, params.focalCm ?? 15));
      const uMag = Math.min(100, Math.max(f + 1, params.objectDistCm ?? 30));
      const v = roundTo((f * uMag) / (uMag - f), 2);
      const mag = roundTo(-v / uMag, 3);
      const powerDiopters = roundTo(100 / f, 2);

      const curvePoints: GraphPoint[] = [];
      for (let dist = Math.max(18, f + 2); dist <= 100; dist += 4) {
        curvePoints.push({ x: dist, y: roundTo((f * dist) / (dist - f), 2) });
      }

      return {
        primaryValue: v,
        primaryLabel: 'Image Distance (v)',
        primarySymbol: 'v',
        primaryUnit: 'cm',
        secondaryMetrics: [
          { label: 'Magnification (m = v/u)', symbol: 'm', value: mag, unit: '×' },
          { label: 'Lens Optical Power', symbol: 'P', value: powerDiopters, unit: 'D' },
        ],
        calculationSteps: [
          `1. New Cartesian inputs: f = +${f} cm, u = −${uMag} cm.`,
          `2. 1/v = 1/${f} + 1/(−${uMag}) = 1/${f} − 1/${uMag}.`,
          `3. v = (${f} × ${uMag}) / (${uMag} − ${f}) = +${v} cm (Real, Inverted; m = ${mag}×).`,
        ],
        curvePoints,
        xAxisLabel: 'Object Distance |u|',
        xAxisUnit: 'cm',
        yAxisLabel: 'Image Distance v',
        yAxisUnit: 'cm',
        validityNote: 'Paraxial thin-lens real-image focus (|u| > f).',
      };
    },
  },
  {
    id: 'half-life-decay',
    number: 17,
    title: 'Exponential Radioactive & First-Order Half-Life',
    shortTitle: 'Half-Life Decay',
    subject: 'Physics & Nuclear Chemistry',
    principle: 'A first-order decaying isotope population decreases by exactly 50% every half-life t½: N(t) = N₀ · (1/2)^(t / t½), equivalent to N₀ · exp(−λt) with λ = ln(2)/t½.',
    explanation:
      'Whether modeling medical radiotracers (like Tc-99m) or first-order chemical kinetics, half-life remains completely independent of initial sample quantity N₀.',
    learningObjective:
      'Relate half-life t½, decay constant λ, elapsed time t, and remaining fraction N(t)/N₀ across multiple half-lives.',
    hypothesis: 'After 3 half-lives (t = 3·t½), exactly 1/8 (12.5%) of the initial population remains undecayed.',
    independentVariable: 'Elapsed Time (t) in hours',
    dependentVariable: 'Remaining Nuclei / Activity N(t) (%)',
    controlledVariables: ['Pure single-isotope first-order sample', 'No external replenishment', 'Initial quantity N₀ = 100%'],
    formula: 'N(t) = N₀ · (1/2)^(t / t½)  |  λ = ln(2) / t½',
    formulaDescription: 'Exact first-order exponential half-life law.',
    unitsSummary: 'Time t, t½: h · Remaining N(t): % · Constant λ: h⁻¹',
    parameters: [
      {
        key: 'timeHours',
        label: 'Elapsed Time (t)',
        symbol: 't',
        unit: 'h',
        min: 0,
        max: 48,
        step: 1,
        defaultValue: 12,
        description: 'Observation duration in hours (0 to 48 h).',
      },
      {
        key: 'halfLifeHours',
        label: 'Half-Life (t½)',
        symbol: 't½',
        unit: 'h',
        min: 1,
        max: 24,
        step: 0.5,
        defaultValue: 6,
        description: 'Characteristic half-life (e.g., 6.0 h for Tc-99m diagnostic tracer).',
      },
    ],
    assumptions: [
      'Macroscopic sample large enough for deterministic continuous exponential statistics (neglecting Poisson single-count shot noise).',
      'Single isolated parent decay step without daughter activity overlap.',
      'Purely mathematical/computational educational simulation.',
    ],
    limitations: [
      'Very small atom counts (< 100) follow discrete stochastic Poisson fluctuations rather than smooth curves.',
      'Multi-step decay chains require Bateman coupled differential equations.',
    ],
    validityRange: '0 ≤ t ≤ 48 h, 1 ≤ t½ ≤ 24 h, N₀ = 100%',
    safetyLevel: 'GREEN',
    safetyNote: 'Purely mathematical radiotracer & first-order decay simulation; zero physical hazards.',
    references: [
      {
        title: 'NIST / IAEA Radionuclide Half-Life Data & First-Order Kinetics',
        source: 'NIST Physics Reference',
        url: 'https://www.nist.gov/pml',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Elapsed Time t (hours).',
      yAxisMeaning: 'Remaining Percentage N(t) (%).',
      relationship: 'Exponential halving curve dropping 100% → 50% → 25% → 12.5% per t½ step.',
      trend: 'Never strictly hits zero in finite time, approaching zero asymptotically.',
      slopeMeaning: 'Instantaneous decay activity A = |dN/dt| = λ·N(t) is proportional to remaining sample.',
      conclusion: 'Elapsed half-lives n = t / t½ yields remaining fraction (0.5)ⁿ directly.',
      limitations: 'Continuous macroscopic approximation for single-species decay.',
    },
    predictionPrompt: 'For a tracer with t½ = 6.0 hours, what percentage remains after 18.0 hours (3 half-lives)?',
    predictionOptions: [
      { id: 'hl-1', label: '25.0%', valueHint: 25.0 },
      { id: 'hl-2', label: '12.5%', valueHint: 12.5 },
      { id: 'hl-3', label: '0.0%', valueHint: 0.0 },
    ],
    predictionExpectedHint: 'n = 18 / 6 = 3 half-lives → 100% × (1/2)³ = 12.50%.',
    calculate: (params) => {
      const tH = Math.min(48, Math.max(0, params.timeHours ?? 12));
      const tHalf = Math.min(24, Math.max(1, params.halfLifeHours ?? 6));
      const nHalfLives = roundTo(tH / tHalf, 3);
      const lambda = roundTo(Math.LN2 / tHalf, 4);
      const remainingPct = roundTo(100 * Math.pow(0.5, tH / tHalf), 2);

      const curvePoints: GraphPoint[] = [];
      for (let t = 0; t <= 48; t += 2) {
        curvePoints.push({ x: t, y: roundTo(100 * Math.pow(0.5, t / tHalf), 2) });
      }

      return {
        primaryValue: remainingPct,
        primaryLabel: 'Remaining Fraction N(t)',
        primarySymbol: 'N(t)',
        primaryUnit: '%',
        secondaryMetrics: [
          { label: 'Decay Constant (λ = ln2/t½)', symbol: 'λ', value: lambda, unit: 'h⁻¹' },
          { label: 'Elapsed Half-Lives', symbol: 'n', value: nHalfLives, unit: 't½' },
        ],
        calculationSteps: [
          `1. Half-lives elapsed: n = ${tH} h / ${tHalf} h = ${nHalfLives}.`,
          `2. Decay constant λ = 0.6931 / ${tHalf} = ${lambda} h⁻¹.`,
          `3. Remaining N(${tH} h) = 100% × (0.5)^(${nHalfLives}) = ${remainingPct}%.`,
        ],
        curvePoints,
        xAxisLabel: 'Elapsed Time',
        xAxisUnit: 'h',
        yAxisLabel: 'Remaining Sample',
        yAxisUnit: '%',
        validityNote: 'Macroscopic continuous first-order exponential decay model.',
      };
    },
  },
  {
    id: 'plant-growth-model',
    number: 18,
    title: 'Plant Growth: Light, Water, CO₂ & Temperature Limiting Factors',
    shortTitle: 'Plant Growth Factors',
    subject: 'Biology & Environmental Science',
    principle:
      'Plant biomass accumulation rate responds multiplicatively to light intensity (I), soil water availability (W), ambient CO₂, and enzymatic temperature balance (Bell curve around 25 °C). Whichever resource is scarcest acts as the Liebig limiting factor.',
    explanation:
      'Plants require photons for energy, water for turgor and electron transport, CO₂ for carbon fixation, and moderate warmth for enzyme activity. Raising light cannot accelerate growth if water is severely depleted or leaves overheat above 40 °C.',
    learningObjective:
      'Test multi-factor plant growth responses and identify which environmental parameter is limiting biomass accumulation.',
    hypothesis:
      'Increasing light or water raises growth rate only until another factor (water, CO₂, or heat stress) becomes limiting.',
    independentVariable: 'Light Intensity (PAR) in µmol/m²/s & Water Supply (%)',
    dependentVariable: 'Modelled Shoot Growth Rate (cm/week)',
    controlledVariables: ['Nutrient-sufficient potting substrate', 'Young vegetative herbaceous seedling', 'Disease-free chamber'],
    formula: 'G = G_max · [I/(K_I + I)] · [W/(K_W + W)] · [C/(K_C + C)] · f(T)',
    formulaDescription:
      'Multiplicative saturation & Gaussian thermal enzyme envelope model (Liebig / Michaelis plant growth formulation).',
    unitsSummary: 'Light: µmol/m²/s · Water: % field capacity · CO₂: ppm · Temp: °C · Growth: cm/week',
    parameters: [
      {
        key: 'lightIntensity',
        label: 'Light Intensity (PAR)',
        symbol: 'I',
        unit: 'µmol/m²/s',
        min: 0,
        max: 1200,
        step: 50,
        defaultValue: 500,
        description: 'Photosynthetically active photon flux reaching the leaves (0 to 1200 µmol/m²/s).',
      },
      {
        key: 'waterSupply',
        label: 'Soil Water Availability',
        symbol: 'W',
        unit: '%',
        min: 5,
        max: 100,
        step: 5,
        defaultValue: 70,
        description: 'Available soil moisture as % of field capacity (5% drought to 100% well-watered).',
      },
      {
        key: 'co2Ppm',
        label: 'Ambient CO₂ Concentration',
        symbol: 'C',
        unit: 'ppm',
        min: 150,
        max: 1000,
        step: 25,
        defaultValue: 420,
        description: 'Atmospheric or chamber CO₂ concentration (default ambient ~420 ppm).',
      },
      {
        key: 'temperatureC',
        label: 'Chamber Temperature',
        symbol: 'T',
        unit: '°C',
        min: 5,
        max: 45,
        step: 1,
        defaultValue: 25,
        description: 'Growth chamber temperature (optimal enzymatic peak near 25 °C).',
      },
    ],
    assumptions: [
      'Macronutrients (N, P, K) and root aeration remain adequate and non-waterlogged.',
      'Gaussian enzyme temperature response centered at 25 °C with half-width 11 °C.',
      'Linear vegetative shoot extension phase prior to flowering.',
    ],
    limitations: [
      'Does not simulate root hypoxia from 100% flooding or species-specific C3 vs C4 CO₂ pathways.',
      'Long-term drought triggers stomatal closure hysteresis not modeled here.',
    ],
    validityRange: '0–1200 µmol/m²/s light · 5–100% soil moisture · 150–1000 ppm CO₂ · 5–45 °C',
    safetyLevel: 'GREEN',
    safetyNote: 'Safe botanical physiology growth model.',
    references: [
      {
        title: 'Taiz & Zeiger — Plant Physiology & Environmental Limiting Factors',
        source: 'Academic Plant Biology Reference',
        url: 'https://openstax.org/books/biology-2e/pages/30-1-the-plant-body',
      },
    ],
    graphInterpretation: {
      xAxisMeaning: 'Simulated Growth Weeks (Weeks 0–8).',
      yAxisMeaning: 'Cumulative Shoot Height (cm).',
      relationship: 'Linear weekly height gain under fixed environmental conditions.',
      trend: 'Steeper slope reflects higher combined resource suitability.',
      slopeMeaning: 'Slope dH/dt equals the modelled weekly growth rate G (cm/week).',
      conclusion: 'All four growth factors interact; removing a drought or cold bottleneck unlocks higher light response.',
      limitations: 'Constant-rate vegetative window only.',
    },
    predictionPrompt: 'If a seedling receives ample light (800 µmol/m²/s) and CO₂ (420 ppm) at 25 °C, what happens if soil water drops from 80% to 10%?',
    predictionOptions: [
      { id: 'pg-1', label: 'Growth increases slightly', valueHint: 5 },
      { id: 'pg-2', label: 'Growth drops sharply because water becomes limiting', valueHint: 1 },
      { id: 'pg-3', label: 'Growth stays identical because light is high', valueHint: 4 },
    ],
    predictionExpectedHint: 'Water stress closes stomata and halts turgor expansion, becoming the limiting factor.',
    calculate: (params) => {
      const I = Math.min(1200, Math.max(0, params.lightIntensity ?? 500));
      const W = Math.min(100, Math.max(5, params.waterSupply ?? 70));
      const C = Math.min(1000, Math.max(150, params.co2Ppm ?? 420));
      const T = Math.min(45, Math.max(5, params.temperatureC ?? 25));

      const gMax = 6.5; // max cm/week for vigorous seedling
      const fLight = I / (220 + I);
      const fWater = W / (25 + W);
      const fCo2 = (C - 50) / (250 + (C - 50));
      const fTemp = Math.exp(-Math.pow((T - 25) / 11, 2));

      const growthRate = roundTo(gMax * fLight * fWater * fCo2 * fTemp, 2);
      const heightAt8Weeks = roundTo(4.0 + growthRate * 8, 1);

      const factors = [
        { name: 'Light', score: fLight },
        { name: 'Water', score: fWater },
        { name: 'CO₂', score: fCo2 },
        { name: 'Temperature', score: fTemp },
      ];
      factors.sort((a, b) => a.score - b.score);
      const limitingPct = roundTo(factors[0].score * 100, 1);

      const curvePoints: GraphPoint[] = [];
      for (let wk = 0; wk <= 8; wk += 1) {
        curvePoints.push({ x: wk, y: roundTo(4.0 + growthRate * wk, 2) });
      }

      return {
        primaryValue: growthRate,
        primaryLabel: `Weekly Shoot Growth (${factors[0].name}-limited)`,
        primarySymbol: 'G',
        primaryUnit: 'cm/week',
        secondaryMetrics: [
          { label: 'Projected 8-Week Height', symbol: 'H₈', value: heightAt8Weeks, unit: 'cm' },
          { label: `Primary Bottleneck (${factors[0].name})`, symbol: 'f_min', value: limitingPct, unit: '% capacity' },
          { label: 'Thermal Enzyme Factor', symbol: 'f(T)', value: roundTo(fTemp * 100, 1), unit: '%' },
        ],
        calculationSteps: [
          `1. Resource factors: Light=${roundTo(fLight, 3)}, Water=${roundTo(fWater, 3)}, CO₂=${roundTo(fCo2, 3)}, Temp=${roundTo(fTemp, 3)}.`,
          `2. Scarcest (Liebig limiting) factor identified: ${factors[0].name} at ${limitingPct}% suitability.`,
          `3. Growth Rate G = 6.5 × ${roundTo(fLight, 3)} × ${roundTo(fWater, 3)} × ${roundTo(fCo2, 3)} × ${roundTo(fTemp, 3)} = ${growthRate} cm/week.`,
          `4. Projected height after 8 weeks from 4.0 cm sprout = ${heightAt8Weeks} cm.`,
        ],
        curvePoints,
        xAxisLabel: 'Growth Duration',
        xAxisUnit: 'weeks',
        yAxisLabel: 'Shoot Height',
        yAxisUnit: 'cm',
        validityNote: 'Multiplicative Liebig / Michaelis vegetative seedling model; excludes root flooding & flowering.',
      };
    },
  },
];

export function getExperimentById(id: string): ExperimentDefinition {
  return EXPERIMENTS.find((e) => e.id === id) ?? EXPERIMENTS[0];
}

export function getDefaultParams(exp: ExperimentDefinition): Record<string, number> {
  const out: Record<string, number> = {};
  for (const p of exp.parameters) {
    out[p.key] = p.defaultValue;
  }
  return out;
}

export function calculateCustomExperiment(
  def: CustomExperimentDefinition,
  xValue: number,
  scaleFactor = 1
): ExperimentCalculationResult {
  const firstParam = def.parameterRanges[0] ?? {
    name: 'Input Parameter',
    symbol: 'x',
    unit: 'units',
    min: 1,
    max: 100,
    defaultValue: 10,
  };
  const clampedX = Math.min(firstParam.max, Math.max(firstParam.min, xValue));

  const computeY = (x: number, template: CustomCalcTemplate): number => {
    switch (template) {
      case 'inverse_proportion':
        return roundTo((100 * scaleFactor) / Math.max(x, 0.001), 3);
      case 'quadratic_growth':
        return roundTo(0.1 * scaleFactor * x * x, 3);
      case 'exponential_decay':
        return roundTo(100 * scaleFactor * Math.exp(-0.05 * x), 3);
      case 'logarithmic_scale':
        return roundTo(scaleFactor * Math.log10(Math.max(x, 0.0001) + 1) * 10, 3);
      case 'linear_ratio':
      default:
        return roundTo(x * scaleFactor * 1.5, 3);
    }
  };

  const y = computeY(clampedX, def.calculationTemplate);
  const stepsCount = 12;
  const span = firstParam.max - firstParam.min || 10;
  const curvePoints: GraphPoint[] = [];
  for (let i = 0; i <= stepsCount; i++) {
    const px = roundTo(firstParam.min + (span * i) / stepsCount, 3);
    curvePoints.push({ x: px, y: computeY(px, def.calculationTemplate) });
  }

  return {
    primaryValue: y,
    primaryLabel: def.dependentVariable,
    primarySymbol: 'y',
    primaryUnit: def.units.split('·')[0]?.trim() || 'units',
    secondaryMetrics: [
      { label: 'Scale Factor', symbol: 'k', value: scaleFactor, unit: '×' },
    ],
    calculationSteps: [
      `1. Deterministic template: ${def.calculationTemplate.replace('_', ' ')}.`,
      `2. Input ${firstParam.symbol} = ${clampedX} ${firstParam.unit}.`,
      `3. Evaluated output = ${y}.`,
    ],
    curvePoints,
    xAxisLabel: firstParam.name,
    xAxisUnit: firstParam.unit,
    yAxisLabel: def.dependentVariable,
    yAxisUnit: def.units.split('·')[0]?.trim() || 'units',
    validityNote: `Deterministic template (${def.calculationTemplate}) bounded to [${firstParam.min}, ${firstParam.max}] ${firstParam.unit}.`,
  };
}
