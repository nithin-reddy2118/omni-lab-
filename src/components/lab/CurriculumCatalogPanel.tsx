import React, { useMemo, useState } from 'react';
import { BookOpen, CheckCircle2, FlaskConical, Info, Layers, Search, ShieldCheck } from 'lucide-react';
import { useLab } from '../../context/LabContext';
import {
  ENGINEERING_BRANCHES,
  getCatalogMetrics,
  getEducationalTier,
  getLevelDisplayLabel,
  inferCatalogEntryTier,
  VERIFIED_CURRICULUM_SOURCES,
} from '../../data/curriculumEngine';
import {
  CURRICULUM_BOARDS,
  CURRICULUM_EXPERIMENT_CATALOG,
} from '../../data/experimentCatalog';
import { getChemicalById } from '../../data/chemicals';
import { getInstrumentById, getLabRoomById } from '../../data/labEquipment';
import type {
  CurriculumExperimentEntry,
  EducationalTier,
  EngineeringBranch,
  ModelImplementationTier,
} from '../../types/science';

interface CurriculumCatalogPanelProps {
  onLaunchEntry: (entry: CurriculumExperimentEntry) => void;
}

const TIER_LABELS: Record<ModelImplementationTier, { label: string; colorClass: string }> = {
  implemented: {
    label: '1. Syllabus Practical · Validated Solver',
    colorClass: 'border-emerald-200 bg-emerald-50 text-emerald-800',
  },
  guided: {
    label: '2. Validated Simulation + Workbench',
    colorClass: 'border-blue-200 bg-blue-50 text-blue-800',
  },
  conceptual: {
    label: '3. Conceptual Demo / Assembly',
    colorClass: 'border-amber-200 bg-amber-50 text-amber-800',
  },
  planned: {
    label: '4. Supervised Physical Lab Guide',
    colorClass: 'border-slate-200 bg-slate-100 text-slate-700',
  },
};

const TIER_ORDER: Record<EducationalTier, number> = {
  primary: 1,
  secondary: 2,
  higher: 3,
  research: 4,
};

export function CurriculumCatalogPanel({ onLaunchEntry }: CurriculumCatalogPanelProps) {
  const {
    curriculumCompletedIds,
    toggleCurriculumCompleted,
    activeDivision,
    schoolClassLevel,
    higherStage,
    researchTrack,
    selectedBoard,
    setSelectedBoard,
    engineeringBranch,
    setEngineeringBranch,
    activeSubjectId,
    selectedChapter,
    setSelectedChapter,
  } = useLab();

  const [boardFilter, setBoardFilter] = useState<string>('All');
  const [tierFilter, setTierFilter] = useState<string>('All');
  const [subjectFilter, setSubjectFilter] = useState<string>('All');
  const [matchUserLevelOnly, setMatchUserLevelOnly] = useState<boolean>(false);
  const [search, setSearch] = useState('');

  const profile = useMemo(
    () => ({
      activeDivision,
      schoolClassLevel,
      higherStage,
      researchTrack,
      selectedBoard,
      engineeringBranch,
      activeSubjectId,
      selectedChapter,
    }),
    [
      activeDivision,
      schoolClassLevel,
      higherStage,
      researchTrack,
      selectedBoard,
      engineeringBranch,
      activeSubjectId,
      selectedChapter,
    ]
  );

  const userLevelLabel = getLevelDisplayLabel(profile);
  const userTier = getEducationalTier(profile);
  const catalogMetrics = useMemo(() => getCatalogMetrics(CURRICULUM_EXPERIMENT_CATALOG), []);

  const subjectsList = useMemo(
    () => ['All', ...Array.from(new Set(CURRICULUM_EXPERIMENT_CATALOG.map((e) => e.subject)))],
    []
  );

  const chaptersList = useMemo(() => {
    const base = CURRICULUM_EXPERIMENT_CATALOG.filter(
      (e) =>
        (boardFilter === 'All' || e.board === boardFilter) &&
        (subjectFilter === 'All' || e.subject === subjectFilter)
    );
    return ['All', ...Array.from(new Set(base.map((e) => e.chapter)))];
  }, [boardFilter, subjectFilter]);

  const completedCount = CURRICULUM_EXPERIMENT_CATALOG.filter((item) =>
    curriculumCompletedIds.includes(item.id)
  ).length;
  const totalCount = CURRICULUM_EXPERIMENT_CATALOG.length;
  const completionPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CURRICULUM_EXPERIMENT_CATALOG.filter((item) => {
      const boardOk = boardFilter === 'All' || item.board === boardFilter;
      const tierOk = tierFilter === 'All' || item.modelTier === tierFilter;
      const subjOk = subjectFilter === 'All' || item.subject === subjectFilter;
      const chapterOk = !selectedChapter || selectedChapter === 'All' || item.chapter === selectedChapter;
      const levelOk =
        !matchUserLevelOnly || TIER_ORDER[inferCatalogEntryTier(item)] <= TIER_ORDER[userTier];
      const qOk =
        !q ||
        item.title.toLowerCase().includes(q) ||
        item.subject.toLowerCase().includes(q) ||
        item.chapter.toLowerCase().includes(q) ||
        item.summary.toLowerCase().includes(q);
      return boardOk && tierOk && subjOk && chapterOk && levelOk && qOk;
    });
  }, [boardFilter, tierFilter, subjectFilter, selectedChapter, matchUserLevelOnly, userTier, search]);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4" />
              Curriculum-to-Experiment Engine · Active Profile: {userLevelLabel}
            </div>
            <h2 className="text-xl font-display font-bold text-slate-900 mt-1">
              Board, Stage, Subject &amp; Chapter Practical Mapping
            </h2>
            <p className="text-xs text-slate-600 mt-1 max-w-3xl">
              Selection chain: Division → Class/Stage/Branch → Board → Subject → Chapter → Verified Practical/Simulation. Every item honestly labels whether it runs a validated quantitative solver or a conceptual bench setup.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search chapter, topic, board..."
              className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-slate-300 text-xs text-slate-900"
            />
          </div>
        </div>

        {/* Real Counted Curriculum Metrics Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-slate-500">Total Mapped Entries</div>
            <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">
              {catalogMetrics.total}
            </div>
          </div>
          <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3">
            <div className="text-emerald-800">Validated Solvers</div>
            <div className="text-lg font-mono font-bold text-emerald-900 tabular-nums">
              {catalogMetrics.validatedInteractiveCount + catalogMetrics.guidedCount}
            </div>
          </div>
          <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-3">
            <div className="text-amber-800">Conceptual Demos</div>
            <div className="text-lg font-mono font-bold text-amber-900 tabular-nums">
              {catalogMetrics.conceptualCount}
            </div>
          </div>
          <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="text-slate-600">Supervised Lab Guides</div>
            <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">
              {catalogMetrics.plannedCount}
            </div>
          </div>
        </div>

        {/* Chain Selectors: Board, Branch (Higher Ed), Subject, Chapter, Level Toggle */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Curriculum Board / Standard</label>
            <select
              value={boardFilter}
              onChange={(e) => {
                setBoardFilter(e.target.value);
                if (e.target.value !== 'All') setSelectedBoard(e.target.value);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
            >
              {CURRICULUM_BOARDS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Subject Area</label>
            <select
              value={subjectFilter}
              onChange={(e) => {
                setSubjectFilter(e.target.value);
                setSelectedChapter(null);
              }}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
            >
              {subjectsList.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Chapter / Unit</label>
            <select
              value={selectedChapter || 'All'}
              onChange={(e) =>
                setSelectedChapter(e.target.value === 'All' ? null : e.target.value)
              }
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
            >
              {chaptersList.map((ch) => (
                <option key={ch} value={ch}>
                  {ch}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold text-slate-700 block mb-1">Engineering / B.Sc. Branch</label>
            <select
              value={engineeringBranch}
              onChange={(e) => setEngineeringBranch(e.target.value as EngineeringBranch)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-900"
            >
              {ENGINEERING_BRANCHES.map((br) => (
                <option key={br.id} value={br.id}>
                  {br.shortLabel}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Tier Filter & Match My Level Toggle */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-200 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-slate-600 flex items-center gap-1">
              <Layers className="w-3.5 h-3.5" />
              Category:
            </span>
            {(
              [
                { id: 'All', label: 'All Types' },
                { id: 'implemented', label: 'Validated Solver' },
                { id: 'guided', label: 'Guided Workbench' },
                { id: 'conceptual', label: 'Conceptual Demo' },
                { id: 'planned', label: 'Supervised Physical' },
              ] as const
            ).map((tOpt) => (
              <button
                key={tOpt.id}
                type="button"
                onClick={() => setTierFilter(tOpt.id)}
                className={`px-2.5 py-1 rounded border ${
                  tierFilter === tOpt.id
                    ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                    : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                }`}
              >
                {tOpt.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setMatchUserLevelOnly((v) => !v)}
            className={`px-3 py-1 rounded-lg border font-semibold ${
              matchUserLevelOnly
                ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                : 'border-slate-200 bg-slate-50 text-slate-700'
            }`}
          >
            {matchUserLevelOnly ? `Filtered to ≤ ${userTier}` : 'Filter to My Education Level'}
          </button>
        </div>

        {/* Practical Syllabus Completion Tracker */}
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/50 p-3 space-y-1.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            <span className="font-semibold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Practical Syllabus Completion Tracker
            </span>
            <span className="font-mono font-bold text-emerald-900 tabular-nums">
              {completedCount} / {totalCount} Completed ({completionPct}%)
            </span>
          </div>
          <div className="h-2 rounded-full bg-emerald-100 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all duration-300"
              style={{ width: `${completionPct}%` }}
            />
          </div>
        </div>
      </div>

      {/* Syllabus Reference Verification Note */}
      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
        <div className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-blue-700" />
          Curriculum Source Verification Transparency
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2.5 text-[11px]">
          {VERIFIED_CURRICULUM_SOURCES.slice(0, 3).map((src) => (
            <div key={src.board} className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="font-bold text-slate-900">{src.board}</div>
              <div className="text-blue-700 font-medium">{src.verificationStatus}</div>
              <div className="text-slate-600 mt-0.5">{src.notes}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Catalog Grid */}
      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-600">
          No syllabus entries match your current filter. Try resetting chapter or board filters.
        </div>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map((entry) => {
            const tierMeta = TIER_LABELS[entry.modelTier];
            const equipmentNames = entry.equipmentIds
              .map((id) => getInstrumentById(id)?.name ?? id)
              .slice(0, 4);
            const chemicalNames = (entry.chemicalIds ?? [])
              .map((id) => {
                const chem = getChemicalById(id);
                return chem ? `${chem.name} (${chem.formula})` : id;
              })
              .slice(0, 4);
            const roomMeta = getLabRoomById(entry.department);

            return (
              <div
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 shadow-xs"
              >
                <div className="space-y-2.5">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-blue-700">
                      {entry.board} · {entry.gradeLevel} · {entry.subject}
                    </span>
                    <span
                      className={`px-2.5 py-0.5 rounded border text-[11px] font-semibold ${tierMeta.colorClass}`}
                    >
                      {tierMeta.label}
                    </span>
                  </div>

                  <h3 className="text-base font-display font-bold text-slate-900">{entry.title}</h3>
                  <div className="text-xs text-slate-600">
                    <strong className="text-slate-800">Chapter:</strong> {entry.chapter} ·{' '}
                    <strong className="text-slate-800">Difficulty:</strong> {entry.difficulty}
                  </div>
                  <p className="text-xs text-slate-600 leading-relaxed">{entry.summary}</p>

                  <div className="text-xs text-slate-800">
                    <span className="text-slate-500">Required Equipment:</span>{' '}
                    {equipmentNames.join(', ')}
                  </div>

                  {chemicalNames.length > 0 && (
                    <div className="text-xs text-emerald-800">
                      <span className="text-slate-500">Virtual Substances:</span>{' '}
                      {chemicalNames.join(', ')}
                    </div>
                  )}

                  <div className="text-[11px] text-slate-600 flex items-start gap-1.5 bg-slate-50 rounded-lg p-2.5 border border-slate-200">
                    <Info className="w-3.5 h-3.5 text-blue-700 shrink-0 mt-0.5" />
                    <span>{entry.referenceNote}</span>
                  </div>
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2">
                  <span className="text-[11px] text-slate-500 uppercase tracking-wide font-mono">
                    {roomMeta.wingCode} · {roomMeta.shortName}
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => toggleCurriculumCompleted(entry.id)}
                      className={`px-2.5 py-2 rounded-lg border text-xs font-semibold flex items-center gap-1 min-h-[38px] ${
                        curriculumCompletedIds.includes(entry.id)
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {curriculumCompletedIds.includes(entry.id) ? 'Completed' : 'Mark Done'}
                    </button>
                    <button
                      type="button"
                      onClick={() => onLaunchEntry(entry)}
                      className="px-3.5 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1.5 min-h-[38px]"
                    >
                      <FlaskConical className="w-3.5 h-3.5" />
                      {entry.modelTier === 'planned'
                        ? 'Inspect Workbench Setup'
                        : 'Assemble in Lab Room'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
