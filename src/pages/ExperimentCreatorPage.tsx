import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  CheckCircle2,
  FlaskConical,
  Loader2,
  PlusCircle,
  RotateCcw,
  Save,
  ShieldAlert,
  Sparkles,
  Trash2,
} from 'lucide-react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLab } from '../context/LabContext';
import { getChemicalById } from '../data/chemicals';
import { getInstrumentById, getLabRoomById } from '../data/labEquipment';
import { calculateCustomExperiment } from '../engine/experiments';
import { buildLocalExperimentTemplate } from '../engine/localFallback';
import { getSafetyBadgeMeta } from '../engine/safetyEngine';
import type { CustomExperimentDefinition, SafetyEvaluation } from '../types/science';
import { SmartVideoLessonWidget } from '../components/smart/SmartVideoLessonWidget';

const GENERATION_STAGES = [
  '1. Evaluating Safety Guardian classification...',
  '2. Designing scientific variables, formula & procedure...',
  '3. Mapping compatible laboratory apparatus & deterministic model...',
];

export function ExperimentCreatorPage() {
  const {
    customExperiments,
    saveCustomExperiment,
    deleteCustomExperiment,
    addSavedReport,
    language,
    recordSafetyCheck,
    creatorPrefillPrompt,
    setCreatorPrefillPrompt,
    creatorSelectedCustomId,
    setCreatorSelectedCustomId,
    setWorkbenchHandoff,
    navigate,
  } = useLab();

  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [stageIndex, setStageIndex] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [fallbackOffer, setFallbackOffer] = useState<CustomExperimentDefinition | null>(null);
  const [blockedSafety, setBlockedSafety] = useState<SafetyEvaluation | null>(null);
  const [draft, setDraft] = useState<CustomExperimentDefinition | null>(null);
  const [testInputVal, setTestInputVal] = useState<number>(10);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [observationNote, setObservationNote] = useState<string>('');
  const inFlightRef = useRef(false);

  useEffect(() => {
    if (creatorPrefillPrompt) {
      setPrompt(creatorPrefillPrompt);
      setCreatorPrefillPrompt(null);
    }
  }, [creatorPrefillPrompt, setCreatorPrefillPrompt]);

  useEffect(() => {
    if (creatorSelectedCustomId) {
      const found = customExperiments.find((c) => c.id === creatorSelectedCustomId);
      setCreatorSelectedCustomId(null);
      if (found) {
        setDraft(found);
        setTestInputVal(found.parameterRanges[0]?.defaultValue ?? 10);
        setSaveSuccess(`Loaded saved custom experiment "${found.title}".`);
      }
    }
  }, [creatorSelectedCustomId, customExperiments, setCreatorSelectedCustomId]);

  useEffect(() => {
    if (!loading) {
      setStageIndex(0);
      return;
    }
    const timer = window.setInterval(() => {
      setStageIndex((i) => Math.min(GENERATION_STAGES.length - 1, i + 1));
    }, 2400);
    return () => window.clearInterval(timer);
  }, [loading]);

  const runGenerate = async (targetPrompt = prompt) => {
    const clean = targetPrompt.trim();
    if (!clean || inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setStageIndex(0);
    setError(null);
    setFallbackOffer(null);
    setBlockedSafety(null);
    setSaveSuccess(null);

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch('/api/ai/create-experiment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: clean, language }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'The AI Experiment Creator is temporarily busy.');
        setFallbackOffer(data.fallbackTemplate || buildLocalExperimentTemplate(clean));
        return;
      }
      if (data.safety) recordSafetyCheck(clean, data.safety.level);
      if (data.blockedBySafety) {
        setBlockedSafety(data.safety);
        setDraft(null);
        return;
      }
      const localMatch = buildLocalExperimentTemplate(clean);
      const generated: CustomExperimentDefinition = {
        ...data.experiment,
        id: `custom-${Date.now()}`,
        department: data.experiment.department || localMatch.department,
        recommendedEquipmentIds:
          data.experiment.recommendedEquipmentIds && data.experiment.recommendedEquipmentIds.length > 0
            ? data.experiment.recommendedEquipmentIds
            : localMatch.recommendedEquipmentIds,
        recommendedChemicalIds:
          data.experiment.recommendedChemicalIds && data.experiment.recommendedChemicalIds.length > 0
            ? data.experiment.recommendedChemicalIds
            : localMatch.recommendedChemicalIds,
        roomOverviewNote: data.experiment.roomOverviewNote || localMatch.roomOverviewNote,
        matchedValidatedModelId: localMatch.matchedValidatedModelId,
        hasValidatedModel: Boolean(localMatch.matchedValidatedModelId),
        sourceMode: 'ai',
        createdAt: new Date().toISOString(),
      };
      setDraft(generated);
      setTestInputVal(generated.parameterRanges[0]?.defaultValue ?? 10);
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      setError(
        aborted
          ? 'AI experiment generation timed out after 18 seconds. You can retry or load our instant deterministic template below.'
          : 'Network error contacting the Experiment Creator service. Your prompt is saved—retry or use the local deterministic template.'
      );
      setFallbackOffer(buildLocalExperimentTemplate(clean));
    } finally {
      window.clearTimeout(timeoutId);
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    await runGenerate(prompt);
  };

  const handleUseFallbackTemplate = () => {
    const tpl = fallbackOffer || buildLocalExperimentTemplate(prompt);
    setDraft(tpl);
    setTestInputVal(tpl.parameterRanges[0]?.defaultValue ?? 10);
    setError(null);
    setFallbackOffer(null);
    setSaveSuccess('Loaded deterministic experiment template. You can edit parameters or assemble it in the Virtual Lab Room.');
  };

  const handleAssembleInLabRoom = () => {
    if (!draft) return;
    setWorkbenchHandoff({
      department: draft.department || 'physics',
      experimentId: draft.matchedValidatedModelId || undefined,
      equipmentIds: draft.recommendedEquipmentIds,
      chemicalIds: draft.recommendedChemicalIds,
      enterRoomDirectly: true,
    });
    navigate('virtual-lab', {
      experimentId: draft.matchedValidatedModelId || undefined,
    });
  };

  const deterministicPreview = useMemo(() => {
    if (!draft) return null;
    return calculateCustomExperiment(draft, testInputVal, 1);
  }, [draft, testInputVal]);

  const handleSave = () => {
    if (!draft) return;
    saveCustomExperiment(draft);
    setSaveSuccess(`Saved "${draft.title}" to your custom experiments.`);
  };

  const handleSaveObservationNote = () => {
    if (!draft) return;
    const note = observationNote.trim();
    if (!note) return;
    addSavedReport({
      id: `rep-custom-${Date.now()}`,
      experimentId: draft.id,
      experimentTitle: `Custom Blueprint: ${draft.title}`,
      aim: draft.learningObjective || draft.title,
      hypothesis: draft.hypothesis || draft.expectedResult || 'Custom conceptual hypothesis.',
      safetyLevel: draft.safetyClassification,
      createdAt: new Date().toISOString(),
      trialsCount: 1,
      latestResultSummary: draft.hasValidatedModel && deterministicPreview
        ? `Validated Model Preview: ${deterministicPreview.primaryValue} ${deterministicPreview.primaryUnit}`
        : 'Conceptual Lab Observation (no fabricated physics metrics)',
      analysisNotes: note,
    });
    setObservationNote('');
    setSaveSuccess(`Recorded observation note for "${draft.title}" inside My Learning.`);
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
          <PlusCircle className="w-4 h-4" />
          Structured AI Experiment Design · Deterministic Templates &amp; Lab Assembly
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
          AI Experiment Creator
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Describe an experiment in natural language. We design variables, safety checks, equipment mapping, and a deterministic calculation model that can be assembled right inside the Virtual Lab Room.
        </p>
      </div>

      <form onSubmit={handleGenerate} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <label htmlFor="creator-prompt" className="text-sm font-semibold text-slate-900 block">
          Describe Your Experiment Idea
        </label>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            id="creator-prompt"
            type="text"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="e.g. How does mountain altitude pressure affect water boiling temperature?"
            className="flex-1 px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
          />
          <button
            type="submit"
            disabled={loading || !prompt.trim()}
            className="px-5 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-40 flex items-center justify-center gap-2 shrink-0 min-h-[44px]"
          >
            {loading && <Loader2 className="w-4 h-4 animate-spin" />}
            {loading ? 'Designing Experiment...' : 'Generate Experiment'}
          </button>
        </div>

        {loading && (
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-3.5 space-y-2 text-xs">
            <div className="font-semibold text-blue-700">{GENERATION_STAGES[stageIndex]}</div>
            <div className="grid sm:grid-cols-3 gap-2">
              {GENERATION_STAGES.map((st, idx) => (
                <div
                  key={st}
                  className={`px-2.5 py-1.5 rounded border ${
                    idx <= stageIndex
                      ? 'border-blue-300 bg-white text-slate-900 font-medium'
                      : 'border-slate-200 text-slate-500'
                  }`}
                >
                  {st}
                </div>
              ))}
            </div>
          </div>
        )}
      </form>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-3 text-sm">
          <div className="text-rose-800 font-semibold">AI Generation Temporarily Unavailable</div>
          <p className="text-xs text-rose-900">{error}</p>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => runGenerate(prompt)}
              className="px-3.5 py-2 rounded-lg bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Retry with AI
            </button>
            <button
              type="button"
              onClick={handleUseFallbackTemplate}
              className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Use Deterministic Local Template Instead
            </button>
          </div>
        </div>
      )}

      {blockedSafety && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-800">
            <ShieldAlert className="w-5 h-5" />
            {blockedSafety.title}
          </div>
          <p className="text-sm text-slate-900">{blockedSafety.summary}</p>
          <p className="text-xs text-emerald-800 font-medium">Safe alternative: {blockedSafety.safeVirtualAlternative}</p>
        </div>
      )}

      {draft && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-lg font-display font-bold text-slate-900">Editable Experiment Blueprint</h2>
              <div className="text-xs text-slate-600 mt-0.5">
                {draft.hasValidatedModel
                  ? 'Bound to a validated deterministic simulation model.'
                  : 'Conceptual & template-based design (no unverified numerical physics claimed).'}
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2.5">
              <span
                className={`px-3 py-1 rounded-lg border text-xs font-semibold ${
                  getSafetyBadgeMeta(draft.safetyClassification).bgClass
                } ${getSafetyBadgeMeta(draft.safetyClassification).borderClass} ${
                  getSafetyBadgeMeta(draft.safetyClassification).colorClass
                }`}
              >
                {getSafetyBadgeMeta(draft.safetyClassification).label}
              </span>
              <button
                type="button"
                onClick={handleAssembleInLabRoom}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 min-h-[40px]"
              >
                <FlaskConical className="w-4 h-4" />
                Enter Lab and Perform Experiment
              </button>
              <button
                type="button"
                onClick={handleSave}
                className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 flex items-center gap-1.5 min-h-[40px]"
              >
                <Save className="w-3.5 h-3.5" />
                Save Experiment
              </button>
            </div>
          </div>

          <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="font-semibold text-slate-900">
                Target Laboratory:{' '}
                <span className="text-blue-700">
                  {getLabRoomById(draft.department || 'physics').name} ({getLabRoomById(draft.department || 'physics').wingCode})
                </span>
              </div>
              <span className={draft.hasValidatedModel ? 'text-emerald-700 font-semibold' : 'text-amber-700 font-semibold'}>
                {draft.hasValidatedModel ? 'Implemented Deterministic Solver' : 'Conceptual Lab Assembly'}
              </span>
            </div>
            {draft.roomOverviewNote && <div className="text-slate-600">{draft.roomOverviewNote}</div>}

            {draft.recommendedEquipmentIds && draft.recommendedEquipmentIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-blue-700 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Required Apparatus:
                </span>
                {draft.recommendedEquipmentIds.map((eqId) => (
                  <span
                    key={eqId}
                    className="px-2.5 py-1 rounded bg-white border border-slate-200 text-slate-800"
                  >
                    {getInstrumentById(eqId)?.name ?? eqId}
                  </span>
                ))}
              </div>
            )}

            {draft.recommendedChemicalIds && draft.recommendedChemicalIds.length > 0 && (
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-emerald-700 font-semibold">Virtual Substances (Chemistry Vault):</span>
                {draft.recommendedChemicalIds.map((chemId) => {
                  const sub = getChemicalById(chemId);
                  return (
                    <span
                      key={chemId}
                      className="px-2.5 py-1 rounded bg-white border border-emerald-200 text-emerald-800 font-medium"
                    >
                      {sub ? `${sub.name} (${sub.symbol})` : chemId}
                    </span>
                  );
                })}
              </div>
            )}
          </div>

          {saveSuccess && (
            <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-800">
              {saveSuccess}
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Title</label>
              <input
                type="text"
                value={draft.title}
                onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Subject</label>
              <input
                type="text"
                value={draft.subject}
                onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Learning Objective</label>
              <textarea
                rows={2}
                value={draft.learningObjective}
                onChange={(e) => setDraft({ ...draft, learningObjective: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Hypothesis</label>
              <textarea
                rows={2}
                value={draft.hypothesis}
                onChange={(e) => setDraft({ ...draft, hypothesis: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Formula &amp; Units</label>
              <input
                type="text"
                value={`${draft.formula} (${draft.units})`}
                onChange={(e) => setDraft({ ...draft, formula: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 font-mono text-blue-700"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Independent / Dependent Variables</label>
              <input
                type="text"
                value={`${draft.independentVariable} → ${draft.dependentVariable}`}
                readOnly
                className="w-full px-3 py-2 rounded-lg bg-slate-100 border border-slate-200 text-slate-700"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Controlled Variables (comma-separated)</label>
              <input
                type="text"
                value={draft.controlledVariables.join(', ')}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    controlledVariables: e.target.value
                      .split(',')
                      .map((v) => v.trim())
                      .filter(Boolean),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Safety Guidance</label>
              <input
                type="text"
                value={draft.safetyGuidance}
                onChange={(e) => setDraft({ ...draft, safetyGuidance: e.target.value })}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
          </div>

          {draft.parameterRanges[0] && deterministicPreview && (
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-semibold text-slate-900">
                  Deterministic Model Preview ({draft.calculationTemplate.replace('_', ' ')})
                </div>
                <div className="font-mono text-sm font-bold text-blue-700">
                  y = {deterministicPreview.primaryValue} {deterministicPreview.primaryUnit}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <span className="text-xs text-slate-600">
                  {draft.parameterRanges[0].name}: {testInputVal} {draft.parameterRanges[0].unit}
                </span>
                <input
                  type="range"
                  min={draft.parameterRanges[0].min}
                  max={draft.parameterRanges[0].max}
                  step={(draft.parameterRanges[0].max - draft.parameterRanges[0].min) / 20 || 1}
                  value={testInputVal}
                  onChange={(e) => setTestInputVal(Number(e.target.value))}
                  className="flex-1 accent-blue-700"
                />
              </div>
              <div className="h-52 w-full bg-white rounded-lg border border-slate-200 p-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={deterministicPreview.curvePoints}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                    <XAxis dataKey="x" stroke="#64748B" tick={{ fontSize: 11, fill: '#475569' }} />
                    <YAxis stroke="#64748B" tick={{ fontSize: 11, fill: '#475569' }} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#FFFFFF',
                        border: '1px solid #CBD5E1',
                        color: '#0F172A',
                        borderRadius: '8px',
                      }}
                    />
                    <Line type="monotone" dataKey="y" stroke="#1D4ED8" strokeWidth={2.5} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 gap-4 text-xs text-slate-600">
            <div>
              <strong className="text-slate-900 block mb-1">Editable Virtual Procedure (one step per line)</strong>
              <textarea
                rows={4}
                value={draft.procedure.join('\n')}
                onChange={(e) =>
                  setDraft({
                    ...draft,
                    procedure: e.target.value.split('\n').filter((line) => line.trim().length > 0),
                  })
                }
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
            </div>
            <div>
              <strong className="text-slate-900 block mb-1">Assumptions &amp; Limitations</strong>
              <ul className="list-disc pl-4 space-y-1">
                {draft.assumptions.map((a, i) => (
                  <li key={`a-${i}`}>{a}</li>
                ))}
                {draft.limitations.map((l, i) => (
                  <li key={`l-${i}`}>{l}</li>
                ))}
              </ul>
            </div>
          </div>

          {/* Conceptual Observation Recorder */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5 text-xs">
            <div className="font-semibold text-slate-900">
              Record Conceptual Observation / Lab Note to My Learning
            </div>
            <div className="flex flex-col sm:flex-row gap-2">
              <textarea
                rows={2}
                value={observationNote}
                onChange={(e) => setObservationNote(e.target.value)}
                placeholder="Write your hypothesis test, expected qualitative effect, or real-world apparatus observation..."
                className="flex-1 px-3 py-2 rounded-lg bg-white border border-slate-200 text-xs text-slate-900"
              />
              <button
                type="button"
                disabled={!observationNote.trim()}
                onClick={handleSaveObservationNote}
                className="px-4 py-2 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 disabled:opacity-40 shrink-0"
              >
                Save Lab Note
              </button>
            </div>
          </div>

          {/* Video Phase for Your Custom Experiment */}
          <SmartVideoLessonWidget
            topicQuery={`${draft.title}: ${draft.scientificPrinciple}`}
            title={`Video Phase for Your Custom Experiment: ${draft.title}`}
            autoGenerate={false}
            compact
          />
        </div>
      )}

      {/* Saved Custom Experiments */}
      <div className="space-y-3">
        <h2 className="text-lg font-display font-bold text-slate-900">
          Saved Custom Experiments ({customExperiments.length})
        </h2>
        {customExperiments.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
            No custom experiments saved yet. Describe an idea above to generate your first structured design.
          </div>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {customExperiments.map((ce) => (
              <div
                key={ce.id}
                className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3 shadow-sm"
              >
                <div className="space-y-1">
                  <div className="text-xs text-blue-700 font-medium">{ce.subject} · {ce.safetyClassification}</div>
                  <div className="text-sm font-semibold text-slate-900">{ce.title}</div>
                  <div className="text-xs text-slate-600">{ce.hypothesis}</div>
                  <button
                    type="button"
                    onClick={() => {
                      setDraft(ce);
                      setTestInputVal(ce.parameterRanges[0]?.defaultValue ?? 10);
                    }}
                    className="text-xs font-semibold text-blue-700 hover:underline pt-1"
                  >
                    Load into Editor &amp; Preview →
                  </button>
                </div>
                <button
                  type="button"
                  aria-label={`Delete ${ce.title}`}
                  onClick={() => deleteCustomExperiment(ce.id)}
                  className="p-2 rounded-lg text-slate-400 hover:text-rose-600"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
