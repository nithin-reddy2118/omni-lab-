import React from 'react';
import {
  ArrowRight,
  Award,
  BookOpen,
  Compass,
  Film,
  FlaskConical,
  GraduationCap,
  NotebookPen,
  ShieldCheck,
  Sparkles,
  Wrench,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { AudioNarrationBar } from '../components/ui/AudioNarrationBar';
import {
  EDUCATION_DIVISIONS,
  HIGHER_EDUCATION_STAGES,
  RESEARCH_TRACK_DETAILS,
  SCHOOL_CLASS_LEVELS,
} from '../data/divisions';
import { LAB_ROOMS } from '../data/labEquipment';
import { getExperimentById } from '../engine/experiments';
import type { HigherStage, ResearchTrack, SchoolClassLevel } from '../types/science';

export function DivisionDashboardPage() {
  const {
    activeDivision,
    switchDivision,
    schoolClassLevel,
    setSchoolClassLevel,
    higherStage,
    setHigherStage,
    researchTrack,
    setResearchTrack,
    navigate,
    trialsByExperiment,
    savedReports,
    researchNotebookEntries,
    masteredInstrumentIds,
    setSmartLearningPrefillQuery,
  } = useLab();

  const divDef = EDUCATION_DIVISIONS[activeDivision];
  const totalTrials = Object.values(trialsByExperiment).flat().length;
  const activeSchoolInfo = SCHOOL_CLASS_LEVELS.find((l) => l.id === schoolClassLevel) ?? SCHOOL_CLASS_LEVELS[3];
  const activeHigherInfo = HIGHER_EDUCATION_STAGES.find((s) => s.id === higherStage) ?? HIGHER_EDUCATION_STAGES[0];
  const activeTrackInfo = RESEARCH_TRACK_DETAILS.find((t) => t.id === researchTrack) ?? RESEARCH_TRACK_DETAILS[0];

  const divisionRooms = LAB_ROOMS.filter((r) => divDef.allowedDepartments.includes(r.id));

  return (
    <div className="space-y-8">
      {/* Division Hero Header */}
      <section className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div
              className="text-xs font-semibold uppercase tracking-wider flex items-center gap-2"
              style={{ color: divDef.accentHex }}
            >
              <GraduationCap className="w-4 h-4" />
              {divDef.audienceLabel}
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
              {divDef.title}
            </h1>
            <p className="text-sm text-slate-600 leading-relaxed">{divDef.description}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(['school', 'higher', 'research'] as const).map((id) => (
              <button
                key={id}
                type="button"
                onClick={() => switchDivision(id, 'division-home')}
                className={`px-3 py-2 rounded-lg text-xs font-semibold border transition-colors min-h-[40px] ${
                  activeDivision === id
                    ? 'bg-slate-900 text-white border-slate-900'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {EDUCATION_DIVISIONS[id].shortTitle}
              </button>
            ))}
          </div>
        </div>

        {/* Division-Specific Pathway / Class Selector */}
        {activeDivision === 'school' && (
          <div className="rounded-xl border border-blue-200 bg-blue-50/50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-bold text-slate-900">
                Select School Class Level (Adapts AI Tutor Language &amp; Mathematical Rigor)
              </div>
              <span className="text-xs font-mono text-blue-800">{activeSchoolInfo.ageRange}</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {SCHOOL_CLASS_LEVELS.map((lvl) => (
                <button
                  key={lvl.id}
                  type="button"
                  onClick={() => setSchoolClassLevel(lvl.id as SchoolClassLevel)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border transition-colors ${
                    schoolClassLevel === lvl.id
                      ? 'bg-blue-700 text-white border-blue-700'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-blue-400'
                  }`}
                >
                  {lvl.label}
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-700 flex flex-wrap gap-4 pt-1">
              <span>
                <strong className="text-slate-900">Math Focus:</strong> {activeSchoolInfo.mathDepth}
              </span>
              <span>
                <strong className="text-slate-900">Guidance:</strong> {activeSchoolInfo.guidance}
              </span>
            </div>
          </div>
        )}

        {activeDivision === 'higher' && (
          <div className="rounded-xl border border-teal-200 bg-teal-50/50 p-4 space-y-3">
            <div className="text-xs font-bold text-slate-900">
              Select Higher Education Academic Pathway
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {HIGHER_EDUCATION_STAGES.map((st) => (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setHigherStage(st.id as HigherStage)}
                  className={`p-3 rounded-lg text-left border transition-colors ${
                    higherStage === st.id
                      ? 'bg-teal-700 text-white border-teal-700'
                      : 'bg-white text-slate-800 border-slate-200 hover:border-teal-400'
                  }`}
                >
                  <div className="text-xs font-bold">{st.label}</div>
                </button>
              ))}
            </div>
            <div className="text-xs text-slate-700 space-y-1 pt-1">
              <div>
                <strong className="text-slate-900">Quantitative Scope:</strong> {activeHigherInfo.mathDepth}
              </div>
              <div>
                <strong className="text-slate-900">Focus:</strong> {activeHigherInfo.guidance}
              </div>
            </div>
          </div>
        )}

        {activeDivision === 'research' && (
          <div className="rounded-xl border border-violet-200 bg-violet-50/50 p-4 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold text-slate-900">
                  Specialised Research Track ({RESEARCH_TRACK_DETAILS.length} Pathways)
                </div>
                <div className="text-xs text-slate-600 mt-0.5">
                  Select a track to focus lab rooms, instrument operating parameters, and mathematical assumptions.
                </div>
              </div>
              <select
                value={researchTrack}
                onChange={(e) => setResearchTrack(e.target.value as ResearchTrack)}
                className="px-3 py-2 rounded-lg bg-white border border-violet-300 text-xs font-semibold text-slate-900"
              >
                {RESEARCH_TRACK_DETAILS.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid md:grid-cols-2 gap-3 text-xs bg-white rounded-lg border border-violet-200 p-3">
              <div>
                <div className="font-semibold text-slate-900 mb-1">Key Instruments &amp; Models</div>
                <div className="text-slate-700">{activeTrackInfo.keyInstruments.join(' · ')}</div>
                <div className="font-mono text-violet-800 mt-1.5">
                  {activeTrackInfo.coreEquations.join('  |  ')}
                </div>
              </div>
              <div>
                <div className="font-semibold text-slate-900 mb-1">Empirical Simulation Boundary</div>
                <p className="text-slate-600 leading-relaxed">{activeTrackInfo.empiricalBoundaryNote}</p>
              </div>
            </div>
          </div>
        )}

        {/* Quick Division Metrics & Primary Actions */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 border-t border-slate-100">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Recorded Trials</div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">{totalTrials}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Lab Reports</div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">{savedReports.length}</div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Notebook Entries</div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
              {researchNotebookEntries.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5">
            <div className="text-[11px] text-slate-500">Instruments Mastered</div>
            <div className="text-xl font-bold font-mono text-slate-900 tabular-nums mt-0.5">
              {masteredInstrumentIds.length}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <button
            type="button"
            onClick={() => navigate('virtual-lab')}
            className="px-4 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-2 min-h-[44px]"
          >
            <FlaskConical className="w-4 h-4" />
            Enter Virtual Laboratory ({divisionRooms.length} Wings)
          </button>
          <button
            type="button"
            onClick={() => navigate('lab-tutor')}
            className="px-4 py-2.5 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-2 min-h-[44px]"
          >
            <Sparkles className="w-4 h-4" />
            Open Level-Adapted AI Lab Tutor
          </button>
          <button
            type="button"
            onClick={() => navigate('inventory-explorer')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-2 min-h-[44px]"
          >
            <Wrench className="w-4 h-4 text-blue-700" />
            Equipment &amp; Instrument Explorer
          </button>
          <button
            type="button"
            onClick={() => navigate('innovation-suite')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-2 min-h-[44px]"
          >
            <Compass className="w-4 h-4 text-emerald-700" />
            Digital Twin &amp; Parallel Universe Lab
          </button>
          <button
            type="button"
            onClick={() => navigate('research-notebook')}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-2 min-h-[44px]"
          >
            <NotebookPen className="w-4 h-4 text-violet-700" />
            Research Notebook &amp; Lab Passport
          </button>
          <button
            type="button"
            onClick={() => {
              setSmartLearningPrefillQuery(divDef.subjects[0]?.tutorPrompt || divDef.title);
              navigate('smart-learning');
            }}
            className="px-4 py-2.5 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-emerald-500 flex items-center gap-2 min-h-[44px]"
          >
            <Film className="w-4 h-4 text-emerald-700" />
            Watch Concept Video Lesson
          </button>
        </div>

        <AudioNarrationBar
          compact
          title={`${divDef.shortTitle} Overview`}
          segments={[
            { label: divDef.title, text: divDef.description },
            {
              label:
                activeDivision === 'school'
                  ? activeSchoolInfo.label
                  : activeDivision === 'higher'
                    ? activeHigherInfo.label
                    : activeTrackInfo.label,
              text:
                activeDivision === 'school'
                  ? `${activeSchoolInfo.mathDepth}. ${activeSchoolInfo.guidance}`
                  : activeDivision === 'higher'
                    ? `${activeHigherInfo.mathDepth}. ${activeHigherInfo.guidance}`
                    : `${activeTrackInfo.keyInstruments.join(', ')}. ${activeTrackInfo.empiricalBoundaryNote}`,
            },
          ]}
        />
      </section>

      {/* Division Subjects Directory Preview */}
      <section className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xl font-display font-bold text-slate-900">
              {divDef.shortTitle} Subjects ({divDef.subjects.length})
            </h2>
            <p className="text-xs text-slate-600 mt-0.5">
              Launch dedicated laboratory benches, recommended experiments, or AI explanations directly from any subject.
            </p>
          </div>
          <button
            type="button"
            onClick={() => navigate('subjects')}
            className="text-xs font-semibold text-blue-700 hover:underline flex items-center gap-1"
          >
            View All Subjects <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {divDef.subjects.slice(0, 8).map((subj) => (
            <div
              key={subj.id}
              className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-3 hover:border-blue-300 transition-colors"
            >
              <div className="space-y-1.5">
                <div className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-semibold">
                  {subj.department} wing
                </div>
                <h3 className="text-sm font-display font-bold text-slate-900">{subj.name}</h3>
                <p className="text-xs text-slate-600 leading-relaxed">{subj.summary}</p>
              </div>
              <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() =>
                    navigate('virtual-lab', {
                      department: subj.department,
                      experimentId: subj.recommendedExperimentId,
                    })
                  }
                  className="flex-1 py-1.5 px-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs font-semibold text-slate-800 hover:border-blue-500 hover:text-blue-700"
                >
                  Open Lab
                </button>
                <button
                  type="button"
                  onClick={() => navigate('lab-tutor', { subjectId: subj.id, experimentId: subj.recommendedExperimentId })}
                  className="py-1.5 px-2.5 rounded-lg bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                >
                  Tutor
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Featured Validated Experiments for Current Division */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-bold text-slate-900">
            Recommended {divDef.shortTitle} Investigations
          </h2>
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-emerald-700" />
            100% Deterministic Validated Models
          </span>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {divDef.featuredExperimentIds.map((expId) => {
            const exp = getExperimentById(expId);
            if (!exp) return null;
            return (
              <div
                key={exp.id}
                className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1.5">
                  <div className="text-[11px] font-mono text-slate-500">
                    {exp.subject} · {exp.formula}
                  </div>
                  <h3 className="text-base font-display font-bold text-slate-900">{exp.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed line-clamp-2">{exp.principle}</p>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => navigate('virtual-lab', { experimentId: exp.id })}
                    className="flex-1 py-2 px-3 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800"
                  >
                    Run Experiment
                  </button>
                  <button
                    type="button"
                    onClick={() => navigate('what-if', { whatIfExpId: exp.id })}
                    className="py-2 px-3 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:border-blue-400"
                  >
                    What-If
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
