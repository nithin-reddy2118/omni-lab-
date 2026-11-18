import type { LabDepartmentId, SafetyLevel } from './science';

export type SmartSubject =
  | 'mathematics'
  | 'physics'
  | 'chemistry'
  | 'biology'
  | 'computer-science'
  | 'engineering'
  | 'astronomy'
  | 'environmental';

export type LearningMode =
  | 'concept'
  | 'theorem'
  | 'practical-experiment'
  | 'algorithm'
  | 'biological-process';

export type SmartLanguage = 'en' | 'kn' | 'hi';

export type EducationLevel =
  | 'classes-5-7'
  | 'classes-8-10'
  | 'classes-11-12'
  | 'undergraduate'
  | 'engineering'
  | 'advanced';

export type LearningStyle = 'simple' | 'detailed' | 'visual' | 'practical';

export type VideoDurationPreset = 'short' | 'standard' | 'detailed';

export type SceneVisualKind =
  | 'math-pythagoras'
  | 'math-coordinate-graph'
  | 'math-circle-geometry'
  | 'physics-newtons-second-law'
  | 'physics-ohms-law-circuit'
  | 'physics-pendulum'
  | 'physics-optics-refraction'
  | 'physics-em-induction'
  | 'physics-boiling-altitude'
  | 'chemistry-electrolysis'
  | 'chemistry-test-tube-heating'
  | 'chemistry-neutralisation'
  | 'chemistry-reaction-kinetics'
  | 'biology-photosynthesis'
  | 'biology-cell-microscope'
  | 'biology-dna'
  | 'cs-binary-search'
  | 'cs-sorting'
  | 'cs-cpu-cycle'
  | 'cs-transistor'
  | 'astronomy-orbit'
  | 'general-scientific-diagram';

export interface SmartSceneSpec {
  id: string;
  sceneNumber: number;
  title: string;
  durationSec: number;
  narrationText: string;
  subtitleText: string;
  mathOrFormulaHighlight?: string;
  calculationStepText?: string;
  visualKind: SceneVisualKind;
  visualPayload: Record<string, unknown>;
  caption: string;
}

export interface ExperimentEquipmentSpec {
  id: string;
  name: string;
  purpose: string;
  unit: string;
  visualKind: string;
}

export interface ExperimentPreparationSpec {
  experimentName: string;
  aim: string;
  scientificPrinciple: string;
  learningOutcomes: string[];
  equipmentRequired: ExperimentEquipmentSpec[];
  materialsAndChemicals: {
    id: string;
    name: string;
    formula: string;
    hazardClass: string;
  }[];
  setupDescription: string;
  connectionsAndSetupSteps: string[];
  numberedProcedure: string[];
  safetyClassification: SafetyLevel;
  protectiveEquipment: string[];
  safetyPrecautions: string[];
  expectedObservations: {
    summary: string;
    colorChange: string;
    gasFormation: string;
    precipitateFormation: string;
    temperatureChange: string;
    chemicalEquation?: string;
  };
  observationTableHeaders: string[];
  observationRows: string[][];
  calculations: string[];
  result: string;
  conclusion: string;
  disposalNotes: string;
  virtualLabDepartment: LabDepartmentId;
  virtualLabExperimentId: string | null;
  virtualLabEquipmentIds: string[];
  virtualLabChemicalIds: string[];
}

export interface SmartQuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface WorkedExampleItem {
  title: string;
  given: string;
  steps: string[];
  finalAnswer: string;
}

export interface ImportantTermItem {
  term: string;
  definition: string;
}

export interface SmartInteractiveDefaults {
  kind: 'pythagoras' | 'newtons-law' | 'ohms-law' | 'binary-search' | 'sorting' | 'boiling' | 'none';
  a?: number;
  b?: number;
  forceN?: number;
  massKg?: number;
  voltageV?: number;
  resistanceOhm?: number;
  pressureKpa?: number;
  arrayValues?: number[];
  targetValue?: number;
  algorithmId?: string;
}

export interface SmartLessonPackage {
  id: string;
  topicQuery: string;
  topicTitle: string;
  subject: SmartSubject;
  learningMode: LearningMode;
  language: SmartLanguage;
  educationLevel: EducationLevel;
  learningStyle: LearningStyle;
  durationPreset: VideoDurationPreset;
  // 15 Required Structured Sections
  topicIntroduction: string;
  meaningAndDefinition: string;
  whyConceptMatters: string;
  scientificOrMathPrinciple: string;
  importantTerms: ImportantTermItem[];
  formulasAndEquations: string[];
  stepByStepExplanation: string[];
  workedExamples: WorkedExampleItem[];
  realLifeApplications: string[];
  commonMistakes: string[];
  visualDemonstrationPlan: string;
  narrationScript: string;
  subtitleSegments: { index: number; startSec: number; endSec: number; text: string }[];
  quiz: SmartQuizQuestion[];
  furtherExploration: string[];
  // Animation + Procedure-First Practical + Lab Handoff
  scenes: SmartSceneSpec[];
  experimentPrep?: ExperimentPreparationSpec;
  interactiveDefaults: SmartInteractiveDefaults;
  complexityInfo?: {
    timeBest: string;
    timeAverage: string;
    timeWorst: string;
    space: string;
    pseudocode: string[];
  };
  safetyClassification: SafetyLevel;
  safetyNote: string;
  sourceMode: 'ai-grounded' | 'deterministic-verified';
  modelUsed?: string;
  validationNote: string;
  createdAt: string;
}

export interface SmartLessonHistoryItem {
  id: string;
  lesson: SmartLessonPackage;
  saved: boolean;
  lastViewedAt: string;
  bestQuizScore?: number;
  renderedMp4Url?: string;
  renderedVideoDurationSec?: number;
}

export interface SmartQuizAttempt {
  id: string;
  lessonId: string;
  topicTitle: string;
  subject: SmartSubject;
  language: SmartLanguage;
  score: number;
  total: number;
  completedAt: string;
}

export interface EnvironmentCapabilities {
  geminiConfigured: boolean;
  ffmpegInstalled: boolean;
  ffprobeInstalled: boolean;
  manimInstalled: boolean;
  pythonInstalled: boolean;
  ttsModel: string;
  browserAnimationEngine: string;
}

export type VideoPipelineStage =
  | 'idle'
  | 'classifying'
  | 'generating-lesson'
  | 'validating-science'
  | 'rendering-frames'
  | 'synthesizing-tts'
  | 'muxing-mp4'
  | 'mp4-ready'
  | 'error';
