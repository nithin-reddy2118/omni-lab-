import { CURRICULUM_EXPERIMENT_CATALOG } from './experimentCatalog';
import {
  EDUCATION_DIVISIONS,
  HIGHER_EDUCATION_STAGES,
  RESEARCH_TRACK_DETAILS,
  SCHOOL_CLASS_LEVELS,
} from './divisions';
import { LAB_INSTRUMENTS, LAB_ROOMS } from './labEquipment';
import { EXPERIMENTS } from '../engine/experiments';
import type {
  CurriculumBoard,
  CurriculumExperimentEntry,
  EducationDivision,
  EducationalTier,
  EngineeringBranch,
  ExperimentDefinition,
  HigherStage,
  LabDepartmentId,
  LabInstrument,
  LabRoomDefinition,
  ResearchTrack,
  SchoolClassLevel,
} from '../types/science';

export interface AcademicProfile {
  activeDivision: EducationDivision;
  schoolClassLevel: SchoolClassLevel;
  higherStage: HigherStage;
  researchTrack: ResearchTrack;
  selectedBoard: string;
  engineeringBranch: EngineeringBranch;
  activeSubjectId: string | null;
  selectedChapter?: string | null;
}

export interface DynamicCampusWelcome {
  eyebrow: string;
  heading: string;
  subtitle: string;
  levelLabel: string;
  tier: EducationalTier;
  recommendedExperimentId: string;
  recommendedDepartment: LabDepartmentId;
}

export interface WingProfileContext {
  wingId: LabDepartmentId;
  adaptedSubtitle: string;
  purposeAtLevel: string;
  relevantSubjects: string[];
  syllabusChapters: string[];
  levelExperiments: CurriculumExperimentEntry[];
  validatedModelCount: number;
  conceptualCount: number;
  levelEquipment: LabInstrument[];
  suggestedActivities: string[];
  safetyFocus: string;
  simulationCapabilitiesLabel: string;
}

export const ENGINEERING_BRANCHES: {
  id: EngineeringBranch;
  label: string;
  shortLabel: string;
  primaryDepartments: LabDepartmentId[];
  recommendedExperimentId: string;
  coreFocus: string;
}[] = [
  {
    id: 'general',
    label: 'General Science / Foundation',
    shortLabel: 'General / B.Sc.',
    primaryDepartments: ['physics', 'chemistry', 'biology', 'math'],
    recommendedExperimentId: 'acid-base-titration',
    coreFocus: 'Core physical sciences, analytical chemistry, cellular biology & quantitative metrology',
  },
  {
    id: 'mechanical',
    label: 'Mechanical Engineering',
    shortLabel: 'Mechanical (ME)',
    primaryDepartments: ['engineering', 'physics', 'math'],
    recommendedExperimentId: 'newtons-cooling',
    coreFocus: 'Thermodynamics, Newton’s Law of Cooling, dynamics F = ma, calorimetry & material density',
  },
  {
    id: 'ece-eee',
    label: 'Electronics & Electrical (ECE / EEE)',
    shortLabel: 'ECE / EEE',
    primaryDepartments: ['electronics', 'physics', 'engineering'],
    recommendedExperimentId: 'rc-circuit-decay',
    coreFocus: 'RC transient response τ = RC, Ohm’s Law DC networks, oscilloscope signal timing & optics',
  },
  {
    id: 'computer-science',
    label: 'Computer Science & Data Engineering',
    shortLabel: 'CSE / Data',
    primaryDepartments: ['math', 'electronics', 'engineering'],
    recommendedExperimentId: 'voltage-current',
    coreFocus: '22 live algorithms, ML pipelines on UCI datasets, logic & digital instrumentation',
  },
  {
    id: 'chemical',
    label: 'Chemical Engineering',
    shortLabel: 'Chemical (ChE)',
    primaryDepartments: ['chemistry', 'environmental', 'physics'],
    recommendedExperimentId: 'reaction-rate',
    coreFocus: 'Arrhenius reaction kinetics, vapour-liquid equilibrium (IAPWS-IF97), acid-base titration',
  },
  {
    id: 'biotechnology',
    label: 'Biotechnology & Biomedical',
    shortLabel: 'Biotech / BME',
    primaryDepartments: ['biotechnology', 'microbiology', 'chemistry'],
    recommendedExperimentId: 'michaelis-menten',
    coreFocus: 'Michaelis–Menten enzyme kinetics, Beer–Lambert UV-Vis spectroscopy, batch microbial growth',
  },
  {
    id: 'civil',
    label: 'Civil & Environmental Engineering',
    shortLabel: 'Civil / Env',
    primaryDepartments: ['environmental', 'engineering', 'chemistry'],
    recommendedExperimentId: 'mass-volume-density',
    coreFocus: 'Material density & mechanics, water pH & filtration chemistry, structural load testing',
  },
];

export const VERIFIED_CURRICULUM_SOURCES: {
  board: string;
  referenceTitle: string;
  verificationStatus: 'Verified Official Curriculum Outline' | 'Adapted Educational Syllabus';
  notes: string;
}[] = [
  {
    board: 'CBSE / NCERT',
    referenceTitle: 'NCERT Science & Laboratory Manuals (Classes 5–12)',
    verificationStatus: 'Verified Official Curriculum Outline',
    notes: 'Practical themes mapped cleanly across Matter, Acids/Bases, Force, Electricity, Optics & Life Processes.',
  },
  {
    board: 'CISCE / ICSE / ISC',
    referenceTitle: 'CISCE Practical Science & Physics/Chemistry Syllabi',
    verificationStatus: 'Verified Official Curriculum Outline',
    notes: 'Covers volumetric titration, simple pendulum g measurement, density metrology & ohmic circuits.',
  },
  {
    board: 'PUC / Intermediate',
    referenceTitle: 'State Pre-University / Class 11–12 Practical Syllabus',
    verificationStatus: 'Verified Official Curriculum Outline',
    notes: 'Covers convex lens focal length, Newton’s Law of Cooling, Arrhenius rate, HCl–NaOH molarity & decay kinetics.',
  },
  {
    board: 'IGCSE',
    referenceTitle: 'Cambridge IGCSE Science (0610 / 0620 / 0625) Themes',
    verificationStatus: 'Adapted Educational Syllabus',
    notes: 'Aligned to limiting factors in photosynthesis, Newtonian motion & pH indicators.',
  },
  {
    board: 'University / B.Tech',
    referenceTitle: 'AICTE Engineering & B.Sc./B.Pharm Core Lab Outcomes',
    verificationStatus: 'Adapted Educational Syllabus',
    notes: 'Branch-focused labs covering RC transients, UV-Vis Beer–Lambert, enzymology & thermodynamics.',
  },
  {
    board: 'Postgraduate / Research',
    referenceTitle: 'Quantitative Research Modelling & Empirical Boundaries',
    verificationStatus: 'Adapted Educational Syllabus',
    notes: 'Explicitly distinguishes educational mathematical solvers from certified physical wet-lab measurements.',
  },
];

export function getEducationalTier(profile: AcademicProfile): EducationalTier {
  if (profile.activeDivision === 'research') return 'research';
  if (profile.activeDivision === 'higher') return 'higher';
  if (
    profile.schoolClassLevel === 'class-5' ||
    profile.schoolClassLevel === 'class-6' ||
    profile.schoolClassLevel === 'class-7'
  ) {
    return 'primary';
  }
  return 'secondary';
}

export function getLevelDisplayLabel(profile: AcademicProfile): string {
  if (profile.activeDivision === 'school') {
    const lvl = SCHOOL_CLASS_LEVELS.find((l) => l.id === profile.schoolClassLevel)?.label ?? 'Class 8';
    return profile.selectedBoard && profile.selectedBoard !== 'All'
      ? `${lvl} (${profile.selectedBoard})`
      : lvl;
  }
  if (profile.activeDivision === 'higher') {
    const stage =
      HIGHER_EDUCATION_STAGES.find((s) => s.id === profile.higherStage)?.label ?? 'Classes 11–12';
    const branch = ENGINEERING_BRANCHES.find((b) => b.id === profile.engineeringBranch);
    if (
      branch &&
      branch.id !== 'general' &&
      (profile.higherStage === 'undergraduate' || profile.higherStage === 'diploma')
    ) {
      return `${stage} · ${branch.shortLabel}`;
    }
    return stage;
  }
  const track = RESEARCH_TRACK_DETAILS.find((r) => r.id === profile.researchTrack)?.label ?? 'Biotechnology';
  return `Master’s / PhD Research · ${track}`;
}

export function getRecommendedDefaultExperimentForProfile(profile: AcademicProfile): {
  experimentId: string;
  department: LabDepartmentId;
} {
  const divDef = EDUCATION_DIVISIONS[profile.activeDivision];
  if (profile.activeSubjectId) {
    const subj = divDef.subjects.find((s) => s.id === profile.activeSubjectId);
    if (subj) {
      return { experimentId: subj.recommendedExperimentId, department: subj.department };
    }
  }

  if (profile.activeDivision === 'school') {
    switch (profile.schoolClassLevel) {
      case 'class-5':
      case 'class-6':
        return { experimentId: 'mass-volume-density', department: 'chemistry' };
      case 'class-7':
        return { experimentId: 'acid-ph', department: 'chemistry' };
      case 'class-8':
        return { experimentId: 'force-acceleration', department: 'physics' };
      case 'class-9':
        return { experimentId: 'pendulum-period', department: 'physics' };
      case 'class-10':
        return { experimentId: 'voltage-current', department: 'physics' };
    }
  }

  if (profile.activeDivision === 'higher') {
    const branch = ENGINEERING_BRANCHES.find((b) => b.id === profile.engineeringBranch);
    if (branch && branch.id !== 'general') {
      return {
        experimentId: branch.recommendedExperimentId,
        department: branch.primaryDepartments[0],
      };
    }
    if (profile.higherStage === 'class-11-12') {
      return { experimentId: 'thin-lens-optics', department: 'physics' };
    }
    if (profile.higherStage === 'diploma') {
      return { experimentId: 'rc-circuit-decay', department: 'electronics' };
    }
    return { experimentId: 'acid-base-titration', department: 'chemistry' };
  }

  const track = RESEARCH_TRACK_DETAILS.find((r) => r.id === profile.researchTrack);
  if (track) {
    const trackExpMap: Record<ResearchTrack, string> = {
      biotechnology: 'michaelis-menten',
      'molecular-biology': 'beer-lambert',
      genetics: 'plant-growth-model',
      bioinformatics: 'bacterial-growth',
      microbiology: 'bacterial-growth',
      biochemistry: 'michaelis-menten',
      'analytical-chemistry': 'acid-base-titration',
      'materials-science': 'newtons-cooling',
      nanotechnology: 'beer-lambert',
      'advanced-physics': 'pendulum-period',
      'electronics-instrumentation': 'rc-circuit-decay',
      'environmental-research': 'plant-growth-model',
      'advanced-engineering': 'force-acceleration',
    };
    return {
      experimentId: trackExpMap[track.id] || 'michaelis-menten',
      department: track.department,
    };
  }

  return { experimentId: 'michaelis-menten', department: 'biotechnology' };
}

export function buildDynamicCampusWelcome(profile: AcademicProfile): DynamicCampusWelcome {
  const tier = getEducationalTier(profile);
  const levelLabel = getLevelDisplayLabel(profile);
  const rec = getRecommendedDefaultExperimentForProfile(profile);
  const divDef = EDUCATION_DIVISIONS[profile.activeDivision];
  const subj = profile.activeSubjectId
    ? divDef.subjects.find((s) => s.id === profile.activeSubjectId)
    : null;
  const chapterNote = profile.selectedChapter ? ` · Chapter: ${profile.selectedChapter}` : '';

  if (profile.activeDivision === 'school') {
    const classMeta = SCHOOL_CLASS_LEVELS.find((l) => l.id === profile.schoolClassLevel);
    const isJunior = tier === 'primary';
    return {
      eyebrow: `${levelLabel}${subj ? ` · ${subj.name}` : ''}${chapterNote} · ${LAB_ROOMS.length} Adapted Lab Wings`,
      heading: subj
        ? `${levelLabel} ${subj.name} Laboratory Campus`
        : isJunior
          ? `${levelLabel} Young Explorer Science Campus`
          : `${levelLabel} Guided Practical Science Campus`,
      subtitle: subj
        ? `Exploring ${subj.name} (${subj.keyTopics.slice(0, 3).join(', ')}) with ${isJunior ? 'beginner-safe tools, everyday examples, and guided observations' : 'board-aligned measurements, graphs, and quantitative checks'}.`
        : `${classMeta?.guidance ?? ''} Equipment and experiments across all ${LAB_ROOMS.length} wings are calibrated for ${levelLabel}.`,
      levelLabel,
      tier,
      recommendedExperimentId: rec.experimentId,
      recommendedDepartment: rec.department,
    };
  }

  if (profile.activeDivision === 'higher') {
    const branch = ENGINEERING_BRANCHES.find((b) => b.id === profile.engineeringBranch);
    const stage = HIGHER_EDUCATION_STAGES.find((s) => s.id === profile.higherStage);
    const branchTitle =
      branch && branch.id !== 'general' ? branch.label : stage?.label ?? 'Higher Education';
    return {
      eyebrow: `${levelLabel}${subj ? ` · ${subj.name}` : ''}${chapterNote} · Quantitative Practical Suite`,
      heading: subj
        ? `${branchTitle} · ${subj.name} Laboratory`
        : `${branchTitle} Practical & Quantitative Campus`,
      subtitle:
        branch && branch.id !== 'general'
          ? `Tailored for ${branch.label}: ${branch.coreFocus}. Every wing enforces apparatus wiring checks, SI calculations, and error analysis.`
          : `${stage?.guidance ?? ''} Focus: ${stage?.mathDepth ?? 'quantitative experimentation'}.`,
      levelLabel,
      tier,
      recommendedExperimentId: rec.experimentId,
      recommendedDepartment: rec.department,
    };
  }

  const track = RESEARCH_TRACK_DETAILS.find((r) => r.id === profile.researchTrack);
  return {
    eyebrow: `Master’s / PhD Research Division · ${track?.label ?? 'Research'}${chapterNote}`,
    heading: `${track?.label ?? 'Scientific'} Research & Instrumentation Campus`,
    subtitle: `${track?.empiricalBoundaryNote ?? ''} Key equations: ${track?.coreEquations.join(' | ') ?? 'Quantitative mathematical solvers'} with explicit model limitations and Research Notebook integration.`,
    levelLabel,
    tier,
    recommendedExperimentId: rec.experimentId,
    recommendedDepartment: rec.department,
  };
}

const ADVANCED_INSTRUMENT_IDS = new Set([
  'chem-analytical-balance',
  'chem-conductivity-meter',
  'chem-distillation',
  'chem-burette',
  'chem-magnetic-stirrer',
  'phys-oscilloscope',
  'phys-wave-generator',
  'phys-resonance-tube',
  'phys-calorimeter',
  'biotech-pcr-concept',
  'biotech-gel-electrophoresis',
  'biotech-centrifuge',
  'biotech-biomolecule',
  'mb-biosafety-hood',
  'mb-incubator',
  'mb-colony-counter',
  'elec-oscilloscope',
  'elec-signal-gen',
  'astro-spectroscope',
]);

const SECONDARY_OR_ABOVE_IDS = new Set([
  'chem-ph-meter',
  'chem-conical-flask',
  'chem-volumetric-flask',
  'chem-pipette',
  'chem-micropipette',
  'chem-crucible',
  'phys-dc-supply',
  'phys-ammeter',
  'phys-voltmeter',
  'phys-resistor',
  'phys-optical-bench',
  'phys-ray-box',
  'phys-lenses',
  'phys-prism',
  'phys-photometer',
  'phys-track',
  'phys-trolley',
  'phys-force-sensor',
  'bio-par-probe',
  'eng-microcontroller',
  'eng-servo',
  'elec-dc-supply',
  'elec-resistor-kit',
  'elec-capacitor-diode',
  'elec-multimeter',
]);

export function getInstrumentTier(inst: LabInstrument): EducationalTier {
  if (inst.minTier) return inst.minTier;
  if (
    inst.department === 'biotechnology' ||
    inst.department === 'microbiology' ||
    ADVANCED_INSTRUMENT_IDS.has(inst.id)
  ) {
    return inst.id === 'biotech-dna-model' || inst.id === 'mb-agar-plates' ? 'secondary' : 'higher';
  }
  if (SECONDARY_OR_ABOVE_IDS.has(inst.id)) {
    return 'secondary';
  }
  return 'primary';
}

const TIER_RANK: Record<EducationalTier, number> = {
  primary: 1,
  secondary: 2,
  higher: 3,
  research: 4,
};

export function filterInstrumentsForProfile(
  instruments: LabInstrument[],
  profile: AcademicProfile
): LabInstrument[] {
  const userRank = TIER_RANK[getEducationalTier(profile)];
  return instruments.filter((inst) => TIER_RANK[getInstrumentTier(inst)] <= userRank);
}

const EXPERIMENT_TIER_MAP: Record<string, EducationalTier> = {
  'mass-volume-density': 'primary',
  'force-acceleration': 'primary',
  'pendulum-period': 'primary',
  'plant-growth-model': 'primary',
  'boiling-point': 'primary',
  'acid-ph': 'secondary',
  'voltage-current': 'secondary',
  'photosynthesis-rate': 'secondary',
  'light-distance': 'secondary',
  'thin-lens-optics': 'secondary',
  'newtons-cooling': 'higher',
  'reaction-rate': 'higher',
  'acid-base-titration': 'higher',
  'rc-circuit-decay': 'higher',
  'half-life-decay': 'higher',
  'beer-lambert': 'higher',
  'michaelis-menten': 'research',
  'bacterial-growth': 'research',
};

const EXPERIMENT_DEPARTMENT_MAP: Record<string, LabDepartmentId[]> = {
  'boiling-point': ['chemistry', 'physics'],
  'acid-ph': ['chemistry', 'environmental'],
  'reaction-rate': ['chemistry', 'biotechnology'],
  'pendulum-period': ['physics', 'astronomy', 'math'],
  'force-acceleration': ['physics', 'engineering'],
  'voltage-current': ['physics', 'electronics', 'engineering'],
  'mass-volume-density': ['chemistry', 'math', 'engineering'],
  'light-distance': ['physics', 'astronomy'],
  'photosynthesis-rate': ['biology', 'environmental'],
  'newtons-cooling': ['physics', 'engineering'],
  'acid-base-titration': ['chemistry'],
  'michaelis-menten': ['biotechnology', 'chemistry'],
  'beer-lambert': ['biotechnology', 'chemistry'],
  'bacterial-growth': ['microbiology', 'biotechnology'],
  'rc-circuit-decay': ['electronics', 'physics'],
  'thin-lens-optics': ['physics'],
  'half-life-decay': ['physics', 'chemistry'],
  'plant-growth-model': ['biology', 'environmental'],
};

export function getExperimentTier(expId: string): EducationalTier {
  return EXPERIMENT_TIER_MAP[expId] ?? 'secondary';
}

export function getExperimentDepartments(expId: string): LabDepartmentId[] {
  return EXPERIMENT_DEPARTMENT_MAP[expId] ?? ['physics'];
}

export function filterExperimentsForProfile(
  profile: AcademicProfile,
  opts?: { department?: LabDepartmentId; includeHigher?: boolean }
): ExperimentDefinition[] {
  const userRank = TIER_RANK[getEducationalTier(profile)];
  return EXPERIMENTS.filter((exp) => {
    const tierOk = opts?.includeHigher || TIER_RANK[getExperimentTier(exp.id)] <= userRank;
    const deptOk = !opts?.department || getExperimentDepartments(exp.id).includes(opts.department);
    return tierOk && deptOk;
  });
}

export function inferCatalogEntryTier(entry: CurriculumExperimentEntry): EducationalTier {
  if (entry.minTier) return entry.minTier;
  const g = entry.gradeLevel.toLowerCase();
  if (/(class\s*5|class\s*6|classes\s*5|classes\s*6|class\s*7)/.test(g)) return 'primary';
  if (/(class\s*8|class\s*9|class\s*10|classes\s*7|classes\s*8|classes\s*9|classes\s*10)/.test(g)) return 'secondary';
  if (/(phd|m\.sc|msc|m\.tech|mtech|postgrad)/.test(g) || entry.board === 'Advanced Science') return 'research';
  return 'higher';
}

export function filterCatalogForProfile(
  profile: AcademicProfile,
  department?: LabDepartmentId
): CurriculumExperimentEntry[] {
  const userRank = TIER_RANK[getEducationalTier(profile)];
  return CURRICULUM_EXPERIMENT_CATALOG.filter((entry) => {
    const entryRank = TIER_RANK[inferCatalogEntryTier(entry)];
    const tierOk = entryRank <= userRank;
    const deptOk = !department || entry.department === department;
    const boardOk =
      !profile.selectedBoard ||
      profile.selectedBoard === 'All' ||
      entry.board === (profile.selectedBoard as CurriculumBoard) ||
      profile.activeDivision !== 'school';
    return tierOk && deptOk && boardOk;
  });
}

export function getCatalogMetrics(entries = CURRICULUM_EXPERIMENT_CATALOG) {
  const validatedInteractiveCount = entries.filter((e) => e.modelTier === 'implemented').length;
  const guidedCount = entries.filter((e) => e.modelTier === 'guided').length;
  const conceptualCount = entries.filter((e) => e.modelTier === 'conceptual').length;
  const plannedCount = entries.filter((e) => e.modelTier === 'planned').length;
  return {
    total: entries.length,
    validatedInteractiveCount,
    guidedCount,
    conceptualCount,
    plannedCount,
  };
}

const WING_CHAPTERS_BY_TIER: Record<LabDepartmentId, Record<EducationalTier, string[]>> = {
  chemistry: {
    primary: ['Materials Around Us & Density', 'Water, Heating & Dissolving', 'Household Acids & Bases'],
    secondary: ['Matter in Our Surroundings', 'Acids, Bases and Salts (pH)', 'Chemical Reactions & Metals'],
    higher: ['Volumetric Acid–Base Titration', 'Chemical Kinetics (Arrhenius)', 'Vapour–Liquid Equilibrium'],
    research: ['Potentiometric Equilibria', 'Transition-State Activation Barriers', 'Spectrophotometric Trace Assay'],
  },
  physics: {
    primary: ['Push, Pull & Motion', 'Floating, Measurement & Time', 'Light & Shadows'],
    secondary: ['Force & Laws of Motion', 'Simple Pendulum & Gravitation', 'Electricity (Ohm’s Law) & Lenses'],
    higher: ['Thermal Relaxation (Newton Cooling)', 'Gaussian Ray Optics & Photometry', 'First-Order Decay Kinetics'],
    research: ['Small-Angle Harmonic Deviations', 'Radiative Attenuation & Calorimetry', 'Transient Boundary Modeling'],
  },
  biology: {
    primary: ['Plant Growth Needs (Light & Water)', 'Seeds, Leaves & Roots', 'Observing Everyday Living Things'],
    secondary: ['Fundamental Unit of Life (Microscopy)', 'Photosynthesis & Stomata', 'Respiration & Transport'],
    higher: ['Photosynthetic Light-Saturation Curves', 'Multi-Factor Plant Productivity', 'Cellular Ultrastructure'],
    research: ['Limiting-Factor Biomass Kinetics', 'Photophysiological Saturation Bounds', 'High-Resolution Cytology'],
  },
  environmental: {
    primary: ['Clean Water & Simple Filtration', 'Rain, Soil & Plant Care', 'Weather Measurement'],
    secondary: ['Water Quality & pH Testing', 'Ecosystem Energy Capture', 'Acid Rain & Buffering'],
    higher: ['Watershed Acidity Buffering', 'Canopy Irradiance & Carbon Uptake', 'Environmental Sensor Calibration'],
    research: ['Photosynthetic Carbon Flux Bounds', 'Hydrochemical pH Perturbation', 'Ecological Limiting Kinetics'],
  },
  engineering: {
    primary: ['Simple Machines (Levers & Pulleys)', 'Measuring Weight & Volume', 'Safe Structures'],
    secondary: ['Force, Load & Cart Motion', 'Basic Robotics & Motors', 'Material Density Screening'],
    higher: ['Mechatronic PWM Actuation', 'Newtonian Load & Efficiency', 'Thermal Insulation Screening'],
    research: ['Dynamic Actuator Torque Curves', 'Composite Material Metrology', 'Control Loop Diagnostics'],
  },
  astronomy: {
    primary: ['Day, Night & Solar System Planets', 'Gravity on the Moon vs Earth', 'Simple Telescopes'],
    secondary: ['Gravitation & Pendulum Across Worlds', 'Light Distance Attenuation', 'Rocket Action–Reaction'],
    higher: ['Inverse-Square Solar Irradiance', 'Planetary Surface Gravity Comparisons', 'Optical Spectroscopy Concepts'],
    research: ['Radiative Flux Modelling', 'Planetary Environmental Mechanics', 'Spectral Attenuation Analysis'],
  },
  math: {
    primary: ['SI Units, Mass & Volume Ratios', 'Reading Bar & Line Graphs', 'Right Triangles'],
    secondary: ['Linear Graphs & Slope (ρ = m/V)', 'Proportionality & Algebra in Science', 'Sorting & Search Logic'],
    higher: ['Regression & Linearization (T² vs L)', '22 Executable Algorithms', 'UCI Machine Learning Pipelines'],
    research: ['Non-linear Parameter Fitting', 'Algorithm Complexity Verification', 'Bioinformatics Sequence Entropy'],
  },
  biotechnology: {
    primary: ['How Living Cells Work (Intro)', 'DNA Model Discovery'],
    secondary: ['DNA Structure Concepts', 'Micro-Volume Pipetting Basics', 'Enzyme Catalysis Intro'],
    higher: ['Beer–Lambert UV-Vis DNA Assay', 'Enzyme Temperature Kinetics', 'PCR & Gel Concepts'],
    research: ['Michaelis–Menten Km/Vmax Enzymology', 'Spectrophotometric Linearity Limits', 'Molecular Assay Calibration'],
  },
  microbiology: {
    primary: ['Helpful & Harmful Microbes (Concepts)', 'Microscope Exploration'],
    secondary: ['Observing Microorganisms Safely', 'Sterile Hygiene & Food Science', 'Colony Observation'],
    higher: ['Logistic Bacterial Growth Curve', 'Doubling Time g = ln(2)/r', 'Biosafety Cabinet Principles'],
    research: ['Batch Carrying-Capacity Modeling', 'Monod Substrate Bounds', 'BSL-1/2 Sterile Containment Protocol'],
  },
  electronics: {
    primary: ['Torch Bulb, Switch & Battery Cell', 'Conductors vs Insulators'],
    secondary: ['Ohm’s Law (V = I·R) Circuits', 'Series vs Parallel Resistance', 'Safe Low-Voltage Wiring'],
    higher: ['RC Charging & Discharging (τ = RC)', 'Oscilloscope Signal Analysis', 'Multimeter Diagnostics'],
    research: ['Impedance Loading & Attenuation', 'First-Order Transient Filtering', 'Transducer Signal Conditioning'],
  },
};

export function getWingProfileContext(
  room: LabRoomDefinition,
  profile: AcademicProfile
): WingProfileContext {
  const tier = getEducationalTier(profile);
  const levelLabel = getLevelDisplayLabel(profile);

  const allWingTools = LAB_INSTRUMENTS.filter((i) => i.department === room.id);
  const levelEquipment = filterInstrumentsForProfile(allWingTools, profile);
  const allWingCatalog = CURRICULUM_EXPERIMENT_CATALOG.filter((c) => c.department === room.id);
  const levelCatalog = allWingCatalog.filter(
    (entry) => TIER_RANK[inferCatalogEntryTier(entry)] <= TIER_RANK[tier]
  );

  const validatedModelCount = levelCatalog.filter(
    (e) => e.modelTier === 'implemented' || e.modelTier === 'guided'
  ).length;
  const conceptualCount = levelCatalog.filter((e) => e.modelTier === 'conceptual').length;

  const chapters = WING_CHAPTERS_BY_TIER[room.id][tier];
  const divDef = EDUCATION_DIVISIONS[profile.activeDivision];
  const relevantSubjects = divDef.subjects
    .filter((s) => s.department === room.id)
    .map((s) => s.name);

  const purposeAtLevel =
    tier === 'primary'
      ? `Foundation discovery bench for ${levelLabel}: safe visual apparatus, everyday measurements, and step-by-step guided observations.`
      : tier === 'secondary'
        ? `School practical laboratory for ${levelLabel}: syllabus-aligned apparatus assembly, prediction checks, and deterministic graphs.`
        : tier === 'higher'
          ? `Quantitative academic laboratory for ${levelLabel}: rigorous equations, circuit/thermal wiring verification, and multi-trial data analysis.`
          : `Advanced research workstation (${levelLabel}): analytical instruments, parameter boundary auditing, and Research Notebook documentation.`;

  const suggestedActivities = levelCatalog.slice(0, 3).map((e) => e.title);
  if (suggestedActivities.length === 0) {
    suggestedActivities.push(`Inspect ${levelEquipment[0]?.name ?? room.shortName} principles & apparatus setup`);
  }

  return {
    wingId: room.id,
    adaptedSubtitle: `${purposeAtLevel}`,
    purposeAtLevel,
    relevantSubjects: relevantSubjects.length > 0 ? relevantSubjects : [room.shortName],
    syllabusChapters: chapters,
    levelExperiments: levelCatalog,
    validatedModelCount,
    conceptualCount,
    levelEquipment: levelEquipment.length > 0 ? levelEquipment : allWingTools.slice(0, 4),
    suggestedActivities,
    safetyFocus: room.safetyZoneNote,
    simulationCapabilitiesLabel: `${validatedModelCount} simulation-linked · ${conceptualCount} conceptual · ${levelEquipment.length} level-fit tools`,
  };
}
