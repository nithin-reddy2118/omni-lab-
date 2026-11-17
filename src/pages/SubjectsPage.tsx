import React, { useMemo, useState } from 'react';
import { BookOpen, Film, FlaskConical, GraduationCap, Search } from 'lucide-react';
import { useLab } from '../context/LabContext';
import { EDUCATION_DIVISIONS } from '../data/divisions';

export function SubjectsPage() {
  const {
    activeDivision,
    activeSubjectId,
    setActiveSubjectId,
    navigate,
    setSmartLearningPrefillQuery,
  } = useLab();

  const [query, setQuery] = useState('');
  const divDef = EDUCATION_DIVISIONS[activeDivision];

  const subjects = useMemo(() => {
    const q = query.trim().toLowerCase();
    return divDef.subjects.filter(
      (s) =>
        !q ||
        s.name.toLowerCase().includes(q) ||
        s.summary.toLowerCase().includes(q) ||
        s.keyTopics.some((t) => t.toLowerCase().includes(q))
    );
  }, [divDef.subjects, query]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div
            className="text-xs font-semibold uppercase tracking-wider flex items-center gap-1.5"
            style={{ color: divDef.accentHex }}
          >
            <BookOpen className="w-4 h-4" />
            {divDef.shortTitle} Curriculum Directory
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            Subjects &amp; Guided Investigation Pathways
          </h1>
          <p className="text-xs text-slate-600 max-w-2xl">
            {divDef.subtitle}
          </p>
        </div>

        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Filter subjects or topics..."
            className="pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 w-64"
          />
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {subjects.map((subj) => {
          const highlighted = activeSubjectId === subj.id;
          return (
            <div
              key={subj.id}
              onClick={() => setActiveSubjectId(subj.id)}
              className={`rounded-xl border bg-white p-5 space-y-4 transition-colors ${
                highlighted ? 'border-blue-500 ring-1 ring-blue-200' : 'border-slate-200 hover:border-blue-300'
              }`}
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500">
                    {subj.department} laboratory wing
                  </div>
                  <h2 className="text-lg font-display font-bold text-slate-900 mt-0.5">{subj.name}</h2>
                </div>
                <span className="text-xs font-mono text-blue-700 font-semibold">
                  {subj.keyTopics.length} topics
                </span>
              </div>

              <p className="text-xs text-slate-600 leading-relaxed">{subj.summary}</p>

              <div className="text-xs text-slate-700 pt-2 border-t border-slate-100">
                <strong className="text-slate-900">Core Topics:</strong> {subj.keyTopics.join(' · ')}
              </div>

              <div className="flex flex-wrap gap-2 pt-1">
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('virtual-lab', {
                      department: subj.department,
                      experimentId: subj.recommendedExperimentId,
                    });
                  }}
                  className="px-3 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5"
                >
                  <FlaskConical className="w-3.5 h-3.5" />
                  Open Lab Room
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('lab-tutor', {
                      subjectId: subj.id,
                      experimentId: subj.recommendedExperimentId,
                    });
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-1.5"
                >
                  <GraduationCap className="w-3.5 h-3.5 text-blue-700" />
                  Ask AI Tutor
                </button>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSmartLearningPrefillQuery(subj.tutorPrompt);
                    navigate('smart-learning');
                  }}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:border-emerald-500 hover:text-emerald-700 flex items-center gap-1.5"
                >
                  <Film className="w-3.5 h-3.5" />
                  Smart Video
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
