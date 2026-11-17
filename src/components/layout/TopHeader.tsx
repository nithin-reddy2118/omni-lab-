import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ChevronDown, Globe, GraduationCap, Menu, Search, User, X } from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { EXPERIMENTS } from '../../engine/experiments';
import { ALGORITHM_REGISTRY } from '../../data/algorithmRegistry';
import { WORLD_DISCOVERIES } from '../../data/discoveries';
import { INNOVATION_CHALLENGES } from '../../data/challenges';
import { EDUCATION_DIVISIONS } from '../../data/divisions';
import type { EducationDivision, LanguageCode } from '../../types/science';
import { Modal } from '../ui/Modal';

export function TopHeader() {
  const {
    activePage,
    navigate,
    activeDivision,
    switchDivision,
    sidebarOpen,
    setSidebarOpen,
    language,
    setLanguage,
    t,
    role,
    setRole,
    demoMode,
    setDemoMode,
    setSmartLearningPrefillQuery,
  } = useLab();

  const [divMenuOpen, setDivMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const divRef = useRef<HTMLDivElement>(null);
  const langRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onOutsideClick = (e: MouseEvent) => {
      if (divRef.current && !divRef.current.contains(e.target as Node)) {
        setDivMenuOpen(false);
      }
      if (langRef.current && !langRef.current.contains(e.target as Node)) {
        setLangMenuOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileMenuOpen(false);
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setDivMenuOpen(false);
        setLangMenuOpen(false);
        setProfileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', onOutsideClick);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onOutsideClick);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, []);

  const searchResults = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return [];

    const algoMatches = ALGORITHM_REGISTRY.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.category.toLowerCase().includes(q) ||
        a.formula.toLowerCase().includes(q)
    ).map((a) => ({
      type: 'Algorithm',
      title: a.name,
      subtitle: `${a.category} · ${a.timeComplexity.average}`,
      onSelect: () => {
        navigate('algorithm-explorer');
        setSearchOpen(false);
      },
    }));

    const expMatches = EXPERIMENTS.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.subject.toLowerCase().includes(q) ||
        e.formula.toLowerCase().includes(q)
    ).map((e) => ({
      type: 'Experiment',
      title: e.title,
      subtitle: `${e.subject} · ${e.formula}`,
      onSelect: () => {
        navigate('virtual-lab', { experimentId: e.id });
        setSearchOpen(false);
      },
    }));

    const discMatches = WORLD_DISCOVERIES.filter(
      (d) =>
        d.title.toLowerCase().includes(q) ||
        d.category.toLowerCase().includes(q) ||
        d.institution.toLowerCase().includes(q)
    ).map((d) => ({
      type: 'Discovery',
      title: d.title,
      subtitle: `${d.category} · ${d.institution}`,
      onSelect: () => {
        navigate('discoveries');
        setSearchOpen(false);
      },
    }));

    const chalMatches = INNOVATION_CHALLENGES.filter(
      (c) => c.title.toLowerCase().includes(q) || c.theme.toLowerCase().includes(q)
    ).map((c) => ({
      type: 'Challenge',
      title: c.title,
      subtitle: c.theme,
      onSelect: () => {
        navigate('challenges');
        setSearchOpen(false);
      },
    }));

    return [...algoMatches, ...expMatches, ...discMatches, ...chalMatches].slice(0, 12);
  }, [searchQuery, navigate]);

  const currentDivisionDef = EDUCATION_DIVISIONS[activeDivision];

  const langLabels: { code: LanguageCode; label: string }[] = [
    { code: 'en', label: 'English' },
    { code: 'kn', label: 'ಕನ್ನಡ (Kannada)' },
    { code: 'hi', label: 'हिन्दी (Hindi)' },
  ];

  const divisionList: EducationDivision[] = ['school', 'higher', 'research'];

  return (
    <>
      <header className="sticky top-0 z-30 h-16 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-[1440px] mx-auto h-full px-4 sm:px-6 flex items-center justify-between gap-4 sm:gap-6">
          {/* Zone 1: Menu toggle + OmniLab Wordmark */}
          <div className="flex items-center gap-3 min-w-0 shrink-0">
            <button
              type="button"
              onClick={() => setSidebarOpen((s) => !s)}
              aria-label={sidebarOpen ? 'Close navigation sidebar' : 'Open navigation sidebar'}
              aria-expanded={sidebarOpen}
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-blue-600/40 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <button
              type="button"
              onClick={() => navigate('home')}
              className="text-left font-display font-bold text-base sm:text-lg tracking-tight text-slate-900 hover:text-blue-700 transition-colors whitespace-nowrap shrink-0"
            >
              OmniLab
            </button>
          </div>

          {/* Zone 2: Strictly ONLY the active division's concise top links */}
          <nav className="hidden lg:flex items-center gap-5" aria-label="Active division navigation">
            {currentDivisionDef.topHeaderPages.map((link) => {
              const isActive =
                activePage === link.page ||
                (link.page === 'division-home' && activePage === 'dashboard');
              return (
                <button
                  key={`${currentDivisionDef.id}-${link.label}`}
                  type="button"
                  onClick={() =>
                    navigate(link.page, {
                      department: link.department,
                      experimentId: link.experimentId,
                    })
                  }
                  className={`text-sm font-medium whitespace-nowrap shrink-0 py-1 border-b-2 transition-colors ${
                    isActive
                      ? 'text-blue-700 border-blue-700 font-semibold'
                      : 'text-slate-600 border-transparent hover:text-slate-950'
                  }`}
                >
                  {link.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Division Switcher, Search, Language, Role Menu */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative" ref={divRef}>
              <button
                type="button"
                onClick={() => {
                  setDivMenuOpen((o) => !o);
                  setLangMenuOpen(false);
                  setProfileMenuOpen(false);
                }}
                aria-expanded={divMenuOpen}
                aria-label="Switch education division"
                className="px-2.5 sm:px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 hover:border-blue-600/40 flex items-center gap-1.5 min-h-[40px] whitespace-nowrap shrink-0"
              >
                <GraduationCap className="w-4 h-4 shrink-0" style={{ color: currentDivisionDef.accentHex }} />
                <span className="hidden sm:inline">{currentDivisionDef.shortTitle}</span>
                <span className="sm:hidden uppercase">{activeDivision}</span>
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>
              {divMenuOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-xl border border-slate-200 bg-white shadow-lg p-1.5 z-40 space-y-1">
                  <div className="px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                    Education Divisions
                  </div>
                  {divisionList.map((divId) => {
                    const def = EDUCATION_DIVISIONS[divId];
                    const selected = activeDivision === divId;
                    return (
                      <button
                        key={divId}
                        type="button"
                        onClick={() => {
                          switchDivision(divId, 'division-home');
                          setDivMenuOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-lg transition-colors ${
                          selected ? 'bg-blue-50 text-blue-800' : 'text-slate-800 hover:bg-slate-50'
                        }`}
                      >
                        <div className="flex items-center justify-between text-xs font-bold">
                          <span>{def.shortTitle}</span>
                          {selected && <span className="text-[11px] text-blue-700">Active</span>}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">{def.audienceLabel}</div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSearchOpen(true)}
              aria-label="Search platform"
              className="p-2 rounded-lg border border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900 hover:border-blue-600/40 transition-colors min-w-[40px] min-h-[40px] flex items-center justify-center"
            >
              <Search className="w-4 h-4" />
            </button>

            <div className="relative" ref={langRef}>
              <button
                type="button"
                onClick={() => {
                  setLangMenuOpen((o) => !o);
                  setDivMenuOpen(false);
                  setProfileMenuOpen(false);
                }}
                aria-expanded={langMenuOpen}
                aria-label="Select language"
                className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:text-slate-950 flex items-center gap-1.5 min-h-[40px] whitespace-nowrap shrink-0"
              >
                <Globe className="w-4 h-4 text-blue-700" />
                <span className="uppercase">{language}</span>
              </button>
              {langMenuOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-xl border border-slate-200 bg-white shadow-lg py-1.5 z-40">
                  {langLabels.map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => {
                        setLanguage(item.code);
                        setLangMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between hover:bg-slate-50 ${
                        language === item.code ? 'text-blue-700 font-semibold' : 'text-slate-800'
                      }`}
                    >
                      <span>{item.label}</span>
                      {language === item.code && <span className="text-xs">Active</span>}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="relative" ref={profileRef}>
              <button
                type="button"
                onClick={() => {
                  setProfileMenuOpen((o) => !o);
                  setDivMenuOpen(false);
                  setLangMenuOpen(false);
                }}
                aria-expanded={profileMenuOpen}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900 hover:border-blue-600/40 flex items-center gap-2 min-h-[40px] whitespace-nowrap shrink-0"
              >
                <User className="w-4 h-4 text-blue-700" />
                <span>{role === 'teacher' ? 'Teacher' : 'Student'}</span>
              </button>
              {profileMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 rounded-xl border border-slate-200 bg-white shadow-lg p-2 z-40 space-y-1">
                  <div className="px-3 py-2 border-b border-slate-100">
                    <div className="text-xs font-semibold text-slate-900">
                      {role === 'teacher' ? 'Teacher Mode Active' : 'Student Researcher'}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      {currentDivisionDef.shortTitle} · {demoMode ? 'Demo Data' : 'Local Workspace'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('division-home');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-950 hover:bg-slate-50"
                  >
                    Division Dashboard
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('personal-lab');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-950 hover:bg-slate-50"
                  >
                    My Personal Laboratory
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('research-notebook');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-950 hover:bg-slate-50"
                  >
                    Notebook &amp; Lab Passport
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      navigate('my-learning');
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-slate-700 hover:text-slate-950 hover:bg-slate-50"
                  >
                    {t.nav.myLearning}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRole(role === 'student' ? 'teacher' : 'student');
                      setProfileMenuOpen(false);
                      if (role === 'student') navigate('teacher-mode');
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-blue-700 font-medium hover:bg-blue-50"
                  >
                    Switch to {role === 'student' ? 'Teacher Mode' : 'Student View'}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDemoMode(!demoMode);
                      setProfileMenuOpen(false);
                    }}
                    className="w-full text-left px-3 py-2 rounded-lg text-sm text-amber-700 font-medium hover:bg-amber-50"
                  >
                    {demoMode ? 'Disable Example Demo Data' : 'Preview Example Student Data'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      <Modal
        open={searchOpen}
        onClose={() => setSearchOpen(false)}
        title="Search Algorithms, Experiments, Discoveries & Challenges"
      >
        <div className="space-y-4">
          <input
            type="search"
            autoFocus
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Type an algorithm, formula, or discovery (e.g. Dijkstra, Titration, Pendulum, pH)..."
            className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-300 text-slate-900 placeholder-slate-400 text-sm focus:border-blue-600 outline-none"
          />
          {!searchQuery.trim() ? (
            <p className="text-xs text-slate-500">
              Search across 22 executable algorithms, {EXPERIMENTS.length} validated experiment models, World Discoveries, and Innovation Challenges.
            </p>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => {
                  setSmartLearningPrefillQuery(searchQuery.trim());
                  navigate('smart-learning');
                  setSearchOpen(false);
                }}
                className="w-full text-left py-2.5 px-3 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 flex items-center justify-between gap-3 text-xs"
              >
                <span className="font-semibold text-blue-900">
                  Generate Animated Concept Video for &ldquo;{searchQuery.trim()}&rdquo;
                </span>
                <span className="font-semibold text-blue-700 shrink-0">Smart Video Studio →</span>
              </button>
              {searchResults.length === 0 ? (
                <p className="text-sm text-slate-600">
                  No static catalog records matched &ldquo;{searchQuery}&rdquo;. Launch Smart Video Studio above or ask in Science Explorer.
                </p>
              ) : (
                <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                  {searchResults.map((r, idx) => (
                    <button
                      key={`${r.type}-${idx}`}
                      type="button"
                      onClick={r.onSelect}
                      className="w-full text-left py-3 px-2 hover:bg-slate-50 rounded-lg transition-colors flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-medium text-slate-900">{r.title}</div>
                        <div className="text-xs text-slate-500 mt-0.5">{r.subtitle}</div>
                      </div>
                      <span className="text-xs font-semibold text-blue-700 shrink-0">{r.type}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </Modal>
    </>
  );
}
