import type { AchievementItem, InnovationItem, TeacherAssignment } from '../types/science';

// Community-approved showcase examples using anonymous student aliases only (zero PII or school locations)
export const SEED_PUBLIC_INNOVATIONS: InnovationItem[] = [
  {
    id: 'pub-innov-1',
    title: 'Two-Bucket Density Polymer Separator',
    category: 'Plastic waste',
    anonymousAlias: 'HydroLeaf_19',
    problemSolved:
      'Mixed plastic bottles and caps often end up landfilled together because manual sorting is slow.',
    scientificPrinciple:
      'Uses density contrast: HDPE and PP (~0.90–0.96 g/cm³) float in freshwater (~1.00 g/cm³) while PET (~1.38 g/cm³) sinks.',
    materialsAndDesign:
      'Recycled clear tub, mesh skimmer tray, and freshwater bath with zero electrical parts.',
    virtualPrototypeNotes:
      'Verified separation densities using Experiment 7 (Mass vs Volume & Density) before sketching.',
    status: 'approved',
    teacherFeedback: 'Verified safe physical principle and clear density table. Approved for public showcase.',
    safetyLevel: 'GREEN',
    createdAt: '2026-10-12T09:15:00.000Z',
    updatedAt: '2026-10-12T14:20:00.000Z',
  },
  {
    id: 'pub-innov-2',
    title: 'Zero-Power Clay Cooler for Rural Clinics',
    category: 'Low-cost healthcare solutions',
    anonymousAlias: 'NovaSpark_04',
    problemSolved:
      'Heat-sensitive supplies warm rapidly during midday power interruptions.',
    scientificPrinciple:
      'Double-wall porous terracotta with damp sand lowers ambient boundary temperature Ta and reduces effective cooling constant k.',
    materialsAndDesign:
      'Nested terracotta pots, washed sand layer, breathable cotton cover, digital thermometer probe.',
    virtualPrototypeNotes:
      'Modeled temperature rise time in Experiment 10 (Newton’s Law of Cooling) and Arrhenius spoilage reduction in Experiment 3.',
    status: 'approved',
    teacherFeedback: 'Strong thermodynamic analysis with clear assumptions. Approved for showcase.',
    safetyLevel: 'GREEN',
    createdAt: '2026-10-20T11:30:00.000Z',
    updatedAt: '2026-10-21T08:45:00.000Z',
  },
  {
    id: 'pub-innov-3',
    title: 'Adaptive LED Canopy for Indoor Microgreens',
    category: 'Farming technology',
    anonymousAlias: 'PhotonSeed_11',
    problemSolved:
      'Fixed overhead grow lights waste energy when seedlings are small or already light-saturated.',
    scientificPrinciple:
      'Balances Inverse-Square distance (I ∝ 1/r²) with photosynthetic saturation K = 200 µmol/m²/s so leaves sit near optimal irradiance.',
    materialsAndDesign:
      'Height-adjustable pulley frame, 12 V DC low-power LED strip, ruler scale for r.',
    virtualPrototypeNotes:
      'Simulated intensity vs distance (Exp 8) and photosynthesis rate (Exp 9) to find sweet-spot height.',
    status: 'approved',
    teacherFeedback: 'Excellent cross-experiment modeling using safe 12V DC lighting. Approved.',
    safetyLevel: 'GREEN',
    createdAt: '2026-11-02T16:00:00.000Z',
    updatedAt: '2026-11-03T10:10:00.000Z',
  },
];

export const INITIAL_TEACHER_ASSIGNMENTS: TeacherAssignment[] = [
  {
    id: 'assign-1',
    title: 'Mountain Cooking: Boiling Point vs Pressure Investigation',
    experimentId: 'boiling-point',
    dueDate: '2026-11-28',
    instructions:
      'Run at least 4 trials between 30 kPa and 200 kPa, plot the curve in the Graphs tab, and export a PDF lab report.',
    assignedGroup: 'Grade 9–10 Physics & Chemistry',
    createdAt: '2026-11-10T09:00:00.000Z',
  },
  {
    id: 'assign-2',
    title: 'Linearizing the Pendulum: T² vs Length',
    experimentId: 'pendulum-period',
    dueDate: '2026-12-04',
    instructions:
      'Test lengths from 0.5 m to 2.5 m on Earth gravity, inspect the T² vs L graph, and compute g from the slope.',
    assignedGroup: 'Mechanics Inquiry Cohort',
    createdAt: '2026-11-12T10:30:00.000Z',
  },
];

export const ACHIEVEMENT_CATALOG: Omit<AchievementItem, 'unlocked' | 'unlockedAt'>[] = [
  {
    id: 'ach-first-trial',
    title: 'First Empirical Trial',
    description: 'Ran and recorded your first deterministic trial in the Virtual Lab.',
    points: 25,
    criteriaText: 'Record at least 1 experiment trial.',
  },
  {
    id: 'ach-prediction',
    title: 'Hypothesis Challenger',
    description: 'Submitted a scientific prediction before running a simulation.',
    points: 30,
    criteriaText: 'Submit at least 1 Prediction Challenge.',
  },
  {
    id: 'ach-multi-exp',
    title: 'Cross-Disciplinary Explorer',
    description: 'Completed trials across 3 or more distinct scientific experiments.',
    points: 60,
    criteriaText: 'Run trials in 3 different experiments.',
  },
  {
    id: 'ach-what-if',
    title: 'Rule Breaker',
    description: 'Tested a hypothetical parameter shift in What If Studio & Assumption Diff.',
    points: 40,
    criteriaText: 'Compare an original vs hypothetical scenario in What If Studio.',
  },
  {
    id: 'ach-report',
    title: 'Published Lab Notebook',
    description: 'Saved or exported a structured scientific lab report.',
    points: 45,
    criteriaText: 'Save at least 1 lab report.',
  },
  {
    id: 'ach-innovator',
    title: 'Global Innovator Draft',
    description: 'Created an original student invention in Global Innovation Hub or Challenges.',
    points: 50,
    criteriaText: 'Create at least 1 innovation idea.',
  },
  {
    id: 'ach-safety',
    title: 'Safety Guardian Verified',
    description: 'Reviewed safety classifications in the Student Safety Guardian.',
    points: 20,
    criteriaText: 'Run a safety evaluation in Safety Guardian.',
  },
];
