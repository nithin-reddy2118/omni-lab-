export type AlgorithmCategory =
  | 'Supervised Regression'
  | 'Supervised Classification'
  | 'Neural Networks & Optimization'
  | 'Unsupervised & Dimensionality'
  | 'Searching & Sorting'
  | 'Graphs, DP & Evolutionary';

export type AlgorithmExecutionTier = 'executable' | 'traceable' | 'conceptual';

export type AlgorithmInputLanguage =
  | 'natural-language'
  | 'pseudocode'
  | 'javascript'
  | 'python'
  | 'math-notation';

export type AlgorithmVisualizationKind =
  | 'regression-line'
  | 'cost-descent'
  | 'decision-boundary'
  | 'decision-tree'
  | 'clustering'
  | 'neural-network'
  | 'array-bars'
  | 'array-search'
  | 'graph-path'
  | 'dp-table'
  | 'population-ga';

export interface AlgorithmParameterDef {
  key: string;
  label: string;
  symbol: string;
  min: number;
  max: number;
  step: number;
  defaultValue: number;
  unit?: string;
}

export interface RegressionVisualState {
  kind: 'regression-line';
  points: { x: number; y: number; label?: string }[];
  slope: number;
  intercept: number;
  mse: number;
  costHistory: { step: number; loss: number }[];
  highlightPointIndex?: number;
}

export interface CostDescentVisualState {
  kind: 'cost-descent';
  x: number;
  fx: number;
  gradient: number;
  trajectory: { step: number; x: number; fx: number }[];
}

export interface DecisionBoundaryVisualState {
  kind: 'decision-boundary';
  points: { x1: number; x2: number; label: number; predicted?: number }[];
  weights?: [number, number, number]; // w1*x1 + w2*x2 + b = 0
  queryPoint?: { x1: number; x2: number; neighborIndices?: number[] };
  accuracy: number;
  loss?: number;
}

export interface DecisionTreeNodeVisual {
  id: string;
  featureName?: string;
  threshold?: number;
  gini: number;
  samples: number;
  predictedClass: string;
  isLeaf: boolean;
  leftId?: string;
  rightId?: string;
  depth: number;
  xPos: number;
  yPos: number;
}

export interface DecisionTreeVisualState {
  kind: 'decision-tree';
  nodes: DecisionTreeNodeVisual[];
  activeNodeId?: string;
  activePathIds: string[];
  samplePoint?: Record<string, number>;
  accuracy: number;
}

export interface ClusteringVisualState {
  kind: 'clustering';
  points: { x: number; y: number; cluster: number }[];
  centroids: { x: number; y: number; cluster: number }[];
  inertia: number;
  activePointIndex?: number;
  eigenVector?: { dx: number; dy: number; meanX: number; meanY: number; varianceExplained: number };
}

export interface NeuralNetworkVisualState {
  kind: 'neural-network';
  layers: number[][]; // node activation values per layer [input, hidden, output]
  weightsIH: number[][];
  weightsHO: number[][];
  biasH: number[];
  biasO: number[];
  loss: number;
  phase: 'forward' | 'loss' | 'backprop' | 'update';
  sampleInput: [number, number];
  sampleTarget: number;
  sampleOutput: number;
  lossHistory: { epoch: number; loss: number }[];
}

export interface ArrayBarsVisualState {
  kind: 'array-bars';
  array: number[];
  comparingIndices: number[];
  swappingIndices: number[];
  sortedIndices: number[];
  pivotIndex?: number;
  comparisons: number;
  swaps: number;
}

export interface ArraySearchVisualState {
  kind: 'array-search';
  array: number[];
  target: number;
  currentIndex: number;
  lowIndex?: number;
  highIndex?: number;
  eliminatedIndices: number[];
  foundIndex: number | null;
  comparisons: number;
}

export interface GraphPathVisualState {
  kind: 'graph-path';
  nodes: { id: string; label: string; x: number; y: number; dist?: number; fScore?: number }[];
  edges: { from: string; to: string; weight: number }[];
  visitedIds: string[];
  frontierIds: string[];
  activeNodeId: string | null;
  pathIds: string[];
}

export interface DpTableVisualState {
  kind: 'dp-table';
  headers: string[];
  rowLabels: string[];
  table: (number | null)[][];
  activeCell: [number, number] | null;
  dependencyCells: [number, number][];
}

export interface PopulationGaVisualState {
  kind: 'population-ga';
  generation: number;
  individuals: { genome: string; x: number; fitness: number }[];
  bestX: number;
  bestFitness: number;
  history: { gen: number; best: number; avg: number }[];
}

export type AlgorithmVisualState =
  | RegressionVisualState
  | CostDescentVisualState
  | DecisionBoundaryVisualState
  | DecisionTreeVisualState
  | ClusteringVisualState
  | NeuralNetworkVisualState
  | ArrayBarsVisualState
  | ArraySearchVisualState
  | GraphPathVisualState
  | DpTableVisualState
  | PopulationGaVisualState;

export interface AlgorithmStep {
  stepNumber: number;
  iterationLabel: string;
  operation: string;
  inputsSnapshot: string;
  intermediateValues: string;
  dataStructureState: string;
  mathExpression: string;
  outputSnapshot: string;
  explanation: string;
  whyNecessary: string;
  visualState: AlgorithmVisualState;
}

export interface AlgorithmExecutionTrace {
  algorithmId: string;
  algorithmName: string;
  executionTier: AlgorithmExecutionTier;
  steps: AlgorithmStep[];
  finalSummary: string;
  measuredRuntimeMs: number;
  comparisonsCount?: number;
  swapsCount?: number;
  finalMetrics: { label: string; value: string }[];
  selfCheckPassed: boolean;
  selfCheckDetail: string;
}

export interface VerifiedVideoResource {
  title: string;
  creator: string;
  source: string;
  url: string;
  verifiedNote: string;
}

export interface AlgorithmDefinition {
  id: string;
  name: string;
  category: AlgorithmCategory;
  executionTier: AlgorithmExecutionTier;
  visualizationKind: AlgorithmVisualizationKind;
  isMachineLearning: boolean;
  mlTask?: 'regression' | 'classification' | 'clustering';
  problemSolved: string;
  whyUseful: string;
  howItWorks: string;
  mathematicalFoundation: string;
  formula: string;
  inputSpec: string;
  outputSpec: string;
  workedExample: string;
  timeComplexity: { best: string; average: string; worst: string };
  spaceComplexity: string;
  advantages: string[];
  limitations: string[];
  realWorldApplications: string[];
  mlConcepts?: {
    trainingVsTesting: string;
    lossFunction: string;
    optimization: string;
    hyperparameters: string;
    overfittingRisk: string;
  };
  pseudocode: string;
  pythonReference: string;
  defaultParams: Record<string, number>;
  parameters: AlgorithmParameterDef[];
  defaultInputSample: string;
  videoResources: VerifiedVideoResource[];
  testExpectation: string;
}

export type UciCategory =
  | 'All'
  | 'Classification'
  | 'Regression'
  | 'Clustering'
  | 'Time-series'
  | 'Healthcare'
  | 'Environmental'
  | 'Engineering'
  | 'Business'
  | 'Biological';

export interface UciDatasetMeta {
  id: number;
  slug: string;
  name: string;
  category: Exclude<UciCategory, 'All'>;
  tasks: ('Classification' | 'Regression' | 'Clustering' | 'Time-Series')[];
  subjectArea: string;
  instances: number;
  features: number;
  featureTypes: string;
  targetName: string;
  license: string;
  description: string;
  officialUrl: string;
  liveCsvUrl?: string;
  unavailableReason?: string;
  sampleHeaders: string[];
  sampleRows: (string | number)[][];
}

export interface LoadedDataset {
  id: string;
  name: string;
  source: 'uci-live' | 'verified-sample' | 'user-csv' | 'builtin';
  attributionUrl?: string;
  license?: string;
  headers: string[];
  rows: (string | number)[][];
  numericColumns: string[];
  categoricalColumns: string[];
  suggestedTarget: string;
  note: string;
}

export interface AiAlgorithmSpecification {
  identifiedName: string;
  matchedBuiltInId: string | null;
  category: string;
  purpose: string;
  inputs: string[];
  outputs: string[];
  dataStructures: string[];
  algorithmLogicSummary: string;
  mathematicalPrinciples: string[];
  formula: string;
  complexity: { time: string; space: string };
  executionStatus: 'executable-builtin' | 'safe-traceable-code' | 'conceptual-walkthrough';
  executionStatusReason: string;
  supportedVisualization: string;
  steps: {
    stepNumber: number;
    operation: string;
    stateDescription: string;
    mathOrLogic: string;
    explanation: string;
  }[];
  limitations: string[];
  sourceMode: 'ai' | 'local-parser';
}

export interface MlEvaluationResult {
  algorithmId: string;
  algorithmName: string;
  task: 'regression' | 'classification' | 'clustering';
  trainCount: number;
  testCount: number;
  runtimeMs: number;
  epochs: { iteration: number; metricLabel: string; metricValue: number }[];
  // Classification
  accuracy?: number;
  precision?: number;
  recall?: number;
  f1Score?: number;
  classLabels?: string[];
  confusionMatrix?: number[][];
  // Regression
  mse?: number;
  mae?: number;
  rSquared?: number;
  // Clustering
  inertia?: number;
  clusterSizes?: { cluster: string; count: number }[];
  // Shared visualization artifacts
  predictionsSample: { actual: string | number; predicted: string | number; featuresSummary: string }[];
  actualVsPredicted?: { actual: number; predicted: number }[];
  scatter2dPoints?: { x: number; y: number; group: string; predictedGroup?: string }[];
  featureImportance?: { feature: string; score: number }[];
  boundaryWeights?: [number, number, number];
  stepSummaries: string[];
}
