import type {
  EducationDivision,
  HigherStage,
  LabDepartmentId,
  PageId,
  ResearchTrack,
  SchoolClassLevel,
} from '../types/science';

export interface DivisionNavItem {
  id: string;
  label: string;
  page: PageId;
  subjectId?: string;
  department?: LabDepartmentId;
  experimentId?: string;
  badge?: string;
}

export interface DivisionSubjectSpec {
  id: string;
  name: string;
  department: LabDepartmentId;
  summary: string;
  keyTopics: string[];
  recommendedExperimentId: string;
  tutorPrompt: string;
}

export interface DivisionDefinition {
  id: EducationDivision;
  title: string;
  shortTitle: string;
  subtitle: string;
  audienceLabel: string;
  accentHex: string;
  description: string;
  navItems: DivisionNavItem[];
  topHeaderPages: { label: string; page: PageId; department?: LabDepartmentId; experimentId?: string }[];
  subjects: DivisionSubjectSpec[];
  featuredExperimentIds: string[];
  allowedDepartments: LabDepartmentId[];
}

export const SCHOOL_CLASS_LEVELS: {
  id: SchoolClassLevel;
  label: string;
  ageRange: string;
  mathDepth: string;
  guidance: string;
}[] = [
  {
    id: 'class-5',
    label: 'Class 5',
    ageRange: '10–11 yrs',
    mathDepth: 'Arithmetic, measurements, simple ratios & visual comparisons',
    guidance: 'Everyday examples, visual analogies, step-by-step safety habits, no abstract algebra.',
  },
  {
    id: 'class-6',
    label: 'Class 6',
    ageRange: '11–12 yrs',
    mathDepth: 'Unit conversions (cm/m, g/kg), averages & simple bar/line charts',
    guidance: 'Introduces circuits, light shadows, mixtures, magnets, and cellular basics.',
  },
  {
    id: 'class-7',
    label: 'Class 7',
    ageRange: '12–13 yrs',
    mathDepth: 'Direct proportionality, heat scales (°C), acids/bases pH indicators',
    guidance: 'Connects indicator color shifts, speed-time slopes, and plant nutrition.',
  },
  {
    id: 'class-8',
    label: 'Class 8',
    ageRange: '13–14 yrs',
    mathDepth: 'Linear graphs, force-pressure formulas, microorganism structures',
    guidance: 'Guided experimental predictions, force balance, metals vs non-metals displacement.',
  },
  {
    id: 'class-9',
    label: 'Class 9',
    ageRange: '14–15 yrs',
    mathDepth: 'Kinematics equations, F = ma, Newton cooling trend, atomic/molar mass',
    guidance: 'Quantitative trial logging, error comparison, phase change thermodynamics.',
  },
  {
    id: 'class-10',
    label: 'Class 10',
    ageRange: '15–16 yrs',
    mathDepth: 'Ohm’s Law V = IR, logarithmic pH basics, chemical equations & lens geometry',
    guidance: 'Board-exam practical readiness with full circuit, titration & optics checks.',
  },
];

export const HIGHER_EDUCATION_STAGES: {
  id: HigherStage;
  label: string;
  mathDepth: string;
  guidance: string;
}[] = [
  {
    id: 'class-11-12',
    label: 'Classes 11–12 / PUC / Intermediate',
    mathDepth: 'Differential rates, Beer-Lambert absorbance, IAPWS boiling data, Arrhenius activation energy',
    guidance: 'Bridges school concepts to quantitative physical chemistry, rotational/SHM physics & molecular genetics.',
  },
  {
    id: 'diploma',
    label: 'Diploma / Technical Track',
    mathDepth: 'Applied instrumentation calibration, circuit nodal analysis, tolerance & uncertainty ±Δ',
    guidance: 'Focuses on lab equipment setup, troubleshooting, tolerance margins & industrial safety standards.',
  },
  {
    id: 'undergraduate',
    label: 'Degree (B.Sc. / B.Tech / B.E. / B.Pharm)',
    mathDepth: 'Michaelis-Menten enzyme kinetics, logistic microbial curves, error propagation & regression R²',
    guidance: 'Independent experiment design, variable isolation, What-If regime exploration & structured reporting.',
  },
  {
    id: 'postgrad-intro',
    label: 'Postgraduate Introductory Bridge',
    mathDepth: 'Multi-parameter non-linear regimes, spectroscopic calibration & bioinformatics sequence metrics',
    guidance: 'Prepares learners for hypothesis-driven experimental validation and transparent model limitation auditing.',
  },
];

export const RESEARCH_TRACK_DETAILS: {
  id: ResearchTrack;
  label: string;
  department: LabDepartmentId;
  keyInstruments: string[];
  coreEquations: string[];
  empiricalBoundaryNote: string;
}[] = [
  {
    id: 'biotechnology',
    label: 'Biotechnology',
    department: 'biotechnology',
    keyInstruments: ['PCR Thermal Cycler (Concept)', 'Agarose Gel Electrophoresis', 'UV-Vis Spectrophotometer', 'Micropipette Rack'],
    coreEquations: ['N = N₀ · 2ⁿ (PCR amplification)', 'A = ε · l · c (DNA/Protein quantification at 260/280 nm)'],
    empiricalBoundaryNote: 'Educational simulation models ideal amplification & absorbance; wet-lab PCR yields depend on primer efficiency & inhibitors.',
  },
  {
    id: 'molecular-biology',
    label: 'Molecular Biology',
    department: 'biotechnology',
    keyInstruments: ['UV-Vis Spectrophotometer', 'Electrophoresis Rig', 'Digital Fluorescence Microscope'],
    coreEquations: ['Tm ≈ 4(G+C) + 2(A+T) °C (short oligo)', 'A₂₆₀/A₂₈₀ purity ratio benchmark (~1.8 DNA, ~2.0 RNA)'],
    empiricalBoundaryNote: 'Base-pairing and thermodynamic estimates are educational; benchtop melt curves require real-time fluorometry.',
  },
  {
    id: 'genetics',
    label: 'Genetics',
    department: 'biology',
    keyInstruments: ['Optic Compound Microscope', 'Genetic Inheritance & Codon Kit'],
    coreEquations: ['p² + 2pq + q² = 1 (Hardy–Weinberg Equilibrium)', 'Chi-square χ² goodness-of-fit'],
    empiricalBoundaryNote: 'Classical Mendelian & Hardy-Weinberg ratios assume zero selection, drift, or linkage.',
  },
  {
    id: 'bioinformatics',
    label: 'Bioinformatics',
    department: 'math',
    keyInstruments: ['Sequence Aligner & Codon Console', 'Algorithm & ML Workbench'],
    coreEquations: ['GC% = (G + C) / Length × 100', 'Shannon Entropy H = −Σ pᵢ log₂(pᵢ)'],
    empiricalBoundaryNote: 'Sequence transcription, GC metrics & ORF scanning are deterministically computed on user sequences; annotation requires curated databases.',
  },
  {
    id: 'microbiology',
    label: 'Microbiology',
    department: 'microbiology',
    keyInstruments: ['Class II Biosafety Cabinet (Virtual)', 'Shaking Incubator', 'Colony Counter', 'Phase-Contrast Microscope'],
    coreEquations: ['N(t) = K / (1 + ((K − N₀)/N₀)e^(−rt))', 'Doubling time g = ln(2)/μ'],
    empiricalBoundaryNote: 'Educational logistic growth only; sterile wet-lab culturing requires biosafety supervision and autoclaving.',
  },
  {
    id: 'biochemistry',
    label: 'Biochemistry',
    department: 'biotechnology',
    keyInstruments: ['UV-Vis Cuvettes & Detector', 'pH Electrode', 'Thermostatic Water Bath'],
    coreEquations: ['v = V_max [S] / (K_m + [S]) (Michaelis–Menten)', 'pH = pKₐ + log₁₀([A⁻]/[HA]) (Henderson–Hasselbalch)'],
    empiricalBoundaryNote: 'Assumes steady-state Briggs–Haldane approximation with negligible substrate depletion during initial rate.',
  },
  {
    id: 'analytical-chemistry',
    label: 'Analytical Chemistry',
    department: 'chemistry',
    keyInstruments: ['Analytical Balance (0.1 mg)', '50 mL Class A Burette', 'UV-Vis Spectrophotometer', 'Digital pH Meter'],
    coreEquations: ['A = ε · l · c', 'nₐ Cₐ Vₐ = n_b C_b V_b', 'pH = −log₁₀([H⁺])'],
    empiricalBoundaryNote: 'Assumes ideal dilute activity coefficients γ ≈ 1; real assays require calibration curves and blank correction.',
  },
  {
    id: 'materials-science',
    label: 'Materials Science',
    department: 'engineering',
    keyInstruments: ['Precision Mass & Density Balance', 'Calipers & Truss Tensile Tester', 'Thermal Conductivity Assembly'],
    coreEquations: ['ρ = m / V', 'σ = F / A,  E = σ / ε'],
    empiricalBoundaryNote: 'Linear elastic and homogeneous density assumptions apply within tested load intervals.',
  },
  {
    id: 'nanotechnology',
    label: 'Nanotechnology Concepts',
    department: 'biotechnology',
    keyInstruments: ['Surface-Area-to-Volume Modeller', 'UV-Vis Scattering Analyzer'],
    coreEquations: ['SA/V (sphere) = 3 / r', 'Beer-Lambert attenuation in colloidal suspensions'],
    empiricalBoundaryNote: 'Conceptual scaling law and optical extinction illustration; quantum confinement requires cryo/TEM empirical validation.',
  },
  {
    id: 'advanced-physics',
    label: 'Advanced Physics',
    department: 'physics',
    keyInstruments: ['Optical Bench & Photometer', 'Oscillation Rig', 'Thermal Calorimeter'],
    coreEquations: ['I(r) = I₀(r₀/r)²', 'T = 2π√(L/g)', 'T(t) = Tₐ + (T₀ − Tₐ)e^(−kt)'],
    empiricalBoundaryNote: 'Idealised boundary conditions (e.g., small-angle SHM < 15°, point-source radiation, lumped thermal capacitance).',
  },
  {
    id: 'electronics-instrumentation',
    label: 'Electronics & Instrumentation',
    department: 'electronics',
    keyInstruments: ['Dual-Trace Oscilloscope', 'Signal Generator', 'Regulated DC Supply', 'Solderless Breadboard'],
    coreEquations: ['V = I · R', 'τ = R · C', 'f_c = 1 / (2πRC)'],
    empiricalBoundaryNote: 'Idealized passive components without parasitic trace inductance; real circuit debugging requires current limiting.',
  },
  {
    id: 'environmental-research',
    label: 'Environmental Research',
    department: 'environmental',
    keyInstruments: ['Multi-Parameter Water Probe', 'Soil pH & Moisture Sensor', 'Air Quality / CO₂ Monitor'],
    coreEquations: ['Photosynthetic Michaelis saturation P = P_max I / (K + I)', 'BOD / turbidity attenuation approximations'],
    empiricalBoundaryNote: 'Simplified environmental subsystem simulations clearly distinct from multi-site field hydrology monitoring.',
  },
  {
    id: 'advanced-engineering',
    label: 'Advanced Engineering',
    department: 'engineering',
    keyInstruments: ['Microcontroller Testbench', 'Motor/Servo Torque Bench', 'ML & Optimization Suite'],
    coreEquations: ['τ = F · r', 'F_net = m · a', 'Efficiency η = P_out / P_in'],
    empiricalBoundaryNote: 'Deterministic rigid-body and DC actuator dynamics; frictionless/steady-state regimes clearly tagged.',
  },
];

export const EDUCATION_DIVISIONS: Record<EducationDivision, DivisionDefinition> = {
  school: {
    id: 'school',
    title: 'School Science (Classes 5 to 10)',
    shortTitle: 'School Science (5–10)',
    subtitle: 'Guided laboratories, visual experiments, labelled equipment and friendly step-by-step AI tutoring.',
    audienceLabel: 'Classes 5 – 10',
    accentHex: '#1D4ED8',
    description:
      'Designed for school learners with clear safety habits, everyday scientific explanations, guided Chemistry, Physics & Biology benches, interactive videos, and Class 5–10 difficulty levels.',
    navItems: [
      { id: 'sch-home', label: 'Home', page: 'division-home' },
      { id: 'sch-lab', label: 'My Lab', page: 'virtual-lab' },
      { id: 'sch-subj', label: 'Subjects', page: 'subjects' },
      { id: 'sch-tutor', label: 'AI Tutor', page: 'lab-tutor' },
      { id: 'sch-guided', label: 'Guided Experiments', page: 'virtual-lab', experimentId: 'boiling-point' },
      { id: 'sch-equip', label: 'Equipment Explorer', page: 'inventory-explorer' },
      { id: 'sch-chal', label: 'Challenges', page: 'challenges' },
      { id: 'sch-my', label: 'My Experiments', page: 'my-learning' },
      { id: 'sch-prog', label: 'Progress', page: 'achievements' },
      { id: 'sch-safe', label: 'Safety', page: 'safety' },
    ],
    topHeaderPages: [
      { label: 'Home', page: 'division-home' },
      { label: 'My Laboratory', page: 'virtual-lab' },
      { label: 'AI Tutor', page: 'lab-tutor' },
      { label: 'Subjects', page: 'subjects' },
      { label: 'Equipment', page: 'inventory-explorer' },
    ],
    subjects: [
      { id: 'physics', name: 'Physics', department: 'physics', summary: 'Forces, motion, simple pendulum, light & safe DC electricity.', keyTopics: ['Pendulum Motion', 'Force & Push/Pull', 'Light Brightness', 'Simple Circuits'], recommendedExperimentId: 'pendulum-period', tutorPrompt: 'Explain how pendulum length changes its swing time' },
      { id: 'chemistry', name: 'Chemistry', department: 'chemistry', summary: 'States of matter, water boiling on mountains, acids/bases & safe displacements.', keyTopics: ['Boiling at Altitude', 'Acids & Indicators', 'Density (m/V)', 'Iron + Copper Sulphate'], recommendedExperimentId: 'boiling-point', tutorPrompt: 'Why does water boil faster at 75°C on high mountains?' },
      { id: 'biology', name: 'Biology', department: 'biology', summary: 'Microscope cell structures, photosynthesis in leaves & respiration.', keyTopics: ['Onion & Plant Cells', 'Chlorophyll & Light', 'Microscope Parts'], recommendedExperimentId: 'photosynthesis-rate', tutorPrompt: 'How do plants turn sunlight and water into food?' },
      { id: 'mathematics', name: 'Mathematics', department: 'math', summary: 'Pythagoras triangles, reading line graphs, units & ratios.', keyTopics: ['Pythagoras Theorem', 'Graph Slopes', 'SI Unit Measurement'], recommendedExperimentId: 'mass-volume-density', tutorPrompt: 'Show Pythagoras theorem with a 3-4-5 right triangle' },
      { id: 'environmental', name: 'Environmental Science', department: 'environmental', summary: 'Clean water filtration, soil pH, weather & local ecosystem health.', keyTopics: ['Water Filtration', 'Soil & Rain pH', 'Air Quality'], recommendedExperimentId: 'acid-ph', tutorPrompt: 'How does acid rain lower pond pH?' },
      { id: 'astronomy', name: 'Astronomy', department: 'astronomy', summary: 'Planets, Earth vs Moon gravity, moon phases & telescope optics.', keyTopics: ['Moon vs Earth Gravity', 'Solar System Scale', 'Star Spectra'], recommendedExperimentId: 'pendulum-period', tutorPrompt: 'What happens to a pendulum if we take it to the Moon?' },
      { id: 'electronics', name: 'Basic Electronics', department: 'electronics', summary: 'Battery cells, switches, glowing LEDs & Ohm’s Law.', keyTopics: ['Closed Circuit Loops', 'Resistors & LEDs', 'Safe Low-Voltage DC'], recommendedExperimentId: 'voltage-current', tutorPrompt: 'Explain Voltage, Current and Resistance like water pipes' },
      { id: 'engineering', name: 'Basic Engineering', department: 'engineering', summary: 'Pulleys, inclined ramps, sturdy bridge trusses & simple motors.', keyTopics: ['Simple Machines', 'Gears & Torque', 'Safe Robotics'], recommendedExperimentId: 'force-acceleration', tutorPrompt: 'Why does a heavier cart need more push to speed up?' },
    ],
    featuredExperimentIds: ['boiling-point', 'pendulum-period', 'acid-ph', 'voltage-current', 'photosynthesis-rate', 'mass-volume-density'],
    allowedDepartments: ['chemistry', 'physics', 'biology', 'math', 'environmental', 'astronomy', 'electronics', 'engineering'],
  },

  higher: {
    id: 'higher',
    title: 'Higher Education (Classes 11–12, Diploma & Degree)',
    shortTitle: 'Higher Education',
    subtitle: 'Quantitative variables, uncertainty & regression analysis, What-If stress tests and independent design.',
    audienceLabel: 'Classes 11–12 · PUC · Diploma · B.Sc. / B.Tech / B.Pharm',
    accentHex: '#0F766E',
    description:
      'Built for Classes 11–12, PUC/Intermediate, Diploma, and Degree (B.Sc., B.Tech, B.E., B.Pharm) students requiring mathematical rigor, stoichiometric titrations, error bounds, algorithm/ML labs, and independent experiment design.',
    navItems: [
      { id: 'he-dash', label: 'Dashboard', page: 'division-home' },
      { id: 'he-labs', label: 'Advanced Labs', page: 'virtual-lab' },
      { id: 'he-subj', label: 'Subjects', page: 'subjects' },
      { id: 'he-prac', label: 'Practical Experiments', page: 'virtual-lab', experimentId: 'acid-base-titration' },
      { id: 'he-inv', label: 'Equipment Inventory', page: 'inventory-explorer' },
      { id: 'he-build', label: 'Experiment Builder', page: 'creator' },
      { id: 'he-whatif', label: 'What-If Studio', page: 'what-if' },
      { id: 'he-graphs', label: 'Graphs', page: 'innovation-suite' },
      { id: 'he-rep', label: 'Lab Reports', page: 'research-notebook' },
      { id: 'he-my', label: 'My Experiments', page: 'my-learning' },
    ],
    topHeaderPages: [
      { label: 'Higher Ed Home', page: 'division-home' },
      { label: 'Advanced Labs', page: 'virtual-lab' },
      { label: 'Academic Tutor', page: 'lab-tutor' },
      { label: 'Experiment Builder', page: 'creator' },
      { label: 'What-If Studio', page: 'what-if' },
    ],
    subjects: [
      { id: 'physics', name: 'Physics', department: 'physics', summary: 'SHM, Newtonian dynamics, radiative/inverse-square optics & thermodynamics.', keyTopics: ['Small-Angle SHM Derivation', 'Thermal Relaxation τ = 1/k', 'Inverse-Square Photometry'], recommendedExperimentId: 'newtons-cooling', tutorPrompt: 'Derive Newton’s Law of Cooling dT/dt = −k(T − Ta)' },
      { id: 'chemistry', name: 'Chemistry', department: 'chemistry', summary: 'Arrhenius kinetics, acid-base titration curves & IAPWS-IF97 vapour equilibrium.', keyTopics: ['Titration Equivalence Point', 'Arrhenius Activation Energy Ea', 'Clausius–Clapeyron Vapour Curve'], recommendedExperimentId: 'acid-base-titration', tutorPrompt: 'Calculate equivalence pH and enthalpy during HCl + NaOH titration' },
      { id: 'mathematics', name: 'Mathematics', department: 'math', summary: 'Linear regression, uncertainty propagation & numerical curve modeling.', keyTopics: ['Logarithmic & Power Scaling', 'R² Regression Diagnostics', 'Error Propagation'], recommendedExperimentId: 'mass-volume-density', tutorPrompt: 'How do you linearize T = 2π√(L/g) by plotting T² vs L?' },
      { id: 'biology', name: 'Biology', department: 'biology', summary: 'Photosynthetic saturation curves, cellular physiology & microscopy.', keyTopics: ['Michaelis Photosynthesis Saturation', 'Cell Organelle Ultrastructure', 'Diffusion Gradients'], recommendedExperimentId: 'photosynthesis-rate', tutorPrompt: 'Explain light-limited vs RuBisCO-saturated regimes in photosynthesis' },
      { id: 'biotechnology', name: 'Biotechnology Fundamentals', department: 'biotechnology', summary: 'Enzyme catalysis, gel electrophoresis principles & UV-Vis nucleic quantification.', keyTopics: ['Beer–Lambert UV-Vis A = εlc', 'Enzyme Km & Vmax', 'PCR Thermal Cycles'], recommendedExperimentId: 'beer-lambert', tutorPrompt: 'Explain how UV absorbance at 260 nm estimates solute concentration' },
      { id: 'microbiology', name: 'Microbiology Fundamentals', department: 'microbiology', summary: 'Exponential & logistic growth phases, aseptic technique & microscopy.', keyTopics: ['Lag/Log/Stationary Growth', 'Doubling Time g', 'Gram Differentiation'], recommendedExperimentId: 'bacterial-growth', tutorPrompt: 'Explain carrying capacity K in logistic bacterial growth' },
      { id: 'electronics', name: 'Electronics', department: 'electronics', summary: 'RC transient response, diode rectification, DC supply regulation & oscilloscope tracing.', keyTopics: ['Ohmic Network Analysis', 'RC Time Constant τ = RC', 'Oscilloscope Timebase'], recommendedExperimentId: 'voltage-current', tutorPrompt: 'Analyse V-I slope vs differential resistance in Ohmic components' },
      { id: 'computer-science', name: 'Computer Science', department: 'math', summary: '22 executable algorithms, sorting/graph complexity & live ML pipelines on UCI datasets.', keyTopics: ['Graph Shortest Paths', 'Divide & Conquer Complexity', 'Gradient Descent & SVMs'], recommendedExperimentId: 'pendulum-period', tutorPrompt: 'Trace Binary Search invariant O(log n) step-by-step' },
      { id: 'engineering', name: 'Engineering', department: 'engineering', summary: 'Applied statics, kinematics, mechatronic PWM actuation & dimensional verification.', keyTopics: ['Force Transducers', 'Mechatronic Control Loops', 'Material Density & Load'], recommendedExperimentId: 'force-acceleration', tutorPrompt: 'Relate net force, inertial mass, and braking work' },
      { id: 'environmental', name: 'Environmental Science', department: 'environmental', summary: 'Watershed pH buffering, turbidity & carbon uptake quantification.', keyTopics: ['Logarithmic Acid Buffering', 'Photometric Turbidity', 'Ecological Productivity'], recommendedExperimentId: 'acid-ph', tutorPrompt: 'Explain why a 10x dilution raises strong acid pH by 1.00 unit' },
      { id: 'astronomy', name: 'Astronomy', department: 'astronomy', summary: 'Gravitational oscillation across planets, spectral irradiance fall-off & orbital dynamics.', keyTopics: ['Planetary Surface Gravity g', 'Inverse-Square Flux Attenuation', 'Spectral Classification'], recommendedExperimentId: 'light-distance', tutorPrompt: 'Apply I(r) = I₀(r₀/r)² to solar flux at Mars (1.52 AU)' },
    ],
    featuredExperimentIds: ['acid-base-titration', 'reaction-rate', 'beer-lambert', 'newtons-cooling', 'voltage-current', 'bacterial-growth'],
    allowedDepartments: ['chemistry', 'physics', 'biology', 'biotechnology', 'microbiology', 'electronics', 'engineering', 'math', 'environmental', 'astronomy'],
  },

  research: {
    id: 'research',
    title: 'Advanced Research (Master’s, PhD & Specialisations)',
    shortTitle: 'Advanced Research',
    subtitle: 'Specialised life/physical science labs, analytical instrumentation principles, research notebook & strict empirical boundaries.',
    audienceLabel: 'Master’s · PhD · Research Specialisations',
    accentHex: '#6D28D9',
    description:
      'Provides specialised educational workstations across Biotechnology, Molecular Biology, Bioinformatics, Microbiology, Analytical Chemistry, and Materials Science—explicitly separating theoretical/educational simulations from certified empirical wet-lab measurements.',
    navItems: [
      { id: 'res-home', label: 'Research Home', page: 'division-home' },
      { id: 'res-labs', label: 'Research Labs', page: 'virtual-lab' },
      { id: 'res-spec', label: 'Specialisations', page: 'subjects' },
      { id: 'res-inst', label: 'Instrument Explorer', page: 'inventory-explorer' },
      { id: 'res-build', label: 'Research Builder', page: 'creator' },
      { id: 'res-data', label: 'Data Analysis', page: 'innovation-suite' },
      { id: 'res-note', label: 'Research Notebook', page: 'research-notebook' },
      { id: 'res-rep', label: 'Research Reports', page: 'my-learning' },
      { id: 'res-disc', label: 'Discoveries', page: 'discoveries' },
      { id: 'res-pers', label: 'My Personal Lab', page: 'personal-lab' },
    ],
    topHeaderPages: [
      { label: 'Research Dashboard', page: 'division-home' },
      { label: 'Specialised Labs', page: 'virtual-lab' },
      { label: 'Instruments', page: 'inventory-explorer' },
      { label: 'Research Notebook', page: 'research-notebook' },
      { label: 'Data & Bioinformatics', page: 'innovation-suite' },
    ],
    subjects: [
      { id: 'biotechnology', name: 'Biotechnology', department: 'biotechnology', summary: 'Enzyme kinetics, PCR amplification modeling & bioprocess yield bounds.', keyTopics: ['Michaelis–Menten Km/Vmax', 'Thermal Cycler Kinetics', 'UV-Vis Assay Validation'], recommendedExperimentId: 'michaelis-menten', tutorPrompt: 'Analyze substrate saturation kinetics when [S] >> Km vs [S] << Km' },
      { id: 'molecular-biology', name: 'Molecular Biology & Genetics', department: 'biotechnology', summary: 'Nucleic acid quantification (A260/A280), Tm estimation & central dogma expression.', keyTopics: ['Beer–Lambert DNA Assay', 'Electrophoretic Mobility', 'Primer Melting Temp Tm'], recommendedExperimentId: 'beer-lambert', tutorPrompt: 'Explain limitations of simple Wallace rule Tm estimation vs nearest-neighbor thermodynamics' },
      { id: 'bioinformatics', name: 'Bioinformatics', department: 'math', summary: 'Deterministic sequence transcription, ORF finding, GC% profiling & dynamic algorithms.', keyTopics: ['GC-Content Profiling', '6-Frame ORF Scan', 'Sequence Complexity Algorithms'], recommendedExperimentId: 'pendulum-period', tutorPrompt: 'How do dynamic programming matrices align biological sequences in O(mn)?' },
      { id: 'microbiology', name: 'Microbiology', department: 'microbiology', summary: 'Logistic population dynamics, doubling-time regimes & sterile biosafety modeling.', keyTopics: ['Baranyi / Logistic Growth Curves', 'Carrying Capacity K', 'Doubling Rate μ'], recommendedExperimentId: 'bacterial-growth', tutorPrompt: 'Contrast idealized logistic growth with nutrient-limited diauxic shift' },
      { id: 'biochemistry', name: 'Biochemistry', department: 'biotechnology', summary: 'Catalytic turnover, pH ionization equilibria & spectrophotometric enzyme assays.', keyTopics: ['Lineweaver–Burk Linearization Pitfalls', 'Buffers & Henderson–Hasselbalch', 'Absorbance Linearity'], recommendedExperimentId: 'michaelis-menten', tutorPrompt: 'Why does Michaelis–Menten saturation break down under substrate inhibition?' },
      { id: 'analytical-chemistry', name: 'Advanced & Analytical Chemistry', department: 'chemistry', summary: 'Trace absorbance linearity, potentiometric titration inflection & Arrhenius barriers.', keyTopics: ['Instrumental LOD / Linear Range', 'Potentiometric Inflection', 'Activation Energy Eyring Bounds'], recommendedExperimentId: 'beer-lambert', tutorPrompt: 'When does Beer–Lambert Law deviate at high solute concentration (> 0.01 M)?' },
      { id: 'materials-science', name: 'Materials & Nanotechnology Concepts', department: 'engineering', summary: 'Surface-area scaling, composite density metrology & thermal dissipation limits.', keyTopics: ['Nanoscale SA/V Ratio', 'Bulk vs Porous Density', 'Lumped Capacitance Bi < 0.1'], recommendedExperimentId: 'newtons-cooling', tutorPrompt: 'Explain Biot number assumptions in Newton thermal relaxation modeling' },
      { id: 'advanced-physics', name: 'Advanced Physics', department: 'physics', summary: 'Non-ideal phase equilibria, radiative flux falloff & damped harmonic bounds.', keyTopics: ['IAPWS-IF97 Saturation', 'Harmonic Anharmonicity', 'Wave Attenuation'], recommendedExperimentId: 'boiling-point', tutorPrompt: 'Explain anharmonic correction terms when pendulum amplitude exceeds 15°' },
      { id: 'electronics-instrumentation', name: 'Electronics & Instrumentation', department: 'electronics', summary: 'Signal acquisition SNR, RC filtering, impedance matching & transducer calibration.', keyTopics: ['RC Transfer Characteristics', 'Input Impedance Loading', 'Sensor Calibration Drift'], recommendedExperimentId: 'voltage-current', tutorPrompt: 'Explain voltmeter loading error when meter impedance approaches source R' },
      { id: 'environmental-research', name: 'Environmental Research', department: 'environmental', summary: 'Carbon fixation saturation models, acid buffering & anthropogenic trace impact.', keyTopics: ['Irradiance Saturation Curves', 'Carbonate Buffering Sensitivity', 'Trace Assay Models'], recommendedExperimentId: 'photosynthesis-rate', tutorPrompt: 'Discuss photoinhibition deviation beyond saturating PAR irradiance' },
    ],
    featuredExperimentIds: ['michaelis-menten', 'beer-lambert', 'bacterial-growth', 'acid-base-titration', 'reaction-rate', 'boiling-point'],
    allowedDepartments: ['biotechnology', 'microbiology', 'chemistry', 'physics', 'electronics', 'engineering', 'biology', 'environmental', 'astronomy', 'math'],
  },
};

export interface AdvancedInstrumentReference {
  id: string;
  name: string;
  department: LabDepartmentId;
  divisionMin: EducationDivision;
  workingPrinciple: string;
  components: string[];
  operatingParameters: string;
  measurementUnits: string;
  limitations: string;
  linkedModelId?: string;
}

export const ADVANCED_INSTRUMENT_GUIDES: AdvancedInstrumentReference[] = [
  {
    id: 'inst-uv-vis',
    name: 'Dual-Beam UV-Vis Spectrophotometer',
    department: 'biotechnology',
    divisionMin: 'higher',
    workingPrinciple: 'Passes monochromatic light (190–900 nm) through sample and reference cuvettes; measures transmitted photon intensity to compute absorbance A = log₁₀(I₀/I) = ε·l·c.',
    components: ['Deuterium / Tungsten Lamps', 'Diffraction Grating Monochromator', '1 cm Quartz Cuvette Holder', 'Photodiode Detector'],
    operatingParameters: 'Wavelength 190–900 nm · Optical path l = 1.0 cm · Stray light < 0.05%',
    measurementUnits: 'Absorbance (AU), Transmittance (%), nm, L·mol⁻¹·cm⁻¹',
    limitations: 'Beer–Lambert linearity fails above A ≈ 1.5–2.0 AU due to stray light, refractive index shifts, and molecular aggregation.',
    linkedModelId: 'beer-lambert',
  },
  {
    id: 'inst-pcr',
    name: 'Gradient PCR Thermal Cycler (Educational Model)',
    department: 'biotechnology',
    divisionMin: 'higher',
    workingPrinciple: 'Cycles Peltier aluminum sample block across Denaturation (~95 °C), Primer Annealing (50–65 °C), and Polymerase Extension (72 °C) to amplify target DNA segments exponentially.',
    components: ['Heated Condensation Lid (105 °C)', '96-Well Peltier Thermal Block', 'Microcontroller PID Ramp Controller'],
    operatingParameters: 'Block Temp 4–99 °C · Ramp 3–5 °C/s · 25–35 Cycles',
    measurementUnits: '°C, Cycles (n), Copy Amplification Fold (2ⁿ)',
    limitations: 'Virtual model illustrates theoretical exponential phase (N₀·2ⁿ); real plateau phase depends on dNTP exhaustion, polymerase half-life & primer dimers.',
    linkedModelId: 'michaelis-menten',
  },
  {
    id: 'inst-oscilloscope',
    name: 'Dual-Channel Digital Storage Oscilloscope (Educational)',
    department: 'electronics',
    divisionMin: 'higher',
    workingPrinciple: 'Digitizes time-varying voltage signals across high-impedance (1 MΩ || 15 pF) probes via ADC, triggering waveform display on calibrated Voltage/div and Time/div grids.',
    components: ['BNC 10× Probe Attenuator', 'Trigger Edge Comparator', 'High-Speed ADC & Memory Buffer', 'Graticule Display'],
    operatingParameters: 'Low-voltage bench signals (±24 V DC / ±10 Vpp safe) · 1 MΩ Input Impedance',
    measurementUnits: 'Volts/div (V, mV), Time/div (ms, µs, ns), Hz',
    limitations: 'Never connect non-isolated benchtop oscilloscopes to mains AC; virtual probe simulates ideal noiseless passive RL/RC/DC steady states.',
    linkedModelId: 'voltage-current',
  },
  {
    id: 'inst-biosafety',
    name: 'Class II Laminar-Flow Biosafety Cabinet & Phase Microscope',
    department: 'microbiology',
    divisionMin: 'higher',
    workingPrinciple: 'Vertical HEPA-filtered laminar airflow curtains protect both conceptual culture samples from contamination and operators, paired with phase-contrast optical microscopy for unstained microorganisms.',
    components: ['H14 HEPA Filter Plenum', 'Sash Barrier Interlock', 'Phase-Ring Condenser', '100× Oil Objective (Conceptual)'],
    operatingParameters: 'Laminar Inflow ~0.45 m/s · Virtual Growth Temp 20–42 °C',
    measurementUnits: 'CFU/mL, OD₆₀₀, µm (micrometers), Generation time (min)',
    limitations: 'Strictly conceptual & mathematical logistic growth modeling only—no live pathogenic culturing exists in this virtual simulator.',
    linkedModelId: 'bacterial-growth',
  },
  {
    id: 'inst-titration-bench',
    name: 'Potentiometric Auto-Titrator & Analytical pH Assembly',
    department: 'chemistry',
    divisionMin: 'school',
    workingPrinciple: 'Monitors H⁺ electrochemical potential at a hydrated glass membrane electrode (Nernst slope −59.16 mV/pH at 25 °C) during incremental strong-base neutralization.',
    components: ['Class A 50 mL Burette', 'Combination Glass pH Electrode', 'Magnetic PTFE Stirrer', 'Temperature Compensator'],
    operatingParameters: 'pH 0.00–14.00 · Volume 0–50.0 mL · 25 °C Reference',
    measurementUnits: 'pH, mL, mol/L (M), ΔH (kJ/mol)',
    limitations: 'Uses ideal strong-electrolyte activity γ = 1 with instantaneous thermal dissipation assumption.',
    linkedModelId: 'acid-base-titration',
  },
];
