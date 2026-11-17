import React, { useEffect } from 'react';
import {
  Atom,
  Award,
  BarChart3,
  BookOpen,
  Compass,
  Cpu,
  Dna,
  FileText,
  Film,
  FlaskConical,
  Globe2,
  GraduationCap,
  HelpCircle,
  Home,
  LayoutDashboard,
  Lightbulb,
  Microscope,
  NotebookPen,
  PlusCircle,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wrench,
  X,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import {
  EDUCATION_DIVISIONS,
  HIGHER_EDUCATION_STAGES,
  RESEARCH_TRACK_DETAILS,
  SCHOOL_CLASS_LEVELS,
} from '../../data/divisions';
import type {
  EducationDivision,
  HigherStage,
  PageId,
  ResearchTrack,
  SchoolClassLevel,
} from '../../types/science';

function getIconForNavId(id: string, page: PageId): React.ComponentType<{ className?: string }> {
  if (id.includes('home') || id.includes('dash')) return LayoutDashboard;
  if (id.includes('biotech') || id.includes('molbio')) return Dna;
  if (id.includes('micro')) return Microscope;
  if (id.includes('bioinf') || id.includes('comp')) return Cpu;
  if (id.includes('phys')) return Atom;
  if (page === 'virtual-lab') return FlaskConical;
  if (page === 'personal-lab') return Wrench;
  if (page === 'subjects') return BookOpen;
  if (page === 'lab-tutor') return GraduationCap;
  if (page === 'inventory-explorer') return Wrench;
  if (page === 'challenges') return Trophy;
  if (page === 'my-learning') return FileText;
  if (page === 'achievements') return Award;
  if (page === 'safety') return ShieldAlert;
  if (page === 'creator') return PlusCircle;
  if (page === 'what-if') return Sparkles;
  if (page === 'innovation-suite') return BarChart3;
  if (page === 'research-notebook') return NotebookPen;
  if (page === 'discoveries') return Globe2;
  if (page === 'algorithm-explorer') return Cpu;
  return Compass;
}

export function Sidebar() {
  const {
    activePage,
    navigate,
    activeDivision,
    switchDivision,
    schoolClassLevel,
    setSchoolClassLevel,
    higherStage,
    setHigherStage,
    researchTrack,
    setResearchTrack,
    activeDepartment,
    activeSubjectId,
    activeExperimentId,
    sidebarOpen,
    setSidebarOpen,
    t,
  } = useLab();

  useEffect(() => {
    if (!sidebarOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setSidebarOpen(false);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [sidebarOpen, setSidebarOpen]);

  const divisionDef = EDUCATION_DIVISIONS[activeDivision];

  const handleNavClick = (
    page: PageId,
    opts?: { department?: typeof activeDepartment; subjectId?: string; experimentId?: string }
  ) => {
    navigate(page, opts);
    if (window.innerWidth < 1024) {
      setSidebarOpen(false);
    }
  };

  if (!sidebarOpen) return null;

  const secondaryTools: { id: PageId; label: string; icon: React.ComponentType<{ className?: string }> }[] = [
    { id: 'home', label: 'OmniLab Campus Portal', icon: Home },
    { id: 'personal-lab', label: 'My Personal Laboratory', icon: Wrench },
    { id: 'smart-learning', label: t.nav.smartLearning, icon: Film },
    { id: 'innovation-suite', label: t.nav.innovationSuite, icon: Sparkles },
    { id: 'algorithm-explorer', label: t.nav.algorithmExplorer, icon: Cpu },
    { id: 'explorer', label: t.nav.explorer, icon: Compass },
    { id: 'innovation-hub', label: t.nav.innovationHub, icon: Lightbulb },
    { id: 'detective', label: t.nav.detective, icon: HelpCircle },
    { id: 'trust-centre', label: t.nav.trustCentre, icon: ShieldCheck },
    { id: 'teacher-mode', label: t.nav.teacherMode, icon: GraduationCap },
    { id: 'settings', label: t.nav.settings, icon: Settings },
  ];

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-slate-900/35 backdrop-blur-xs lg:hidden"
        onClick={() => setSidebarOpen(false)}
        aria-hidden="true"
      />

      <aside
        aria-label="Division navigation sidebar"
        className="fixed top-16 left-0 bottom-0 z-40 w-76 border-r border-slate-200 bg-white flex flex-col overflow-hidden shadow-lg"
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/80">
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Active Division
            </div>
            <div className="text-xs font-bold truncate" style={{ color: divisionDef.accentHex }}>
              {divisionDef.title}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
            className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-200/60 min-w-[36px] min-h-[36px] flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Division Switcher + Active Level Selector */}
        <div className="px-3 py-3 border-b border-slate-200 space-y-2.5 bg-slate-50/40">
          <div className="grid grid-cols-3 gap-1">
            {(['school', 'higher', 'research'] as EducationDivision[]).map((divId) => {
              const selected = activeDivision === divId;
              const shortLabel =
                divId === 'school' ? 'School' : divId === 'higher' ? 'Higher Ed' : 'Research';
              return (
                <button
                  key={divId}
                  type="button"
                  onClick={() => switchDivision(divId, 'division-home')}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-bold transition-colors border ${
                    selected
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {shortLabel}
                </button>
              );
            })}
          </div>

          {activeDivision === 'school' && (
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                School Class Level
              </span>
              <select
                value={schoolClassLevel}
                onChange={(e) => setSchoolClassLevel(e.target.value as SchoolClassLevel)}
                className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800"
              >
                {SCHOOL_CLASS_LEVELS.map((lvl) => (
                  <option key={lvl.id} value={lvl.id}>
                    {lvl.label} ({lvl.ageRange})
                  </option>
                ))}
              </select>
            </label>
          )}

          {activeDivision === 'higher' && (
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Academic Pathway
              </span>
              <select
                value={higherStage}
                onChange={(e) => setHigherStage(e.target.value as HigherStage)}
                className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800"
              >
                {HIGHER_EDUCATION_STAGES.map((st) => (
                  <option key={st.id} value={st.id}>
                    {st.label}
                  </option>
                ))}
              </select>
            </label>
          )}

          {activeDivision === 'research' && (
            <label className="block">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                Research Specialisation
              </span>
              <select
                value={researchTrack}
                onChange={(e) => setResearchTrack(e.target.value as ResearchTrack)}
                className="mt-1 w-full px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-slate-800"
              >
                {RESEARCH_TRACK_DETAILS.map((tr) => (
                  <option key={tr.id} value={tr.id}>
                    {tr.label}
                  </option>
                ))}
              </select>
            </label>
          )}
        </div>

        {/* Strictly ONLY the active division's navigation items */}
        <nav className="flex-1 overflow-y-auto px-3 py-3 space-y-5">
          <div>
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              {divisionDef.shortTitle} Menu ({divisionDef.navItems.length})
            </div>
            <div className="space-y-1">
              {divisionDef.navItems.map((item) => {
                const Icon = getIconForNavId(item.id, item.page);
                const matchesPage = activePage === item.page;
                const matchesSub =
                  (!item.department || activeDepartment === item.department) &&
                  (!item.subjectId || activeSubjectId === item.subjectId) &&
                  (!item.experimentId || activeExperimentId === item.experimentId);
                const active = matchesPage && (item.department || item.subjectId || item.experimentId ? matchesSub : true);

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() =>
                      handleNavClick(item.page, {
                        department: item.department,
                        subjectId: item.subjectId,
                        experimentId: item.experimentId,
                      })
                    }
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[38px] text-left ${
                      active
                        ? 'bg-blue-50 text-blue-700 border border-blue-200 font-semibold'
                        : 'text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-transparent'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-blue-700' : 'text-slate-500'}`} />
                    <span className="truncate">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Shared Studio & Platform Utilities */}
          <div className="pt-3 border-t border-slate-200">
            <div className="px-3 mb-2 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
              Platform Tools &amp; Studio
            </div>
            <div className="space-y-1">
              {secondaryTools.map((tool) => {
                const Icon = tool.icon;
                const active = activePage === tool.id;
                return (
                  <button
                    key={tool.id}
                    type="button"
                    onClick={() => handleNavClick(tool.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px] text-left ${
                      active
                        ? 'bg-slate-900 text-white font-semibold'
                        : 'text-slate-600 hover:text-slate-950 hover:bg-slate-100'
                    }`}
                  >
                    <Icon className={`w-4 h-4 shrink-0 ${active ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{tool.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </nav>
      </aside>
    </>
  );
}
