import React, { useMemo, useState } from 'react';
import { Award, Download, NotebookPen, Plus, ShieldCheck, Sparkles, Trash2 } from 'lucide-react';
import { useLab } from '../context/LabContext';
import { INNOVATION_CHALLENGES } from '../data/challenges';
import { LAB_INSTRUMENTS } from '../data/labEquipment';
import { EXPERIMENTS, getExperimentById } from '../engine/experiments';
import type { ResearchNotebookEntry, SafetyLevel } from '../types/science';

export function ResearchNotebookPage() {
  const {
    activeDivision,
    activeExperimentId,
    trialsByExperiment,
    researchNotebookEntries,
    saveNotebookEntry,
    deleteNotebookEntry,
    masteredInstrumentIds,
    discoveredConceptIds,
    achievements,
    knowledgePoints,
    navigate,
  } = useLab();

  const currentExp = getExperimentById(activeExperimentId) ?? EXPERIMENTS[0];

  const [title, setTitle] = useState(`${currentExp.shortTitle} Investigation Notes`);
  const [subject, setSubject] = useState(currentExp.subject);
  const [hypothesis, setHypothesis] = useState(currentExp.hypothesis);
  const [materials, setMaterials] = useState(`Standard ${currentExp.subject} apparatus & calibrated probes`);
  const [observations, setObservations] = useState('');
  const [equations, setEquations] = useState(`${currentExp.formula} (${currentExp.unitsSummary})`);
  const [conclusion, setConclusion] = useState('');
  const [safetyLevel, setSafetyLevel] = useState<SafetyLevel>(currentExp.safetyLevel);

  const allTrials = useMemo(() => Object.values(trialsByExperiment).flat(), [trialsByExperiment]);
  const completedExpCount = Object.keys(trialsByExperiment).filter(
    (id) => (trialsByExperiment[id]?.length ?? 0) > 0
  ).length;
  const unlockedBadgesCount = achievements.filter((a) => a.unlocked).length;

  const recommendedNext = useMemo(() => {
    const untouched = EXPERIMENTS.filter((e) => (trialsByExperiment[e.id]?.length ?? 0) === 0);
    return untouched.slice(0, 3);
  }, [trialsByExperiment]);

  const handleSaveEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const entry: ResearchNotebookEntry = {
      id: `note-${Date.now()}`,
      division: activeDivision,
      title: title.trim() || `${currentExp.shortTitle} Lab Entry`,
      subject: subject.trim() || currentExp.subject,
      hypothesis: hypothesis.trim(),
      materialsAndSetup: materials.trim(),
      observations: observations.trim() || `${allTrials.length} trials logged across workspace.`,
      calculationsAndEquations: equations.trim(),
      conclusion: conclusion.trim() || 'Awaiting synthesis after comparing multiple parameter regimes.',
      safetyLevel,
      experimentId: currentExp.id,
      createdAt: now,
      updatedAt: now,
    };
    saveNotebookEntry(entry);
    setObservations('');
    setConclusion('');
  };

  const exportMarkdown = (entry: ResearchNotebookEntry) => {
    const md = [
      `# ${entry.title}`,
      `- **Division:** ${entry.division} | **Subject:** ${entry.subject} | **Safety:** ${entry.safetyLevel}`,
      `- **Timestamp:** ${entry.createdAt}`,
      '',
      `## Hypothesis`,
      entry.hypothesis,
      '',
      `## Materials & Experimental Setup`,
      entry.materialsAndSetup,
      '',
      `## Equations & Calculations`,
      entry.calculationsAndEquations,
      '',
      `## Observations`,
      entry.observations,
      '',
      `## Conclusion`,
      entry.conclusion,
    ].join('\n');
    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${entry.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-8">
      {/* Personal Science Intelligence Profile & Laboratory Passport */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-violet-700 flex items-center gap-1.5">
              <Award className="w-4 h-4" />
              Laboratory Passport &amp; Personal Science Intelligence Profile
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900">
              AI Research Notebook &amp; Verified Lab Passport
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Documents your hypotheses, apparatus setups, quantitative equations, and conclusions while tracking mastered instruments across all 10 OmniLab wings.
            </p>
          </div>
          <div className="text-right">
            <div className="text-xs text-slate-500">Science Points</div>
            <div className="text-2xl font-mono font-bold text-blue-700 tabular-nums">
              {knowledgePoints} pts
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Experiments Tested</div>
            <div className="text-lg font-mono font-bold text-slate-900 tabular-nums mt-0.5">
              {completedExpCount} / {EXPERIMENTS.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Instruments Mastered</div>
            <div className="text-lg font-mono font-bold text-slate-900 tabular-nums mt-0.5">
              {masteredInstrumentIds.length} / {LAB_INSTRUMENTS.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Unlocked Badges</div>
            <div className="text-lg font-mono font-bold text-slate-900 tabular-nums mt-0.5">
              {unlockedBadgesCount} / {achievements.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Discovered Concepts</div>
            <div className="text-lg font-mono font-bold text-slate-900 tabular-nums mt-0.5">
              {discoveredConceptIds.length}
            </div>
          </div>
        </div>

        {/* Recommended Next Investigations */}
        {recommendedNext.length > 0 && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-2.5">
            <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-blue-700" />
              Recommended Next Passport Investigations ({INNOVATION_CHALLENGES.length} active platform challenges)
            </div>
            <div className="flex flex-wrap gap-2">
              {recommendedNext.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => navigate('virtual-lab', { experimentId: exp.id })}
                  className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-semibold text-blue-800 hover:bg-blue-100"
                >
                  {exp.number}. {exp.shortTitle} ({exp.subject}) →
                </button>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* AI Research Notebook Editor + Archive */}
      <div className="grid lg:grid-cols-12 gap-6 items-start">
        <form
          onSubmit={handleSaveEntry}
          className="lg:col-span-6 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
              <NotebookPen className="w-5 h-5 text-blue-700" />
              New Notebook Entry
            </h2>
            <span className="text-xs font-mono text-slate-500 uppercase">{activeDivision}</span>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">Entry Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-800 block mb-1">Subject &amp; Safety</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
                <select
                  value={safetyLevel}
                  onChange={(e) => setSafetyLevel(e.target.value as SafetyLevel)}
                  className="px-2 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-900"
                >
                  <option value="GREEN">GREEN</option>
                  <option value="AMBER">AMBER</option>
                </select>
              </div>
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">Hypothesis</label>
            <textarea
              rows={2}
              value={hypothesis}
              onChange={(e) => setHypothesis(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">
              Materials &amp; Experimental Setup
            </label>
            <input
              type="text"
              value={materials}
              onChange={(e) => setMaterials(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">
              Equations &amp; Quantitative Calculation
            </label>
            <input
              type="text"
              value={equations}
              onChange={(e) => setEquations(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">Observations &amp; Results</label>
            <textarea
              rows={3}
              value={observations}
              onChange={(e) => setObservations(e.target.value)}
              placeholder="Record measured temperatures, pH equivalence point, current readings, or cell structures..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-800 block mb-1">Conclusion</label>
            <textarea
              rows={2}
              value={conclusion}
              onChange={(e) => setConclusion(e.target.value)}
              placeholder="Summarize whether the data supported your hypothesis and note limitations..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 px-4 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center justify-center gap-2 min-h-[44px]"
          >
            <Plus className="w-4 h-4" />
            Save Notebook Entry
          </button>
        </form>

        <div className="lg:col-span-6 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display font-bold text-slate-900">
              Saved Research Notebook Archive ({researchNotebookEntries.length})
            </h2>
            <span className="text-xs text-slate-500 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
              Exportable Markdown
            </span>
          </div>

          {researchNotebookEntries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-600">
              No notebook entries recorded yet. Log your first hypothesis and observations on the left to build a verifiable lab record.
            </div>
          ) : (
            <div className="space-y-3">
              {researchNotebookEntries.map((entry) => (
                <div
                  key={entry.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-mono text-blue-700 font-semibold">
                        {entry.division.toUpperCase()} · {entry.subject} · {entry.safetyLevel}
                      </div>
                      <h3 className="text-sm font-display font-bold text-slate-900">{entry.title}</h3>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => exportMarkdown(entry)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-700 hover:text-blue-700"
                        title="Download Markdown report"
                      >
                        <Download className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteNotebookEntry(entry.id)}
                        className="p-1.5 rounded-lg border border-slate-200 bg-slate-50 text-slate-500 hover:text-rose-600"
                        title="Delete entry"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                  <div className="text-xs text-slate-700 space-y-1">
                    <div>
                      <strong>Hypothesis:</strong> {entry.hypothesis}
                    </div>
                    <div className="font-mono text-[11px] text-slate-600">
                      <strong>Equations:</strong> {entry.calculationsAndEquations}
                    </div>
                    <div>
                      <strong>Observations:</strong> {entry.observations}
                    </div>
                    <div>
                      <strong>Conclusion:</strong> {entry.conclusion}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
