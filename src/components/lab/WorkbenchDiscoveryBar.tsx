import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Atom,
  CheckCircle2,
  Compass,
  FlaskConical,
  Loader2,
  Plus,
  Search,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { CHEMISTRY_CHEMICAL_VAULT } from '../../data/chemicals';
import {
  checkInstrumentConnection,
  getInstrumentById,
  getLabRoomById,
  getRecommendedKitForExperiment,
  LAB_INSTRUMENTS,
} from '../../data/labEquipment';
import { EXPERIMENTS } from '../../engine/experiments';
import {
  checkInstrumentPlacementCompatibility,
  findExperimentsForBenchSetup,
  searchCentralRegistry,
} from '../../engine/equipmentRegistry';
import { getSafetyBadgeMeta } from '../../engine/safetyEngine';
import type {
  ChemicalSubstance,
  EducationDivision,
  LabDepartmentId,
  LabInstrument,
  LanguageCode,
  WorkbenchChemicalItem,
  WorkbenchItem,
} from '../../types/science';
import { EquipmentIllustration } from './EquipmentIllustration';

interface WorkbenchDiscoveryBarProps {
  roomId: LabDepartmentId;
  experimentId: string;
  workbenchItems: WorkbenchItem[];
  chemicalItems: WorkbenchChemicalItem[];
  onAddInstrument: (inst: LabInstrument) => void;
  onAddChemical: (chem: ChemicalSubstance) => void;
  onSelectExperiment: (experimentId: string) => void;
  onSwitchRoom: (dept: LabDepartmentId) => void;
  division: EducationDivision;
  levelLabel: string;
  language: LanguageCode;
  onGoToCreator: (prefillPrompt: string) => void;
  isPersonalLabMode?: boolean;
}

interface WorkbenchMatchResult {
  experimentId: string;
  title: string;
  shortTitle: string;
  subject: string;
  formula: string;
  department: LabDepartmentId;
  matchScore: number;
  matchedCount: number;
  totalRequired: number;
  matchedEquipmentNames: string[];
  missingEquipmentNames: string[];
  isReadyToRun: boolean;
}

interface DiscoverResponse {
  blockedBySafety?: boolean;
  safety?: {
    level: 'GREEN' | 'AMBER' | 'RED';
    title: string;
    summary: string;
    safeVirtualAlternative: string;
  };
  modelUsed?: string;
  promptQuestion: string;
  compatibilityIssues: string[];
  matchedExperiments: WorkbenchMatchResult[];
  curriculumMatches: {
    id: string;
    title: string;
    board: string;
    modelId: string | null;
    modelTier: string;
  }[];
  aiGuidance?: {
    headline?: string;
    suggestedExperiments?: {
      title: string;
      scientificQuestion: string;
      linkedModelId?: string | null;
      feasibilityNote: string;
    }[];
    customIdeaFeedback?: string | null;
    requiresConfirmation?: boolean;
  };
}

export function WorkbenchDiscoveryBar({
  roomId,
  experimentId,
  workbenchItems,
  chemicalItems,
  onAddInstrument,
  onAddChemical,
  onSelectExperiment,
  onSwitchRoom,
  division,
  levelLabel,
  language,
  onGoToCreator,
  isPersonalLabMode = false,
}: WorkbenchDiscoveryBarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchScope, setSearchScope] = useState<'room' | 'all'>(
    isPersonalLabMode ? 'all' : 'room'
  );
  const [discoveryOpen, setDiscoveryOpen] = useState(true);
  const [customIdea, setCustomIdea] = useState('');
  const [loadingDiscover, setLoadingDiscover] = useState(false);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [discoverResult, setDiscoverResult] = useState<DiscoverResponse | null>(null);

  const matchedInstruments = useMemo(() => {
    const q = searchQuery.trim();
    if (!q && searchScope === 'room') {
      return LAB_INSTRUMENTS.filter((i) => i.department === roomId).slice(0, 4);
    }
    const entries = searchCentralRegistry({
      query: q,
      department: searchScope === 'all' ? 'all' : roomId,
      includeChemicals: false,
      sortBy: 'relevance',
    });
    return entries
      .map((e) => e.instrument)
      .filter((inst): inst is LabInstrument => Boolean(inst))
      .slice(0, 8);
  }, [roomId, searchQuery, searchScope]);

  const crossWingHints = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q || searchScope === 'all' || matchedInstruments.length > 0) return [];
    return searchCentralRegistry({
      query: q,
      department: 'all',
      includeChemicals: false,
      sortBy: 'relevance',
    })
      .map((e) => e.instrument)
      .filter((inst): inst is LabInstrument => Boolean(inst && inst.department !== roomId))
      .slice(0, 3);
  }, [searchQuery, searchScope, matchedInstruments.length, roomId]);

  const matchedChemicals = useMemo(() => {
    const allowChemicals = roomId === 'chemistry' || isPersonalLabMode || searchScope === 'all';
    if (!allowChemicals) return [];
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];
    return CHEMISTRY_CHEMICAL_VAULT.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.commonName.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.formula.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    ).slice(0, 6);
  }, [roomId, isPersonalLabMode, searchScope, searchQuery]);

  // Live deterministic bench readiness preview
  const liveLocalSummary = useMemo(() => {
    const placedIds = Array.from(new Set(workbenchItems.map((w) => w.instrumentId)));
    const placedChems = Array.from(new Set(chemicalItems.map((c) => c.chemicalId)));
    const instSet = new Set(placedIds);
    const chemSet = new Set(placedChems);

    const compatWarnings: string[] = [];
    for (let i = 0; i < placedIds.length; i++) {
      const a = getInstrumentById(placedIds[i]);
      if (a) {
        for (const warn of checkInstrumentPlacementCompatibility(a, workbenchItems)) {
          compatWarnings.push(warn.message);
        }
      }
      for (let j = i + 1; j < placedIds.length; j++) {
        const b = getInstrumentById(placedIds[j]);
        if (a && b) {
          const check = checkInstrumentConnection(a, b);
          if (!check.valid && (check.note.includes('incompatible') || check.note.includes('Do not'))) {
            compatWarnings.push(check.note);
          }
        }
      }
    }

    const candidates = EXPERIMENTS.map((exp) => {
      const kit = getRecommendedKitForExperiment(exp.id);
      const reqEquip = Array.from(new Set(kit.defaultItems.map((d) => d.instrumentId)));
      const reqChems = Array.from(new Set(kit.chemicalIds ?? []));
      const matchedCount =
        reqEquip.filter((id) => instSet.has(id)).length +
        reqChems.filter((id) => chemSet.has(id)).length;
      const totalReq = reqEquip.length + reqChems.length;
      return {
        experimentId: exp.id,
        title: exp.shortTitle,
        department: kit.department,
        matchedCount,
        totalReq,
        score: totalReq > 0 ? Math.round((matchedCount / totalReq) * 100) : 0,
      };
    })
      .filter((m) => m.matchedCount > 0)
      .sort((a, b) => b.score - a.score || b.matchedCount - a.matchedCount)
      .slice(0, 3);

    const registryMatches = findExperimentsForBenchSetup(workbenchItems, chemicalItems);

    return {
      placedCount: workbenchItems.length,
      chemicalCount: chemicalItems.length,
      compatWarnings: Array.from(new Set(compatWarnings)),
      candidates:
        candidates.length > 0
          ? candidates
          : registryMatches.slice(0, 3).map((m) => ({
              experimentId: m.experimentId,
              title: m.shortTitle,
              department: roomId,
              matchedCount: m.matchedInstruments,
              totalReq: m.requiredCount,
              score: Math.min(100, Math.round((m.matchedInstruments / Math.max(1, m.requiredCount)) * 100)),
            })),
    };
  }, [workbenchItems, chemicalItems, roomId]);

  const handleAnalyzeWorkbench = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoadingDiscover(true);
    setDiscoverError(null);
    try {
      const resp = await fetch('/api/ai/workbench-discover', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          department: roomId,
          instrumentIds: workbenchItems.map((w) => w.instrumentId),
          chemicalIds: chemicalItems.map((c) => c.chemicalId),
          customIdea: customIdea.trim(),
          division,
          levelLabel,
          language,
        }),
      });
      const data = (await resp.json()) as DiscoverResponse & { error?: string };
      if (!resp.ok) {
        setDiscoverError(data.error || 'Could not analyze workbench setup.');
        return;
      }
      setDiscoverResult(data);
    } catch {
      setDiscoverError('Network error while contacting Workbench Discovery Assistant.');
    } finally {
      setLoadingDiscover(false);
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 sm:p-5 space-y-4 shadow-sm">
      {/* PART 1: PROMINENT INLINE ROOM EQUIPMENT & CENTRAL REGISTRY SEARCH */}
      <div className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-semibold flex items-center gap-1.5">
              <Search className="w-3.5 h-3.5" />
              Apparatus &amp; Reagent Search ·{' '}
              {searchScope === 'all'
                ? `Central Registry (${LAB_INSTRUMENTS.length} Instruments)`
                : getLabRoomById(roomId).shortName}
            </div>
            <p className="text-xs text-slate-600 mt-0.5">
              Search tools{roomId === 'chemistry' || isPersonalLabMode || searchScope === 'all' ? ' or virtual chemicals' : ''} and click to add straight onto the center workbench.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg border border-slate-200 bg-slate-50 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setSearchScope('room')}
                className={`px-2.5 py-1 rounded-md font-semibold ${
                  searchScope === 'room' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-600'
                }`}
              >
                This Wing
              </button>
              <button
                type="button"
                onClick={() => setSearchScope('all')}
                className={`px-2.5 py-1 rounded-md font-semibold ${
                  searchScope === 'all' ? 'bg-blue-700 text-white shadow-sm' : 'text-slate-600'
                }`}
              >
                All Wings ({LAB_INSTRUMENTS.length})
              </button>
            </div>
            <button
              type="button"
              onClick={() => setDiscoveryOpen((o) => !o)}
              className="px-3 py-1.5 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-800 hover:bg-blue-100 flex items-center gap-1.5"
            >
              <Sparkles className="w-3.5 h-3.5" />
              {discoveryOpen ? 'Hide Discovery Assistant' : 'AI Workbench Discovery'}
            </button>
          </div>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              searchScope === 'all'
                ? 'Search ALL 133 instruments & 30 reagents (e.g. Beaker, Multimeter, Stopwatch, Microscope, HCl)...'
                : roomId === 'chemistry'
                  ? 'Search glassware, heater, pH meter, or chemicals (e.g. NaOH, HCl, CuSO4, Burette)...'
                  : 'Search wing instruments by name, category, or principle (e.g. Oscilloscope, Microscope, Sensor)...'
            }
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:border-blue-600 focus:bg-white outline-none"
          />
        </div>

        {/* Search results cards */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
          {matchedInstruments.map((inst) => {
            const safety = getSafetyBadgeMeta(inst.safetyLevel);
            const isCrossWing = inst.department !== roomId;
            return (
              <div
                key={inst.id}
                className="rounded-xl border border-slate-200 bg-slate-50/70 p-2.5 flex items-center gap-2.5 hover:border-blue-300 transition-colors"
              >
                <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 p-1">
                  <EquipmentIllustration kind={inst.visualKind} className="w-9 h-9" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-xs font-bold text-slate-900 truncate" title={inst.name}>
                    {inst.name}
                  </div>
                  <div className="text-[10px] text-slate-500 truncate">
                    {isCrossWing ? `${getLabRoomById(inst.department).shortName} · ` : ''}
                    {inst.units || inst.category} · <span className={safety.colorClass}>{inst.safetyLevel}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => onAddInstrument(inst)}
                    className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-blue-700 hover:underline"
                  >
                    <Plus className="w-3 h-3" />
                    Add to Bench
                  </button>
                </div>
              </div>
            );
          })}

          {matchedChemicals.map((chem) => (
            <div
              key={chem.id}
              className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-2.5 flex items-center gap-2.5 hover:border-emerald-400 transition-colors"
            >
              <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 p-1">
                <EquipmentIllustration
                  kind="chemical-bottle"
                  sim={{ bottleColor: chem.bottleColor, chemicalFormula: chem.symbol }}
                  className="w-9 h-9"
                />
              </div>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-bold text-slate-900 truncate" title={chem.name}>
                  {chem.name} ({chem.symbol})
                </div>
                <div className="text-[10px] text-slate-600 truncate">
                  {chem.standardConcentrationOrPurity} · {chem.safetyLevel}
                </div>
                <button
                  type="button"
                  onClick={() => onAddChemical(chem)}
                  className="mt-1 inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 hover:underline"
                >
                  <Atom className="w-3 h-3" />
                  Place Reagent
                </button>
              </div>
            </div>
          ))}
        </div>

        {crossWingHints.length > 0 && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-950 flex flex-wrap items-center justify-between gap-2">
            <span>
              Found in {getLabRoomById(crossWingHints[0].department).shortName}:{' '}
              <strong>{crossWingHints[0].name}</strong>
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => onAddInstrument(crossWingHints[0])}
                className="px-2.5 py-1 rounded-lg bg-blue-700 text-white font-semibold hover:bg-blue-800 inline-flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Place Here Anyway
              </button>
              <button
                type="button"
                onClick={() => onSwitchRoom(crossWingHints[0].department)}
                className="px-2.5 py-1 rounded-lg bg-amber-600 text-white font-semibold hover:bg-amber-700 inline-flex items-center gap-1"
              >
                Visit {getLabRoomById(crossWingHints[0].department).shortName}
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* PART 2: AI EQUIPMENT-TO-EXPERIMENT DISCOVERY ASSISTANT */}
      {discoveryOpen && (
        <div className="pt-4 border-t border-slate-200 space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-blue-700" />
                Workbench Discovery Assistant
              </div>
              <p className="text-xs text-slate-600">
                &ldquo;I noticed the materials on your workbench ({liveLocalSummary.placedCount} instruments
                {liveLocalSummary.chemicalCount > 0 ? `, ${liveLocalSummary.chemicalCount} reagents` : ''}). What would you like to investigate?&rdquo;
              </p>
            </div>
            {liveLocalSummary.candidates.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                {liveLocalSummary.candidates.map((cand) => (
                  <button
                    key={cand.experimentId}
                    type="button"
                    onClick={() => onSelectExperiment(cand.experimentId)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-colors ${
                      cand.experimentId === experimentId
                        ? 'border-blue-700 bg-blue-50 text-blue-800'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-blue-400'
                    }`}
                    title={`Confirm and load ${cand.title}`}
                  >
                    {cand.title} ({cand.score}% bench match)
                  </button>
                ))}
              </div>
            )}
          </div>

          {liveLocalSummary.compatWarnings.length > 0 && (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-900 flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              <div>
                <strong>Benchtop Compatibility Alert:</strong> {liveLocalSummary.compatWarnings[0]}
              </div>
            </div>
          )}

          <form onSubmit={handleAnalyzeWorkbench} className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={customIdea}
              onChange={(e) => setCustomIdea(e.target.value)}
              placeholder="Optional: describe your own investigation idea (e.g. How does pressure shift water boiling point?)"
              className="flex-1 px-3.5 py-2 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900"
            />
            <button
              type="submit"
              disabled={loadingDiscover}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-1.5 min-h-[38px] shrink-0"
            >
              {loadingDiscover ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Sparkles className="w-3.5 h-3.5" />
              )}
              Analyze Workbench &amp; Ideas
            </button>
          </form>

          {discoverError && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {discoverError}
            </div>
          )}

          {discoverResult && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3 text-xs">
              {discoverResult.blockedBySafety && discoverResult.safety ? (
                <div className="rounded-lg border border-rose-300 bg-rose-50 p-3 text-rose-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    Safety Guardian Blocked Unsafe Idea ({discoverResult.safety.level})
                  </div>
                  <p>{discoverResult.safety.summary}</p>
                  <p className="text-emerald-800 font-medium">
                    Safe Virtual Alternative: {discoverResult.safety.safeVirtualAlternative}
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="font-bold text-slate-900">
                      {discoverResult.aiGuidance?.headline || discoverResult.promptQuestion}
                    </div>
                    {discoverResult.modelUsed && (
                      <span className="font-mono text-[10px] text-slate-500">
                        {discoverResult.modelUsed}
                      </span>
                    )}
                  </div>

                  {discoverResult.aiGuidance?.customIdeaFeedback && (
                    <div className="rounded-lg border border-blue-200 bg-white p-2.5 text-slate-800">
                      <strong>Feedback on Your Idea:</strong> {discoverResult.aiGuidance.customIdeaFeedback}
                    </div>
                  )}

                  {discoverResult.compatibilityIssues.length > 0 && (
                    <div className="rounded-lg border border-rose-200 bg-rose-50 p-2.5 text-rose-900">
                      <strong>Compatibility Note:</strong> {discoverResult.compatibilityIssues.join(' · ')}
                    </div>
                  )}

                  {discoverResult.matchedExperiments.length > 0 && (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
                      {discoverResult.matchedExperiments.slice(0, 3).map((m) => (
                        <div
                          key={m.experimentId}
                          className="rounded-xl border border-slate-200 bg-white p-3 flex flex-col justify-between space-y-2"
                        >
                          <div className="space-y-1">
                            <div className="flex items-center justify-between gap-1 text-[10px] font-mono">
                              <span className="text-blue-700 font-bold">{m.subject}</span>
                              <span className="text-emerald-700 font-bold">{m.matchScore}% match</span>
                            </div>
                            <div className="font-bold text-slate-900">{m.shortTitle}</div>
                            <div className="font-mono text-[11px] text-slate-600">{m.formula}</div>
                            {m.missingEquipmentNames.length > 0 ? (
                              <div className="text-[11px] text-amber-800">
                                Missing: {m.missingEquipmentNames.slice(0, 3).join(', ')}
                              </div>
                            ) : (
                              <div className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                                <CheckCircle2 className="w-3 h-3" />
                                All apparatus ready on bench
                              </div>
                            )}
                          </div>
                          <button
                            type="button"
                            onClick={() => onSelectExperiment(m.experimentId)}
                            className="w-full py-1.5 px-2.5 rounded-lg bg-blue-700 text-white text-[11px] font-bold hover:bg-blue-800 flex items-center justify-center gap-1"
                          >
                            <FlaskConical className="w-3 h-3" />
                            Confirm &amp; Load Simulation
                          </button>
                        </div>
                      ))}
                    </div>
                  )}

                  {customIdea.trim() && (
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                      <span className="text-[11px] text-slate-600">
                        Want to formalize &ldquo;{customIdea.trim()}&rdquo; with custom variables and procedure?
                      </span>
                      <button
                        type="button"
                        onClick={() => onGoToCreator(customIdea.trim())}
                        className="px-3 py-1.5 rounded-lg border border-slate-300 bg-white text-slate-800 text-[11px] font-semibold hover:border-blue-500 flex items-center gap-1"
                      >
                        <Wrench className="w-3 h-3 text-blue-700" />
                        Open in Experiment Builder
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
