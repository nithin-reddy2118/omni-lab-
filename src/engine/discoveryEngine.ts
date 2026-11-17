import { getExperimentById } from './experiments';
import { matchLocalScienceTopic } from './localFallback';
import type {
  DiscoveryInvestigationResponse,
  DiscoveryWhatIfOption,
  EducationDivision,
  EngineeringBranch,
  ExternalParameterSpec,
  GraphPoint,
  LabDepartmentId,
  SafetyLevel,
  VisualFallbackType,
} from '../types/science';

export interface DiscoveryInvestigationInput {
  question: string;
  subject?: string;
  levelLabel?: string;
  division?: EducationDivision;
  branch?: EngineeringBranch;
  activePhenomenonContext?: DiscoveryInvestigationResponse | null;
  conversationHistory?: { question: string; topicTitle: string; subject: string }[];
  safetyLevel?: SafetyLevel;
  safetySummary?: string;
}

export interface DiscoveryWhatIfCalculation {
  isQuantitative: boolean;
  experimentId: string | null;
  primaryLabel?: string;
  primarySymbol?: string;
  primaryValue?: number;
  primaryUnit?: string;
  secondaryMetrics?: { label: string; symbol: string; value: number; unit: string }[];
  curvePoints?: GraphPoint[];
  xAxisLabel?: string;
  yAxisLabel?: string;
  causalSummary: string;
  qualitativeImpacts?: { name: string; status: string; direction: string }[];
  limitationNote: string;
}

interface PhenomenonTemplate {
  key: string;
  matcher: RegExp;
  topicTitle: string;
  subject: string;
  department: LabDepartmentId;
  visualFallbackType: VisualFallbackType;
  suggestedExperimentId: string | null;
  suggestedExperimentReason: string;
  suggestedEquipmentIds: string[];
  directAnswer: string;
  scientificExplanation: string;
  underlyingPrinciple: string;
  stepByStepMechanism: string[];
  whereItOccurs: string;
  microscopic: string;
  macroscopic: string;
  internalMechanisms: string;
  externalParameters: ExternalParameterSpec[];
  causeAndEffectAnalysis: DiscoveryInvestigationResponse['causeAndEffectAnalysis'];
  equations: string[];
  measurementsAndUnits: string[];
  variables: DiscoveryInvestigationResponse['variables'];
  realWorldExamples: string[];
  experimentalInvestigation: DiscoveryInvestigationResponse['experimentalInvestigation'];
  visualCaption: string;
  visualLegend: string[];
  whatIfOptions: DiscoveryWhatIfOption[];
  scientificLimitations: string[];
  verifiableSources: { title: string; url: string }[];
  videoSearchKeywords: string[];
  followUpQuestions: string[];
}

const TEMPLATES: PhenomenonTemplate[] = [
  {
    key: 'boiling',
    matcher: /(boil|vapor\s*pressure|vapour\s*pressure|mountain.*water|altitude.*boil|steam\s*point|clausius)/i,
    topicTitle: 'Boiling Point & External Atmospheric Pressure Equilibrium',
    subject: 'Chemistry & Thermodynamics',
    department: 'chemistry',
    visualFallbackType: 'boiling',
    suggestedExperimentId: 'boiling-point',
    suggestedExperimentReason:
      'Matches OmniLab IAPWS-IF97 Water Boiling Point vs External Pressure solver in the Chemistry Wing.',
    suggestedEquipmentIds: ['chem-hot-plate', 'chem-beaker', 'chem-thermometer', 'chem-barometer'],
    directAnswer:
      'A liquid boils when its saturated vapour pressure rises high enough to equal the surrounding external pressure. At higher altitudes, thinner air exerts lower atmospheric pressure, so water reaches boiling at a lower temperature (for example ~71 °C atop Mount Everest vs 100.00 °C at sea level).',
    scientificExplanation:
      'Thermal energy increases the average kinetic energy of water molecules. Fast-moving molecules escape into vapor pockets beneath the surface. If external air pressure pushes down strongly (101.325 kPa at sea level), bubbles collapse until water reaches 100 °C. At low ambient pressure, bubbles expand freely at much cooler temperatures.',
    underlyingPrinciple:
      'Phase Equilibrium & Clausius–Clapeyron Law: Boiling occurs when P_vapor(T) ≥ P_ambient.',
    stepByStepMechanism: [
      '1. Heat transfer raises bulk liquid kinetic energy (temperature T increases toward T_boil).',
      '2. Surface and dissolved-gas micro-nuclei experience rising equilibrium vapour pressure P_vapor(T).',
      '3. When P_vapor(T) equals external pressure P_ext, vapor bubbles stabilize and rise to the surface.',
      '4. Added heat goes into latent heat of vaporization (ΔH_vap ≈ 40.7 kJ/mol) rather than raising temperature further.',
    ],
    whereItOccurs:
      'High-altitude kitchens, mountaineering camps, sealed pressure cookers, vacuum distillation columns, and steam power plants.',
    microscopic:
      'Individual H₂O molecules break hydrogen bonds with neighbors when their translational kinetic energy overcomes intermolecular attraction plus external gas collisions.',
    macroscopic:
      'Sustained rolling bubbles nucleate throughout the liquid bulk while thermometer temperature plateaus at T_boil.',
    internalMechanisms:
      'Hydrogen-bond network strength, latent heat of vaporization, and vapor-pocket surface tension set the intrinsic vapor pressure curve P_sat(T).',
    externalParameters: [
      {
        key: 'pressure',
        name: 'External Ambient Pressure',
        symbol: 'P',
        unit: 'kPa',
        min: 20,
        max: 250,
        step: 2,
        defaultValue: 101.325,
        effectType: 'state-equilibrium',
        direction: 'Lower pressure decreases boiling temperature; higher pressure (e.g. pressure cooker) raises it.',
        relationshipShape: 'nonlinear',
        mechanism: 'Alters the pressure threshold that internal vapor bubbles must overcome to avoid collapsing.',
        heldConstants: ['Pure distilled H₂O', 'Liquid depth (~10 cm)', 'Clean borosilicate nucleation sites'],
        limitation: 'Does not account for boiling-point elevation caused by dissolved solutes such as NaCl.',
      },
    ],
    causeAndEffectAnalysis: {
      whatChanges: 'Lowering external pressure lowers T_boil along a concave logarithmic vapor-pressure curve.',
      whyItChanges: 'Fewer air molecules collide against emerging vapor bubbles from above.',
      mechanism: 'Clausius–Clapeyron exponential dependence between equilibrium vapor pressure and absolute temperature.',
      directionAndShape: 'Direct nonlinear monotonic increase: T_boil rises steeply at low pressures and flattens gradually above 150 kPa.',
      competingEffects: 'Dissolved salts elevate boiling point (colligative effect) while vacuum/altitude depresses it.',
      correlationVsCausation: 'Altitude itself does not change water molecules; atmospheric column pressure reduction is the physical cause.',
    },
    equations: ['d(ln P) / dT = ΔH_vap / (R · T²)', 'P_vapor(T_boil) = P_external'],
    measurementsAndUnits: ['Temperature (°C or K)', 'Pressure (kPa, 101.325 kPa = 1 atm)', 'Altitude (m)'],
    variables: {
      independent: ['External ambient pressure P (kPa)'],
      dependent: ['Boiling temperature T_boil (°C)'],
      controlled: ['Fluid purity (distilled water)', 'Heater thermal coupling'],
    },
    realWorldExamples: [
      'Boiling potatoes in Leh/Mount Everest takes longer because water stays cooler (~71–88 °C), cooking food more slowly.',
      'Pressure cookers trap steam (~180–200 kPa) so water boils near 116–120 °C, speeding starch/protein cooking.',
    ],
    experimentalInvestigation: {
      howToTest: 'Place a Beaker on the Hot Plate with a Thermometer and Barometer, wire them thermally, and run trials at 30 kPa, 70 kPa, 101.325 kPa, and 180 kPa.',
      equipmentNeeded: ['250 mL Borosilicate Beaker', 'Electric Hot Plate', 'Digital RTD Thermometer', 'Digital Barometer'],
      safetyPrecaution: 'Never seal an unvented glass flask during heating; use pressure-rated vessels with relief valves.',
    },
    visualCaption: 'Liquid vapor bubbles stabilize only when internal P_vapor reaches surrounding air pressure P_ambient.',
    visualLegend: ['Blue liquid bulk: H₂O', 'Cyan rising spheres: Vapor bubbles', 'Orange heater wave: Thermal flux'],
    whatIfOptions: [
      {
        label: 'Mount Everest Summit (33 kPa)',
        paramKey: 'pressure',
        suggestedValue: 33,
        unit: 'kPa',
        expectedOutcome: 'Water boils near 71.3 °C — safe for sterilization? No! Too cool to tenderize dense grains quickly.',
        isQuantitativeModel: true,
      },
      {
        label: 'Sea Level Standard (101.3 kPa)',
        paramKey: 'pressure',
        suggestedValue: 101.325,
        unit: 'kPa',
        expectedOutcome: 'Standard reference boiling point of 100.00 °C.',
        isQuantitativeModel: true,
      },
      {
        label: 'Sealed Pressure Cooker (190 kPa)',
        paramKey: 'pressure',
        suggestedValue: 190,
        unit: 'kPa',
        expectedOutcome: 'Boiling temperature climbs near 118.6 °C.',
        isQuantitativeModel: true,
      },
    ],
    scientificLimitations: [
      'Model assumes pure degassed water without dissolved ions or superheating delays.',
      'IAPWS-IF97 saturation curve applies smoothly across 20–250 kPa.',
    ],
    verifiableSources: [
      { title: 'NIST Chemistry WebBook — Water Saturation Properties', url: 'https://webbook.nist.gov/chemistry/fluid/' },
    ],
    videoSearchKeywords: ['boiling water vacuum pressure', 'boiling point altitude physics'],
    followUpQuestions: [
      'Why does adding salt raise the boiling temperature of water?',
      'What if the ambient pressure drops to 40 kPa?',
      'Why does temperature stop rising once water starts boiling?',
    ],
  },
  {
    key: 'plant-growth',
    matcher: /(plant\s*growth|photosynth|chlorophyll|seedling|crop\s*growth|stomata|light\s*and\s*water)/i,
    topicTitle: 'Photosynthesis & Multi-Factor Plant Growth Limiting Kinetics',
    subject: 'Biology & Plant Physiology',
    department: 'biology',
    visualFallbackType: 'photosynthesis',
    suggestedExperimentId: 'plant-growth-model',
    suggestedExperimentReason:
      'Matches OmniLab Multi-Factor Plant Growth Limiting Factor simulator (Light, Water, CO₂ & Temperature) in the Biology Wing.',
    suggestedEquipmentIds: ['bio-growth-lamp', 'bio-plant-chamber', 'bio-par-probe'],
    directAnswer:
      'Plants grow by converting light energy, atmospheric carbon dioxide (CO₂), and root water (H₂O) into sugars inside chloroplasts, while cellular respiration builds biomass. Growth rate is governed by the single scarcest limiting resource (Liebig’s Law of the Minimum) and peaks inside a biological enzyme temperature window (~22–28 °C).',
    scientificExplanation:
      'Light-dependent reactions in thylakoid membranes harvest photons to split water and generate ATP/NADPH. The Calvin cycle uses ATP/NADPH and RuBisCO enzyme to fix CO₂ into glucose. If water drops, stomata close to prevent wilting, starving leaves of CO₂ even in bright sunlight. Extreme heat (>38 °C) or cold (<10 °C) slows or denatures metabolic enzymes.',
    underlyingPrinciple:
      'Liebig’s Law of the Minimum & Michaelis–Menten Light/CO₂ Saturation with Thermal Enzyme Optimum.',
    stepByStepMechanism: [
      '1. Chlorophyll absorbs blue (~450 nm) and red (~660 nm) photons, exciting electrons in Photosystems II and I.',
      '2. Root uptake supplies water (H₂O) and turgor pressure keeps leaf stomata open.',
      '3. CO₂ diffuses through open stomata to stroma enzymes (RuBisCO) to synthesize triose phosphates.',
      '4. Net carbon gain (gross photosynthesis minus respiration) drives leaf area and biomass growth over weeks.',
    ],
    whereItOccurs:
      'Green plant leaves, crop fields, forest canopies, greenhouses, and hydroponic chambers.',
    microscopic:
      'Inside chloroplasts, photon absorption drives electron transport and proton gradients to make ATP; stomata guard cells swell or shrink depending on leaf water status.',
    macroscopic:
      'Healthy leaves stay green and turgid while stem height and fresh biomass accumulate smoothly over 4–8 weeks.',
    internalMechanisms:
      'Chlorophyll concentration, RuBisCO enzyme kinetics, stomatal conductance, and mitochondrial respiration.',
    externalParameters: [
      {
        key: 'lightIntensity',
        name: 'PAR Light Intensity',
        symbol: 'I',
        unit: 'µmol/m²/s',
        min: 50,
        max: 1200,
        step: 25,
        defaultValue: 550,
        effectType: 'rate-only',
        direction: 'Increases growth rapidly from shade up to ~500 µmol/m²/s, then saturates.',
        relationshipShape: 'nonlinear',
        mechanism: 'Saturates photosystem reaction centers following a hyperbolic Michaelis curve.',
        heldConstants: ['75% moisture supply', '420 ppm CO₂', '24 °C chamber temp'],
        limitation: 'Real sunlight above 1600 µmol/m²/s can induce photoinhibition unless shaded.',
      },
      {
        key: 'waterSupply',
        name: 'Soil Moisture / Water Supply',
        symbol: 'W',
        unit: '%',
        min: 10,
        max: 100,
        step: 5,
        defaultValue: 75,
        effectType: 'indirect',
        direction: 'Drought (<35%) forces stomatal closure and halts growth; 65–85% is optimal.',
        relationshipShape: 'threshold',
        mechanism: 'Water acts as both electron donor and hydraulic driver opening stomata for CO₂ entry.',
        heldConstants: ['Well-drained loam medium (no root anoxia modeling)'],
        limitation: 'Waterlogging (100% stagnant water) harms roots in reality—not fully captured at high %.',
      },
      {
        key: 'temperatureC',
        name: 'Ambient Temperature',
        symbol: 'T',
        unit: '°C',
        min: 5,
        max: 45,
        step: 1,
        defaultValue: 24,
        effectType: 'state-equilibrium',
        direction: 'Follows a bell curve peaking near 25 °C; drops sharply below 12 °C or above 36 °C.',
        relationshipShape: 'nonlinear',
        mechanism: 'Higher kinetic collisions accelerate enzymes up to thermal denaturation and photorespiration rise.',
        heldConstants: ['C3 temperate plant baseline'],
        limitation: 'C4 crops (maize) tolerate higher temperatures (30–34 °C) better than C3 crops.',
      },
      {
        key: 'co2Ppm',
        name: 'Atmospheric CO₂ Concentration',
        symbol: 'CO₂',
        unit: 'ppm',
        min: 150,
        max: 1000,
        step: 20,
        defaultValue: 420,
        effectType: 'rate-only',
        direction: 'Raising CO₂ toward 700 ppm reduces photorespiration and boosts carbon fixation if light & water allow.',
        relationshipShape: 'nonlinear',
        mechanism: 'Increases substrate saturation at the RuBisCO carboxylation active site.',
        heldConstants: ['Unconstrained soil NPK nutrients'],
        limitation: 'Without sufficient soil nitrogen, elevated CO₂ quickly hits nutrient ceilings.',
      },
    ],
    causeAndEffectAnalysis: {
      whatChanges: 'Biomass growth rate changes most strongly when you adjust whichever single resource is currently limiting.',
      whyItChanges: 'If water is only 15%, adding more CO₂ or light cannot open closed stomata.',
      mechanism: 'Multiplicative saturation factors multiply photosynthetic capacity rather than adding independently.',
      directionAndShape: 'Hyperbolic saturation for Light & CO₂; asymmetric thermal bell curve for Temperature; threshold response for Water.',
      competingEffects: 'Higher temperature initially speeds Calvin cycle catalysis, but above 30 °C respiration and water loss outpace carbon fixation.',
      correlationVsCausation: 'Plants grow faster in summer warmth only when water and light are simultaneously abundant.',
    },
    equations: [
      'G = G_max · (I/(K_I + I)) · (W/(K_W + W)) · (CO₂/(K_c + CO₂)) · f(T)',
      '6 CO₂ + 6 H₂O + Light → C₆H₁₂O₆ + 6 O₂',
    ],
    measurementsAndUnits: ['PAR (µmol photons/m²/s)', 'Moisture (%)', 'CO₂ (ppm)', 'Biomass (g / week)'],
    variables: {
      independent: ['Light Intensity', 'Water Supply', 'Ambient CO₂', 'Temperature'],
      dependent: ['Net Growth Rate (cm/week) & Projected Biomass'],
      controlled: ['Seed genotype (C3 seedling)', 'Soil mineral composition'],
    },
    realWorldExamples: [
      'Commercial greenhouses enrich CO₂ to ~750 ppm during sunny winter mornings to accelerate tomato yields.',
      'Midday wilting slows afternoon photosynthesis even under full noon sunshine.',
    ],
    experimentalInvestigation: {
      howToTest: 'Assemble Growth Lamp, Plant Chamber & PAR Sensor in Biology Wing; vary one factor at a time while holding the other three fixed.',
      equipmentNeeded: ['Adjustable PAR Growth Lamp', 'Controlled Plant Chamber', 'PAR & O₂ Sensor Probe'],
      safetyPrecaution: 'Avoid looking directly at high-intensity LED growth arrays at close distance.',
    },
    visualCaption: 'Chloroplasts fix CO₂ + H₂O using photon energy; stomatal water status and enzyme temperature throttle total growth.',
    visualLegend: ['Yellow rays: Photon flux (PAR)', 'Green oval: Chloroplast/Leaf', 'Teal O₂: Released oxygen'],
    whatIfOptions: [
      {
        label: 'Severe Drought Stress (15% Water)',
        paramKey: 'waterSupply',
        suggestedValue: 15,
        unit: '%',
        expectedOutcome: 'Stomata close; net growth drops dramatically regardless of bright light.',
        isQuantitativeModel: true,
      },
      {
        label: 'Low Temperature Cold Snap (10 °C)',
        paramKey: 'temperatureC',
        suggestedValue: 10,
        unit: '°C',
        expectedOutcome: 'Enzyme kinetics slow down sharply — growth index falls below 40% of peak.',
        isQuantitativeModel: true,
      },
      {
        label: 'Greenhouse CO₂ Enrichment (800 ppm)',
        paramKey: 'co2Ppm',
        suggestedValue: 800,
        unit: 'ppm',
        expectedOutcome: 'Raises carbon fixation rate noticeably when light and moisture are adequate.',
        isQuantitativeModel: true,
      },
    ],
    scientificLimitations: [
      'Does not simulate mineral deficiencies (Nitrogen, Phosphorus, Potassium) or fungal disease.',
      'Photoperiod (day/night cycle length) is averaged into daily PAR intensity.',
    ],
    verifiableSources: [
      { title: 'OpenStax Biology — Photosynthesis & Limiting Factors', url: 'https://openstax.org/books/biology-2e/pages/8-1-overview-of-photosynthesis' },
    ],
    videoSearchKeywords: ['photosynthesis chloroplast plant growth', 'plant stomata transpiration'],
    followUpQuestions: [
      'What happens if the temperature drops to 10 °C?',
      'Why does drought stop photosynthesis even in bright sunlight?',
      'Which factor is limiting plant growth first when CO₂ is elevated?',
    ],
  },
  {
    key: 'ohms-law',
    matcher: /(ohm|voltage|current|circuit|resistor|electric.*flow|power\s*dissipat|watt|ampere)/i,
    topicTitle: 'Ohm’s Law, Electrical Resistance & Closed-Loop Current Flow',
    subject: 'Physics & Electronics',
    department: 'physics',
    visualFallbackType: 'circuit',
    suggestedExperimentId: 'voltage-current',
    suggestedExperimentReason:
      'Matches OmniLab DC Ohm’s Law (I = V/R) interactive circuit bench in Physics and Electronics Wings.',
    suggestedEquipmentIds: ['phys-dc-supply', 'phys-resistor', 'phys-ammeter', 'phys-voltmeter'],
    directAnswer:
      'In an ohmic conductor at constant temperature, electric current I flowing through a closed circuit is directly proportional to applied voltage V and inversely proportional to total resistance R: I = V / R.',
    scientificExplanation:
      'A DC power supply creates an electric field pushing free conduction electrons slowly around a continuous conducting loop (drift velocity). Collisions between drifting electrons and vibrating atomic lattice ions oppose flow—this opposition is electrical resistance R (measured in ohms, Ω). Breaking the loop (an open circuit) drops current instantly to zero.',
    underlyingPrinciple:
      'Ohm’s Law (V = I · R) and Joule Heating Power (P = V · I = I²R).',
    stepByStepMechanism: [
      '1. Potential difference V establishes an electric field along the conducting wire and resistor.',
      '2. Only when a closed metallic loop exists does steady drift current I flow uniformly through series elements.',
      '3. Increasing resistance R introduces more lattice scattering collisions, cutting current proportionally.',
      '4. Electrical energy converts into thermal energy inside the resistor at rate P = V² / R.',
    ],
    whereItOccurs:
      'Phone chargers, LED current-limiting resistors, toaster heating coils, solar DC microgrids, and electronic sensors.',
    microscopic:
      'Free electrons drift opposite the electric field vector while scattering off phonons and impurity atoms inside the metallic crystal.',
    macroscopic:
      'A series ammeter reads steady current I (Amperes), while a parallel voltmeter across the load reads voltage drop V (Volts).',
    internalMechanisms:
      'Material resistivity ρ, conductor cross-sectional area A, length L (R = ρL/A), and temperature coefficient of resistance.',
    externalParameters: [
      {
        key: 'voltage',
        name: 'Applied DC Voltage',
        symbol: 'V',
        unit: 'V',
        min: 1,
        max: 24,
        step: 0.5,
        defaultValue: 9,
        effectType: 'direct',
        direction: 'Doubling voltage doubles current proportionally (linear through the origin) for fixed R.',
        relationshipShape: 'linear',
        mechanism: 'Directly increases the electric field strength accelerating charge carriers between collisions.',
        heldConstants: ['Ohmic resistor temperature (~25 °C)', 'Negligible wire/ammeter resistance'],
        limitation: 'Non-ohmic devices like diodes and filament bulbs curve away from linearity.',
      },
      {
        key: 'resistance',
        name: 'Load Resistance',
        symbol: 'R',
        unit: 'Ω',
        min: 2,
        max: 100,
        step: 1,
        defaultValue: 18,
        effectType: 'indirect',
        direction: 'Increasing resistance decreases current hyperbolically (I ∝ 1/R).',
        relationshipShape: 'nonlinear',
        mechanism: 'Restricts charge carrier mobility across the resistive element.',
        heldConstants: ['Constant regulated DC supply voltage V'],
        limitation: 'Very low resistance (<1 Ω) at high voltage exceeds bench power-rating limits.',
      },
    ],
    causeAndEffectAnalysis: {
      whatChanges: 'Current increases linearly with Voltage and decreases inversely (1/R) with Resistance.',
      whyItChanges: 'Higher voltage increases driving potential; higher resistance increases collision drag.',
      mechanism: 'Steady-state balance between electrostatic drift acceleration and lattice momentum loss.',
      directionAndShape: 'I vs V is strictly linear (slope = 1/R); I vs R is a decaying hyperbola (1/R).',
      competingEffects: 'As large current heats a resistor, metal lattice vibrations intensify and increase R slightly, reducing I below ideal linear predictions.',
      correlationVsCausation: 'Power supply voltage and circuit resistance cause current; current does not create battery voltage.',
    },
    equations: ['V = I · R', 'I = V / R', 'P = V · I = I² · R'],
    measurementsAndUnits: ['Voltage (V)', 'Current (A or mA)', 'Resistance (Ω)', 'Power (W)'],
    variables: {
      independent: ['Supply Voltage V (V)', 'Circuit Resistance R (Ω)'],
      dependent: ['Electric Current I (A)', 'Power Dissipated P (W)'],
      controlled: ['Closed circuit loop continuity', 'Ambient resistor temperature'],
    },
    realWorldExamples: [
      'Adding a 330 Ω resistor in series with an indicator LED keeps current safely near ~10–15 mA.',
      'Electric kettle elements use low resistance alloy coils so P = V²/R reaches 1500–2000 W.',
    ],
    experimentalInvestigation: {
      howToTest: 'Wire DC Power Supply → Resistor → Ammeter in a closed loop, then run trials at 3 V, 6 V, 9 V, 12 V.',
      equipmentNeeded: ['Low-Voltage DC Power Supply', 'Calibrated Resistor', 'Digital Ammeter / Multimeter'],
      safetyPrecaution: 'Always verify circuit resistance ≥ 2 Ω before enabling DC supply; never connect mains AC.',
    },
    visualCaption: 'Closed-loop electron drift driven by potential difference V through load resistance R.',
    visualLegend: ['V: DC potential source', 'R: Load resistor', 'Dashed cyan flow: Current path I = V/R'],
    whatIfOptions: [
      {
        label: 'Double Supply Voltage (18 V)',
        paramKey: 'voltage',
        suggestedValue: 18,
        unit: 'V',
        expectedOutcome: 'Current doubles cleanly from 0.50 A to 1.00 A while power quadruples (4×).',
        isQuantitativeModel: true,
      },
      {
        label: 'High Load Resistance (60 Ω)',
        paramKey: 'resistance',
        suggestedValue: 60,
        unit: 'Ω',
        expectedOutcome: 'Current drops sharply to I = 0.15 A at 9 V.',
        isQuantitativeModel: true,
      },
    ],
    scientificLimitations: [
      'Assumes ideal zero internal battery resistance and constant temperature ohmic resistor.',
      'Transient AC/capacitive effects require the RC Circuit Decay experiment.',
    ],
    verifiableSources: [
      { title: 'OpenStax University Physics — Ohm’s Law & Resistance', url: 'https://openstax.org/books/university-physics-volume-2/pages/9-4-ohms-law' },
    ],
    videoSearchKeywords: ['ohms law electric circuit', 'current voltage resistance'],
    followUpQuestions: [
      'What happens if resistance is increased while voltage stays constant?',
      'Why does an open switch make current drop to zero?',
      'Why does power increase four times when voltage doubles?',
    ],
  },
  {
    key: 'pendulum',
    matcher: /(pendulum|swing|time\s*period|simple\s*harmonic|shm|gravity.*swing|oscillat)/i,
    topicTitle: 'Simple Pendulum Oscillation & Gravitational Time Period',
    subject: 'Physics & Mechanics',
    department: 'physics',
    visualFallbackType: 'pendulum',
    suggestedExperimentId: 'pendulum-period',
    suggestedExperimentReason:
      'Matches OmniLab Simple Pendulum Length vs Period simulator (T = 2π√(L/g)) in Physics Wing.',
    suggestedEquipmentIds: ['phys-pendulum', 'phys-stopwatch', 'phys-meter-scale'],
    directAnswer:
      'For small swing angles (< 15°), a simple pendulum’s time period T depends only on string length L and gravitational acceleration g (T = 2π√(L/g)), and is remarkably independent of bob mass!',
    scientificExplanation:
      'Both gravitational restoring force pulling the bob back to center (m·g·sinθ) and inertial resistance to acceleration (m) are proportional to mass m—so mass cancels cleanly out of Newton’s Second Law! Increasing string length L stretches the arc distance proportionally while weakening tangential restoring slope, lengthening each swing as √L.',
    underlyingPrinciple:
      'Small-Angle Simple Harmonic Motion (SHM) & Equivalence of Inertial and Gravitational Mass.',
    stepByStepMechanism: [
      '1. Pulling the bob slightly sideways lifts its center of mass by height h = L(1 − cosθ).',
      '2. Releasing converts gravitational potential energy mgh smoothly into kinetic energy ½mv² at the lowest point.',
      '3. Inertia carries the bob symmetrically up the opposite side until gravity slows it to a stop.',
      '4. One full back-and-forth cycle takes T = 2π√(L/g).',
    ],
    whereItOccurs:
      'Grandfather pendulum clocks, Foucault Earth-rotation pendulums, playground swings, and seismic accelerometers.',
    microscopic:
      'String tension balances radial weight + centripetal force while atomic lattice elasticity in the pivot string transmits tension continuously.',
    macroscopic:
      'Symmetric sinusoidal horizontal oscillation whose frequency f = 1/T decreases when the cord is lengthened.',
    internalMechanisms:
      'Interchange of gravitational potential energy and translational kinetic energy.',
    externalParameters: [
      {
        key: 'length',
        name: 'Pendulum String Length',
        symbol: 'L',
        unit: 'm',
        min: 0.2,
        max: 3.0,
        step: 0.1,
        defaultValue: 1.0,
        effectType: 'state-equilibrium',
        direction: 'Longer length increases period T proportionally to √L (4× length = 2× period).',
        relationshipShape: 'nonlinear',
        mechanism: 'Longer radius reduces angular restoring stiffness (g/L).',
        heldConstants: ['Small release angle θ ≤ 10°', 'Negligible air drag'],
        limitation: 'Breaks down at wide angles (>20°), where period lengthens slightly beyond 2π√(L/g).',
      },
      {
        key: 'gravity',
        name: 'Gravitational Acceleration',
        symbol: 'g',
        unit: 'm/s²',
        min: 1.6,
        max: 24.8,
        step: 0.2,
        defaultValue: 9.81,
        effectType: 'state-equilibrium',
        direction: 'Stronger gravity pulls the bob back faster, reducing period T proportional to 1/√g.',
        relationshipShape: 'nonlinear',
        mechanism: 'Directly increases the tangential restoring acceleration g·sinθ.',
        heldConstants: ['Fixed pendulum length L', 'Inextensible string'],
        limitation: 'Assumes point-mass bob without rotational moment of inertia.',
      },
    ],
    causeAndEffectAnalysis: {
      whatChanges: 'Period T grows with √L and shrinks with 1/√g, while changing bob mass leaves T unchanged.',
      whyItChanges: 'Inertial mass and gravitational weight both scale linearly with m and cancel exactly.',
      mechanism: 'Angular equation d²θ/dt² ≈ −(g/L)θ yields natural frequency ω = √(g/L).',
      directionAndShape: 'Square-root curve T vs L (linear when plotted as T² vs L).',
      competingEffects: 'Very bulky light bobs suffer air drag that slowly damps amplitude over many swings.',
      correlationVsCausation: 'Heavier iron bobs sometimes appear to swing longer only because they resist air drag better—not because mass speeds up gravity.',
    },
    equations: ['T = 2π √(L / g)', 'T² = (4π² / g) · L', 'f = 1 / T'],
    measurementsAndUnits: ['Length L (m)', 'Period T (s)', 'Gravity g (m/s²: Earth 9.81, Moon 1.62)'],
    variables: {
      independent: ['Pendulum length L (m)', 'Local gravity g (m/s²)'],
      dependent: ['Oscillation Time Period T (s)', 'Frequency f (Hz)'],
      controlled: ['Initial angle < 12°', 'Rigid pivot support'],
    },
    realWorldExamples: [
      'A 0.994 m pendulum on Earth ticks cleanly with T ≈ 2.00 s (one half-swing per second).',
      'On the Moon (g = 1.62 m/s²), that same pendulum takes ~4.9 s per cycle — over 2.4× slower!',
    ],
    experimentalInvestigation: {
      howToTest: 'Set up Simple Pendulum Rig + Stopwatch in Physics Wing; time 10 oscillations at L = 0.5 m, 1.0 m, 1.5 m, 2.0 m and plot T² vs L.',
      equipmentNeeded: ['Simple Pendulum Rig', 'Precision Stopwatch', 'Meter Scale'],
      safetyPrecaution: 'Secure clamp stand firmly to benchtop so swinging mass stays stable.',
    },
    visualCaption: 'Restoring gravity component mg sinθ drives periodic energy exchange between potential and kinetic energy.',
    visualLegend: ['Cyan bob: Point mass m', 'White rod: String length L', 'Dashed arc: Small-angle trajectory'],
    whatIfOptions: [
      {
        label: 'Quadruple Length (L = 2.4 m)',
        paramKey: 'length',
        suggestedValue: 2.4,
        unit: 'm',
        expectedOutcome: 'Increasing length from 0.6 m to 2.4 m exactly doubles oscillation period T.',
        isQuantitativeModel: true,
      },
      {
        label: 'Take Pendulum to the Moon (g = 1.62 m/s²)',
        paramKey: 'gravity',
        suggestedValue: 1.62,
        unit: 'm/s²',
        expectedOutcome: 'Period lengthens roughly 2.46× (~4.94 s for L = 1 m).',
        isQuantitativeModel: true,
      },
    ],
    scientificLimitations: [
      'Small-angle approximation sinθ ≈ θ introduces <0.5% error up to 15°, growing at large angles.',
      'Ignores air drag and string mass.',
    ],
    verifiableSources: [
      { title: 'OpenStax University Physics — Simple Pendulum', url: 'https://openstax.org/books/university-physics-volume-1/pages/15-4-pendulums' },
    ],
    videoSearchKeywords: ['simple pendulum physics', 'pendulum oscillation shm'],
    followUpQuestions: [
      'What happens to the time period if the bob mass is doubled?',
      'What if we run the same pendulum on the Moon?',
      'Why do scientists plot T² vs L to measure gravity?',
    ],
  },
  {
    key: 'acid-ph',
    matcher: /(ph\b|acid|alkali|base|hydronium|titration|neutrali|hcl|naoh)/i,
    topicTitle: 'Acids, Bases, Logarithmic pH Scale & Neutralisation',
    subject: 'Chemistry',
    department: 'chemistry',
    visualFallbackType: 'general',
    suggestedExperimentId: 'acid-ph',
    suggestedExperimentReason:
      'Matches OmniLab Strong Acid pH vs Molarity simulator (or Acid-Base Titration for Class 11–12+) in Chemistry Wing.',
    suggestedEquipmentIds: ['chem-beaker', 'chem-ph-meter'],
    directAnswer:
      'pH measures how acidic or basic an aqueous solution is on a base-10 logarithmic scale: pH = −log₁₀([H⁺]). Because the scale is logarithmic, every 1-unit drop in pH means a 10× higher concentration of hydrogen/hydronium ions [H₃O⁺].',
    scientificExplanation:
      'Strong acids like hydrochloric acid (HCl) dissociate almost completely in water into H₃O⁺ and Cl⁻ ions. Adding water (dilution) spreads those ions over a larger volume, lowering [H⁺] and raising pH toward 7.00 (neutral water). Adding a base (OH⁻) neutralises H₃O⁺ into H₂O.',
    underlyingPrinciple:
      'Sørensen Logarithmic Acidity Scale: pH = −log₁₀([H⁺]) and Water Auto-ionization [H⁺][OH⁻] = 10⁻¹⁴ at 25 °C.',
    stepByStepMechanism: [
      '1. Acid molecules donate protons (H⁺) to water molecules forming hydronium ions (H₃O⁺).',
      '2. Molar concentration C (mol/L) determines [H⁺] directly for monoprotic strong acids.',
      '3. Taking −log₁₀ converts wide ranges (1 M to 10⁻¹⁴ M) cleanly into 0–14 pH units.',
      '4. A glass pH electrode outputs ~59.16 mV per pH unit shift at 25 °C.',
    ],
    whereItOccurs:
      'Gastric digestion (pH ~1.5–2), rain/river ecology, soil agriculture, swimming pools, and blood homeostasis (pH 7.35–7.45).',
    microscopic:
      'Hydrogen ions rapidly hop along water hydrogen-bond networks (Grotthuss mechanism) until neutralized by OH⁻ ions.',
    macroscopic:
      'Universal indicator paper turns red/orange in acids (<7), emerald green at neutral (7), and deep blue/violet in bases (>7).',
    internalMechanisms:
      'Acid dissociation constant Kₐ, water self-ionization K_w, and chemical buffering equilibria.',
    externalParameters: [
      {
        key: 'concentration',
        name: 'Strong Acid Concentration',
        symbol: 'C',
        unit: 'M (mol/L)',
        min: 0.0001,
        max: 1.0,
        step: 0.001,
        defaultValue: 0.01,
        effectType: 'state-equilibrium',
        direction: 'Higher acid concentration lowers pH logarithmically; 10× dilution raises pH by exactly +1.00.',
        relationshipShape: 'nonlinear',
        mechanism: 'pH depends on −log₁₀([H⁺]), compressing orders of magnitude.',
        heldConstants: ['25 °C aqueous solution (K_w = 1.0×10⁻¹⁴)', 'Strong monoprotic acid (HCl)'],
        limitation: 'Weak acids (acetic acid) dissociate only partially and buffer pH changes differently.',
      },
    ],
    causeAndEffectAnalysis: {
      whatChanges: 'Decreasing acid molarity 10-fold increases pH by 1.0 unit.',
      whyItChanges: 'Diluting the solution cuts [H⁺] by 90%, moving the exponent in [H⁺] = 10⁻ᵖᴴ up by +1.',
      mechanism: 'Base-10 logarithm compression.',
      directionAndShape: 'Monotonically decreasing logarithmic curve from pH 4 (10⁻⁴ M) down to pH 0 (1 M).',
      competingEffects: 'At extreme dilutions (<10⁻⁶ M), natural water auto-ionization (10⁻⁷ M H⁺) prevents pH from ever exceeding 7.0 in acid dilution.',
      correlationVsCausation: 'Indicator color changes because the indicator dye gains or loses a proton at that pH—dye color is a detector, not the cause.',
    },
    equations: ['pH = −log₁₀([H⁺])', '[H⁺] · [OH⁻] = 1.0 × 10⁻¹⁴ (at 25 °C)'],
    measurementsAndUnits: ['Molarity (mol/L = M)', 'pH (dimensionless logarithmic scale)'],
    variables: {
      independent: ['Acid Molarity C (M)'],
      dependent: ['Solution pH', 'Hydronium concentration [H₃O⁺]'],
      controlled: ['Temperature (25 °C)', 'Strong monoprotic electrolyte'],
    },
    realWorldExamples: [
      'Diluting lemon juice (citric acid) 10× with pure water softens tartness and shifts pH up.',
      'Agricultural lime neutralizes overly acidic topsoil to protect nutrient availability.',
    ],
    experimentalInvestigation: {
      howToTest: 'Place a Beaker and Digital pH Meter in Chemistry Wing, link probe to vessel, and test serial 10× dilutions (0.1 M, 0.01 M, 0.001 M).',
      equipmentNeeded: ['250 mL Beaker', 'Digital pH Meter', 'Graduated Pipette'],
      safetyPrecaution: 'Always add acid to water slowly when preparing real laboratory dilutions; wear splash goggles.',
    },
    visualCaption: 'Hydronium ion density shifts logarithmically across orders of magnitude.',
    visualLegend: ['pH < 7: Excess H₃O⁺', 'pH = 7: Balanced H₃O⁺ = OH⁻', 'pH > 7: Excess OH⁻'],
    whatIfOptions: [
      {
        label: '10× Acid Dilution (0.001 M)',
        paramKey: 'concentration',
        suggestedValue: 0.001,
        unit: 'M',
        expectedOutcome: 'pH rises from 2.00 to 3.00 — a full 1.0 unit increase.',
        isQuantitativeModel: true,
      },
      {
        label: 'Concentrated Bench Acid (0.5 M)',
        paramKey: 'concentration',
        suggestedValue: 0.5,
        unit: 'M',
        expectedOutcome: 'pH drops sharply to 0.30.',
        isQuantitativeModel: true,
      },
    ],
    scientificLimitations: [
      'Assumes ideal activity coefficient γ = 1 and strong monoprotic acid.',
    ],
    verifiableSources: [
      { title: 'OpenStax Chemistry 2e — pH and pOH', url: 'https://openstax.org/books/chemistry-2e/pages/14-2-ph-and-poh' },
    ],
    videoSearchKeywords: ['acid base ph chemistry', 'titration indicator'],
    followUpQuestions: [
      'Why can diluting an acid never make pH go above 7?',
      'What is the difference between a strong acid and a concentrated acid?',
      'What happens during acid–base neutralisation titration?',
    ],
  },
  {
    key: 'reaction-rate',
    matcher: /(reaction\s*rate|arrhenius|activation\s*energy|catalyst|rate\s*of\s*reaction)/i,
    topicTitle: 'Arrhenius Reaction Kinetics & Activation Energy Barrier',
    subject: 'Chemistry & Chemical Kinetics',
    department: 'chemistry',
    visualFallbackType: 'cooling',
    suggestedExperimentId: 'reaction-rate',
    suggestedExperimentReason:
      'Matches OmniLab Arrhenius Temperature vs Reaction Rate simulator in Chemistry Wing.',
    suggestedEquipmentIds: ['chem-conical-flask', 'chem-hot-plate', 'chem-thermometer'],
    directAnswer:
      'Raising temperature accelerates chemical reactions exponentially because the fraction of molecular collisions exceeding the activation energy barrier Ea rises dramatically with kinetic temperature.',
    scientificExplanation:
      'According to collision theory, reactant molecules only react if they collide with both proper orientation and energy ≥ Ea. Raising temperature by just 10 °C shifts the Maxwell–Boltzmann energy tail sharply upward, often roughly doubling the rate constant k.',
    underlyingPrinciple:
      'Arrhenius Equation & Collision Theory: k = A · exp(−Ea / RT).',
    stepByStepMechanism: [
      '1. Heating increases average molecular velocity and collision frequency slightly.',
      '2. Crucially, the exponential fraction exp(−Ea/RT) of ultra-energetic molecules jumps rapidly.',
      '3. Reactants surmount the transition-state activation barrier cleanly into products.',
    ],
    whereItOccurs:
      'Food refrigeration (slowing spoilage), catalytic converters, industrial ammonia synthesis, and enzyme biochemistry.',
    microscopic:
      'Exponential Boltzmann tail fraction above activation threshold Ea governs reactive bond rearrangement.',
    macroscopic:
      'Effervescence bubbles, color fade, or product formation completes noticeably faster in warm flasks than ice-bath flasks.',
    internalMechanisms:
      'Activation energy barrier Ea, pre-exponential steric factor A, and catalyst alternative pathways.',
    externalParameters: [
      {
        key: 'temperatureC',
        name: 'Reaction Temperature',
        symbol: 'T',
        unit: '°C',
        min: 5,
        max: 90,
        step: 5,
        defaultValue: 25,
        effectType: 'rate-only',
        direction: 'Higher temperature accelerates reaction rate exponentially (T must be converted to Kelvin).',
        relationshipShape: 'nonlinear',
        mechanism: 'Boosts Boltzmann fraction exp(−Ea/RT) able to cross the transition state.',
        heldConstants: ['Fixed reactant concentration', 'Fixed activation energy Ea = 52 kJ/mol'],
        limitation: 'At extreme heat, thermal decomposition or evaporation may alter reactants.',
      },
      {
        key: 'activationEnergy',
        name: 'Activation Energy Barrier',
        symbol: 'Ea',
        unit: 'kJ/mol',
        min: 25,
        max: 90,
        step: 5,
        defaultValue: 52,
        effectType: 'rate-only',
        direction: 'A catalyst lowers Ea and speeds up the reaction dramatically at the same temperature.',
        relationshipShape: 'nonlinear',
        mechanism: 'Provides an alternate lower-energy reaction pathway without changing equilibrium yield ΔG.',
        heldConstants: ['Temperature T (°C)', 'Collision factor A'],
        limitation: 'Lowering Ea speeds forward and reverse rates equally—it does not shift final equilibrium.',
      },
    ],
    causeAndEffectAnalysis: {
      whatChanges: 'Reaction rate constant k grows exponentially with Kelvin temperature T and shrinks exponentially as Ea rises.',
      whyItChanges: 'Most molecules sit below Ea; warming unlocks the exponential high-energy tail.',
      mechanism: 'Maxwell–Boltzmann + Arrhenius kinetics.',
      directionAndShape: 'Exponentially accelerating rate curve.',
      competingEffects: 'For enzymes, exceeding ~45 °C denatures the protein catalyst, reversing the upward Arrhenius rate trend.',
      correlationVsCausation: 'Catalysts raise rate by lowering Ea, not by heating the vessel.',
    },
    equations: ['k = A · e^(−Ea / (R·T))', 'ln(k₂/k₁) = (Ea/R) · (1/T₁ − 1/T₂)'],
    measurementsAndUnits: ['Temperature (°C / K)', 'Ea (kJ/mol)', 'Relative rate constant k (s⁻¹)'],
    variables: {
      independent: ['Temperature T (°C)', 'Activation Energy Ea (kJ/mol)'],
      dependent: ['Rate Constant k', 'Time to completion'],
      controlled: ['Initial reagent molarity', 'Surface area & stirring'],
    },
    realWorldExamples: [
      'Refrigerators store food at 4 °C instead of 25 °C to cut bacterial spoilage reaction rates several-fold.',
      'Catalytic converters use platinum/rhodium to lower Ea for exhaust CO oxidation.',
    ],
    experimentalInvestigation: {
      howToTest: 'Couple Conical Flask + Hot Plate + Thermometer in Chemistry Wing; compare rate at 15 °C, 35 °C, and 55 °C.',
      equipmentNeeded: ['250 mL Conical Flask', 'Hot Plate', 'Digital Thermometer'],
      safetyPrecaution: 'Never heat volatile flammable solvents on an open hot plate.',
    },
    visualCaption: 'Temperature boosts thermal energy distribution so more molecules cross activation barrier Ea.',
    visualLegend: ['High-T state: Rapid barrier crossing', 'Catalyst: Lowers Ea barrier without changing net ΔH'],
    whatIfOptions: [
      {
        label: 'Warm Water Bath (55 °C)',
        paramKey: 'temperatureC',
        suggestedValue: 55,
        unit: '°C',
        expectedOutcome: 'Relative reaction rate jumps roughly 6× faster than at 25 °C.',
        isQuantitativeModel: true,
      },
      {
        label: 'Ice Bath Cooling (5 °C)',
        paramKey: 'temperatureC',
        suggestedValue: 5,
        unit: '°C',
        expectedOutcome: 'Reaction slows to less than one-quarter of room-temperature speed.',
        isQuantitativeModel: true,
      },
    ],
    scientificLimitations: [
      'Assumes constant pre-exponential factor A and single rate-determining step.',
    ],
    verifiableSources: [
      { title: 'OpenStax Chemistry 2e — Collision Theory & Arrhenius Law', url: 'https://openstax.org/books/chemistry-2e/pages/12-5-collision-theory' },
    ],
    videoSearchKeywords: ['arrhenius reaction rate', 'chemical kinetics catalyst'],
    followUpQuestions: [
      'Why does a catalyst speed up a reaction without being consumed?',
      'What happens if the reaction temperature drops to 5 °C?',
      'Why does temperature use Kelvin in the Arrhenius equation?',
    ],
  },
  {
    key: 'force-motion',
    matcher: /(force|accelerat|newton.*law|inertia|trolley|friction|rocket.*thrust|momentum)/i,
    topicTitle: 'Newton’s Laws of Motion, Force, Mass & Acceleration',
    subject: 'Physics & Engineering',
    department: 'physics',
    visualFallbackType: 'rocket',
    suggestedExperimentId: 'force-acceleration',
    suggestedExperimentReason:
      'Matches OmniLab Newton’s Second Law (a = F_net / m) dynamics track experiment in Physics Wing.',
    suggestedEquipmentIds: ['phys-trolley', 'phys-force-sensor', 'phys-track'],
    directAnswer:
      'An object’s acceleration is directly proportional to the net unbalanced force acting on it and inversely proportional to its inertial mass: a = F_net / m.',
    scientificExplanation:
      'Mass measures inertia—an object’s natural resistance to changes in velocity. Pulling harder (greater net force F) speeds up velocity change proportionally, whereas doubling cargo mass cuts acceleration in half for the same push. For rockets, pushing exhaust downward creates equal opposite upward thrust (Newton’s Third Law).',
    underlyingPrinciple:
      'Newton’s Second Law (F_net = m · a) & Third Law Action–Reaction.',
    stepByStepMechanism: [
      '1. Sum all forces acting along motion axis (applied push minus friction = F_net).',
      '2. Divide net force by total inertial mass m.',
      '3. Constant net force produces uniform acceleration and linearly increasing velocity v = a · t.',
    ],
    whereItOccurs:
      'Cars braking, dynamics trolleys, elevator cables, robotic actuators, and rocket launches.',
    microscopic:
      'Contact forces arise from electromagnetic repulsion between electron clouds at surfaces.',
    macroscopic:
      'Velocity rises steadily while acceleration stays flat under constant net force.',
    internalMechanisms:
      'Inertial mass distribution and surface friction coefficients.',
    externalParameters: [
      {
        key: 'force',
        name: 'Applied Net Force',
        symbol: 'F',
        unit: 'N',
        min: 1,
        max: 50,
        step: 1,
        defaultValue: 12,
        effectType: 'direct',
        direction: 'Increasing net force increases acceleration linearly for fixed mass.',
        relationshipShape: 'linear',
        mechanism: 'Directly raises impulse per unit time Δp/Δt.',
        heldConstants: ['Frictionless level air track', 'Total mass = 3.0 kg'],
        limitation: 'Real surfaces exhibit static and kinetic friction reducing net force.',
      },
      {
        key: 'mass',
        name: 'Total Inertial Mass',
        symbol: 'm',
        unit: 'kg',
        min: 0.5,
        max: 20,
        step: 0.5,
        defaultValue: 3.0,
        effectType: 'indirect',
        direction: 'Doubling mass cuts acceleration in half (inverse proportion a ∝ 1/m).',
        relationshipShape: 'nonlinear',
        mechanism: 'Greater inertia resists velocity change.',
        heldConstants: ['Applied pull force F'],
        limitation: 'Relativistic mass effects are zero at everyday lab speeds.',
      },
    ],
    causeAndEffectAnalysis: {
      whatChanges: 'Acceleration rises linearly with force and falls hyperbolically as mass increases.',
      whyItChanges: 'More mass means greater inertia requiring more impulse per m/s speed gain.',
      mechanism: 'Conservation of momentum F = dp/dt.',
      directionAndShape: 'Linear vs Force; 1/m inverse curve vs Mass.',
      competingEffects: 'Added normal weight increases sliding friction in non-ideal tracks, lowering net force.',
      correlationVsCausation: 'Net force causes acceleration; constant speed needs zero net force if friction is absent.',
    },
    equations: ['F_net = m · a', 'a = F_net / m', 'v = u + a · t'],
    measurementsAndUnits: ['Force F (N = kg·m/s²)', 'Mass m (kg)', 'Acceleration a (m/s²)'],
    variables: {
      independent: ['Net Force F (N)', 'System Mass m (kg)'],
      dependent: ['Acceleration a (m/s²)', 'Velocity after 3 s (m/s)'],
      controlled: ['Horizontal track level', 'Negligible rolling drag'],
    },
    realWorldExamples: [
      'An empty shopping cart accelerates sharply under a gentle push compared to a loaded cart.',
      'Rocket boosters shed empty fuel tanks mid-flight to lower mass m and raise acceleration.',
    ],
    experimentalInvestigation: {
      howToTest: 'Link Force Sensor to Dynamics Trolley in Physics Wing; test 6 N, 12 N, and 24 N pulls at 3 kg.',
      equipmentNeeded: ['Dynamics Trolley', 'Force Sensor / Spring Balance', 'Track'],
      safetyPrecaution: 'Place padded end-stop bumper on dynamics track.',
    },
    visualCaption: 'Equal and opposite forces plus a = F_net/m drive directional acceleration.',
    visualLegend: ['Cyan nose: Motion direction', 'Orange plume: Reaction force'],
    whatIfOptions: [
      {
        label: 'Double Net Force (24 N)',
        paramKey: 'force',
        suggestedValue: 24,
        unit: 'N',
        expectedOutcome: 'Acceleration doubles cleanly from 4.00 m/s² to 8.00 m/s².',
        isQuantitativeModel: true,
      },
      {
        label: 'Heavy Payload (12 kg)',
        paramKey: 'mass',
        suggestedValue: 12,
        unit: 'kg',
        expectedOutcome: 'Acceleration drops fourfold to 1.00 m/s².',
        isQuantitativeModel: true,
      },
    ],
    scientificLimitations: [
      'Frictionless idealisation; real tracks lose energy to wheel bearing and air drag.',
    ],
    verifiableSources: [
      { title: 'OpenStax Physics — Newton’s Second Law', url: 'https://openstax.org/books/university-physics-volume-1/pages/5-3-newtons-second-law' },
    ],
    videoSearchKeywords: ['newton second law motion', 'rocket propulsion thrust'],
    followUpQuestions: [
      'What happens if we double both net force and mass together?',
      'Why does an object keep moving when net force returns to zero?',
      'How does friction affect real acceleration?',
    ],
  },
];

function detectOutOfScopeQuery(q: string): boolean {
  const lower = q.toLowerCase().trim();
  if (!lower) return false;
  const nonSciencePatterns =
    /(who won the (world cup|election|oscar|match|ipl)|celebrity|movie\s*review|best\s*restaurant|stock\s*price|lottery|horoscope|astrology\s*sign|recipe\s*for\s*biryani|gossip|cricket\s*score)/i;
  const hasScienceOverride =
    /(physics|chem|bio|math|equation|energy|cell|atom|acid|pressure|force|circuit|planet|dna|heat|light|experiment|algorithm)/i.test(
      lower
    );
  return nonSciencePatterns.test(lower) && !hasScienceOverride;
}

function isFollowUpMessage(q: string, activeCtx?: DiscoveryInvestigationResponse | null): boolean {
  if (!activeCtx) return false;
  const lower = q.toLowerCase().trim();
  const explicitFollowUp =
    /^(why|what if|what happens|how does that|how about|explain more|and if|can you|lower|higher|increase|decrease|double|half|compare|what about)/i.test(
      lower
    ) || /\b(it|this|that|same|above|previous)\b/i.test(lower);
  const newDistinctTopic = TEMPLATES.some(
    (t) => t.topicTitle !== activeCtx.topicTitle && t.matcher.test(lower)
  );
  return explicitFollowUp && !newDistinctTopic;
}

function adaptExplanationForLevel(
  baseAnswer: string,
  division: EducationDivision,
  levelLabel: string
): string {
  if (division === 'school') {
    return `${baseAnswer} [${levelLabel} Focus: Focus on observable cause-and-effect and intuitive relationships.]`;
  }
  if (division === 'research') {
    return `${baseAnswer} [${levelLabel} Focus: Inspect model assumptions, parametric sensitivity, and empirical validation boundaries.]`;
  }
  return `${baseAnswer} [${levelLabel} Focus: Quantitative governing equation, SI units, and limiting behaviour.]`;
}

export function buildDiscoveryInvestigation(
  input: DiscoveryInvestigationInput
): DiscoveryInvestigationResponse {
  const cleanQuestion = input.question.trim();
  const division = input.division ?? 'school';
  const levelLabel = input.levelLabel ?? 'Class 8';
  const safetyClassification = input.safetyLevel ?? 'GREEN';
  const safetyNote = input.safetySummary ?? 'Safe educational scientific exploration.';

  // 1. Out-of-scope honesty check
  if (detectOutOfScopeQuery(cleanQuestion)) {
    return {
      question: cleanQuestion,
      isFollowUp: false,
      isInScientificScope: false,
      scopeLimitationNote:
        'This query falls outside verifiable natural science, mathematics, engineering, and computing scope. OmniLab does not fabricate answers for non-scientific topics like sports scores, entertainment gossip, or financial predictions.',
      topicTitle: 'Outside Scientific Investigation Scope',
      subject: 'Scientific Scope Boundary',
      educationLevelLabel: levelLabel,
      directAnswer:
        'I cannot verify or answer non-scientific queries such as current events, entertainment, or personal advice. Ask any question about Physics, Chemistry, Biology, Mathematics, Computer Science, Astronomy, or Engineering to run a real scientific investigation.',
      scientificExplanation:
        'Scientific investigation requires testable hypotheses, measurable variables, physical mechanisms, and reproducible models.',
      underlyingPrinciple: 'Empirical Testability & Epistemic Honesty',
      stepByStepMechanism: ['Enter a phenomenon in nature, technology, matter, energy, or life sciences.'],
      whereItOccurs: 'STEM research and virtual laboratories.',
      microAndMacroView: {
        microscopic: 'N/A — non-scientific prompt.',
        macroscopic: 'N/A — non-scientific prompt.',
      },
      internalMechanisms: 'N/A',
      externalParameters: [],
      causeAndEffectAnalysis: {
        whatChanges: 'No physical variables identified in this prompt.',
        whyItChanges: 'Outside STEM domain.',
        mechanism: 'N/A',
        directionAndShape: 'N/A',
        competingEffects: 'N/A',
        correlationVsCausation: 'N/A',
      },
      equations: [],
      measurementsAndUnits: [],
      variables: { independent: [], dependent: [], controlled: [] },
      realWorldExamples: [],
      experimentalInvestigation: {
        howToTest: 'Try asking: "Why does water boil faster on mountains?" or "What controls plant growth?"',
        equipmentNeeded: [],
        safetyPrecaution: 'Verify claims against empirical data.',
      },
      visualFallbackType: 'general',
      visualCaption: 'Enter a scientific phenomenon to activate the Discovery Visualization Engine.',
      visualLegend: [],
      whatIfOptions: [],
      suggestedExperimentId: null,
      suggestedExperimentReason: 'Not mapped — outside scientific domain.',
      suggestedDepartment: 'physics',
      suggestedEquipmentIds: [],
      suggestedCreatorPrompt: null,
      scientificLimitations: ['OmniLab answers only grounded STEM questions.'],
      verifiableSources: [],
      videoSearchKeywords: ['scientific method'],
      followUpQuestions: [
        'Why does water boil at a lower temperature on mountains?',
        'What factors control plant growth and photosynthesis?',
        'How does resistance affect current in an electric circuit?',
      ],
      safetyClassification,
      safetyNote,
      sourceMode: 'local-engine',
    };
  }

  // 2. Context-aware follow-up handling
  const activeCtx = input.activePhenomenonContext;
  if (isFollowUpMessage(cleanQuestion, activeCtx) && activeCtx) {
    const lower = cleanQuestion.toLowerCase();
    const mentionsLowerTemp = /(lower|cool|cold|decrease|drop).*temp|colder/i.test(lower);
    const mentionsHigherTemp = /(higher|hot|warm|increase|raise).*temp|hotter/i.test(lower);
    const mentionsLowerPress = /(lower|drop|mountain|vacuum).*press/i.test(lower);
    const mentionsMoreRes = /(increase|higher|more).*resist/i.test(lower);
    const mentionsWhy = /\bwhy\b/i.test(lower);

    let contextualDirect = `Continuing investigation of "${activeCtx.topicTitle}": `;
    if (mentionsLowerTemp) {
      contextualDirect +=
        activeCtx.externalParameters.find((p) => p.key.toLowerCase().includes('temp'))?.direction ||
        'Lowering temperature reduces average molecular kinetic energy, slowing molecular collision rates, enzyme turnover, and chemical reaction speeds.';
    } else if (mentionsHigherTemp) {
      contextualDirect +=
        'Raising temperature boosts molecular kinetic energy and collision frequency initially; for biological enzymes or plants, exceeding optimal warmth triggers thermal stress and denaturation.';
    } else if (mentionsLowerPress) {
      contextualDirect +=
        'Lowering external pressure decreases the confining force on emerging vapor pockets, allowing phase transition (boiling) at a cooler temperature.';
    } else if (mentionsMoreRes) {
      contextualDirect +=
        'Increasing circuit resistance opposes electron drift along the conductor, lowering steady electric current inversely (I = V/R) when supply voltage is fixed.';
    } else if (mentionsWhy) {
      contextualDirect += `${activeCtx.causeAndEffectAnalysis.whyItChanges} Mechanism: ${activeCtx.causeAndEffectAnalysis.mechanism}`;
    } else {
      contextualDirect += `${activeCtx.scientificExplanation} Use the What-If Parameter Controls below to test exact changes numerically.`;
    }

    return {
      ...activeCtx,
      question: cleanQuestion,
      isFollowUp: true,
      educationLevelLabel: levelLabel,
      directAnswer: contextualDirect,
      safetyClassification,
      safetyNote,
    };
  }

  // 3. Match rich template
  const matchedTemplate = TEMPLATES.find((t) => t.matcher.test(cleanQuestion));
  if (matchedTemplate) {
    return {
      question: cleanQuestion,
      isFollowUp: false,
      isInScientificScope: true,
      topicTitle: matchedTemplate.topicTitle,
      subject:
        input.subject && input.subject !== 'Auto-detect'
          ? `${matchedTemplate.subject} (${input.subject})`
          : matchedTemplate.subject,
      educationLevelLabel: levelLabel,
      directAnswer: adaptExplanationForLevel(matchedTemplate.directAnswer, division, levelLabel),
      scientificExplanation: matchedTemplate.scientificExplanation,
      underlyingPrinciple: matchedTemplate.underlyingPrinciple,
      stepByStepMechanism: matchedTemplate.stepByStepMechanism,
      whereItOccurs: matchedTemplate.whereItOccurs,
      microAndMacroView: {
        microscopic: matchedTemplate.microscopic,
        macroscopic: matchedTemplate.macroscopic,
      },
      internalMechanisms: matchedTemplate.internalMechanisms,
      externalParameters: matchedTemplate.externalParameters,
      causeAndEffectAnalysis: matchedTemplate.causeAndEffectAnalysis,
      equations: matchedTemplate.equations,
      measurementsAndUnits: matchedTemplate.measurementsAndUnits,
      variables: matchedTemplate.variables,
      realWorldExamples: matchedTemplate.realWorldExamples,
      experimentalInvestigation: matchedTemplate.experimentalInvestigation,
      visualFallbackType: matchedTemplate.visualFallbackType,
      visualCaption: matchedTemplate.visualCaption,
      visualLegend: matchedTemplate.visualLegend,
      whatIfOptions: matchedTemplate.whatIfOptions,
      suggestedExperimentId: matchedTemplate.suggestedExperimentId,
      suggestedExperimentReason: matchedTemplate.suggestedExperimentReason,
      suggestedDepartment: matchedTemplate.department,
      suggestedEquipmentIds: matchedTemplate.suggestedEquipmentIds,
      suggestedCreatorPrompt: cleanQuestion,
      scientificLimitations: matchedTemplate.scientificLimitations,
      verifiableSources: matchedTemplate.verifiableSources,
      videoSearchKeywords: matchedTemplate.videoSearchKeywords,
      followUpQuestions: matchedTemplate.followUpQuestions,
      safetyClassification,
      safetyNote,
      sourceMode: 'local-engine',
    };
  }

  // 4. General STEM local synthesis backed by matchLocalScienceTopic & EXPERIMENTS
  const localMatch = matchLocalScienceTopic(cleanQuestion);
  const exp = localMatch.matchedExperimentId ? getExperimentById(localMatch.matchedExperimentId) : undefined;
  const fallbackParams: ExternalParameterSpec[] = exp
    ? exp.parameters.map((p) => ({
        key: p.key,
        name: p.label,
        symbol: p.symbol,
        unit: p.unit,
        min: p.min,
        max: p.max,
        step: p.step,
        defaultValue: p.defaultValue,
        effectType: 'state-equilibrium' as const,
        direction: p.description,
        relationshipShape: 'nonlinear' as const,
        mechanism: exp.formulaDescription,
        heldConstants: exp.controlledVariables,
        limitation: exp.limitations[0] || 'Idealized educational range applies.',
      }))
    : [
        {
          key: 'stimulus',
          name: 'Primary Independent Variable',
          symbol: 'x',
          unit: 'units',
          min: 10,
          max: 100,
          step: 5,
          defaultValue: 50,
          effectType: 'direct',
          direction: 'Adjusting the primary external condition shifts system response qualitatively.',
          relationshipShape: 'conditional',
          mechanism: 'Physical/chemical boundary constraints govern directional shift.',
          heldConstants: ['Controlled laboratory ambient conditions'],
          limitation: 'Conceptual qualitative model only; exact curve requires domain calibration.',
        },
      ];

  const subjectName =
    input.subject && input.subject !== 'Auto-detect'
      ? input.subject
      : exp?.subject || localMatch.department.charAt(0).toUpperCase() + localMatch.department.slice(1);

  return {
    question: cleanQuestion,
    isFollowUp: false,
    isInScientificScope: true,
    topicTitle: exp ? exp.title : cleanQuestion.length > 70 ? `${cleanQuestion.slice(0, 67)}...` : cleanQuestion,
    subject: subjectName,
    educationLevelLabel: levelLabel,
    directAnswer: adaptExplanationForLevel(
      exp ? `${exp.principle} ${exp.explanation}` : localMatch.reason,
      division,
      levelLabel
    ),
    scientificExplanation: exp
      ? exp.explanation
      : `Investigating "${cleanQuestion}" requires separating internal system properties from external driving parameters, isolating one variable at a time, and recording repeatable measurements in the ${localMatch.department} wing.`,
    underlyingPrinciple: exp
      ? exp.principle
      : `Controlled Causal Scientific Inquiry (${subjectName})`,
    stepByStepMechanism: exp
      ? [
          `1. Establish baseline controlled variables: ${exp.controlledVariables.join(', ')}.`,
          `2. Vary ${exp.independentVariable} systematically inside validity range (${exp.validityRange}).`,
          `3. Measure ${exp.dependentVariable} using calibrated instrumentation.`,
          `4. Verify trend against ${exp.formula}.`,
        ]
      : [
          `1. Define the physical or biological system involved in "${cleanQuestion}".`,
          '2. Separate internal structural factors from external environmental conditions.',
          '3. Predict how changing one independent parameter alters the observed response.',
        ],
    whereItOccurs: exp
      ? `${exp.subject} laboratory benches and real-world engineering/natural systems.`
      : `Natural and engineered ${subjectName} environments.`,
    microAndMacroView: {
      microscopic: exp
        ? `Microscale particle, photon, charge, or molecular kinetics underlying ${exp.shortTitle}.`
        : 'Microscale molecular, cellular, or field interactions determine bulk behavior.',
      macroscopic: exp
        ? `Observable output: ${exp.dependentVariable} responding to ${exp.independentVariable}.`
        : 'Measurable macroscopic changes on laboratory gauges and graphs.',
    },
    internalMechanisms: exp
      ? exp.formulaDescription
      : 'Internal composition, structure, and energy barriers determine how strongly the system responds.',
    externalParameters: fallbackParams,
    causeAndEffectAnalysis: {
      whatChanges: exp
        ? `${exp.dependentVariable} varies systematically with ${exp.independentVariable}.`
        : 'System response shifts when primary external boundary conditions vary.',
      whyItChanges: exp
        ? exp.graphInterpretation.relationship
        : 'Energy balance, conservation laws, or molecular kinetics couple input to output.',
      mechanism: exp ? exp.formula : 'Physical causal chain linking independent to dependent variable.',
      directionAndShape: exp
        ? `${exp.graphInterpretation.trend} (${exp.graphInterpretation.slopeMeaning})`
        : 'Direction depends on active regime and limiting factors.',
      competingEffects: exp
        ? exp.limitations[0] || 'Boundary limits apply at extreme parameter settings.'
        : 'Secondary variables can mask the main trend unless held constant.',
      correlationVsCausation:
        'Controlled variable testing isolates true causal mechanisms from coincidental correlation.',
    },
    equations: exp ? [exp.formula] : ['Empirical Relationship Pending Quantitative Model Calibration'],
    measurementsAndUnits: exp ? [exp.unitsSummary] : ['SI Standard Units'],
    variables: {
      independent: exp ? [exp.independentVariable] : ['Primary External Input'],
      dependent: exp ? [exp.dependentVariable] : ['Observed System Output'],
      controlled: exp ? exp.controlledVariables : ['Ambient temperature & sample identity'],
    },
    realWorldExamples: [
      `Applied across ${subjectName} laboratories and instrumentation workflows.`,
    ],
    experimentalInvestigation: {
      howToTest: exp
        ? `Open the ${localMatch.department} wing in Virtual Lab and test "${exp.shortTitle}" across 3+ trials.`
        : `Assemble recommended instruments in the ${localMatch.department} wing or define variables in Experiment Creator.`,
      equipmentNeeded: localMatch.recommendedEquipmentIds,
      safetyPrecaution: exp?.safetyNote || 'Follow standard GREEN/AMBER laboratory safety supervision.',
    },
    visualFallbackType: localMatch.visualFallbackType,
    visualCaption: exp ? exp.graphInterpretation.conclusion : localMatch.reason,
    visualLegend: exp
      ? [`Independent: ${exp.independentVariable}`, `Dependent: ${exp.dependentVariable}`]
      : ['Interactive visual concept model'],
    whatIfOptions: exp
      ? exp.parameters.slice(0, 2).map((p) => ({
          label: `Test High ${p.label} (${Number((p.defaultValue + (p.max - p.defaultValue) * 0.5).toFixed(2))} ${p.unit})`,
          paramKey: p.key,
          suggestedValue: Number((p.defaultValue + (p.max - p.defaultValue) * 0.5).toFixed(2)),
          unit: p.unit,
          expectedOutcome: `Inspect recalculated ${exp.dependentVariable} and updated graph.`,
          isQuantitativeModel: true,
        }))
      : [],
    suggestedExperimentId: localMatch.matchedExperimentId,
    suggestedExperimentReason: localMatch.reason,
    suggestedDepartment: localMatch.department,
    suggestedEquipmentIds: localMatch.recommendedEquipmentIds,
    suggestedCreatorPrompt: cleanQuestion,
    scientificLimitations: exp
      ? exp.limitations
      : [
          'No pre-validated quantitative numerical solver is currently attached to this specific topic; qualitative causal framework shown honestly.',
        ],
    verifiableSources: exp?.references.map((r) => ({ title: r.title, url: r.url })) ?? [],
    videoSearchKeywords: localMatch.videoKeywords,
    followUpQuestions: [
      'Why does this mechanism happen at the particle or cellular level?',
      'What happens if the primary variable is lowered?',
      'How can I test this in the Virtual Laboratory?',
    ],
    safetyClassification,
    safetyNote,
    sourceMode: 'local-engine',
  };
}

export function recalculateDiscoveryWhatIf(
  investigation: DiscoveryInvestigationResponse,
  overrides: Record<string, number>
): DiscoveryWhatIfCalculation {
  if (investigation.suggestedExperimentId) {
    const exp = getExperimentById(investigation.suggestedExperimentId);
    if (exp) {
      const mergedParams: Record<string, number> = {};
      for (const p of exp.parameters) {
        const val = overrides[p.key];
        mergedParams[p.key] =
          val !== undefined && Number.isFinite(val)
            ? Math.min(p.max, Math.max(p.min, val))
            : p.defaultValue;
      }
      const calc = exp.calculate(mergedParams);
      return {
        isQuantitative: true,
        experimentId: exp.id,
        primaryLabel: calc.primaryLabel,
        primarySymbol: calc.primarySymbol,
        primaryValue: calc.primaryValue,
        primaryUnit: calc.primaryUnit,
        secondaryMetrics: calc.secondaryMetrics,
        curvePoints: calc.curvePoints,
        xAxisLabel: `${calc.xAxisLabel} (${calc.xAxisUnit})`,
        yAxisLabel: `${calc.yAxisLabel} (${calc.yAxisUnit})`,
        causalSummary: `${calc.primaryLabel} (${calc.primarySymbol}) = ${calc.primaryValue} ${calc.primaryUnit}. ${calc.validityNote}`,
        limitationNote: exp.limitations[0] || 'Computed deterministically within stated validity bounds.',
      };
    }
  }

  const qualitativeImpacts = investigation.externalParameters.map((spec) => {
    const cur = overrides[spec.key] ?? spec.defaultValue;
    const ratio = (cur - spec.defaultValue) / Math.max(1e-6, Math.abs(spec.defaultValue));
    const status =
      Math.abs(ratio) < 0.03
        ? 'Baseline'
        : ratio > 0
          ? `Increased (+${Math.round(ratio * 100)}%)`
          : `Decreased (${Math.round(ratio * 100)}%)`;
    return {
      name: `${spec.name} (${cur} ${spec.unit})`,
      status,
      direction: spec.direction,
    };
  });

  return {
    isQuantitative: false,
    experimentId: null,
    causalSummary:
      'Qualitative Causal Preview: No pre-validated mathematical equation solver is attached to this topic, so no unverified numbers are fabricated.',
    qualitativeImpacts,
    limitationNote:
      investigation.scientificLimitations[0] ||
      'Use Experiment Creator or a closely matched lab simulation for numeric calculations.',
  };
}
