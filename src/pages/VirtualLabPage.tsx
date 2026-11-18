import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Cpu,
  Download,
  Droplets,
  FileText,
  Film,
  FlaskConical,
  HelpCircle,
  Link2,
  ListChecks,
  Mountain,
  NotebookPen,
  Play,
  Plus,
  RotateCcw,
  Save,
  Sparkles,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { getInstrumentById, getRecommendedKitForExperiment } from '../data/labEquipment';
import {
  EXPERIMENTS,
  getDefaultParams,
  getExperimentById,
} from '../engine/experiments';
import { findExperimentsForBenchSetup } from '../engine/equipmentRegistry';
import { executeScientificExperiment, validateWorkbenchSetup } from '../engine/executionEngine';
import { getSafetyBadgeMeta } from '../engine/safetyEngine';
import type {
  ChemistryBenchSyncState,
  CurriculumExperimentEntry,
  LabDepartmentId,
  TrialRecord,
  WorkbenchConnection,
  WorkbenchItem,
} from '../types/science';
import { Accordion } from '../components/ui/Accordion';
import { AudioNarrationBar } from '../components/ui/AudioNarrationBar';
import { BoilingAltitudeLab } from '../components/lab/BoilingAltitudeLab';
import { CurriculumCatalogPanel } from '../components/lab/CurriculumCatalogPanel';
import { ExperimentGraphWorkspace } from '../components/lab/ExperimentGraphWorkspace';
import { ExperimentVideoPanel } from '../components/lab/ExperimentVideoPanel';
import { PredictionChallengeCard } from '../components/lab/PredictionChallengeCard';
import { ScienceCampusLobby } from '../components/lab/ScienceCampusLobby';
import { TrialManagerPanel } from '../components/lab/TrialManagerPanel';
import { VirtualLabRoom, type BenchCommandRequest } from '../components/lab/VirtualLabRoom';
import { exportExperimentPdfReport, exportTrialsCsv } from '../utils/exportUtils';

type LabTab =
  | 'room'
  | 'boiling-demo'
  | 'video'
  | 'catalog'
  | 'graphs'
  | 'trials'
  | 'report';

export function VirtualLabPage() {
  const {
    activeDivision,
    activeExperimentId,
    setActiveExperimentId,
    activeDepartment,
    setActiveDepartment,
    trialsByExperiment,
    addTrial,
    renameTrial,
    deleteTrial,
    predictionsByExperiment,
    savePrediction,
    addSavedReport,
    saveNotebookEntry,
    workbenchHandoff,
    setWorkbenchHandoff,
    navigate,
    t,
  } = useLab();

  const experiment = useMemo(
    () => getExperimentById(activeExperimentId),
    [activeExperimentId]
  );

  const [activeTab, setActiveTab] = useState<LabTab>('room');
  const [insideLabRoom, setInsideLabRoom] = useState<boolean>(() => Boolean(workbenchHandoff));
  const [params, setParams] = useState<Record<string, number>>(() =>
    getDefaultParams(experiment)
  );
  const [hasRunCurrent, setHasRunCurrent] = useState(false);
  const [feedbackBanner, setFeedbackBanner] = useState<{
    type: 'success' | 'error';
    text: string;
    openNotebookLink?: boolean;
  } | null>(null);
  const [studentNotes, setStudentNotes] = useState('');
  const [chemistrySync, setChemistrySync] = useState<ChemistryBenchSyncState | null>(null);
  const [autoSyncFromBench, setAutoSyncFromBench] = useState(true);
  const lastSyncedTotalRef = useRef<number>(0);
  const [benchItems, setBenchItems] = useState<WorkbenchItem[]>([]);
  const [benchConnections, setBenchConnections] = useState<WorkbenchConnection[]>([]);
  const [benchCommand, setBenchCommand] = useState<BenchCommandRequest | null>(null);

  const handleWorkbenchStateChange = useCallback(
    (items: WorkbenchItem[], conns: WorkbenchConnection[]) => {
      setBenchItems(items);
      setBenchConnections(conns);
    },
    []
  );

  useEffect(() => {
    setParams(getDefaultParams(experiment));
    setHasRunCurrent(false);
    setFeedbackBanner(null);
    setChemistrySync(null);
    lastSyncedTotalRef.current = 0;
  }, [experiment]);

  useEffect(() => {
    if (
      !autoSyncFromBench ||
      activeDepartment !== 'chemistry' ||
      !chemistrySync ||
      !chemistrySync.hasPouredContent ||
      chemistrySync.experimentId !== experiment.id
    ) {
      return;
    }
    if (chemistrySync.totalTransferredMlOrG !== lastSyncedTotalRef.current) {
      lastSyncedTotalRef.current = chemistrySync.totalTransferredMlOrG;
      setParams((prev) => {
        const next = { ...prev };
        for (const p of experiment.parameters) {
          const val = chemistrySync.derivedParams[p.key];
          if (typeof val === 'number' && !Number.isNaN(val)) {
            next[p.key] = Math.min(p.max, Math.max(p.min, val));
          }
        }
        return next;
      });
    }
  }, [autoSyncFromBench, activeDepartment, chemistrySync, experiment]);

  useEffect(() => {
    if (!workbenchHandoff) return;
    if (workbenchHandoff.autoOpenBoilingDemo) {
      setActiveExperimentId('boiling-point');
      setActiveTab('boiling-demo');
      setInsideLabRoom(true);
      setWorkbenchHandoff(null);
      return;
    }
    if (
      workbenchHandoff.enterRoomDirectly ||
      workbenchHandoff.savedDesignId ||
      workbenchHandoff.department ||
      workbenchHandoff.equipmentIds?.length
    ) {
      setInsideLabRoom(true);
      setActiveTab('room');
    }
  }, [workbenchHandoff, setActiveExperimentId, setWorkbenchHandoff]);

  const result = useMemo(() => experiment.calculate(params), [experiment, params]);
  const trials = trialsByExperiment[experiment.id] ?? [];
  const safetyMeta = getSafetyBadgeMeta(experiment.safetyLevel);

  const benchValidation = useMemo(
    () =>
      validateWorkbenchSetup({
        experimentId: experiment.id,
        params,
        workbenchItems: benchItems,
        connections: benchConnections,
      }),
    [experiment.id, params, benchItems, benchConnections]
  );

  const compatibleBenchExperiments = useMemo(
    () => findExperimentsForBenchSetup(benchItems).slice(0, 4),
    [benchItems]
  );

  const experimentNarrationText = useMemo(
    () =>
      [
        `Experiment ${experiment.number}: ${experiment.title}.`,
        experiment.explanation,
        `Scientific principle: ${experiment.principle}.`,
        `Learning objective: ${experiment.learningObjective}.`,
        `Hypothesis: ${experiment.hypothesis}.`,
        `Formula: ${experiment.formula}. ${experiment.formulaDescription}`,
      ]
        .filter(Boolean)
        .join(' '),
    [experiment]
  );

  const resultsNarrationText = useMemo(
    () =>
      [
        `Simulated result for ${experiment.title}.`,
        `${result.primaryLabel} equals ${result.primaryValue} ${result.primaryUnit}.`,
        result.secondaryMetrics
          .map((m) => `${m.label}: ${m.value} ${m.unit}`)
          .join('. '),
        `Conclusion: ${experiment.graphInterpretation.conclusion}.`,
      ]
        .filter(Boolean)
        .join(' '),
    [experiment, result]
  );

  const handleParamChange = (key: string, val: number) => {
    const def = experiment.parameters.find((p) => p.key === key);
    if (!def || Number.isNaN(val)) return;
    const clamped = Math.min(def.max, Math.max(def.min, val));
    setParams((prev) => ({ ...prev, [key]: clamped }));
  };

  const buildTrialRecord = (
    inputMap: Record<string, number>,
    customName?: string
  ): TrialRecord => {
    const calc = experiment.calculate(inputMap);
    const unitsMap: Record<string, string> = {};
    for (const p of experiment.parameters) {
      unitsMap[p.key] = p.unit;
    }
    return {
      id: `trial-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      experimentId: experiment.id,
      name: customName || `Trial ${trials.length + 1}`,
      inputs: { ...inputMap },
      units: unitsMap,
      primaryOutput: {
        label: calc.primaryLabel,
        symbol: calc.primarySymbol,
        value: calc.primaryValue,
        unit: calc.primaryUnit,
      },
      secondaryOutputs: calc.secondaryMetrics,
      timestamp: new Date().toISOString(),
      dataType: 'Deterministic Virtual Simulation',
      modelVersion: 'v1.0-validated',
    };
  };

  const handleRunAndRecord = (recordTrial: boolean) => {
    setHasRunCurrent(true);
    if (recordTrial) {
      const res = addTrial(buildTrialRecord(params));
      if (res.ok) {
        setFeedbackBanner({
          type: 'success',
          text: `Recorded Trial ${trials.length + 1}: ${result.primarySymbol} = ${result.primaryValue} ${result.primaryUnit}.`,
        });
      } else {
        setFeedbackBanner({ type: 'error', text: res.error || 'Could not add trial.' });
      }
    } else {
      setFeedbackBanner({
        type: 'success',
        text: `Calculated ${result.primaryLabel}: ${result.primaryValue} ${result.primaryUnit}. Click "Add Trial" to store this run.`,
      });
    }
  };

  const handleExecuteValidatedSetup = () => {
    const exec = executeScientificExperiment({
      experimentId: experiment.id,
      params,
      workbenchItems: benchItems,
      connections: benchConnections,
    });
    if (!exec.ok) {
      setFeedbackBanner({
        type: 'error',
        text: exec.error || 'Workbench setup is incomplete.',
      });
      return;
    }
    setHasRunCurrent(true);
    setFeedbackBanner({
      type: 'success',
      text: `Validated setup executed! ${exec.apparatusReadouts?.map((r) => `${r.label}: ${r.value}`).join(' · ')}`,
    });
  };

  const handleSaveToNotebook = () => {
    const now = new Date().toISOString();
    const apparatusSummary =
      benchItems.length > 0
        ? benchItems
            .map((w) => getInstrumentById(w.instrumentId)?.name ?? w.instrumentId)
            .join(', ')
        : 'Virtual Parameter Simulation';
    const paramSummary = experiment.parameters
      .map((p) => `${p.label} (${p.symbol}) = ${params[p.key] ?? p.defaultValue} ${p.unit}`)
      .join('; ');
    const metricsSummary = [
      `${result.primaryLabel} (${result.primarySymbol}) = ${result.primaryValue} ${result.primaryUnit}`,
      ...result.secondaryMetrics.map((m) => `${m.label}: ${m.value} ${m.unit}`),
    ].join(' | ');

    saveNotebookEntry({
      id: `nb-run-${Date.now()}`,
      division: activeDivision,
      title: `${experiment.shortTitle} — ${result.primarySymbol} = ${result.primaryValue} ${result.primaryUnit}`,
      subject: experiment.subject,
      hypothesis: experiment.hypothesis,
      materialsAndSetup: `Apparatus: ${apparatusSummary}. Parameters: ${paramSummary}.`,
      observations: metricsSummary,
      calculationsAndEquations: `${experiment.formula} -> ${result.calculationSteps.slice(0, 3).join(' ; ')}`,
      conclusion: studentNotes.trim() || experiment.graphInterpretation.conclusion,
      safetyLevel: experiment.safetyLevel,
      experimentId: experiment.id,
      createdAt: now,
      updatedAt: now,
    });
    setFeedbackBanner({
      type: 'success',
      text: `Saved experiment run "${experiment.shortTitle}" to Research Notebook.`,
      openNotebookLink: true,
    });
  };

  const handleReset = () => {
    setParams(getDefaultParams(experiment));
    setHasRunCurrent(false);
    setFeedbackBanner(null);
  };

  const handleSaveReport = () => {
    addSavedReport({
      id: `rep-${Date.now()}`,
      experimentId: experiment.id,
      experimentTitle: experiment.title,
      aim: experiment.learningObjective,
      hypothesis: experiment.hypothesis,
      trialsCount: trials.length,
      latestResultSummary: `${result.primarySymbol} = ${result.primaryValue} ${result.primaryUnit}`,
      analysisNotes: studentNotes.trim() || experiment.graphInterpretation.conclusion,
      safetyLevel: experiment.safetyLevel,
      createdAt: new Date().toISOString(),
    });
    setFeedbackBanner({
      type: 'success',
      text: 'Lab report saved to My Learning.',
    });
  };

  return (
    <div className="space-y-6 pb-16 min-w-0 max-w-full">
      {/* Experiment Selector Strip */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm min-w-0 max-w-full">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FlaskConical className="w-5 h-5 text-blue-700" />
            <h1 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
              Virtual Science Laboratory
            </h1>
          </div>
          <select
            aria-label="Select experiment"
            value={experiment.id}
            onChange={(e) => {
              const id = e.target.value;
              setActiveExperimentId(id);
              const kit = getRecommendedKitForExperiment(id);
              setActiveDepartment(kit.department);
              setInsideLabRoom(true);
              setActiveTab('room');
            }}
            className="px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900 w-full sm:w-80 max-w-full"
          >
            {EXPERIMENTS.map((exp) => (
              <option key={exp.id} value={exp.id}>
                #{exp.number} · {exp.shortTitle}
              </option>
            ))}
          </select>
        </div>

        {/* Quick Pills for switching 10 modules */}
        <div className="flex gap-2 overflow-x-auto max-w-full min-w-0 pb-1">
          <button
            type="button"
            onClick={() => {
              setInsideLabRoom(false);
              setActiveTab('room');
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap shrink-0 border transition-colors ${
              activeTab === 'room' && !insideLabRoom
                ? 'bg-emerald-700 text-white border-emerald-700'
                : 'bg-emerald-50 text-emerald-800 border-emerald-200 hover:bg-emerald-100'
            }`}
          >
            Campus Directory (10 Labs)
          </button>
          {EXPERIMENTS.map((exp) => {
            const active = exp.id === experiment.id && insideLabRoom;
            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => {
                  setActiveExperimentId(exp.id);
                  const kit = getRecommendedKitForExperiment(exp.id);
                  setActiveDepartment(kit.department);
                  setInsideLabRoom(true);
                  setActiveTab('room');
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-colors ${
                  active
                    ? 'bg-blue-700 text-white border-blue-700 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                {exp.number}. {exp.shortTitle}
              </button>
            );
          })}
        </div>
      </div>

      {/* Experiment Header Summary */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs text-slate-500">
              Experiment #{experiment.number} · {experiment.subject} · {experiment.unitsSummary}
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900">
              {experiment.title}
            </h2>
            <p className="text-sm text-slate-600 max-w-3xl">{experiment.explanation}</p>
          </div>
          <div
            className={`px-3 py-1.5 rounded-lg border text-xs font-semibold shrink-0 ${safetyMeta.bgClass} ${safetyMeta.borderClass} ${safetyMeta.colorClass}`}
          >
            {safetyMeta.label}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3 pt-2 border-t border-slate-100 text-xs">
          <div>
            <span className="text-slate-500">Independent Variable:</span>{' '}
            <span className="text-slate-900 font-medium">{experiment.independentVariable}</span>
          </div>
          <div>
            <span className="text-slate-500">Dependent Variable:</span>{' '}
            <span className="text-slate-900 font-medium">{experiment.dependentVariable}</span>
          </div>
          <div>
            <span className="text-slate-500">Controlled:</span>{' '}
            <span className="text-slate-900 font-medium">{experiment.controlledVariables.join(', ')}</span>
          </div>
        </div>

        <AudioNarrationBar
          title={`Experiment Procedure & Concept: ${experiment.shortTitle}`}
          text={experimentNarrationText}
          compact
        />
      </div>

      {/* Workspace Tabs */}
      <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 pb-3" role="tablist">
        {(
          [
            { id: 'room', label: insideLabRoom ? 'Laboratory Room' : 'Science Campus (10 Labs)', icon: Cpu },
            { id: 'boiling-demo', label: 'Altitude Boiling Demo', icon: Mountain },
            { id: 'video', label: 'Video & Concept Guide', icon: Film },
            { id: 'catalog', label: 'Curriculum Catalog', icon: BookOpen },
            { id: 'graphs', label: `${t.tabs.graphs}`, icon: BarChart3 },
            { id: 'trials', label: `${t.tabs.trials} (${trials.length}/10)`, icon: ListChecks },
            { id: 'report', label: t.tabs.report, icon: FileText },
          ] as const
        ).map((tab) => {
          const Icon = tab.icon;
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3.5 py-2.5 rounded-lg text-xs sm:text-sm font-medium flex items-center gap-1.5 transition-colors min-h-[42px] whitespace-nowrap ${
                active
                  ? 'bg-blue-700 text-white font-semibold shadow-sm'
                  : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
              }`}
            >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      {feedbackBanner && (
        <div
          className={`rounded-lg border px-4 py-3 text-sm flex flex-wrap items-center justify-between gap-3 ${
            feedbackBanner.type === 'success'
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-rose-200 bg-rose-50 text-rose-800'
          }`}
        >
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            {feedbackBanner.text}
          </span>
          <div className="flex items-center gap-3">
            {feedbackBanner.openNotebookLink && (
              <button
                type="button"
                onClick={() => navigate('research-notebook')}
                className="px-2.5 py-1 rounded-md bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
              >
                Open Research Notebook
              </button>
            )}
            <button
              type="button"
              onClick={() => setFeedbackBanner(null)}
              className="text-xs underline"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* TAB 1: SCIENCE CAMPUS LOBBY OR ACTIVE ARCHITECTURAL LAB ROOM */}
      {activeTab === 'room' && (
        <div className="space-y-6">
          {!insideLabRoom ? (
            <ScienceCampusLobby
              activeDepartment={activeDepartment}
              onEnterLab={(dept: LabDepartmentId, defaultExpId?: string) => {
                setWorkbenchHandoff({
                  department: dept,
                  experimentId: defaultExpId,
                  enterRoomDirectly: true,
                });
                if (defaultExpId) setActiveExperimentId(defaultExpId);
                setActiveDepartment(dept);
                setInsideLabRoom(true);
              }}
            />
          ) : (
            <>
              <VirtualLabRoom
                experiment={experiment}
                params={params}
                result={result}
                onParamChange={handleParamChange}
                onSelectExperiment={setActiveExperimentId}
                onRecordTrial={() => handleRunAndRecord(true)}
                onOpenBoilingAltitudeDemo={() => setActiveTab('boiling-demo')}
                onExitToCampus={() => setInsideLabRoom(false)}
                trialsCount={trials.length}
                onChemistryBenchSync={setChemistrySync}
                onWorkbenchStateChange={handleWorkbenchStateChange}
                benchCommand={benchCommand}
              />

              {/* APPARATUS READINESS & LIVE EXECUTION SYNC BAR */}
              <div
                data-testid="apparatus-readiness-bar"
                className={`rounded-xl border p-4 space-y-3 shadow-sm ${
                  benchValidation.valid
                    ? 'border-emerald-200 bg-emerald-50/70'
                    : benchValidation.status === 'missing_equipment' || benchValidation.status === 'not_configured'
                      ? 'border-amber-200 bg-amber-50/80'
                      : 'border-rose-200 bg-rose-50/80'
                }`}
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <div className="text-xs font-bold text-slate-900 flex items-center gap-2">
                      {benchValidation.valid ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-700" />
                      )}
                      Apparatus Readiness ({experiment.shortTitle}):{' '}
                      <span
                        className={`font-mono uppercase text-[11px] px-2 py-0.5 rounded ${
                          benchValidation.valid
                            ? 'bg-emerald-700 text-white'
                            : 'bg-amber-700 text-white'
                        }`}
                      >
                        {benchValidation.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-xs text-slate-700">
                      {benchValidation.valid
                        ? `${benchItems.length} placed apparatus & ${benchConnections.length} coupling(s) verified.`
                        : benchValidation.compatibilityErrors[0] || benchValidation.guidanceSteps[0]}
                    </p>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {(benchValidation.missingEquipmentIds.length > 0 || benchItems.length === 0) && (
                      <button
                        type="button"
                        data-testid="add-missing-kit-btn"
                        onClick={() =>
                          setBenchCommand({ id: Date.now(), type: 'add-missing-kit' })
                        }
                        className="px-3.5 py-2 rounded-lg bg-amber-600 text-white text-xs font-bold hover:bg-amber-700 flex items-center gap-1.5 min-h-[38px]"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        Add Missing Kit ({benchValidation.missingEquipmentNames.length || 'Recommended'})
                      </button>
                    )}
                    {benchValidation.status === 'invalid_configuration' && benchItems.length >= 2 && (
                      <button
                        type="button"
                        data-testid="auto-wire-tools-btn"
                        onClick={() => setBenchCommand({ id: Date.now(), type: 'auto-wire' })}
                        className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 min-h-[38px]"
                      >
                        <Link2 className="w-3.5 h-3.5" />
                        Auto-Wire Tools
                      </button>
                    )}
                    {benchValidation.valid && (
                      <button
                        type="button"
                        data-testid="run-validated-setup-btn"
                        onClick={handleExecuteValidatedSetup}
                        className="px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center gap-1.5 min-h-[38px]"
                      >
                        <Play className="w-3.5 h-3.5" />
                        Run Validated Setup
                      </button>
                    )}
                  </div>
                </div>

                {benchValidation.missingEquipmentNames.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-amber-950">
                    <span className="font-semibold">Missing Slots:</span>
                    {benchValidation.missingEquipmentNames.map((name) => (
                      <span
                        key={name}
                        className="px-2 py-0.5 rounded bg-white border border-amber-200 font-medium"
                      >
                        {name}
                      </span>
                    ))}
                  </div>
                )}

                {compatibleBenchExperiments.length > 0 && (
                  <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200/70 text-[11px]">
                    <span className="text-slate-600 font-semibold">Detected Bench Matches:</span>
                    {compatibleBenchExperiments.map((match) => (
                      <button
                        key={match.experimentId}
                        type="button"
                        onClick={() => setActiveExperimentId(match.experimentId)}
                        className={`px-2 py-0.5 rounded border font-medium ${
                          match.experimentId === experiment.id
                            ? 'border-blue-600 bg-blue-50 text-blue-800 font-bold'
                            : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'
                        }`}
                      >
                        {match.shortTitle} ({match.readinessLabel})
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <PredictionChallengeCard
            experiment={experiment}
            savedPrediction={predictionsByExperiment[experiment.id]}
            hasRunAfterPrediction={hasRunCurrent}
            result={result}
            onSubmitPrediction={savePrediction}
            onEncourageAnotherTrial={() => setActiveTab('room')}
          />

          <div className="grid lg:grid-cols-12 gap-6">
            {/* Parameter Controls */}
            <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-5 shadow-sm">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-slate-900">Interactive Parameters</h3>
                <button
                  type="button"
                  onClick={handleReset}
                  className="text-xs text-slate-600 hover:text-slate-900 flex items-center gap-1"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  {t.actions.reset}
                </button>
              </div>

              {activeDepartment === 'chemistry' && chemistrySync && (
                <div
                  data-testid="chemistry-bench-sync-card"
                  className={`rounded-lg border p-3 text-xs space-y-2 ${
                    chemistrySync.hasPouredContent
                      ? 'border-sky-200 bg-sky-50/70 text-slate-800'
                      : 'border-slate-200 bg-slate-50 text-slate-600'
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-semibold text-slate-900 flex items-center gap-1.5">
                      <Droplets className="w-3.5 h-3.5 text-sky-700" />
                      Workbench Vessel Sync
                    </span>
                    <div className="flex items-center gap-2">
                      <label className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-700 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={autoSyncFromBench}
                          onChange={(e) => setAutoSyncFromBench(e.target.checked)}
                          className="accent-sky-700 rounded"
                        />
                        Auto-sync pours
                      </label>
                      {chemistrySync.hasPouredContent && (
                        <button
                          type="button"
                          onClick={() => {
                            setParams((prev) => {
                              const next = { ...prev };
                              for (const p of experiment.parameters) {
                                const val = chemistrySync.derivedParams[p.key];
                                if (typeof val === 'number' && !Number.isNaN(val)) {
                                  next[p.key] = Math.min(p.max, Math.max(p.min, val));
                                }
                              }
                              return next;
                            });
                          }}
                          className="px-2 py-1 rounded bg-white border border-sky-300 text-sky-800 font-semibold text-[11px] hover:bg-sky-100"
                        >
                          Sync Now
                        </button>
                      )}
                    </div>
                  </div>
                  <p className="text-[11px] leading-snug">{chemistrySync.summaryNote}</p>
                  {chemistrySync.vesselSummaries.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-0.5">
                      {chemistrySync.vesselSummaries.map((v) => (
                        <span
                          key={v.instanceId}
                          className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[10px] text-slate-700 tabular-nums"
                        >
                          {v.label}: {v.currentAmount}/{v.capacity} {v.unit}
                          {v.currentAmount > 0 ? ` (${v.substancesSummary})` : ' (Empty)'}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="space-y-5">
                {experiment.parameters.map((param) => {
                  const val = params[param.key] ?? param.defaultValue;
                  return (
                    <div key={param.key} className="space-y-2">
                      <div className="flex items-center justify-between gap-2">
                        <label
                          htmlFor={`param-${param.key}`}
                          className="text-sm font-medium text-slate-900"
                        >
                          {param.label} ({param.symbol})
                        </label>
                        <div className="flex items-center gap-1.5">
                          <input
                            id={`param-${param.key}`}
                            type="number"
                            min={param.min}
                            max={param.max}
                            step={param.step}
                            value={val}
                            onChange={(e) => handleParamChange(param.key, Number(e.target.value))}
                            className="w-24 px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-right font-mono tabular-nums text-sm text-slate-900"
                          />
                          <span className="text-xs font-mono text-slate-500 w-16">
                            {param.unit}
                          </span>
                        </div>
                      </div>

                      <input
                        type="range"
                        aria-label={`${param.label} slider`}
                        min={param.min}
                        max={param.max}
                        step={param.step}
                        value={val}
                        onChange={(e) => handleParamChange(param.key, Number(e.target.value))}
                        className="w-full accent-blue-700 cursor-pointer"
                      />

                      <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                        <span>Min: {param.min} {param.unit}</span>
                        <span>Default: {param.defaultValue} {param.unit}</span>
                        <span>Max: {param.max} {param.unit}</span>
                      </div>

                      {param.options && (
                        <div className="flex flex-wrap gap-1.5 pt-1">
                          {param.options.map((opt) => (
                            <button
                              key={opt.label}
                              type="button"
                              onClick={() => handleParamChange(param.key, opt.value)}
                              className={`px-2.5 py-1 rounded text-[11px] border ${
                                Math.abs(val - opt.value) < 0.0001
                                  ? 'border-blue-700 bg-blue-50 text-blue-700 font-semibold'
                                  : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                              }`}
                            >
                              {opt.label}
                            </button>
                          ))}
                        </div>
                      )}
                      <p className="text-xs text-slate-600">{param.description}</p>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap gap-3 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => handleRunAndRecord(false)}
                  className="flex-1 min-w-[140px] py-2.5 px-4 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Play className="w-4 h-4" />
                  {t.actions.runExperiment}
                </button>
                <button
                  type="button"
                  disabled={trials.length >= 10}
                  onClick={() => handleRunAndRecord(true)}
                  className="py-2.5 px-4 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 disabled:opacity-40 flex items-center justify-center gap-2 min-h-[44px]"
                >
                  <Save className="w-4 h-4" />
                  {t.actions.addTrial} ({trials.length}/10)
                </button>
              </div>
            </div>

            {/* Deterministic Output Readout */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Calculated Simulation Outcome</span>
                  <span className="font-mono text-emerald-700 font-semibold">Deterministic Model · v1.0</span>
                </div>

                <div>
                  <div className="text-sm text-slate-600">
                    {result.primaryLabel} ({result.primarySymbol})
                  </div>
                  <div className="text-4xl font-mono font-bold tabular-nums text-blue-700 mt-1">
                    {result.primaryValue}{' '}
                    <span className="text-lg font-normal text-slate-500">{result.primaryUnit}</span>
                  </div>
                </div>

                <div className="grid sm:grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                  {result.secondaryMetrics.map((m) => (
                    <div key={m.label} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                      <div className="text-xs text-slate-600">{m.label} ({m.symbol})</div>
                      <div className="text-lg font-mono font-semibold tabular-nums text-slate-900 mt-0.5">
                        {m.value} <span className="text-xs text-slate-500">{m.unit}</span>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="text-xs text-slate-600 bg-slate-50 rounded-lg p-3 border border-slate-200">
                  <strong className="text-slate-900">Validity Range:</strong> {experiment.validityRange}
                </div>

                <AudioNarrationBar
                  title="Narrate Calculated Outcome & Conclusion"
                  text={resultsNarrationText}
                  compact
                />

                <div className="flex flex-wrap gap-2 pt-1">
                  <button
                    type="button"
                    data-testid="save-run-notebook-btn"
                    onClick={handleSaveToNotebook}
                    className="px-3.5 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5"
                  >
                    <NotebookPen className="w-3.5 h-3.5" />
                    Save Run to Research Notebook
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('graphs')}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-1.5"
                  >
                    <BarChart3 className="w-3.5 h-3.5 text-blue-700" />
                    Open Graphs Tab
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('what-if', { whatIfExpId: experiment.id })}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-1.5"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-600" />
                    Explore in What If Studio
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('detective', { detectiveExpId: experiment.id })}
                    className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-1.5"
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-teal-600" />
                    Ask Science Detective
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Expandable Accordions */}
          <div className="space-y-3">
            <Accordion
              title="Real Science Mode: Formula & Step-by-Step Calculation"
              subtitle="Expand to inspect exact mathematical formula, variables, and arithmetic steps"
            >
              <div className="space-y-3 pt-2">
                <div className="font-mono text-sm text-blue-700 bg-slate-50 p-3 rounded-lg border border-slate-200">
                  {experiment.formula}
                </div>
                <p className="text-xs text-slate-600">{experiment.formulaDescription}</p>
                <div className="space-y-1 font-mono text-xs text-slate-800">
                  {result.calculationSteps.map((step, i) => (
                    <div key={i}>{step}</div>
                  ))}
                </div>
              </div>
            </Accordion>

            <Accordion
              title="Scientific Hypothesis, Assumptions & Limitations"
              subtitle="Expand to examine idealisations and physical boundaries of this model"
            >
              <div className="grid sm:grid-cols-2 gap-4 pt-2">
                <div>
                  <div className="text-xs font-semibold text-slate-900 mb-1">Working Hypothesis</div>
                  <p className="text-xs text-slate-600 mb-3">{experiment.hypothesis}</p>
                  <div className="text-xs font-semibold text-slate-900 mb-1">Model Assumptions</div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                    {experiment.assumptions.map((a, idx) => (
                      <li key={idx}>{a}</li>
                    ))}
                  </ul>
                </div>
                <div>
                  <div className="text-xs font-semibold text-slate-900 mb-1">Model Limitations</div>
                  <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
                    {experiment.limitations.map((l, idx) => (
                      <li key={idx}>{l}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </Accordion>

            <Accordion
              title="Safety Classification & Verified References"
              subtitle="Expand to view Student Safety Guardian classification and primary sources"
            >
              <div className="space-y-3 pt-2">
                <div className="text-xs text-slate-800">
                  <strong>Safety Level ({experiment.safetyLevel}):</strong> {experiment.safetyNote}
                </div>
                <div className="space-y-1.5">
                  <div className="text-xs font-semibold text-slate-900">Verified Scientific References</div>
                  {experiment.references.map((ref) => (
                    <div key={ref.url} className="text-xs">
                      <a
                        href={ref.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-700 hover:underline"
                      >
                        {ref.title} ({ref.source}) ↗
                      </a>
                    </div>
                  ))}
                </div>
              </div>
            </Accordion>
          </div>
        </div>
      )}

      {/* TAB 1B: SEA LEVEL VS HIGH ALTITUDE BOILING DEMO */}
      {activeTab === 'boiling-demo' && (
        <BoilingAltitudeLab
          onRecordTrial={(trial) => addTrial(trial)}
          onOpenVideoTab={() => setActiveTab('video')}
          existingTrialsCount={(trialsByExperiment['boiling-point'] ?? []).length}
        />
      )}

      {/* TAB 1C: CONNECTED EDUCATIONAL VIDEO EXPLORER */}
      {activeTab === 'video' && <ExperimentVideoPanel experiment={experiment} />}

      {/* TAB 1D: CURRICULUM CATALOG */}
      {activeTab === 'catalog' && (
        <CurriculumCatalogPanel
          onLaunchEntry={(entry: CurriculumExperimentEntry) => {
            const targetExpId = entry.modelId || activeExperimentId;
            setWorkbenchHandoff({
              department: entry.department,
              experimentId: targetExpId,
              equipmentIds: entry.equipmentIds,
              chemicalIds: entry.chemicalIds,
              enterRoomDirectly: true,
            });
            setInsideLabRoom(true);
            setActiveTab('room');
            setFeedbackBanner({
              type: 'success',
              text:
                entry.modelTier === 'conceptual' || entry.modelTier === 'planned'
                  ? `Entered ${entry.department} Lab with "${entry.title}" apparatus assembled (${entry.modelTier} tier).`
                  : `Entered ${entry.department} Lab with "${entry.title}" model and apparatus loaded.`,
            });
          }}
        />
      )}

      {/* TAB 2: GRAPH WORKSPACE */}
      {activeTab === 'graphs' && (
        <ExperimentGraphWorkspace
          experiment={experiment}
          currentParams={params}
          result={result}
          trials={trials}
        />
      )}

      {/* TAB 3: TRIAL MANAGER */}
      {activeTab === 'trials' && (
        <TrialManagerPanel
          experiment={experiment}
          trials={trials}
          currentParams={params}
          onAddCurrentTrial={() => handleRunAndRecord(true)}
          onRepeatTrial={(trial) => {
            const res = addTrial(buildTrialRecord(trial.inputs, `${trial.name} (Repeat)`));
            if (!res.ok) setFeedbackBanner({ type: 'error', text: res.error || 'Limit reached.' });
          }}
          onReopenTrial={(trial) => {
            setParams({ ...trial.inputs });
            setHasRunCurrent(true);
            setActiveTab('room');
            setFeedbackBanner({
              type: 'success',
              text: `Loaded parameters from "${trial.name}".`,
            });
          }}
          onRenameTrial={(trialId, newName) => renameTrial(experiment.id, trialId, newName)}
          onDeleteTrial={(trialId) => deleteTrial(experiment.id, trialId)}
        />
      )}

      {/* TAB 4: REPORT & EXPORT */}
      {activeTab === 'report' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
          <div>
            <h3 className="text-lg font-display font-bold text-slate-900">
              Structured Lab Report Generator
            </h3>
            <p className="text-sm text-slate-600 mt-1">
              Includes aim, hypothesis, variables, formula, parameters, {trials.length} saved trials, graph conclusion, assumptions, limitations, and safety classification.
            </p>
          </div>

          <div className="space-y-2">
            <label htmlFor="report-notes" className="text-xs font-semibold text-slate-900 block">
              Your Scientific Conclusion &amp; Observations (Optional)
            </label>
            <textarea
              id="report-notes"
              rows={4}
              value={studentNotes}
              onChange={(e) => setStudentNotes(e.target.value)}
              placeholder="Summarize what changed across your trials, whether your prediction matched, and why..."
              className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
            />
          </div>

          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={handleSaveReport}
              className="px-4 py-2.5 rounded-lg bg-emerald-700 text-white text-sm font-semibold hover:bg-emerald-800 flex items-center gap-2"
            >
              <Save className="w-4 h-4" />
              {t.actions.saveReport}
            </button>
            <button
              type="button"
              onClick={() =>
                exportExperimentPdfReport({
                  experiment,
                  currentParams: params,
                  result,
                  trials,
                  studentNotes,
                })
              }
              className="px-4 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 flex items-center gap-2"
            >
              <Download className="w-4 h-4" />
              {t.actions.exportPdf}
            </button>
            <button
              type="button"
              disabled={trials.length === 0}
              onClick={() => exportTrialsCsv(experiment, trials)}
              className="px-4 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-900 text-sm font-medium hover:border-blue-400 disabled:opacity-40 flex items-center gap-2"
            >
              <Download className="w-4 h-4 text-blue-700" />
              {t.actions.exportCsv}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
