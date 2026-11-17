import { EXPERIMENTS } from './experiments';
import { evaluateSafety } from './safetyEngine';
import type {
  CustomCalcTemplate,
  CustomExperimentDefinition,
  LabDepartmentId,
  VisualFallbackType,
} from '../types/science';

export interface LocalMatchResult {
  matchedExperimentId: string | null;
  department: LabDepartmentId;
  visualFallbackType: VisualFallbackType;
  videoKeywords: string[];
  recommendedEquipmentIds: string[];
  recommendedChemicalIds: string[];
  reason: string;
}

export function matchLocalScienceTopic(query: string): LocalMatchResult {
  const q = query.toLowerCase();

  if (/(boil|mountain|altitude|evaporat|vapor\s*pressure|steam|kpa)/i.test(q)) {
    return {
      matchedExperimentId: 'boiling-point',
      department: 'chemistry',
      visualFallbackType: 'boiling',
      videoKeywords: ['boiling water pressure', 'boiling point'],
      recommendedEquipmentIds: ['chem-hot-plate', 'chem-beaker', 'chem-thermometer', 'chem-barometer'],
      recommendedChemicalIds: ['chem-sub-h2o'],
      reason:
        'Matched our validated Water Boiling Point vs External Pressure (IAPWS-IF97) simulation inside the Chemistry Lab.',
    };
  }

  if (
    /(ph\b|acid|hydronium|base|alkali|titration|mol\/l|indicator|phenolphthalein)/i.test(q) &&
    !/(river|lake|soil|turbidity|watershed|weather|aquifer|rainwater|environmental|ecosystem|filtration|pollution)/i.test(
      q
    )
  ) {
    return {
      matchedExperimentId: 'acid-ph',
      department: 'chemistry',
      visualFallbackType: 'general',
      videoKeywords: ['acid base ph', 'chemistry titration'],
      recommendedEquipmentIds: ['chem-beaker', 'chem-ph-meter', 'chem-pipette', 'chem-burette'],
      recommendedChemicalIds: ['chem-sub-hcl', 'chem-sub-naoh', 'chem-sub-universal'],
      reason:
        'Matched our validated Acid Concentration vs pH logarithmic model inside the Chemistry Lab.',
    };
  }

  if (/(reaction\s*rate|arrhenius|activation\s*energy|catalyst|kinetics|marble\s*chips|caco3)/i.test(q)) {
    const isBiotech = /(enzyme|protein|substrate|biotech)/i.test(q);
    return {
      matchedExperimentId: 'reaction-rate',
      department: isBiotech ? 'biotechnology' : 'chemistry',
      visualFallbackType: 'general',
      videoKeywords: ['chemical reaction rate', 'enzyme kinetics'],
      recommendedEquipmentIds: isBiotech
        ? ['biotech-biomolecule', 'biotech-micropipette', 'biotech-centrifuge']
        : ['chem-hot-plate', 'chem-conical-flask', 'chem-thermometer', 'chem-magnetic-stirrer'],
      recommendedChemicalIds: isBiotech ? [] : ['chem-sub-hcl', 'chem-sub-caco3'],
      reason: isBiotech
        ? 'Matched enzyme catalysis & Arrhenius temperature kinetics inside the Biotechnology Lab.'
        : 'Matched our validated Arrhenius Temperature vs Reaction Rate kinetics model inside the Chemistry Lab.',
    };
  }

  if (/(dna|gene|genetic|pcr|electrophoresis|gel|biotech|biomolecule|cell\s*culture|micropipette|codon)/i.test(q)) {
    return {
      matchedExperimentId: null,
      department: 'biotechnology',
      visualFallbackType: 'microscope',
      videoKeywords: ['dna structure', 'gel electrophoresis pcr'],
      recommendedEquipmentIds: [
        'biotech-dna-model',
        'biotech-pcr-concept',
        'biotech-gel-electrophoresis',
        'biotech-micropipette',
      ],
      recommendedChemicalIds: [],
      reason:
        'Mapped to the Biotechnology Laboratory (conceptual molecular assembly; no clinical wet synthesis solver attached).',
    };
  }

  if (/(photosynth|chlorophyll|leaf|plant|greenhouse|light.*plant|seed\s*germination)/i.test(q)) {
    return {
      matchedExperimentId: 'photosynthesis-rate',
      department: 'biology',
      visualFallbackType: 'photosynthesis',
      videoKeywords: ['photosynthesis', 'plant chloroplast'],
      recommendedEquipmentIds: ['bio-growth-lamp', 'bio-plant-chamber', 'bio-par-probe'],
      recommendedChemicalIds: [],
      reason: 'Matched our validated Light Intensity vs Photosynthesis saturation model inside the Biology Lab.',
    };
  }

  if (/(microscope|onion\s*cell|stomata|cell\s*model|anatomy|slide|organelle)/i.test(q)) {
    return {
      matchedExperimentId: null,
      department: 'biology',
      visualFallbackType: 'microscope',
      videoKeywords: ['compound microscope', 'plant cell'],
      recommendedEquipmentIds: ['bio-microscope', 'bio-slides', 'bio-cover-slips', 'bio-cell-model'],
      recommendedChemicalIds: [],
      reason:
        'Microscopy specimens and organelle models are located inside the Biology Lab Microscopy Station.',
    };
  }

  if (
    /(pendulum|swing|oscillat|harmonic|period)/i.test(q) &&
    !/(orbit|planet|satellite|telescope|star|astro|comet)/i.test(q)
  ) {
    return {
      matchedExperimentId: 'pendulum-period',
      department: 'physics',
      visualFallbackType: 'pendulum',
      videoKeywords: ['pendulum', 'simple pendulum'],
      recommendedEquipmentIds: ['phys-pendulum', 'phys-stopwatch', 'phys-meter-scale', 'phys-masses'],
      recommendedChemicalIds: [],
      reason: 'Matched our validated Simple Pendulum Length vs Time Period model (T = 2π√(L/g)) in the Physics Lab.',
    };
  }

  if (/(robot|servo|motor|microcontroller|arduino|chassis|gear|autonomous)/i.test(q)) {
    return {
      matchedExperimentId: 'voltage-current',
      department: 'engineering',
      visualFallbackType: 'circuit',
      videoKeywords: ['robotics dc motor', 'microcontroller circuit'],
      recommendedEquipmentIds: ['eng-battery', 'eng-microcontroller', 'eng-breadboard', 'eng-servo', 'eng-chassis'],
      recommendedChemicalIds: [],
      reason: 'Mapped to the Engineering & Robotics Workshop with safe DC load validation.',
    };
  }

  if (/(ohm|circuit|volt|current|resistor|electric|bulb|led|breadboard|capacitor|diode)/i.test(q)) {
    return {
      matchedExperimentId: 'voltage-current',
      department: 'physics',
      visualFallbackType: 'circuit',
      videoKeywords: ['electric circuit', 'ohm law'],
      recommendedEquipmentIds: ['phys-dc-supply', 'phys-resistor', 'phys-ammeter', 'phys-voltmeter'],
      recommendedChemicalIds: [],
      reason: 'Matched our validated safe low-voltage DC Ohm’s Law simulation (V = I·R) in the Physics Lab.',
    };
  }

  if (/(water\s*quality|turbidity|rain\s*gauge|soil\s*moisture|air\s*quality|weather|ecosystem|filtration|pollution)/i.test(q)) {
    return {
      matchedExperimentId: 'acid-ph',
      department: 'environmental',
      visualFallbackType: 'general',
      videoKeywords: ['water quality testing', 'water filtration'],
      recommendedEquipmentIds: ['env-ph-probe', 'env-water-sim', 'env-filtration', 'env-weather-station'],
      recommendedChemicalIds: [],
      reason: 'Mapped to the Environmental Science Laboratory with field pH telemetry and filtration equipment.',
    };
  }

  if (/(telescope|planet|solar\s*system|orbit|moon\s*phase|rocket|spacecraft|satellite|star|spectrum)/i.test(q)) {
    const isThrust = /(rocket|thrust|launch|heat\s*shield)/i.test(q);
    return {
      matchedExperimentId: isThrust ? 'force-acceleration' : null,
      department: 'astronomy',
      visualFallbackType: /(heat\s*shield)/i.test(q) ? 'heat-shield' : 'rocket',
      videoKeywords: ['nasa rocket launch', 'solar system planets'],
      recommendedEquipmentIds: isThrust
        ? ['astro-spacecraft', 'astro-gravity-sim', 'astro-solar-system']
        : ['astro-telescope', 'astro-solar-system', 'astro-spectroscope'],
      recommendedChemicalIds: [],
      reason: 'Mapped to the Astronomy & Space Science Observatory.',
    };
  }

  if (/(density|mass|volume|buoyancy|float|sink|nacl|salt\s*solution)/i.test(q)) {
    return {
      matchedExperimentId: 'mass-volume-density',
      department: 'chemistry',
      visualFallbackType: 'general',
      videoKeywords: ['density mass volume', 'archimedes buoyancy'],
      recommendedEquipmentIds: ['chem-measuring-cylinder', 'chem-digital-balance'],
      recommendedChemicalIds: ['chem-sub-h2o', 'chem-sub-nacl'],
      reason: 'Matched our validated Mass, Volume & Density model inside the Chemistry Lab.',
    };
  }

  if (/(inverse\s*square|light\s*intensity|dimmer|lamp|brightness|irradiance)/i.test(q)) {
    return {
      matchedExperimentId: 'light-distance',
      department: 'physics',
      visualFallbackType: 'general',
      videoKeywords: ['inverse square law light', 'optics'],
      recommendedEquipmentIds: ['phys-ray-box', 'phys-optical-bench', 'phys-photometer'],
      recommendedChemicalIds: [],
      reason: 'Matched our validated Distance vs Light Intensity (1/r²) optics model in the Physics Lab.',
    };
  }

  if (/(cool|newton.*cool|heat\s*loss|room\s*temp|thermal\s*decay|calorimeter)/i.test(q)) {
    return {
      matchedExperimentId: 'newtons-cooling',
      department: 'physics',
      visualFallbackType: 'cooling',
      videoKeywords: ['thermal cooling', 'heat transfer'],
      recommendedEquipmentIds: ['phys-calorimeter', 'phys-thermometer', 'phys-stopwatch'],
      recommendedChemicalIds: [],
      reason: 'Matched our validated Newton’s Law of Cooling thermal model inside the Physics Heat & Waves Bay.',
    };
  }

  if (/(force|accelerat|newton|inertia|trolley|pulley|inclined|spring)/i.test(q)) {
    return {
      matchedExperimentId: 'force-acceleration',
      department: 'physics',
      visualFallbackType: 'general',
      videoKeywords: ['newton second law', 'force acceleration'],
      recommendedEquipmentIds: ['phys-track', 'phys-trolley', 'phys-force-sensor', 'phys-masses'],
      recommendedChemicalIds: [],
      reason: 'Matched our validated Force vs Acceleration (Newton’s Second Law: a = F/m) model.',
    };
  }

  if (/(rainbow|prism|spectrum|refraction|dispersion|lens|mirror)/i.test(q)) {
    return {
      matchedExperimentId: null,
      department: 'physics',
      visualFallbackType: 'rainbow',
      videoKeywords: ['prism light dispersion', 'rainbow refraction'],
      recommendedEquipmentIds: ['phys-ray-box', 'phys-prism', 'phys-optical-bench', 'phys-screen'],
      recommendedChemicalIds: [],
      reason: 'Assembled Physics Optics Bench instruments (conceptual spectrum dispersion mode).',
    };
  }

  if (/(protractor|ruler|coordinate|geometry|regression|statistics|unit\s*convert|calculator)/i.test(q)) {
    return {
      matchedExperimentId: 'mass-volume-density',
      department: 'math',
      visualFallbackType: 'general',
      videoKeywords: ['measurement units', 'scientific graphing'],
      recommendedEquipmentIds: ['math-ruler', 'math-protractor', 'math-plotter', 'math-calculator'],
      recommendedChemicalIds: [],
      reason: 'Mapped to the Mathematics & Scientific Measurement Studio.',
    };
  }

  if (/(magnet|compass|electromagnet|flux)/i.test(q)) {
    return {
      matchedExperimentId: null,
      department: 'physics',
      visualFallbackType: 'magnet',
      videoKeywords: ['magnetic field', 'electromagnet'],
      recommendedEquipmentIds: ['phys-dc-supply', 'phys-wires', 'phys-switch', 'phys-ammeter'],
      recommendedChemicalIds: [],
      reason: 'Mapped to the Physics Electricity & Electromagnetism bench.',
    };
  }

  return {
    matchedExperimentId: null,
    department: 'physics',
    visualFallbackType: 'general',
    videoKeywords: [query.slice(0, 60)],
    recommendedEquipmentIds: ['phys-meter-scale', 'phys-stopwatch', 'phys-spring-balance'],
    recommendedChemicalIds: [],
    reason: 'Mapped to a conceptual assembly inside the Physics Lab; refine parameters on the workbench.',
  };
}

export function buildLocalExperimentTemplate(prompt: string): CustomExperimentDefinition {
  const cleanPrompt = prompt.trim();
  const safety = evaluateSafety(cleanPrompt);
  const match = matchLocalScienceTopic(cleanPrompt);
  const matchedExp = match.matchedExperimentId
    ? EXPERIMENTS.find((e) => e.id === match.matchedExperimentId)
    : undefined;

  if (matchedExp) {
    const firstParam = matchedExp.parameters[0];
    let template: CustomCalcTemplate = 'linear_ratio';
    if (matchedExp.id === 'light-distance') template = 'inverse_proportion';
    else if (matchedExp.id === 'acid-ph') template = 'logarithmic_scale';
    else if (matchedExp.id === 'newtons-cooling') template = 'exponential_decay';
    else if (matchedExp.id === 'reaction-rate') template = 'quadratic_growth';

    return {
      id: `custom-${Date.now()}`,
      title: matchedExp.title,
      subject: matchedExp.subject,
      department: match.department,
      learningObjective: matchedExp.learningObjective,
      scientificPrinciple: matchedExp.principle,
      hypothesis: matchedExp.hypothesis,
      independentVariable: matchedExp.independentVariable,
      dependentVariable: matchedExp.dependentVariable,
      controlledVariables: matchedExp.controlledVariables,
      formula: matchedExp.formula,
      units: matchedExp.unitsSummary,
      parameterRanges: [
        {
          name: firstParam?.label ?? 'Input Parameter',
          symbol: firstParam?.symbol ?? 'x',
          unit: firstParam?.unit ?? 'units',
          min: firstParam?.min ?? 1,
          max: firstParam?.max ?? 100,
          defaultValue: firstParam?.defaultValue ?? 10,
        },
      ],
      procedure: [
        `Enter the ${match.department.toUpperCase()} Laboratory Room from the Science Campus.`,
        'Verify that the preloaded apparatus and any virtual reagent bottles sit cleanly on the center island workbench.',
        `Connect compatible instruments, then vary ${matchedExp.independentVariable} across 4+ trials.`,
        'Record calculated trials and compare against your initial scientific prediction.',
      ],
      predictionPrompt: matchedExp.predictionPrompt,
      expectedResult: matchedExp.predictionExpectedHint,
      graphRecommendation: `${matchedExp.graphInterpretation.xAxisMeaning} vs ${matchedExp.graphInterpretation.yAxisMeaning}`,
      assumptions: matchedExp.assumptions,
      limitations: matchedExp.limitations,
      safetyClassification: safety.level === 'GREEN' ? matchedExp.safetyLevel : safety.level,
      safetyGuidance: matchedExp.safetyNote,
      calculationTemplate: template,
      recommendedEquipmentIds: match.recommendedEquipmentIds,
      recommendedChemicalIds: match.recommendedChemicalIds,
      roomOverviewNote: match.reason,
      matchedValidatedModelId: matchedExp.id,
      hasValidatedModel: true,
      sourceMode: 'local-template',
      createdAt: new Date().toISOString(),
    };
  }

  return {
    id: `custom-${Date.now()}`,
    title: cleanPrompt.length > 72 ? `${cleanPrompt.slice(0, 69)}...` : cleanPrompt,
    subject: match.department.charAt(0).toUpperCase() + match.department.slice(1),
    department: match.department,
    learningObjective: `Design and inspect a structured conceptual investigation inside the ${match.department} laboratory for: "${cleanPrompt}".`,
    scientificPrinciple:
      'Isolate one independent variable, keep controlled variables fixed, and record measurable changes cleanly.',
    hypothesis: 'Changing the independent variable systematically produces a repeatable trend in the dependent variable.',
    independentVariable: 'Primary Test Parameter (x)',
    dependentVariable: 'Measured Outcome (y)',
    controlledVariables: ['Ambient room conditions', 'Consistent sample size', 'Calibrated measurement units'],
    formula: 'Conceptual Design (Awaiting Specific Validated Physical Law)',
    units: 'SI Units (verify in Lab Room)',
    parameterRanges: [
      {
        name: 'Test Parameter',
        symbol: 'x',
        unit: 'units',
        min: 1,
        max: 100,
        defaultValue: 20,
      },
    ],
    procedure: [
      `Enter the ${match.department} lab wing using the button above.`,
      'Inspect the preloaded equipment rack items arranged on the center workbench.',
      'Document controlled variables and qualitative apparatus behavior inside Save Lab Design.',
    ],
    predictionPrompt: 'How do you expect the observed system to respond when the test parameter increases?',
    expectedResult:
      'Because no domain-specific validated numerical equation is bound to this custom topic yet, treat the template curve as a conceptual placeholder only.',
    graphRecommendation: 'Scatter/line plot of Test Parameter (x) vs Measured Outcome (y)',
    assumptions: ['Controlled variables remain constant throughout observation.'],
    limitations: [
      'Conceptual design mode: no pre-validated physics/biotech solver exists for this exact free-form topic.',
    ],
    safetyClassification: safety.level,
    safetyGuidance: safety.summary,
    calculationTemplate: 'linear_ratio',
    recommendedEquipmentIds: match.recommendedEquipmentIds,
    recommendedChemicalIds: match.recommendedChemicalIds,
    roomOverviewNote: match.reason,
    matchedValidatedModelId: null,
    hasValidatedModel: false,
    sourceMode: 'local-template',
    createdAt: new Date().toISOString(),
  };
}
