import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type {
  AchievementItem,
  CustomExperimentDefinition,
  EducationDivision,
  EngineeringBranch,
  HigherStage,
  InnovationItem,
  LabDepartmentId,
  LanguageCode,
  PageId,
  PersonalLabWorkspace,
  PredictionSubmission,
  ResearchNotebookEntry,
  ResearchTrack,
  SafetyLevel,
  SavedDiscoveryEntry,
  SavedLabDesign,
  SavedReport,
  SchoolClassLevel,
  ScienceVideoItem,
  TeacherAssignment,
  TrialRecord,
  UserRole,
} from '../types/science';
import { getRecommendedDefaultExperimentForProfile } from '../data/curriculumEngine';
import type {
  SmartLessonHistoryItem,
  SmartLessonPackage,
  SmartQuizAttempt,
} from '../types/smartLearning';

export interface WorkbenchHandoff {
  department?: LabDepartmentId;
  experimentId?: string;
  equipmentIds?: string[];
  chemicalIds?: string[];
  enterRoomDirectly?: boolean;
  autoOpenBoilingDemo?: boolean;
  savedDesignId?: string;
}
import {
  ACHIEVEMENT_CATALOG,
  INITIAL_TEACHER_ASSIGNMENTS,
  SEED_PUBLIC_INNOVATIONS,
} from '../data/seedCommunity';
import { getTranslations, type TranslationBundle } from '../engine/i18n';

const STORAGE_KEY = 'omnilab_campus_state_v1';
const LEGACY_STORAGE_KEY = 'btr_discover_science_state_v1';

interface PersistedState {
  activeExperimentId: string;
  trialsByExperiment: Record<string, TrialRecord[]>;
  predictionsByExperiment: Record<string, PredictionSubmission>;
  customExperiments: CustomExperimentDefinition[];
  savedReports: SavedReport[];
  savedLabDesigns: SavedLabDesign[];
  recentEquipmentIds: string[];
  activeDepartment: LabDepartmentId;
  savedDiscoveryIds: string[];
  savedVideos: ScienceVideoItem[];
  myInnovations: InnovationItem[];
  publicInnovations: InnovationItem[];
  savedInnovationIds: string[];
  teacherAssignments: TeacherAssignment[];
  safetyChecksCount: number;
  whatIfExploredCount: number;
  recentSafetyLogs: { id: string; input: string; level: SafetyLevel; timestamp: string }[];
  streakDays: number;
  lastActiveDate: string;
  language: LanguageCode;
  reducedMotion: boolean;
  highContrast: boolean;
  fontScale: 'normal' | 'large';
  role: UserRole;
  demoMode: boolean;
  smartLessonHistory: SmartLessonHistoryItem[];
  smartQuizAttempts: SmartQuizAttempt[];
  activeDivision: EducationDivision;
  schoolClassLevel: SchoolClassLevel;
  higherStage: HigherStage;
  researchTrack: ResearchTrack;
  selectedBoard: string;
  engineeringBranch: EngineeringBranch;
  selectedChapter: string | null;
  researchNotebookEntries: ResearchNotebookEntry[];
  savedDiscoveries: SavedDiscoveryEntry[];
  unfinishedExperiment: {
    experimentId: string;
    department: LabDepartmentId;
    params: Record<string, number>;
    updatedAt: string;
  } | null;
  masteredInstrumentIds: string[];
  discoveredConceptIds: string[];
  personalLabs: PersonalLabWorkspace[];
  activePersonalLabId: string | null;
  curriculumCompletedIds: string[];
}

const DEFAULT_PERSISTED: PersistedState = {
  activeExperimentId: 'force-acceleration',
  trialsByExperiment: {},
  predictionsByExperiment: {},
  customExperiments: [],
  savedReports: [],
  savedLabDesigns: [],
  recentEquipmentIds: [],
  activeDepartment: 'physics',
  savedDiscoveryIds: [],
  savedVideos: [],
  myInnovations: [],
  publicInnovations: SEED_PUBLIC_INNOVATIONS,
  savedInnovationIds: [],
  teacherAssignments: INITIAL_TEACHER_ASSIGNMENTS,
  safetyChecksCount: 0,
  whatIfExploredCount: 0,
  recentSafetyLogs: [],
  streakDays: 0,
  lastActiveDate: '',
  language: 'en',
  reducedMotion: false,
  highContrast: false,
  fontScale: 'normal',
  role: 'student',
  demoMode: false,
  smartLessonHistory: [],
  smartQuizAttempts: [],
  activeDivision: 'school',
  schoolClassLevel: 'class-8',
  higherStage: 'class-11-12',
  researchTrack: 'biotechnology',
  selectedBoard: 'CBSE',
  engineeringBranch: 'general',
  selectedChapter: null,
  researchNotebookEntries: [],
  savedDiscoveries: [],
  unfinishedExperiment: null,
  masteredInstrumentIds: [],
  discoveredConceptIds: [],
  personalLabs: [],
  activePersonalLabId: null,
  curriculumCompletedIds: [],
};

const VALID_PAGES = new Set<PageId>([
  'home',
  'division-home',
  'dashboard',
  'subjects',
  'lab-tutor',
  'inventory-explorer',
  'research-notebook',
  'innovation-suite',
  'explorer',
  'smart-learning',
  'algorithm-explorer',
  'creator',
  'virtual-lab',
  'personal-lab',
  'what-if',
  'detective',
  'safety',
  'trust-centre',
  'innovation-hub',
  'discoveries',
  'challenges',
  'my-learning',
  'achievements',
  'teacher-mode',
  'settings',
]);

function readPageFromHash(): PageId {
  const raw = window.location.hash.replace(/^#\/?/, '').split('?')[0] as PageId;
  return VALID_PAGES.has(raw) ? raw : 'home';
}

function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
    if (!raw) return DEFAULT_PERSISTED;
    const parsed = JSON.parse(raw) as Partial<PersistedState>;
    return {
      ...DEFAULT_PERSISTED,
      ...parsed,
      savedVideos: Array.isArray(parsed.savedVideos) ? parsed.savedVideos : [],
      savedLabDesigns: Array.isArray(parsed.savedLabDesigns) ? parsed.savedLabDesigns : [],
      recentEquipmentIds: Array.isArray(parsed.recentEquipmentIds) ? parsed.recentEquipmentIds : [],
      smartLessonHistory: Array.isArray(parsed.smartLessonHistory) ? parsed.smartLessonHistory : [],
      smartQuizAttempts: Array.isArray(parsed.smartQuizAttempts) ? parsed.smartQuizAttempts : [],
      researchNotebookEntries: Array.isArray(parsed.researchNotebookEntries) ? parsed.researchNotebookEntries : [],
      masteredInstrumentIds: Array.isArray(parsed.masteredInstrumentIds) ? parsed.masteredInstrumentIds : [],
      discoveredConceptIds: Array.isArray(parsed.discoveredConceptIds) ? parsed.discoveredConceptIds : [],
      personalLabs: Array.isArray(parsed.personalLabs) ? parsed.personalLabs : [],
      activePersonalLabId: parsed.activePersonalLabId ?? null,
      curriculumCompletedIds: Array.isArray(parsed.curriculumCompletedIds) ? parsed.curriculumCompletedIds : [],
      activeDivision: parsed.activeDivision || 'school',
      schoolClassLevel: parsed.schoolClassLevel || 'class-8',
      higherStage: parsed.higherStage || 'class-11-12',
      researchTrack: parsed.researchTrack || 'biotechnology',
      selectedBoard: parsed.selectedBoard || 'CBSE',
      engineeringBranch: parsed.engineeringBranch || 'general',
      selectedChapter: parsed.selectedChapter ?? null,
      savedDiscoveries: Array.isArray(parsed.savedDiscoveries) ? parsed.savedDiscoveries : [],
      unfinishedExperiment: parsed.unfinishedExperiment ?? null,
      activeDepartment: parsed.activeDepartment || 'physics',
      publicInnovations:
        parsed.publicInnovations && parsed.publicInnovations.length > 0
          ? parsed.publicInnovations
          : SEED_PUBLIC_INNOVATIONS,
      teacherAssignments:
        parsed.teacherAssignments && parsed.teacherAssignments.length > 0
          ? parsed.teacherAssignments
          : INITIAL_TEACHER_ASSIGNMENTS,
    };
  } catch {
    return DEFAULT_PERSISTED;
  }
}

interface LabContextValue {
  activePage: PageId;
  navigate: (
    page: PageId,
    opts?: {
      experimentId?: string;
      whatIfExpId?: string;
      detectiveExpId?: string;
      department?: LabDepartmentId;
      subjectId?: string;
    }
  ) => void;
  activeDivision: EducationDivision;
  setActiveDivision: (div: EducationDivision) => void;
  switchDivision: (div: EducationDivision, targetPage?: PageId) => void;
  schoolClassLevel: SchoolClassLevel;
  setSchoolClassLevel: (level: SchoolClassLevel) => void;
  higherStage: HigherStage;
  setHigherStage: (stage: HigherStage) => void;
  researchTrack: ResearchTrack;
  setResearchTrack: (track: ResearchTrack) => void;
  selectedBoard: string;
  setSelectedBoard: (board: string) => void;
  engineeringBranch: EngineeringBranch;
  setEngineeringBranch: (branch: EngineeringBranch) => void;
  selectedChapter: string | null;
  setSelectedChapter: (chapter: string | null) => void;
  activeSubjectId: string | null;
  setActiveSubjectId: React.Dispatch<React.SetStateAction<string | null>>;
  researchNotebookEntries: ResearchNotebookEntry[];
  saveNotebookEntry: (entry: ResearchNotebookEntry) => void;
  deleteNotebookEntry: (id: string) => void;
  savedDiscoveries: SavedDiscoveryEntry[];
  saveDiscoveryEntry: (entry: SavedDiscoveryEntry) => void;
  deleteDiscoveryEntry: (id: string) => void;
  discoveryPrefill: string | null;
  setDiscoveryPrefill: React.Dispatch<React.SetStateAction<string | null>>;
  unfinishedExperiment: PersistedState['unfinishedExperiment'];
  saveUnfinishedExperiment: (draft: NonNullable<PersistedState['unfinishedExperiment']>) => void;
  clearUnfinishedExperiment: () => void;
  masteredInstrumentIds: string[];
  recordMasteredInstrument: (id: string) => void;
  discoveredConceptIds: string[];
  recordDiscoveredConcept: (concept: string) => void;
  personalLabs: PersonalLabWorkspace[];
  activePersonalLabId: string | null;
  setActivePersonalLabId: (id: string | null) => void;
  savePersonalLab: (lab: PersonalLabWorkspace) => void;
  deletePersonalLab: (id: string) => void;
  curriculumCompletedIds: string[];
  toggleCurriculumCompleted: (id: string) => void;
  sidebarOpen: boolean;
  setSidebarOpen: React.Dispatch<React.SetStateAction<boolean>>;
  activeExperimentId: string;
  setActiveExperimentId: (id: string) => void;
  trialsByExperiment: Record<string, TrialRecord[]>;
  addTrial: (trial: TrialRecord) => { ok: boolean; error?: string };
  renameTrial: (experimentId: string, trialId: string, newName: string) => void;
  deleteTrial: (experimentId: string, trialId: string) => void;
  predictionsByExperiment: Record<string, PredictionSubmission>;
  savePrediction: (pred: PredictionSubmission) => void;
  customExperiments: CustomExperimentDefinition[];
  saveCustomExperiment: (exp: CustomExperimentDefinition) => void;
  deleteCustomExperiment: (id: string) => void;
  savedReports: SavedReport[];
  addSavedReport: (report: SavedReport) => void;
  savedLabDesigns: SavedLabDesign[];
  saveLabDesign: (design: SavedLabDesign) => void;
  renameLabDesign: (id: string, title: string) => void;
  duplicateLabDesign: (id: string) => void;
  deleteLabDesign: (id: string) => void;
  recentEquipmentIds: string[];
  recordRecentEquipment: (instrumentId: string) => void;
  activeDepartment: LabDepartmentId;
  setActiveDepartment: (dept: LabDepartmentId) => void;
  workbenchHandoff: WorkbenchHandoff | null;
  setWorkbenchHandoff: React.Dispatch<React.SetStateAction<WorkbenchHandoff | null>>;
  savedDiscoveryIds: string[];
  toggleSaveDiscovery: (id: string) => void;
  savedVideos: ScienceVideoItem[];
  toggleSaveVideo: (video: ScienceVideoItem) => void;
  isVideoSaved: (id: string) => boolean;
  creatorPrefillPrompt: string | null;
  setCreatorPrefillPrompt: React.Dispatch<React.SetStateAction<string | null>>;
  creatorSelectedCustomId: string | null;
  setCreatorSelectedCustomId: React.Dispatch<React.SetStateAction<string | null>>;
  smartLearningPrefillQuery: string | null;
  setSmartLearningPrefillQuery: React.Dispatch<React.SetStateAction<string | null>>;
  reopenSmartLessonId: string | null;
  setReopenSmartLessonId: React.Dispatch<React.SetStateAction<string | null>>;
  smartLessonHistory: SmartLessonHistoryItem[];
  saveSmartLesson: (
    lesson: SmartLessonPackage,
    opts?: { saved?: boolean; renderedMp4Url?: string; renderedVideoDurationSec?: number }
  ) => void;
  toggleSaveSmartLesson: (lessonId: string) => void;
  deleteSmartLesson: (lessonId: string) => void;
  smartQuizAttempts: SmartQuizAttempt[];
  recordSmartQuizAttempt: (attempt: SmartQuizAttempt) => void;
  myInnovations: InnovationItem[];
  publicInnovations: InnovationItem[];
  savedInnovationIds: string[];
  saveInnovation: (item: InnovationItem) => void;
  deleteMyInnovation: (id: string) => void;
  toggleSaveInnovation: (id: string) => void;
  reviewInnovation: (id: string, decision: 'approved' | 'needs_revision', feedback: string) => void;
  teacherAssignments: TeacherAssignment[];
  addTeacherAssignment: (assignment: TeacherAssignment) => void;
  recordSafetyCheck: (input: string, level: SafetyLevel) => void;
  recentSafetyLogs: { id: string; input: string; level: SafetyLevel; timestamp: string }[];
  recordWhatIfExploration: () => void;
  whatIfExploredCount: number;
  detectiveInitialContext: { experimentId: string; prefill?: string } | null;
  setDetectiveInitialContext: React.Dispatch<React.SetStateAction<{ experimentId: string; prefill?: string } | null>>;
  language: LanguageCode;
  setLanguage: (lang: LanguageCode) => void;
  t: TranslationBundle;
  reducedMotion: boolean;
  setReducedMotion: (v: boolean) => void;
  highContrast: boolean;
  setHighContrast: (v: boolean) => void;
  fontScale: 'normal' | 'large';
  setFontScale: (v: 'normal' | 'large') => void;
  role: UserRole;
  setRole: (role: UserRole) => void;
  demoMode: boolean;
  setDemoMode: (v: boolean) => void;
  streakDays: number;
  achievements: AchievementItem[];
  knowledgePoints: number;
  aiConfigured: boolean | null;
  clearAllLocalData: () => void;
  exportBackupJson: () => void;
}

const LabContext = createContext<LabContextValue | null>(null);

export function LabProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<PersistedState>(loadState);
  const [activePage, setActivePage] = useState<PageId>(readPageFromHash);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [aiConfigured, setAiConfigured] = useState<boolean | null>(null);
  const [activeSubjectId, setActiveSubjectId] = useState<string | null>(null);
  const [creatorPrefillPrompt, setCreatorPrefillPrompt] = useState<string | null>(null);
  const [creatorSelectedCustomId, setCreatorSelectedCustomId] = useState<string | null>(null);
  const [smartLearningPrefillQuery, setSmartLearningPrefillQuery] = useState<string | null>(null);
  const [reopenSmartLessonId, setReopenSmartLessonId] = useState<string | null>(null);
  const [workbenchHandoff, setWorkbenchHandoff] = useState<WorkbenchHandoff | null>(null);
  const [discoveryPrefill, setDiscoveryPrefill] = useState<string | null>(null);
  const [detectiveInitialContext, setDetectiveInitialContext] = useState<{
    experimentId: string;
    prefill?: string;
  } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      // Ignore storage quota issues silently
    }
  }, [state]);

  useEffect(() => {
    const onHashChange = () => {
      setActivePage(readPageFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => setAiConfigured(Boolean(data?.aiConfigured)))
      .catch(() => setAiConfigured(false));
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('reduced-motion', state.reducedMotion);
    root.classList.toggle('high-contrast-mode', state.highContrast);
    root.style.fontSize = state.fontScale === 'large' ? '17.5px' : '16px';
  }, [state.reducedMotion, state.highContrast, state.fontScale]);

  const touchStreak = useCallback((prev: PersistedState): Pick<PersistedState, 'streakDays' | 'lastActiveDate'> => {
    const today = new Date().toISOString().slice(0, 10);
    if (prev.lastActiveDate === today) {
      return { streakDays: prev.streakDays || 1, lastActiveDate: today };
    }
    if (!prev.lastActiveDate) {
      return { streakDays: 1, lastActiveDate: today };
    }
    const prevDate = new Date(prev.lastActiveDate);
    const curDate = new Date(today);
    const diffDays = Math.round((curDate.getTime() - prevDate.getTime()) / 86400000);
    return {
      streakDays: diffDays === 1 ? prev.streakDays + 1 : 1,
      lastActiveDate: today,
    };
  }, []);

  const navigate = useCallback(
    (
      page: PageId,
      opts?: {
        experimentId?: string;
        whatIfExpId?: string;
        detectiveExpId?: string;
        department?: LabDepartmentId;
        subjectId?: string;
      }
    ) => {
      if (opts?.experimentId || opts?.whatIfExpId || opts?.department) {
        setState((prev) => ({
          ...prev,
          activeExperimentId: opts.experimentId ?? opts.whatIfExpId ?? prev.activeExperimentId,
          activeDepartment: opts.department ?? prev.activeDepartment,
        }));
      }
      if (opts?.subjectId) {
        setActiveSubjectId(opts.subjectId);
      }
      if (opts?.detectiveExpId) {
        setDetectiveInitialContext({ experimentId: opts.detectiveExpId });
      }
      window.location.hash = `#/${page}`;
      setActivePage(page);
      window.scrollTo({ top: 0, behavior: state.reducedMotion ? 'auto' : 'smooth' });
    },
    [state.reducedMotion]
  );

  const setActiveDivision = useCallback((activeDivision: EducationDivision) => {
    setState((prev) => ({ ...prev, activeDivision }));
  }, []);

  const switchDivision = useCallback(
    (activeDivision: EducationDivision, targetPage: PageId = 'division-home') => {
      setState((prev) => {
        const rec = getRecommendedDefaultExperimentForProfile({
          activeDivision,
          schoolClassLevel: prev.schoolClassLevel,
          higherStage: prev.higherStage,
          researchTrack: prev.researchTrack,
          selectedBoard: prev.selectedBoard,
          engineeringBranch: prev.engineeringBranch,
          activeSubjectId: null,
          selectedChapter: null,
        });
        return {
          ...prev,
          activeDivision,
          activeDepartment: rec.department,
          activeExperimentId: rec.experimentId,
          selectedChapter: null,
        };
      });
      setActiveSubjectId(null);
      window.location.hash = `#/${targetPage}`;
      setActivePage(targetPage);
      window.scrollTo({ top: 0, behavior: state.reducedMotion ? 'auto' : 'smooth' });
    },
    [state.reducedMotion]
  );

  const saveDiscoveryEntry = useCallback((entry: SavedDiscoveryEntry) => {
    setState((prev) => ({
      ...prev,
      savedDiscoveries: [entry, ...prev.savedDiscoveries.filter((d) => d.id !== entry.id)].slice(0, 60),
    }));
  }, []);

  const deleteDiscoveryEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      savedDiscoveries: prev.savedDiscoveries.filter((d) => d.id !== id),
    }));
  }, []);

  const saveUnfinishedExperiment = useCallback(
    (draft: NonNullable<PersistedState['unfinishedExperiment']>) => {
      setState((prev) => ({ ...prev, unfinishedExperiment: draft }));
    },
    []
  );

  const clearUnfinishedExperiment = useCallback(() => {
    setState((prev) => ({ ...prev, unfinishedExperiment: null }));
  }, []);

  const saveNotebookEntry = useCallback(
    (entry: ResearchNotebookEntry) => {
      setState((prev) => {
        const exists = prev.researchNotebookEntries.some((e) => e.id === entry.id);
        return {
          ...prev,
          ...touchStreak(prev),
          researchNotebookEntries: exists
            ? prev.researchNotebookEntries.map((e) => (e.id === entry.id ? entry : e))
            : [entry, ...prev.researchNotebookEntries],
        };
      });
    },
    [touchStreak]
  );

  const deleteNotebookEntry = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      researchNotebookEntries: prev.researchNotebookEntries.filter((e) => e.id !== id),
    }));
  }, []);

  const recordMasteredInstrument = useCallback((id: string) => {
    setState((prev) =>
      prev.masteredInstrumentIds.includes(id)
        ? prev
        : { ...prev, masteredInstrumentIds: [id, ...prev.masteredInstrumentIds].slice(0, 120) }
    );
  }, []);

  const recordDiscoveredConcept = useCallback((concept: string) => {
    const clean = concept.trim();
    if (!clean) return;
    setState((prev) =>
      prev.discoveredConceptIds.includes(clean)
        ? prev
        : { ...prev, discoveredConceptIds: [clean, ...prev.discoveredConceptIds].slice(0, 80) }
    );
  }, []);

  const savePersonalLab = useCallback(
    (lab: PersonalLabWorkspace) => {
      setState((prev) => {
        const exists = prev.personalLabs.some((p) => p.id === lab.id);
        return {
          ...prev,
          ...touchStreak(prev),
          activePersonalLabId: lab.id,
          personalLabs: exists
            ? prev.personalLabs.map((p) => (p.id === lab.id ? lab : p))
            : [lab, ...prev.personalLabs],
        };
      });
    },
    [touchStreak]
  );

  const deletePersonalLab = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      personalLabs: prev.personalLabs.filter((p) => p.id !== id),
      activePersonalLabId: prev.activePersonalLabId === id ? null : prev.activePersonalLabId,
    }));
  }, []);

  const toggleCurriculumCompleted = useCallback((id: string) => {
    setState((prev) => {
      const exists = prev.curriculumCompletedIds.includes(id);
      return {
        ...prev,
        curriculumCompletedIds: exists
          ? prev.curriculumCompletedIds.filter((c) => c !== id)
          : [id, ...prev.curriculumCompletedIds],
      };
    });
  }, []);

  const setActiveExperimentId = useCallback((id: string) => {
    setState((prev) => ({ ...prev, activeExperimentId: id }));
  }, []);

  const addTrial = useCallback(
    (trial: TrialRecord): { ok: boolean; error?: string } => {
      let added = false;
      setState((prev) => {
        const existing = prev.trialsByExperiment[trial.experimentId] ?? [];
        if (existing.length >= 10) {
          return prev;
        }
        added = true;
        const streak = touchStreak(prev);
        return {
          ...prev,
          ...streak,
          trialsByExperiment: {
            ...prev.trialsByExperiment,
            [trial.experimentId]: [...existing, trial],
          },
        };
      });
      if (!added) {
        return { ok: false, error: 'Maximum of 10 trials reached for this experiment. Delete an older trial to add another.' };
      }
      return { ok: true };
    },
    [touchStreak]
  );

  const renameTrial = useCallback((experimentId: string, trialId: string, newName: string) => {
    const clean = newName.trim();
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      trialsByExperiment: {
        ...prev.trialsByExperiment,
        [experimentId]: (prev.trialsByExperiment[experimentId] ?? []).map((t) =>
          t.id === trialId ? { ...t, name: clean } : t
        ),
      },
    }));
  }, []);

  const deleteTrial = useCallback((experimentId: string, trialId: string) => {
    setState((prev) => ({
      ...prev,
      trialsByExperiment: {
        ...prev.trialsByExperiment,
        [experimentId]: (prev.trialsByExperiment[experimentId] ?? []).filter((t) => t.id !== trialId),
      },
    }));
  }, []);

  const savePrediction = useCallback(
    (pred: PredictionSubmission) => {
      setState((prev) => ({
        ...prev,
        ...touchStreak(prev),
        predictionsByExperiment: {
          ...prev.predictionsByExperiment,
          [pred.experimentId]: pred,
        },
      }));
    },
    [touchStreak]
  );

  const saveCustomExperiment = useCallback((exp: CustomExperimentDefinition) => {
    setState((prev) => {
      const exists = prev.customExperiments.some((c) => c.id === exp.id);
      return {
        ...prev,
        customExperiments: exists
          ? prev.customExperiments.map((c) => (c.id === exp.id ? exp : c))
          : [exp, ...prev.customExperiments],
      };
    });
  }, []);

  const deleteCustomExperiment = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      customExperiments: prev.customExperiments.filter((c) => c.id !== id),
    }));
  }, []);

  const addSavedReport = useCallback(
    (report: SavedReport) => {
      setState((prev) => ({
        ...prev,
        ...touchStreak(prev),
        savedReports: [report, ...prev.savedReports],
      }));
    },
    [touchStreak]
  );

  const saveLabDesign = useCallback(
    (design: SavedLabDesign) => {
      setState((prev) => {
        const exists = prev.savedLabDesigns.some((d) => d.id === design.id);
        return {
          ...prev,
          ...touchStreak(prev),
          savedLabDesigns: exists
            ? prev.savedLabDesigns.map((d) => (d.id === design.id ? design : d))
            : [design, ...prev.savedLabDesigns],
        };
      });
    },
    [touchStreak]
  );

  const renameLabDesign = useCallback((id: string, title: string) => {
    const clean = title.trim();
    if (!clean) return;
    setState((prev) => ({
      ...prev,
      savedLabDesigns: prev.savedLabDesigns.map((d) =>
        d.id === id ? { ...d, title: clean, updatedAt: new Date().toISOString() } : d
      ),
    }));
  }, []);

  const duplicateLabDesign = useCallback((id: string) => {
    setState((prev) => {
      const target = prev.savedLabDesigns.find((d) => d.id === id);
      if (!target) return prev;
      const now = new Date().toISOString();
      const copy: SavedLabDesign = {
        ...target,
        id: `lab-design-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        title: `${target.title} (Copy)`,
        createdAt: now,
        updatedAt: now,
      };
      return {
        ...prev,
        savedLabDesigns: [copy, ...prev.savedLabDesigns],
      };
    });
  }, []);

  const deleteLabDesign = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      savedLabDesigns: prev.savedLabDesigns.filter((d) => d.id !== id),
    }));
  }, []);

  const recordRecentEquipment = useCallback((instrumentId: string) => {
    setState((prev) => ({
      ...prev,
      recentEquipmentIds: [
        instrumentId,
        ...prev.recentEquipmentIds.filter((id) => id !== instrumentId),
      ].slice(0, 8),
      masteredInstrumentIds: prev.masteredInstrumentIds.includes(instrumentId)
        ? prev.masteredInstrumentIds
        : [instrumentId, ...prev.masteredInstrumentIds].slice(0, 120),
    }));
  }, []);

  const setActiveDepartment = useCallback((activeDepartment: LabDepartmentId) => {
    setState((prev) => ({ ...prev, activeDepartment }));
  }, []);

  const toggleSaveDiscovery = useCallback((id: string) => {
    setState((prev) => {
      const exists = prev.savedDiscoveryIds.includes(id);
      return {
        ...prev,
        savedDiscoveryIds: exists
          ? prev.savedDiscoveryIds.filter((d) => d !== id)
          : [...prev.savedDiscoveryIds, id],
      };
    });
  }, []);

  const toggleSaveVideo = useCallback((video: ScienceVideoItem) => {
    setState((prev) => {
      const exists = prev.savedVideos.some((v) => v.id === video.id);
      return {
        ...prev,
        savedVideos: exists
          ? prev.savedVideos.filter((v) => v.id !== video.id)
          : [video, ...prev.savedVideos],
      };
    });
  }, []);

  const isVideoSaved = useCallback(
    (id: string) => state.savedVideos.some((v) => v.id === id),
    [state.savedVideos]
  );

  const saveSmartLesson = useCallback(
    (
      lesson: SmartLessonPackage,
      opts?: { saved?: boolean; renderedMp4Url?: string; renderedVideoDurationSec?: number }
    ) => {
      setState((prev) => {
        const existing = prev.smartLessonHistory.find(
          (item) =>
            item.id === lesson.id ||
            (item.lesson.topicQuery.toLowerCase() === lesson.topicQuery.toLowerCase() &&
              item.lesson.language === lesson.language)
        );
        const now = new Date().toISOString();
        const entry: SmartLessonHistoryItem = {
          id: existing?.id ?? lesson.id,
          lesson,
          saved: opts?.saved ?? existing?.saved ?? false,
          lastViewedAt: now,
          bestQuizScore: existing?.bestQuizScore,
          renderedMp4Url: opts?.renderedMp4Url ?? existing?.renderedMp4Url,
          renderedVideoDurationSec: opts?.renderedVideoDurationSec ?? existing?.renderedVideoDurationSec,
        };
        const filtered = prev.smartLessonHistory.filter((i) => i.id !== entry.id);
        return {
          ...prev,
          ...touchStreak(prev),
          smartLessonHistory: [entry, ...filtered].slice(0, 30),
        };
      });
    },
    [touchStreak]
  );

  const toggleSaveSmartLesson = useCallback((lessonId: string) => {
    setState((prev) => ({
      ...prev,
      smartLessonHistory: prev.smartLessonHistory.map((item) =>
        item.id === lessonId || item.lesson.id === lessonId
          ? { ...item, saved: !item.saved }
          : item
      ),
    }));
  }, []);

  const deleteSmartLesson = useCallback((lessonId: string) => {
    setState((prev) => ({
      ...prev,
      smartLessonHistory: prev.smartLessonHistory.filter(
        (item) => item.id !== lessonId && item.lesson.id !== lessonId
      ),
    }));
  }, []);

  const recordSmartQuizAttempt = useCallback(
    (attempt: SmartQuizAttempt) => {
      setState((prev) => ({
        ...prev,
        ...touchStreak(prev),
        smartQuizAttempts: [attempt, ...prev.smartQuizAttempts].slice(0, 40),
        smartLessonHistory: prev.smartLessonHistory.map((item) =>
          item.id === attempt.lessonId || item.lesson.id === attempt.lessonId
            ? {
                ...item,
                bestQuizScore: Math.max(item.bestQuizScore ?? 0, attempt.score),
              }
            : item
        ),
      }));
    },
    [touchStreak]
  );

  const saveInnovation = useCallback(
    (item: InnovationItem) => {
      setState((prev) => {
        const exists = prev.myInnovations.some((i) => i.id === item.id);
        return {
          ...prev,
          ...touchStreak(prev),
          myInnovations: exists
            ? prev.myInnovations.map((i) => (i.id === item.id ? item : i))
            : [item, ...prev.myInnovations],
        };
      });
    },
    [touchStreak]
  );

  const deleteMyInnovation = useCallback((id: string) => {
    setState((prev) => ({
      ...prev,
      myInnovations: prev.myInnovations.filter((i) => i.id !== id),
    }));
  }, []);

  const toggleSaveInnovation = useCallback((id: string) => {
    setState((prev) => {
      const exists = prev.savedInnovationIds.includes(id);
      return {
        ...prev,
        savedInnovationIds: exists
          ? prev.savedInnovationIds.filter((i) => i !== id)
          : [...prev.savedInnovationIds, id],
      };
    });
  }, []);

  const reviewInnovation = useCallback(
    (id: string, decision: 'approved' | 'needs_revision', feedback: string) => {
      setState((prev) => {
        const target = prev.myInnovations.find((i) => i.id === id);
        if (!target) return prev;
        const updatedItem: InnovationItem = {
          ...target,
          status: decision,
          teacherFeedback: feedback.trim() || (decision === 'approved' ? 'Approved for Global Showcase.' : 'Please refine safety or scientific explanation.'),
          updatedAt: new Date().toISOString(),
        };
        const updatedMy = prev.myInnovations.map((i) => (i.id === id ? updatedItem : i));
        let updatedPublic = prev.publicInnovations;
        if (decision === 'approved') {
          const alreadyPublic = prev.publicInnovations.some((p) => p.id === id);
          updatedPublic = alreadyPublic
            ? prev.publicInnovations.map((p) => (p.id === id ? updatedItem : p))
            : [updatedItem, ...prev.publicInnovations];
        } else {
          updatedPublic = prev.publicInnovations.filter((p) => p.id !== id);
        }
        return {
          ...prev,
          myInnovations: updatedMy,
          publicInnovations: updatedPublic,
        };
      });
    },
    []
  );

  const addTeacherAssignment = useCallback((assignment: TeacherAssignment) => {
    setState((prev) => ({
      ...prev,
      teacherAssignments: [assignment, ...prev.teacherAssignments],
    }));
  }, []);

  const recordSafetyCheck = useCallback((input: string, level: SafetyLevel) => {
    setState((prev) => ({
      ...prev,
      safetyChecksCount: prev.safetyChecksCount + 1,
      recentSafetyLogs: [
        {
          id: `safe-${Date.now()}`,
          input: input.slice(0, 140),
          level,
          timestamp: new Date().toISOString(),
        },
        ...prev.recentSafetyLogs.slice(0, 19),
      ],
    }));
  }, []);

  const recordWhatIfExploration = useCallback(() => {
    setState((prev) => ({
      ...prev,
      whatIfExploredCount: prev.whatIfExploredCount + 1,
    }));
  }, []);

  const clearAllLocalData = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(LEGACY_STORAGE_KEY);
    setState(DEFAULT_PERSISTED);
  }, []);

  const exportBackupJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnilab-workspace-backup-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [state]);

  const achievements = useMemo<AchievementItem[]>(() => {
    const allTrials = Object.values(state.trialsByExperiment).flat();
    const distinctExpsWithTrials = Object.keys(state.trialsByExperiment).filter(
      (k) => (state.trialsByExperiment[k]?.length ?? 0) > 0
    ).length;
    const predsCount = Object.keys(state.predictionsByExperiment).length;

    const unlockMap: Record<string, boolean> = {
      'ach-first-trial': allTrials.length >= 1,
      'ach-prediction': predsCount >= 1,
      'ach-multi-exp': distinctExpsWithTrials >= 3,
      'ach-what-if': state.whatIfExploredCount >= 1,
      'ach-report': state.savedReports.length >= 1,
      'ach-innovator': state.myInnovations.length >= 1,
      'ach-safety': state.safetyChecksCount >= 1,
    };

    return ACHIEVEMENT_CATALOG.map((item) => ({
      ...item,
      unlocked: Boolean(unlockMap[item.id]),
    }));
  }, [
    state.trialsByExperiment,
    state.predictionsByExperiment,
    state.whatIfExploredCount,
    state.savedReports.length,
    state.myInnovations.length,
    state.safetyChecksCount,
  ]);

  const knowledgePoints = useMemo(() => {
    return achievements.reduce((sum, a) => sum + (a.unlocked ? a.points : 0), 0);
  }, [achievements]);

  const t = useMemo(() => getTranslations(state.language), [state.language]);

  const value: LabContextValue = {
    activePage,
    navigate,
    activeDivision: state.activeDivision,
    setActiveDivision,
    switchDivision,
    schoolClassLevel: state.schoolClassLevel,
    setSchoolClassLevel: (schoolClassLevel) => setState((prev) => ({ ...prev, schoolClassLevel })),
    higherStage: state.higherStage,
    setHigherStage: (higherStage) => setState((prev) => ({ ...prev, higherStage })),
    researchTrack: state.researchTrack,
    setResearchTrack: (researchTrack) => setState((prev) => ({ ...prev, researchTrack })),
    selectedBoard: state.selectedBoard,
    setSelectedBoard: (selectedBoard) => setState((prev) => ({ ...prev, selectedBoard })),
    engineeringBranch: state.engineeringBranch,
    setEngineeringBranch: (engineeringBranch) => setState((prev) => ({ ...prev, engineeringBranch })),
    selectedChapter: state.selectedChapter,
    setSelectedChapter: (selectedChapter) => setState((prev) => ({ ...prev, selectedChapter })),
    activeSubjectId,
    setActiveSubjectId,
    researchNotebookEntries: state.researchNotebookEntries,
    saveNotebookEntry,
    deleteNotebookEntry,
    savedDiscoveries: state.savedDiscoveries,
    saveDiscoveryEntry,
    deleteDiscoveryEntry,
    discoveryPrefill,
    setDiscoveryPrefill,
    unfinishedExperiment: state.unfinishedExperiment,
    saveUnfinishedExperiment,
    clearUnfinishedExperiment,
    masteredInstrumentIds: state.masteredInstrumentIds,
    recordMasteredInstrument,
    discoveredConceptIds: state.discoveredConceptIds,
    recordDiscoveredConcept,
    personalLabs: state.personalLabs,
    activePersonalLabId: state.activePersonalLabId,
    setActivePersonalLabId: (activePersonalLabId) => setState((prev) => ({ ...prev, activePersonalLabId })),
    savePersonalLab,
    deletePersonalLab,
    curriculumCompletedIds: state.curriculumCompletedIds,
    toggleCurriculumCompleted,
    sidebarOpen,
    setSidebarOpen,
    activeExperimentId: state.activeExperimentId,
    setActiveExperimentId,
    trialsByExperiment: state.trialsByExperiment,
    addTrial,
    renameTrial,
    deleteTrial,
    predictionsByExperiment: state.predictionsByExperiment,
    savePrediction,
    customExperiments: state.customExperiments,
    saveCustomExperiment,
    deleteCustomExperiment,
    savedReports: state.savedReports,
    addSavedReport,
    savedLabDesigns: state.savedLabDesigns,
    saveLabDesign,
    renameLabDesign,
    duplicateLabDesign,
    deleteLabDesign,
    recentEquipmentIds: state.recentEquipmentIds,
    recordRecentEquipment,
    activeDepartment: state.activeDepartment,
    setActiveDepartment,
    workbenchHandoff,
    setWorkbenchHandoff,
    savedDiscoveryIds: state.savedDiscoveryIds,
    toggleSaveDiscovery,
    savedVideos: state.savedVideos,
    toggleSaveVideo,
    isVideoSaved,
    creatorPrefillPrompt,
    setCreatorPrefillPrompt,
    creatorSelectedCustomId,
    setCreatorSelectedCustomId,
    smartLearningPrefillQuery,
    setSmartLearningPrefillQuery,
    reopenSmartLessonId,
    setReopenSmartLessonId,
    smartLessonHistory: state.smartLessonHistory,
    saveSmartLesson,
    toggleSaveSmartLesson,
    deleteSmartLesson,
    smartQuizAttempts: state.smartQuizAttempts,
    recordSmartQuizAttempt,
    myInnovations: state.myInnovations,
    publicInnovations: state.publicInnovations,
    savedInnovationIds: state.savedInnovationIds,
    saveInnovation,
    deleteMyInnovation,
    toggleSaveInnovation,
    reviewInnovation,
    teacherAssignments: state.teacherAssignments,
    addTeacherAssignment,
    recordSafetyCheck,
    recentSafetyLogs: state.recentSafetyLogs,
    recordWhatIfExploration,
    whatIfExploredCount: state.whatIfExploredCount,
    detectiveInitialContext,
    setDetectiveInitialContext,
    language: state.language,
    setLanguage: (language) => setState((prev) => ({ ...prev, language })),
    t,
    reducedMotion: state.reducedMotion,
    setReducedMotion: (reducedMotion) => setState((prev) => ({ ...prev, reducedMotion })),
    highContrast: state.highContrast,
    setHighContrast: (highContrast) => setState((prev) => ({ ...prev, highContrast })),
    fontScale: state.fontScale,
    setFontScale: (fontScale) => setState((prev) => ({ ...prev, fontScale })),
    role: state.role,
    setRole: (role) => setState((prev) => ({ ...prev, role })),
    demoMode: state.demoMode,
    setDemoMode: (demoMode) => setState((prev) => ({ ...prev, demoMode })),
    streakDays: state.streakDays,
    achievements,
    knowledgePoints,
    aiConfigured,
    clearAllLocalData,
    exportBackupJson,
  };

  return <LabContext.Provider value={value}>{children}</LabContext.Provider>;
}

export function useLab() {
  const ctx = useContext(LabContext);
  if (!ctx) throw new Error('useLab must be used inside LabProvider');
  return ctx;
}
