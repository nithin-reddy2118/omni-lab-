import React, { useEffect, useMemo, useState } from 'react';
import {
  Play,
  Pause,
  SkipForward,
  SkipBack,
  RotateCcw,
  StepForward,
  ListOrdered,
  Eye,
  EyeOff,
  Sparkles,
  BookOpen,
  Code2,
  Database,
  SlidersHorizontal,
  GitCompareArrows,
  ExternalLink,
  CheckCircle2,
  AlertTriangle,
  Film,
  Video,
} from 'lucide-react';
import { ALGORITHM_REGISTRY, getAlgorithmById } from '../data/algorithmRegistry';
import { UCI_DATASETS_CATALOG, metaToLoadedDataset } from '../data/uciDatasets';
import {
  executeAlgorithm,
  executeSafePseudocodeSubset,
  parseLocalAlgorithmDescription,
} from '../engine/algorithmExecutor';
import type {
  AiAlgorithmSpecification,
  AlgorithmCategory,
  AlgorithmExecutionTrace,
  AlgorithmInputLanguage,
  LoadedDataset,
} from '../types/algorithm';
import { AlgorithmVisualizerCanvas } from '../components/algorithms/AlgorithmVisualizerCanvas';
import { UciDatasetExplorer } from '../components/algorithms/UciDatasetExplorer';
import { MlPlaygroundPanel } from '../components/algorithms/MlPlaygroundPanel';
import { AlgorithmComparisonPanel } from '../components/algorithms/AlgorithmComparisonPanel';
import { SmartVideoLessonWidget } from '../components/smart/SmartVideoLessonWidget';
import algorithmHeroImg from '../assets/images/algorithm_explorer_preview_1794918901251.jpg';

type ExplorerTab =
  | 'visualizer'
  | 'custom-input'
  | 'datasets'
  | 'ml-playground'
  | 'compare'
  | 'video-lesson';

const CATEGORIES: ('All' | AlgorithmCategory)[] = [
  'All',
  'Supervised Regression',
  'Supervised Classification',
  'Neural Networks & Optimization',
  'Unsupervised & Dimensionality',
  'Searching & Sorting',
  'Graphs, DP & Evolutionary',
];

const CUSTOM_EXAMPLES = [
  {
    label: 'Bubble Sort (Pseudocode)',
    name: 'Bubble Sort',
    lang: 'pseudocode' as AlgorithmInputLanguage,
    text: `arr = [24, 9, 31, 15, 6]
for i = 0 to n-1:
  for j = 0 to n-i-2:
    if arr[j] > arr[j+1]:
      swap(arr[j], arr[j+1])`,
  },
  {
    label: 'Binary Search (Python)',
    name: 'Binary Search',
    lang: 'python' as AlgorithmInputLanguage,
    text: `arr = [4, 9, 14, 18, 27, 38, 41]
target = 27
# Halve search interval at each mid check`,
  },
  {
    label: 'Simple Variable Trace',
    name: 'Compound Step Sum',
    lang: 'pseudocode' as AlgorithmInputLanguage,
    text: `x = 4
y = x + 6
z = y * 3
total = z - 5`,
  },
  {
    label: 'PageRank (Conceptual)',
    name: 'PageRank Graph Centrality',
    lang: 'natural-language' as AlgorithmInputLanguage,
    text: 'Iteratively distribute node importance weights across outgoing hypertext links with damping factor d = 0.85 until convergence.',
  },
];

export function AlgorithmExplorerPage() {
  const [activeTab, setActiveTab] = useState<ExplorerTab>('visualizer');

  // Algorithm Selection & Playback State
  const [selectedCategory, setSelectedCategory] = useState<'All' | AlgorithmCategory>('All');
  const [selectedAlgoId, setSelectedAlgoId] = useState<string>('linear-regression');
  const activeDef = useMemo(
    () => getAlgorithmById(selectedAlgoId) ?? ALGORITHM_REGISTRY[0],
    [selectedAlgoId]
  );

  const [params, setParams] = useState<Record<string, number>>(activeDef.defaultParams);
  const [customDataInput, setCustomDataInput] = useState<string>(activeDef.defaultInputSample);
  const [trace, setTrace] = useState<AlgorithmExecutionTrace>(() =>
    executeAlgorithm(activeDef.id, activeDef.defaultParams, activeDef.defaultInputSample)
  );
  const [stepIndex, setStepIndex] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [speedMultiplier, setSpeedMultiplier] = useState<number>(1);
  const [showAllSteps, setShowAllSteps] = useState<boolean>(true);
  const [showExplanations, setShowExplanations] = useState<boolean>(true);
  const [codeTab, setCodeTab] = useState<'pseudocode' | 'python'>('pseudocode');
  const [showMathDetails, setShowMathDetails] = useState<boolean>(false);

  // Custom Algorithm Input & AI Analysis State
  const [customAlgoName, setCustomAlgoName] = useState<string>('');
  const [customInputLang, setCustomInputLang] = useState<AlgorithmInputLanguage>('natural-language');
  const [customAlgoBody, setCustomAlgoBody] = useState<string>('');
  const [analyzingCustom, setAnalyzingCustom] = useState<boolean>(false);
  const [customSpec, setCustomSpec] = useState<AiAlgorithmSpecification | null>(null);
  const [customTracePreview, setCustomTracePreview] = useState<AlgorithmExecutionTrace | null>(null);

  // Dataset Workspace State (shared between UCI Dataset Explorer & ML Playground)
  const defaultDataset = useMemo(
    () => metaToLoadedDataset(UCI_DATASETS_CATALOG[0], 'verified-sample'),
    []
  );
  const [activeDataset, setActiveDataset] = useState<LoadedDataset>(defaultDataset);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>(
    defaultDataset.numericColumns.slice(0, 4)
  );
  const [selectedTarget, setSelectedTarget] = useState<string>(defaultDataset.suggestedTarget);

  // Switch built-in algorithm cleanly
  const handleSelectAlgorithm = (id: string) => {
    const def = getAlgorithmById(id);
    if (!def) return;
    setSelectedAlgoId(def.id);
    setParams({ ...def.defaultParams });
    setCustomDataInput(def.defaultInputSample);
    const nextTrace = executeAlgorithm(def.id, def.defaultParams, def.defaultInputSample);
    setTrace(nextTrace);
    setStepIndex(0);
    setIsPlaying(false);
  };

  // Re-run trace when parameters or input change
  const rerunTrace = (nextParams = params, nextInput = customDataInput, autoStart = false) => {
    const nextTrace = executeAlgorithm(activeDef.id, nextParams, nextInput);
    setTrace(nextTrace);
    setStepIndex(0);
    setIsPlaying(autoStart);
  };

  // Playback timer
  useEffect(() => {
    if (!isPlaying) return;
    const intervalMs = Math.round(900 / speedMultiplier);
    const timer = window.setInterval(() => {
      setStepIndex((prev) => {
        if (prev >= trace.steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [isPlaying, speedMultiplier, trace.steps.length]);

  const currentStep = trace.steps[stepIndex] ?? trace.steps[0];

  const filteredAlgos = useMemo(
    () =>
      selectedCategory === 'All'
        ? ALGORITHM_REGISTRY
        : ALGORITHM_REGISTRY.filter((a) => a.category === selectedCategory),
    [selectedCategory]
  );

  // Analyze student's custom algorithm (AI endpoint + safe local fallback + safe sandbox trace)
  const handleAnalyzeCustomAlgorithm = async () => {
    if (!customAlgoName.trim() && !customAlgoBody.trim()) return;
    setAnalyzingCustom(true);
    setCustomTracePreview(null);

    let spec: AiAlgorithmSpecification | null = null;
    try {
      const res = await fetch('/api/ai/understand-algorithm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: customAlgoName,
          input: customAlgoBody,
          language: customInputLang,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        spec = data.specification ?? null;
      }
    } catch {
      spec = null;
    }

    if (!spec) {
      spec = parseLocalAlgorithmDescription(customAlgoName, customAlgoBody, customInputLang);
    }

    setCustomSpec(spec);

    if (spec.matchedBuiltInId) {
      const def = getAlgorithmById(spec.matchedBuiltInId);
      if (def) {
        setCustomTracePreview(executeAlgorithm(def.id, def.defaultParams, def.defaultInputSample));
      }
    } else if (spec.executionStatus === 'safe-traceable-code') {
      setCustomTracePreview(executeSafePseudocodeSubset(customAlgoBody));
    }

    setAnalyzingCustom(false);
  };

  const handleLoadAnalyzedIntoVisualizer = () => {
    if (!customSpec) return;
    if (customSpec.matchedBuiltInId) {
      handleSelectAlgorithm(customSpec.matchedBuiltInId);
      setActiveTab('visualizer');
      return;
    }
    if (customTracePreview) {
      setTrace(customTracePreview);
      setStepIndex(0);
      setIsPlaying(false);
      setActiveTab('visualizer');
    }
  };

  return (
    <div className="pb-16 space-y-6">
      {/* Header Banner */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          <div className="lg:col-span-8 space-y-3">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-blue-700">
              <span>Algorithm Learning Laboratory</span>
              <span className="text-slate-300">·</span>
              <span className="text-teal-700">22 Executable Kernels & Real UCI Datasets</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Algorithm Explorer — Understand Every Step
            </h1>
            <p className="text-sm sm:text-base text-slate-600 max-w-2xl leading-relaxed">
              Enter an algorithm, explore its logic, run it, and watch how it works step by step. Inspect mathematical updates, test custom inputs safely, browse UCI datasets, and train real machine learning models.
            </p>
          </div>
          <div className="lg:col-span-4">
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-50 aspect-[4/3] max-h-44 w-full">
              <img
                src={algorithmHeroImg}
                alt="Algorithm visualization and mathematical study workspace"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        {/* Navigation Sub-Tabs */}
        <div className="mt-6 pt-4 border-t border-slate-200 flex flex-wrap gap-2">
          {[
            { id: 'visualizer' as ExplorerTab, label: 'Step-by-Step Visualizer', icon: Play },
            { id: 'custom-input' as ExplorerTab, label: 'Custom Algorithm & AI Parser', icon: Sparkles },
            { id: 'datasets' as ExplorerTab, label: 'UCI Datasets & CSV Loader', icon: Database },
            { id: 'ml-playground' as ExplorerTab, label: 'ML Training Playground', icon: SlidersHorizontal },
            { id: 'compare' as ExplorerTab, label: 'Algorithm Comparison', icon: GitCompareArrows },
            { id: 'video-lesson' as ExplorerTab, label: 'Animated Concept Video & Quiz', icon: Film },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-colors ${
                  active
                    ? 'bg-blue-700 text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* TAB 1: STEP-BY-STEP VISUALIZER */}
      {activeTab === 'visualizer' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Left Algorithm Catalog Sidebar */}
          <aside className="lg:col-span-4 rounded-xl border border-slate-200 bg-white p-4 shadow-xs space-y-4">
            <div>
              <h2 className="text-sm font-bold text-slate-900">Built-In Executable Algorithms</h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Every kernel runs real deterministic math with step verification.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? 'bg-blue-700 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="max-h-[420px] overflow-y-auto space-y-1.5 pr-1">
              {filteredAlgos.map((algo) => {
                const selected = algo.id === activeDef.id;
                return (
                  <button
                    key={algo.id}
                    type="button"
                    onClick={() => handleSelectAlgorithm(algo.id)}
                    className={`w-full text-left px-3 py-2.5 rounded-lg border transition-colors ${
                      selected
                        ? 'bg-blue-50 border-blue-600 text-blue-950'
                        : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-bold">{algo.name}</span>
                      <span className="text-[10px] font-mono text-slate-500 shrink-0">
                        {algo.timeComplexity.average}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5 line-clamp-1">
                      {algo.category}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Parameters & Input Editor */}
            <div className="pt-3 border-t border-slate-200 space-y-3">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Parameters & Input Data
              </div>

              {activeDef.parameters.map((p) => (
                <div key={p.key} className="space-y-1">
                  <div className="flex justify-between text-xs font-mono text-slate-700 tabular-nums">
                    <span>{p.label}</span>
                    <span className="font-bold text-blue-700">
                      {params[p.key] ?? p.defaultValue}
                      {p.unit ? ` ${p.unit}` : ''}
                    </span>
                  </div>
                  <input
                    type="range"
                    min={p.min}
                    max={p.max}
                    step={p.step}
                    value={params[p.key] ?? p.defaultValue}
                    onChange={(e) => {
                      const next = { ...params, [p.key]: Number(e.target.value) };
                      setParams(next);
                      rerunTrace(next, customDataInput, false);
                    }}
                    className="w-full accent-blue-700"
                  />
                </div>
              ))}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">
                  Sample / Custom Input
                </label>
                <div className="flex gap-1.5">
                  <input
                    type="text"
                    value={customDataInput}
                    onChange={(e) => setCustomDataInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 bg-white"
                  />
                  <button
                    type="button"
                    onClick={() => rerunTrace(params, customDataInput, false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-blue-700 text-white text-xs font-semibold transition-colors"
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>
          </aside>

          {/* Right Main Interactive Visualization & Step Trace */}
          <div className="lg:col-span-8 space-y-5">
            {/* Selected Algorithm Header + Playback Bar */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <div className="text-xs font-mono text-blue-700 font-semibold">
                    {activeDef.category} · {activeDef.executionTier.toUpperCase()}
                    {activeDef.isMachineLearning ? ' · Machine Learning' : ''}
                  </div>
                  <h2 className="text-xl font-bold text-slate-900 mt-0.5">{trace.algorithmName}</h2>
                  <p className="text-sm text-slate-600 mt-1">{activeDef.problemSolved}</p>
                </div>

                <div className="text-right text-xs font-mono text-slate-500 tabular-nums space-y-1">
                  <div>
                    Self-Check:{' '}
                    <span className={trace.selfCheckPassed ? 'text-emerald-700 font-semibold' : 'text-amber-700'}>
                      {trace.selfCheckPassed ? 'Verified' : 'Check Notice'}
                    </span>
                  </div>
                  <div>Runtime: {trace.measuredRuntimeMs} ms</div>
                </div>
              </div>

              {/* Playback Transport Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-slate-50 border border-slate-200">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => {
                      if (stepIndex >= trace.steps.length - 1) setStepIndex(0);
                      setIsPlaying((p) => !p);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-xs font-semibold transition-colors"
                  >
                    {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                    <span>{isPlaying ? 'Pause' : stepIndex === 0 ? 'Start' : 'Resume'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={stepIndex <= 0}
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIndex((i) => Math.max(0, i - 1));
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 disabled:opacity-40"
                  >
                    <SkipBack className="w-3.5 h-3.5" />
                    <span>Prev</span>
                  </button>

                  <button
                    type="button"
                    disabled={stepIndex >= trace.steps.length - 1}
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIndex((i) => Math.min(trace.steps.length - 1, i + 1));
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 disabled:opacity-40"
                  >
                    <span>Next Step</span>
                    <SkipForward className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    disabled={stepIndex >= trace.steps.length - 1}
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIndex((i) => Math.min(trace.steps.length - 1, i + 1));
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700 disabled:opacity-40"
                  >
                    <StepForward className="w-3.5 h-3.5" />
                    <span>1 Iteration</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setIsPlaying(false);
                      setStepIndex(0);
                    }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs font-medium text-slate-700"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset</span>
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label="Animation Speed"
                    value={speedMultiplier}
                    onChange={(e) => setSpeedMultiplier(Number(e.target.value))}
                    className="px-2 py-1 rounded-lg border border-slate-300 bg-white text-xs font-mono text-slate-800"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1.0x</option>
                    <option value={2}>2.0x</option>
                    <option value={4}>4.0x</option>
                  </select>

                  <button
                    type="button"
                    onClick={() => setShowExplanations((v) => !v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs text-slate-700"
                  >
                    {showExplanations ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    <span>{showExplanations ? 'Hide Notes' : 'Show Notes'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setShowAllSteps((v) => !v)}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-xs text-slate-700"
                  >
                    <ListOrdered className="w-3.5 h-3.5" />
                    <span>{showAllSteps ? 'Compact Trace' : 'All Steps'}</span>
                  </button>
                </div>
              </div>

              {/* Synchronized State Visual Canvas */}
              {currentStep && (
                <AlgorithmVisualizerCanvas
                  visualState={currentStep.visualState}
                  stepNumber={currentStep.stepNumber}
                  totalSteps={trace.steps.length}
                  iterationLabel={currentStep.iterationLabel}
                />
              )}

              {/* Current Step Detailed Breakdown */}
              {currentStep && (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-bold text-slate-900">
                      Step {currentStep.stepNumber}: {currentStep.operation}
                    </div>
                    <span className="text-xs font-mono text-blue-700 font-semibold">
                      {currentStep.outputSnapshot}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="font-semibold text-slate-500 mb-0.5">Inputs & Data State</div>
                      <div className="font-mono text-slate-800">{currentStep.inputsSnapshot}</div>
                      <div className="font-mono text-slate-600 mt-1">{currentStep.dataStructureState}</div>
                    </div>
                    <div className="p-2.5 rounded-lg bg-white border border-slate-200">
                      <div className="font-semibold text-slate-500 mb-0.5">Formula / Logic Applied</div>
                      <div className="font-mono text-blue-800">{currentStep.mathExpression}</div>
                      <div className="font-mono text-slate-600 mt-1">{currentStep.intermediateValues}</div>
                    </div>
                  </div>

                  {showExplanations && (
                    <div className="pt-1 text-xs text-slate-700 space-y-1">
                      <div>
                        <strong className="text-slate-900">What happened:</strong> {currentStep.explanation}
                      </div>
                      <div>
                        <strong className="text-slate-900">Why this step is necessary:</strong> {currentStep.whyNecessary}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Clickable All Steps Log */}
              {showAllSteps && (
                <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
                  <div className="px-4 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-700">
                    <span>Complete Step-by-Step Execution Log (click any row to jump)</span>
                    <span className="font-mono tabular-nums">{trace.steps.length} steps</span>
                  </div>
                  <div className="max-h-56 overflow-y-auto divide-y divide-slate-100">
                    {trace.steps.map((step, idx) => {
                      const active = idx === stepIndex;
                      return (
                        <button
                          key={step.stepNumber}
                          type="button"
                          onClick={() => {
                            setIsPlaying(false);
                            setStepIndex(idx);
                          }}
                          className={`w-full text-left px-4 py-2 text-xs flex items-start justify-between gap-3 transition-colors ${
                            active ? 'bg-blue-50 text-blue-950 font-semibold' : 'hover:bg-slate-50 text-slate-700'
                          }`}
                        >
                          <div>
                            <span className="font-mono font-bold text-blue-700 mr-2">#{step.stepNumber}</span>
                            <span>{step.operation}</span>
                          </div>
                          <span className="font-mono text-slate-500 shrink-0">{step.outputSnapshot}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Final Summary & Metrics Strip */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 space-y-2">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                  <span>{trace.finalSummary}</span>
                </div>
                <div className="flex flex-wrap gap-4 text-xs font-mono text-emerald-900 tabular-nums">
                  {trace.finalMetrics.map((m) => (
                    <span key={m.label}>
                      {m.label}: <strong>{m.value}</strong>
                    </span>
                  ))}
                </div>
              </div>
            </div>

            {/* Expandable Mathematics, Code, ML Concepts & Videos */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-blue-700" />
                  <span>Mathematical Foundation, Code & Educational Videos</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowMathDetails((v) => !v)}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  {showMathDetails ? 'Hide Detailed Math Breakdown' : 'Expand Detailed Math & Limitations'}
                </button>
              </div>

              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-900">
                {activeDef.formula}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs font-mono">
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Best Time</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeDef.timeComplexity.best}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Average Time</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeDef.timeComplexity.average}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Worst Time</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeDef.timeComplexity.worst}</div>
                </div>
                <div className="p-2.5 rounded-lg border border-slate-200">
                  <div className="text-slate-500">Space</div>
                  <div className="font-bold text-slate-900 mt-0.5">{activeDef.spaceComplexity}</div>
                </div>
              </div>

              {showMathDetails && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 text-xs text-slate-700 border-t border-slate-100">
                  <div className="space-y-2">
                    <p>
                      <strong className="text-slate-900">Why Useful:</strong> {activeDef.whyUseful}
                    </p>
                    <p>
                      <strong className="text-slate-900">Math Foundation:</strong> {activeDef.mathematicalFoundation}
                    </p>
                    <p>
                      <strong className="text-slate-900">Worked Example:</strong> {activeDef.workedExample}
                    </p>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <strong className="text-slate-900">Advantages:</strong>{' '}
                      {activeDef.advantages.join(' · ')}
                    </div>
                    <div>
                      <strong className="text-slate-900">Limitations:</strong>{' '}
                      {activeDef.limitations.join(' · ')}
                    </div>
                    <div>
                      <strong className="text-slate-900">Applications:</strong>{' '}
                      {activeDef.realWorldApplications.join(' · ')}
                    </div>
                  </div>
                </div>
              )}

              {/* ML Concepts ONLY shown for Machine Learning algorithms */}
              {activeDef.isMachineLearning && activeDef.mlConcepts && (
                <div className="rounded-lg border border-blue-200 bg-blue-50/60 p-4 space-y-1.5 text-xs text-slate-800">
                  <div className="font-bold text-blue-900">Machine Learning Concepts</div>
                  <div><strong>Train vs Test:</strong> {activeDef.mlConcepts.trainingVsTesting}</div>
                  <div><strong>Loss / Objective:</strong> {activeDef.mlConcepts.lossFunction}</div>
                  <div><strong>Optimization:</strong> {activeDef.mlConcepts.optimization}</div>
                  <div><strong>Overfitting Risk:</strong> {activeDef.mlConcepts.overfittingRisk}</div>
                </div>
              )}

              {/* Code Viewer */}
              <div className="rounded-lg border border-slate-200 overflow-hidden">
                <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-700">
                    <Code2 className="w-4 h-4 text-blue-700" />
                    <span>Algorithm Logic Reference</span>
                  </span>
                  <div className="flex gap-1">
                    {(['pseudocode', 'python'] as const).map((t) => (
                      <button
                        key={t}
                        type="button"
                        onClick={() => setCodeTab(t)}
                        className={`px-2.5 py-1 rounded text-[11px] font-semibold ${
                          codeTab === t ? 'bg-blue-700 text-white' : 'text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        {t === 'pseudocode' ? 'Pseudocode' : 'Python'}
                      </button>
                    ))}
                  </div>
                </div>
                <pre className="p-3 bg-slate-900 text-slate-100 text-xs font-mono overflow-x-auto leading-relaxed">
                  {codeTab === 'pseudocode' ? activeDef.pseudocode : activeDef.pythonReference}
                </pre>
              </div>

              {/* Verified Video References */}
              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-teal-700" />
                  <span>Verified Educational Video Lectures</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeDef.videoResources.map((v) => (
                    <a
                      key={v.url}
                      href={v.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 hover:bg-blue-50 text-xs text-slate-800 transition-colors"
                    >
                      <span className="font-semibold">{v.title}</span>
                      <span className="text-slate-500">({v.source})</span>
                      <ExternalLink className="w-3.5 h-3.5 text-blue-700" />
                    </a>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CUSTOM ALGORITHM INPUT & AI PARSER */}
      {activeTab === 'custom-input' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wider text-blue-700">
                Universal Algorithm Input
              </div>
              <h2 className="text-lg font-bold text-slate-900 mt-0.5">
                Enter Any Algorithm, Pseudocode, Code or Formula
              </h2>
              <p className="text-xs text-slate-600 mt-1">
                Our analyzer maps supported algorithms to verified visual kernels or safely traces restricted array/variable steps without arbitrary eval(). Unsupported procedures clearly display a structured conceptual walkthrough.
              </p>
            </div>

            <div className="flex flex-wrap gap-1.5">
              {CUSTOM_EXAMPLES.map((ex) => (
                <button
                  key={ex.label}
                  type="button"
                  onClick={() => {
                    setCustomAlgoName(ex.name);
                    setCustomInputLang(ex.lang);
                    setCustomAlgoBody(ex.text);
                  }}
                  className="px-2.5 py-1 rounded-md border border-slate-200 bg-slate-50 hover:bg-blue-50 text-[11px] font-medium text-slate-700"
                >
                  {ex.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Algorithm Name</label>
                <input
                  type="text"
                  value={customAlgoName}
                  onChange={(e) => setCustomAlgoName(e.target.value)}
                  placeholder="e.g. Dijkstra, Quick Sort, PageRank..."
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Input Format</label>
                <select
                  value={customInputLang}
                  onChange={(e) => setCustomInputLang(e.target.value as AlgorithmInputLanguage)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-300 text-sm text-slate-900 bg-white"
                >
                  <option value="natural-language">Natural Language Description</option>
                  <option value="pseudocode">Pseudocode</option>
                  <option value="python">Python</option>
                  <option value="javascript">JavaScript</option>
                  <option value="math-notation">Mathematical Procedure</option>
                </select>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Algorithm Logic, Pseudocode, or Description
              </label>
              <textarea
                rows={7}
                value={customAlgoBody}
                onChange={(e) => setCustomAlgoBody(e.target.value)}
                placeholder="Describe steps or paste pseudocode/code here..."
                className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs font-mono text-slate-900 bg-white"
              />
            </div>

            <button
              type="button"
              disabled={analyzingCustom || (!customAlgoName.trim() && !customAlgoBody.trim())}
              onClick={() => void handleAnalyzeCustomAlgorithm()}
              className="w-full py-2.5 px-4 rounded-lg bg-blue-700 hover:bg-blue-800 text-white text-sm font-semibold transition-colors disabled:opacity-50"
            >
              {analyzingCustom ? 'Analyzing Algorithm Structure...' : 'Understand & Parse Algorithm'}
            </button>
          </div>

          <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
            {!customSpec ? (
              <div className="py-16 text-center text-sm text-slate-500">
                Enter an algorithm on the left or pick an example preset to inspect its structured breakdown and execution status.
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-2 border-b border-slate-200 pb-3">
                  <div>
                    <div className="text-xs font-mono text-slate-500">
                      {customSpec.category} · {customSpec.sourceMode === 'ai' ? 'AI Structured Analysis' : 'Local Verified Parser'}
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 mt-0.5">{customSpec.identifiedName}</h3>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-md text-xs font-semibold ${
                      customSpec.executionStatus === 'conceptual-walkthrough'
                        ? 'bg-amber-50 text-amber-900 border border-amber-200'
                        : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
                    }`}
                  >
                    {customSpec.executionStatus === 'executable-builtin'
                      ? 'Executable Kernel'
                      : customSpec.executionStatus === 'safe-traceable-code'
                      ? 'Safe Sandbox Trace'
                      : 'Conceptual Only'}
                  </span>
                </div>

                <div
                  className={`p-3 rounded-lg border text-xs flex items-start gap-2 ${
                    customSpec.executionStatus === 'conceptual-walkthrough'
                      ? 'bg-amber-50 border-amber-200 text-amber-950'
                      : 'bg-blue-50 border-blue-200 text-blue-950'
                  }`}
                >
                  {customSpec.executionStatus === 'conceptual-walkthrough' ? (
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                  ) : (
                    <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
                  )}
                  <span>{customSpec.executionStatusReason}</span>
                </div>

                <p className="text-xs text-slate-700 leading-relaxed">{customSpec.algorithmLogicSummary}</p>

                <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-200 font-mono text-xs text-slate-800">
                  {customSpec.formula} · Time: {customSpec.complexity.time} · Space: {customSpec.complexity.space}
                </div>

                <div className="space-y-2">
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    Structured Walkthrough Steps
                  </div>
                  {customSpec.steps.map((s) => (
                    <div key={s.stepNumber} className="p-2.5 rounded-lg border border-slate-200 text-xs">
                      <div className="font-bold text-slate-900">
                        Step {s.stepNumber}: {s.operation}
                      </div>
                      <div className="font-mono text-blue-800 mt-0.5">{s.mathOrLogic}</div>
                      <div className="text-slate-600 mt-0.5">{s.explanation}</div>
                    </div>
                  ))}
                </div>

                {(customSpec.matchedBuiltInId || customTracePreview) && (
                  <button
                    type="button"
                    onClick={handleLoadAnalyzedIntoVisualizer}
                    className="w-full py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white text-sm font-semibold transition-colors"
                  >
                    Open Live Step-by-Step Visualizer
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: UCI DATASET EXPLORER */}
      {activeTab === 'datasets' && (
        <UciDatasetExplorer
          activeDataset={activeDataset}
          selectedFeatures={selectedFeatures}
          selectedTarget={selectedTarget}
          onSelectDataset={setActiveDataset}
          onChangeFeatures={setSelectedFeatures}
          onChangeTarget={setSelectedTarget}
          onOpenMlPlayground={() => setActiveTab('ml-playground')}
        />
      )}

      {/* TAB 4: ML TRAINING PLAYGROUND */}
      {activeTab === 'ml-playground' && (
        <MlPlaygroundPanel
          dataset={activeDataset}
          selectedFeatures={selectedFeatures}
          selectedTarget={selectedTarget}
        />
      )}

      {/* TAB 5: ALGORITHM COMPARISON */}
      {activeTab === 'compare' && <AlgorithmComparisonPanel />}

      {/* TAB 6: ANIMATED CONCEPT VIDEO & QUIZ */}
      {activeTab === 'video-lesson' && (
        <SmartVideoLessonWidget
          topicQuery={`${activeDef.name} algorithm`}
          preferredSubject="computer-science"
          title={`Animated Concept Video, Pseudocode & Quiz: ${activeDef.name}`}
          autoGenerate
        />
      )}
    </div>
  );
}
