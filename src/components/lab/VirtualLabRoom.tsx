import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowDown,
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  Atom,
  Building2,
  CheckCircle2,
  DoorOpen,
  Droplets,
  Flame,
  FlaskConical,
  Link2,
  Maximize2,
  Minimize2,
  Mountain,
  Pause,
  Play,
  Plus,
  RotateCcw,
  RotateCw,
  Save,
  Search,
  ShieldCheck,
  Sparkles,
  Trash2,
  Unlink,
  Wrench,
  X,
  Microscope,
  History,
  Lock,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { CHEMISTRY_CHEMICAL_VAULT, getChemicalById } from '../../data/chemicals';
import { evaluateBenchChemistryInteraction } from '../../data/chemistryReactions';
import {
  checkInstrumentConnection,
  getInstrumentById,
  getLabRoomById,
  getRecommendedKitForExperiment,
  LAB_INSTRUMENTS,
  LAB_ROOMS,
} from '../../data/labEquipment';
import { EXPERIMENTS, interpolateWaterBoilingPoint } from '../../engine/experiments';
import {
  buildNumberedInstrumentLabels,
  deriveExperimentSyncFromWorkbench,
  evaluateBottleProximity,
  getBottleDisplayLabel,
  getContainerCapacity,
  getShortMaterialName,
  getVesselCurrentAmount,
  getVesselLiquidVisual,
  isReceivingVessel,
  makePairKey,
  RECEIVING_CONTAINER_SPECS,
  SEPARATION_HYSTERESIS_PX,
  validateTransferAttempt,
} from '../../engine/chemistryBenchEngine';
import { getSafetyBadgeMeta } from '../../engine/safetyEngine';
import {
  checkInstrumentPlacementCompatibility,
  searchCentralRegistry,
} from '../../engine/equipmentRegistry';
import { validateWorkbenchSetup } from '../../engine/executionEngine';
import type {
  ChemicalSubstance,
  ChemistryBenchSyncState,
  ExperimentCalculationResult,
  ExperimentDefinition,
  LabDepartmentId,
  LabInstrument,
  RoomStation,
  SavedLabDesign,
  TransferHistoryEntry,
  VesselMixtureEntry,
  WorkbenchChemicalItem,
  WorkbenchConnection,
  WorkbenchItem,
} from '../../types/science';
import { Modal } from '../ui/Modal';
import { ChemicalCabinetDrawer } from './ChemicalCabinetDrawer';
import {
  type ActivePourPrompt,
  PourProximityPopup,
  PourQuantityModal,
  PourStreamOverlay,
  TransferHistoryModal,
} from './ChemicalPourWorkflow';
import { EquipmentIllustration, type EquipmentSimState } from './EquipmentIllustration';
import { InlineLabTutorStrip, OscilloscopeBenchPanel, VirtualMicroscopeModal } from './LabSpecialViewers';
import { WorkbenchDiscoveryBar } from './WorkbenchDiscoveryBar';
import {
  HIGHER_EDUCATION_STAGES,
  RESEARCH_TRACK_DETAILS,
  SCHOOL_CLASS_LEVELS,
} from '../../data/divisions';

export interface BenchCommandRequest {
  id: number;
  type: 'add-missing-kit' | 'auto-wire';
}

interface VirtualLabRoomProps {
  experiment: ExperimentDefinition;
  params: Record<string, number>;
  result: ExperimentCalculationResult;
  onParamChange: (key: string, val: number) => void;
  onSelectExperiment: (experimentId: string) => void;
  onRecordTrial: () => void;
  onOpenBoilingAltitudeDemo: () => void;
  onExitToCampus: () => void;
  trialsCount: number;
  onChemistryBenchSync?: (sync: ChemistryBenchSyncState) => void;
  onWorkbenchStateChange?: (items: WorkbenchItem[], connections: WorkbenchConnection[]) => void;
  benchCommand?: BenchCommandRequest | null;
}

const CONNECTION_COLORS: Record<WorkbenchConnection['connectionType'], string> = {
  thermal: '#F5B942',
  electrical: '#35D5F2',
  optical: '#FDE047',
  mechanical: '#478BFF',
  measurement: '#35C98A',
  fluid: '#38BDF8',
};

function createInstanceId(prefix = 'inst'): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
}

function buildDefaultConnections(
  items: WorkbenchItem[],
  pairs: [number, number][]
): WorkbenchConnection[] {
  const conns: WorkbenchConnection[] = [];
  for (const [aIdx, bIdx] of pairs) {
    const fromItem = items[aIdx];
    const toItem = items[bIdx];
    if (!fromItem || !toItem) continue;
    const fromInst = getInstrumentById(fromItem.instrumentId);
    const toInst = getInstrumentById(toItem.instrumentId);
    if (!fromInst || !toInst) continue;
    const check = checkInstrumentConnection(fromInst, toInst);
    if (check.valid) {
      conns.push({
        id: `conn-${aIdx}-${bIdx}-${Math.random().toString(36).slice(2, 5)}`,
        fromInstanceId: fromItem.instanceId,
        toInstanceId: toItem.instanceId,
        connectionType: check.connectionType,
        valid: true,
        note: check.note,
      });
    }
  }
  return conns;
}

export function VirtualLabRoom({
  experiment,
  params,
  result,
  onParamChange,
  onSelectExperiment,
  onRecordTrial,
  onOpenBoilingAltitudeDemo,
  onExitToCampus,
  trialsCount,
  onChemistryBenchSync,
  onWorkbenchStateChange,
  benchCommand,
}: VirtualLabRoomProps) {
  const {
    activeDepartment,
    setActiveDepartment,
    activeChemistryBench,
    setActiveChemistryBench,
    activeDivision,
    schoolClassLevel,
    higherStage,
    researchTrack,
    language,
    reducedMotion,
    setCreatorPrefillPrompt,
    navigate,
    recentEquipmentIds,
    recordRecentEquipment,
    saveLabDesign,
    savedLabDesigns,
    workbenchHandoff,
    setWorkbenchHandoff,
    personalLabs,
    updatePersonalLabWorkspace,
  } = useLab();

  const [sessionPersonalLabId, setSessionPersonalLabId] = useState<string | null>(null);
  const [drawerScopeAllWings, setDrawerScopeAllWings] = useState<boolean>(false);
  const isPersonalLabSession = Boolean(sessionPersonalLabId);
  const activePersonalLab = useMemo(
    () => (sessionPersonalLabId ? personalLabs.find((p) => p.id === sessionPersonalLabId) ?? null : null),
    [sessionPersonalLabId, personalLabs]
  );

  const currentLevelLabel = useMemo(() => {
    if (activeDivision === 'school') {
      return SCHOOL_CLASS_LEVELS.find((l) => l.id === schoolClassLevel)?.label ?? 'Class 8';
    }
    if (activeDivision === 'higher') {
      return HIGHER_EDUCATION_STAGES.find((s) => s.id === higherStage)?.label ?? 'Classes 11–12';
    }
    return RESEARCH_TRACK_DETAILS.find((r) => r.id === researchTrack)?.label ?? 'Biotechnology';
  }, [activeDivision, schoolClassLevel, higherStage, researchTrack]);

  const room = useMemo(() => getLabRoomById(activeDepartment), [activeDepartment]);

  const shouldRestoreChemistrySnapshot = Boolean(
    !workbenchHandoff &&
      activeDepartment === 'chemistry' &&
      activeChemistryBench &&
      activeChemistryBench.experimentId === experiment.id
  );

  const [workbenchItems, setWorkbenchItems] = useState<WorkbenchItem[]>(() => {
    if (shouldRestoreChemistrySnapshot && activeChemistryBench) {
      return activeChemistryBench.workbenchItems;
    }
    const kit = getRecommendedKitForExperiment(experiment.id);
    if (kit.department !== activeDepartment) return [];
    return kit.defaultItems.map((item) => ({ ...item, instanceId: createInstanceId('inst') }));
  });

  const [chemicalItems, setChemicalItems] = useState<WorkbenchChemicalItem[]>(() => {
    if (shouldRestoreChemistrySnapshot && activeChemistryBench) {
      return activeChemistryBench.chemicalItems;
    }
    const kit = getRecommendedKitForExperiment(experiment.id);
    if (kit.department !== 'chemistry' || activeDepartment !== 'chemistry' || !kit.chemicalIds) {
      return [];
    }
    return kit.chemicalIds
      .map((cId, idx) => {
        const sub = getChemicalById(cId);
        if (!sub) return null;
        const initAmt = sub.stateAtRoomTemp === 'Solid' ? 10 : 100;
        return {
          instanceId: createInstanceId('chem'),
          chemicalId: sub.id,
          xPercent: Math.min(86, 18 + idx * 14),
          yPercent: 72,
          amount: initAmt,
          capacity: initAmt,
          unit: sub.stateAtRoomTemp === 'Solid' ? 'g' : 'mL',
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
  });

  const [vesselMixtures, setVesselMixtures] = useState<VesselMixtureEntry[]>(() =>
    shouldRestoreChemistrySnapshot && activeChemistryBench
      ? activeChemistryBench.vesselMixtures
      : []
  );
  const [transferHistory, setTransferHistory] = useState<TransferHistoryEntry[]>(() =>
    shouldRestoreChemistrySnapshot && activeChemistryBench
      ? activeChemistryBench.transferHistory
      : []
  );
  const [historyModalOpen, setHistoryModalOpen] = useState<boolean>(false);
  const [microscopeOpen, setMicroscopeOpen] = useState<boolean>(false);

  const [connections, setConnections] = useState<WorkbenchConnection[]>(() => {
    if (shouldRestoreChemistrySnapshot && activeChemistryBench) {
      return activeChemistryBench.connections;
    }
    const kit = getRecommendedKitForExperiment(experiment.id);
    if (kit.department !== activeDepartment) return [];
    const created = kit.defaultItems.map((item) => ({ ...item, instanceId: createInstanceId('inst') }));
    return buildDefaultConnections(created, kit.connectionPairs);
  });

  const [selectedInstanceId, setSelectedInstanceId] = useState<string | null>(null);
  const [selectedChemicalInstanceId, setSelectedChemicalInstanceId] = useState<string | null>(null);
  const [connectingFromId, setConnectingFromId] = useState<string | null>(null);

  // Architectural Room Overlays (keep main room stage visible!)
  const [drawerOpen, setDrawerOpen] = useState<boolean>(false);
  const [activeRackId, setActiveRackId] = useState<string | null>(null);
  const [drawerSearch, setDrawerSearch] = useState('');
  const [chemicalCabinetOpen, setChemicalCabinetOpen] = useState<boolean>(false);
  const [activeStationInfo, setActiveStationInfo] = useState<RoomStation | null>(null);
  const [benchFocusMode, setBenchFocusMode] = useState<boolean>(false);

  const [statusNotice, setStatusNotice] = useState<{
    type: 'info' | 'warning' | 'success';
    text: string;
  } | null>(null);

  // Live Workbench Simulation Loop
  const [isRunning, setIsRunning] = useState(false);
  const [simSpeed, setSimSpeed] = useState<1 | 2 | 5>(1);
  const [simTimeSec, setSimTimeSec] = useState(0);
  const [liveWaterTempC, setLiveWaterTempC] = useState(25);

  // Save Design Modal
  const [saveModalOpen, setSaveModalOpen] = useState(false);
  const [designTitleInput, setDesignTitleInput] = useState('');
  const [designNotesInput, setDesignNotesInput] = useState('');

  // Pointer drag state with Pointer Capture & Proximity Pour Workflow
  const benchRef = useRef<HTMLDivElement | null>(null);
  const [draggingId, setDraggingId] = useState<{ kind: 'inst' | 'chem'; id: string } | null>(null);
  const dragMetaRef = useRef<{
    kind: 'inst' | 'chem';
    id: string;
    pointerId: number;
    startClientX: number;
    startClientY: number;
    didMove: boolean;
    latestXPct?: number;
    latestYPct?: number;
  } | null>(null);

  const suppressedPairsRef = useRef<Set<string>>(new Set());
  const [activePourPrompt, setActivePourPrompt] = useState<ActivePourPrompt | null>(null);
  const [quantityModalTarget, setQuantityModalTarget] = useState<{
    sourceId: string;
    targetId: string;
  } | null>(null);
  const [incompatibleFeedback, setIncompatibleFeedback] = useState<{
    message: string;
    xPercent: number;
    yPercent: number;
  } | null>(null);

  interface PourAnimationState {
    sourceId: string;
    targetId: string;
    phase: 'approaching' | 'tilting' | 'pouring' | 'returning';
    progress01: number;
    bottleX: number;
    bottleY: number;
    bottleTiltDeg: number;
    spoutX: number;
    spoutY: number;
    destMouthX: number;
    destMouthY: number;
    colorHex: string;
    isSolid: boolean;
    startBottleAmt: number;
    endBottleAmt: number;
    bottleCap: number;
    startDestAmt: number;
    endDestAmt: number;
    destCapacity: number;
  }

  const [pourAnimation, setPourAnimation] = useState<PourAnimationState | null>(null);
  const pourRafRef = useRef<number | null>(null);

  const lockedObjectIds = useMemo(() => {
    const set = new Set<string>();
    if (pourAnimation) {
      set.add(pourAnimation.sourceId);
      set.add(pourAnimation.targetId);
    }
    return set;
  }, [pourAnimation]);

  const loadChemicalSamples = (
    chemIds: string[] = [],
    dept: LabDepartmentId,
    forceAllow = false
  ) => {
    if ((dept !== 'chemistry' && !forceAllow) || chemIds.length === 0) {
      setChemicalItems([]);
      return;
    }
    const items: WorkbenchChemicalItem[] = chemIds
      .map((cId, idx) => {
        const sub = getChemicalById(cId);
        if (!sub) return null;
        const initAmt = sub.stateAtRoomTemp === 'Solid' ? 10 : 100;
        return {
          instanceId: createInstanceId('chem'),
          chemicalId: sub.id,
          xPercent: Math.min(84, 18 + idx * 14),
          yPercent: 72,
          amount: initAmt,
          capacity: initAmt,
          unit: sub.stateAtRoomTemp === 'Solid' ? 'g' : 'mL',
        };
      })
      .filter((x): x is NonNullable<typeof x> => x !== null);
    setChemicalItems(items);
  };

  // Load recommended kit when experiment changes (unless overridden by workbenchHandoff)
  const applyRecommendedKit = (expId: string) => {
    const kit = getRecommendedKitForExperiment(expId);
    setActiveDepartment(kit.department);
    const items = kit.defaultItems.map((d) => ({ ...d, instanceId: createInstanceId('inst') }));
    setWorkbenchItems(items);
    setConnections(buildDefaultConnections(items, kit.connectionPairs));
    loadChemicalSamples(kit.chemicalIds, kit.department);
    setVesselMixtures([]);
    setTransferHistory([]);
    setActivePourPrompt(null);
    setQuantityModalTarget(null);
    setIncompatibleFeedback(null);
    suppressedPairsRef.current.clear();
    setSelectedInstanceId(items[0]?.instanceId ?? null);
    setSelectedChemicalInstanceId(null);
    setConnectingFromId(null);
    setChemicalCabinetOpen(false);
    setIsRunning(false);
    setSimTimeSec(0);
    setLiveWaterTempC(25);
    setStatusNotice({
      type: 'info',
      text: `Entered ${getLabRoomById(kit.department).name} and placed recommended apparatus on the center island workbench.`,
    });
  };

  const prevExpIdRef = useRef(experiment.id);
  useEffect(() => {
    if (workbenchHandoff) return;
    if (prevExpIdRef.current !== experiment.id) {
      prevExpIdRef.current = experiment.id;
      applyRecommendedKit(experiment.id);
    }
  }, [experiment.id, workbenchHandoff]);

  // Handle handoff from Catalog, Experiment Creator, Campus Lobby, Personal Lab, or Saved Designs
  useEffect(() => {
    if (!workbenchHandoff) return;

    if (workbenchHandoff.savedDesignId) {
      setSessionPersonalLabId(null);
      const found = savedLabDesigns.find((d) => d.id === workbenchHandoff.savedDesignId);
      if (found) {
        setActiveDepartment(found.department);
        onSelectExperiment(found.experimentId);
        prevExpIdRef.current = found.experimentId;
        setWorkbenchItems(found.workbenchItems);
        setChemicalItems(
          (found.chemicalItems ?? []).map((c) => ({
            ...c,
            capacity: c.capacity ?? (c.unit === 'g' ? Math.max(10, c.amount) : Math.max(100, c.amount)),
          }))
        );
        setVesselMixtures(found.vesselMixtures ?? []);
        setTransferHistory(found.transferHistory ?? []);
        setConnections(found.connections);
        setActivePourPrompt(null);
        setQuantityModalTarget(null);
        suppressedPairsRef.current.clear();
        Object.entries(found.parameters).forEach(([k, v]) => onParamChange(k, v));
        setSelectedInstanceId(found.workbenchItems[0]?.instanceId ?? null);
        setStatusNotice({
          type: 'success',
          text: `Restored saved lab design "${found.title}" inside ${getLabRoomById(found.department).shortName}.`,
        });
      }
      setWorkbenchHandoff(null);
      return;
    }

    const targetDept = workbenchHandoff.department ?? activeDepartment;
    setActiveDepartment(targetDept);
    if (workbenchHandoff.experimentId) {
      onSelectExperiment(workbenchHandoff.experimentId);
      prevExpIdRef.current = workbenchHandoff.experimentId;
    }

    if (workbenchHandoff.personalLabId) {
      setSessionPersonalLabId(workbenchHandoff.personalLabId);
      setDrawerScopeAllWings(true);
      const exactItems = workbenchHandoff.workbenchItems ?? [];
      setWorkbenchItems(exactItems);
      setConnections([]);
      setVesselMixtures([]);
      setTransferHistory([]);
      loadChemicalSamples(workbenchHandoff.chemicalIds ?? [], targetDept, true);
      exactItems.forEach((item) => {
        Object.entries(item.config).forEach(([k, v]) => {
          if (typeof v === 'number' && Number.isFinite(v)) {
            onParamChange(k, v);
          }
        });
      });
      setSelectedInstanceId(exactItems[0]?.instanceId ?? null);
      setSelectedChemicalInstanceId(null);
      setStatusNotice({
        type: 'success',
        text: `Entered Personal Laboratory (${exactItems.length} placed apparatus, ${(workbenchHandoff.chemicalIds ?? []).length} reagents). Cross-wing equipment enabled & auto-saved.`,
      });
      setWorkbenchHandoff(null);
      return;
    }

    setSessionPersonalLabId(null);
    setDrawerScopeAllWings(false);

    if (workbenchHandoff.equipmentIds && workbenchHandoff.equipmentIds.length > 0) {
      const placed: WorkbenchItem[] = workbenchHandoff.equipmentIds
        .map((eqId, idx) => {
          const inst = getInstrumentById(eqId);
          if (!inst) return null;
          const defaults: Record<string, number> = {};
          inst.configurations.forEach((c) => {
            defaults[c.key] = c.defaultValue;
          });
          return {
            instanceId: createInstanceId('inst'),
            instrumentId: inst.id,
            xPercent: 22 + (idx % 3) * 26,
            yPercent: 34 + Math.floor(idx / 3) * 26,
            rotationDeg: 0,
            config: defaults,
          };
        })
        .filter((x): x is WorkbenchItem => x !== null);
      setWorkbenchItems(placed);
      setConnections([]);
      loadChemicalSamples(workbenchHandoff.chemicalIds ?? [], targetDept);
      setSelectedInstanceId(placed[0]?.instanceId ?? null);
      setSelectedChemicalInstanceId(null);
      setStatusNotice({
        type: 'success',
        text: `Entered ${getLabRoomById(targetDept).name} with ${placed.length} apparatus${
          workbenchHandoff.chemicalIds?.length
            ? ` and ${workbenchHandoff.chemicalIds.length} chemical samples`
            : ''
        } placed on the workbench.`,
      });
    } else if (workbenchHandoff.experimentId) {
      const kit = getRecommendedKitForExperiment(workbenchHandoff.experimentId);
      if (kit.department === targetDept) {
        applyRecommendedKit(workbenchHandoff.experimentId);
      } else {
        setWorkbenchItems([]);
        setChemicalItems([]);
        setConnections([]);
      }
    }

    setWorkbenchHandoff(null);
  }, [workbenchHandoff]);

  // Report live bench items & connections up to VirtualLabPage
  useEffect(() => {
    onWorkbenchStateChange?.(workbenchItems, connections);
  }, [workbenchItems, connections, onWorkbenchStateChange]);

  // Auto-persist changes back to active Personal Lab workspace in localStorage
  useEffect(() => {
    if (!sessionPersonalLabId || workbenchHandoff) return;
    updatePersonalLabWorkspace(sessionPersonalLabId, {
      workbenchItems,
      chemicalIds: Array.from(new Set(chemicalItems.map((c) => c.chemicalId))),
      activeExperimentId: experiment.id,
      department: room.id,
    });
  }, [
    sessionPersonalLabId,
    workbenchHandoff,
    workbenchItems,
    chemicalItems,
    experiment.id,
    room.id,
    updatePersonalLabWorkspace,
  ]);

  // Sync top experiment parameter sliders back onto placed instrument configurations
  useEffect(() => {
    setWorkbenchItems((prev) => {
      let changed = false;
      const next = prev.map((w) => {
        let itemChanged = false;
        const nextCfg = { ...w.config };
        for (const k of Object.keys(nextCfg)) {
          const pVal = params[k];
          if (typeof pVal === 'number' && Number.isFinite(pVal) && Math.abs(nextCfg[k] - pVal) > 1e-6) {
            nextCfg[k] = pVal;
            itemChanged = true;
          }
        }
        if (itemChanged) {
          changed = true;
          return { ...w, config: nextCfg };
        }
        return w;
      });
      return changed ? next : prev;
    });
  }, [params]);

  // Execute imperative commands triggered from VirtualLabPage Readiness Bar
  const lastBenchCmdIdRef = useRef<number>(0);
  useEffect(() => {
    if (!benchCommand || benchCommand.id === lastBenchCmdIdRef.current) return;
    lastBenchCmdIdRef.current = benchCommand.id;

    if (benchCommand.type === 'add-missing-kit') {
      const validation = validateWorkbenchSetup({
        experimentId: experiment.id,
        params,
        workbenchItems,
        connections,
      });
      const kit = getRecommendedKitForExperiment(experiment.id);
      const idsToAdd =
        validation.missingEquipmentIds.length > 0
          ? validation.missingEquipmentIds
          : kit.defaultItems.map((d) => d.instrumentId);

      const newItems: WorkbenchItem[] = [];
      const existingInstIds = new Set(workbenchItems.map((w) => w.instrumentId));
      idsToAdd.forEach((id, idx) => {
        if (existingInstIds.has(id)) return;
        const inst = getInstrumentById(id);
        if (!inst) return;
        const kitTemplate = kit.defaultItems.find((d) => d.instrumentId === id);
        const cfg: Record<string, number> = {};
        inst.configurations.forEach((c) => {
          cfg[c.key] = params[c.key] ?? c.defaultValue;
        });
        const totalIdx = workbenchItems.length + idx;
        newItems.push({
          instanceId: createInstanceId('inst'),
          instrumentId: inst.id,
          xPercent: kitTemplate?.xPercent ?? Math.min(84, 20 + (totalIdx % 4) * 19),
          yPercent: kitTemplate?.yPercent ?? Math.min(78, 34 + Math.floor(totalIdx / 4) * 22),
          rotationDeg: 0,
          config: cfg,
        });
        existingInstIds.add(id);
      });

      const mergedItems = [...workbenchItems, ...newItems];
      const nextConns = [...connections];
      for (let i = 0; i < mergedItems.length; i++) {
        for (let j = i + 1; j < mergedItems.length; j++) {
          const a = mergedItems[i];
          const b = mergedItems[j];
          const already = nextConns.some(
            (c) =>
              (c.fromInstanceId === a.instanceId && c.toInstanceId === b.instanceId) ||
              (c.fromInstanceId === b.instanceId && c.toInstanceId === a.instanceId)
          );
          if (already) continue;
          const aInst = getInstrumentById(a.instrumentId);
          const bInst = getInstrumentById(b.instrumentId);
          if (!aInst || !bInst) continue;
          const check = checkInstrumentConnection(aInst, bInst);
          if (check.valid) {
            nextConns.push({
              id: `conn-auto-${Date.now()}-${i}-${j}`,
              fromInstanceId: a.instanceId,
              toInstanceId: b.instanceId,
              connectionType: check.connectionType,
              valid: true,
              note: check.note,
            });
          }
        }
      }
      setWorkbenchItems(mergedItems);
      setConnections(nextConns);
      if (newItems[0]) setSelectedInstanceId(newItems[0].instanceId);
      setStatusNotice({
        type: 'success',
        text: `Added ${newItems.length} missing apparatus item(s) and wired compatible couplings for ${experiment.shortTitle}.`,
      });
    } else if (benchCommand.type === 'auto-wire') {
      const nextConns = [...connections];
      let addedCount = 0;
      for (let i = 0; i < workbenchItems.length; i++) {
        for (let j = i + 1; j < workbenchItems.length; j++) {
          const a = workbenchItems[i];
          const b = workbenchItems[j];
          const already = nextConns.some(
            (c) =>
              (c.fromInstanceId === a.instanceId && c.toInstanceId === b.instanceId) ||
              (c.fromInstanceId === b.instanceId && c.toInstanceId === a.instanceId)
          );
          if (already) continue;
          const aInst = getInstrumentById(a.instrumentId);
          const bInst = getInstrumentById(b.instrumentId);
          if (!aInst || !bInst) continue;
          const check = checkInstrumentConnection(aInst, bInst);
          if (check.valid) {
            nextConns.push({
              id: `conn-auto-${Date.now()}-${i}-${j}`,
              fromInstanceId: a.instanceId,
              toInstanceId: b.instanceId,
              connectionType: check.connectionType,
              valid: true,
              note: check.note,
            });
            addedCount++;
          }
        }
      }
      setConnections(nextConns);
      setStatusNotice({
        type: addedCount > 0 ? 'success' : 'info',
        text:
          addedCount > 0
            ? `Auto-wired ${addedCount} valid apparatus connection(s) on the workbench.`
            : 'All compatible placed instruments are already coupled.',
      });
    }
  }, [benchCommand, experiment.id, experiment.shortTitle, params, workbenchItems, connections]);

  const chemistryEnabled =
    room.id === 'chemistry' || isPersonalLabSession || chemicalItems.length > 0;

  // Thermal & harmonic simulation tick
  const targetBoilingC = useMemo(
    () => interpolateWaterBoilingPoint(params.pressure ?? 101.325),
    [params.pressure]
  );

  const heaterPowerW = useMemo(() => {
    const heaterItem = workbenchItems.find(
      (w) => getInstrumentById(w.instrumentId)?.visualKind === 'heater'
    );
    return heaterItem?.config.power ?? 500;
  }, [workbenchItems]);

  const chemOutcome = useMemo(() => {
    if (!chemistryEnabled) return null;
    const heatableIds = new Set(['chem-beaker', 'chem-test-tubes', 'chem-conical-flask', 'chem-crucible']);
    const vessels = workbenchItems.filter((w) => heatableIds.has(w.instrumentId));
    const heaters = workbenchItems.filter(
      (w) => getInstrumentById(w.instrumentId)?.visualKind === 'heater'
    );
    const condensers = workbenchItems.filter((w) => w.instrumentId === 'chem-distillation');

    const heaterPresent = heaters.length > 0;
    const heaterNearVessel =
      heaterPresent &&
      vessels.some((v) =>
        heaters.some((h) => {
          const dist = Math.hypot(h.xPercent - v.xPercent, h.yPercent - v.yPercent);
          const linked = connections.some(
            (c) =>
              (c.fromInstanceId === h.instanceId && c.toInstanceId === v.instanceId) ||
              (c.fromInstanceId === v.instanceId && c.toInstanceId === h.instanceId)
          );
          return dist < 34 || linked;
        })
      );

    const condenserLinked =
      condensers.length > 0 &&
      vessels.some((v) =>
        condensers.some((cd) => {
          const dist = Math.hypot(cd.xPercent - v.xPercent, cd.yPercent - v.yPercent);
          const linked = connections.some(
            (c) =>
              (c.fromInstanceId === cd.instanceId && c.toInstanceId === v.instanceId) ||
              (c.fromInstanceId === v.instanceId && c.toInstanceId === cd.instanceId)
          );
          return dist < 38 || linked;
        })
      );

    const reagentAmountsMl: Record<string, number> = {};
    const pouredSubstances = new Set<string>();
    vesselMixtures.forEach((m) => {
      if (m.amountMlOrG > 0) {
        reagentAmountsMl[m.chemicalId] = (reagentAmountsMl[m.chemicalId] ?? 0) + m.amountMlOrG;
        pouredSubstances.add(m.chemicalId);
      }
    });

    return evaluateBenchChemistryInteraction({
      vesselInstrumentIds: vessels.map((v) => v.instrumentId),
      heaterPresent,
      heaterNearVessel,
      heaterPowerW,
      condenserLinked,
      substanceIds: Array.from(pouredSubstances),
      reagentAmountsMl,
      pressureKpa: params.pressure ?? 101.325,
      liveTempC: liveWaterTempC,
      isRunning,
    });
  }, [chemistryEnabled, workbenchItems, connections, vesselMixtures, params.pressure, liveWaterTempC, isRunning, heaterPowerW]);

  // Persist active Chemistry bench & sync derived parameters to VirtualLabPage
  useEffect(() => {
    if (!chemistryEnabled) return;
    setActiveChemistryBench({
      experimentId: experiment.id,
      workbenchItems,
      chemicalItems,
      vesselMixtures,
      connections,
      transferHistory,
      updatedAt: new Date().toISOString(),
    });
    if (onChemistryBenchSync) {
      onChemistryBenchSync(
        deriveExperimentSyncFromWorkbench({
          experimentId: experiment.id,
          workbenchItems,
          vesselMixtures,
          connections,
          currentParams: params,
        })
      );
    }
  }, [chemistryEnabled, experiment.id, workbenchItems, chemicalItems, vesselMixtures, connections, transferHistory]);

  // Cleanup animation frame on unmount
  useEffect(() => {
    return () => {
      if (pourRafRef.current !== null) {
        cancelAnimationFrame(pourRafRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (chemOutcome?.blocked && isRunning) {
      setIsRunning(false);
      setStatusNotice({
        type: 'warning',
        text: chemOutcome.blockReason || chemOutcome.title,
      });
    }
  }, [chemOutcome, isRunning]);

  useEffect(() => {
    if (!isRunning) return;
    let rafId = 0;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min(0.08, (now - last) / 1000) * simSpeed;
      last = now;
      setSimTimeSec((prev) => prev + dt);

      if (experiment.id === 'boiling-point' || room.id === 'chemistry') {
        const hasHeater = workbenchItems.some(
          (w) => getInstrumentById(w.instrumentId)?.visualKind === 'heater'
        );
        const rate = hasHeater ? heaterPowerW / 104.6 : 0;
        if (rate > 0) {
          setLiveWaterTempC((prev) => Math.min(targetBoilingC, prev + rate * dt));
        }
      }

      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning, simSpeed, experiment.id, room.id, workbenchItems, heaterPowerW, targetBoilingC]);

  useEffect(() => {
    setLiveWaterTempC((prev) => Math.min(prev, targetBoilingC));
  }, [targetBoilingC]);

  // Switching physical room keeps rooms strictly isolated (clears chemicals if leaving Chemistry)
  const handleSelectDepartment = (dept: LabDepartmentId) => {
    if (dept !== activeDepartment) {
      setWorkbenchItems([]);
      setConnections([]);
      setChemicalItems([]);
      setVesselMixtures([]);
      setSelectedInstanceId(null);
      setSelectedChemicalInstanceId(null);
      setIsRunning(false);
      setSimTimeSec(0);
    }
    setActiveDepartment(dept);
    setActiveRackId(null);
    setDrawerOpen(false);
    setChemicalCabinetOpen(false);
    setActiveStationInfo(null);
    setConnectingFromId(null);
    const nextRoom = getLabRoomById(dept);
    setStatusNotice({
      type: 'info',
      text: `Walked into ${nextRoom.name} (${nextRoom.wingCode}). Click any wall rack, cabinet, or safety station to load instruments.`,
    });
  };

  const addInstrumentToBench = (
    inst: LabInstrument,
    xPercent = 24 + (workbenchItems.length % 4) * 18,
    yPercent = 36 + Math.floor(workbenchItems.length / 4) * 22
  ) => {
    const warnings = checkInstrumentPlacementCompatibility(inst, workbenchItems);

    const clampedX = Math.min(86, Math.max(14, xPercent));
    const clampedY = Math.min(80, Math.max(20, yPercent));
    const defaults: Record<string, number> = {};
    inst.configurations.forEach((c) => {
      defaults[c.key] = params[c.key] ?? c.defaultValue;
    });

    const newItem: WorkbenchItem = {
      instanceId: createInstanceId('inst'),
      instrumentId: inst.id,
      xPercent: clampedX,
      yPercent: clampedY,
      rotationDeg: 0,
      config: defaults,
    };

    setWorkbenchItems((prev) => [...prev, newItem]);
    setSelectedInstanceId(newItem.instanceId);
    setSelectedChemicalInstanceId(null);
    recordRecentEquipment(inst.id);
    if (warnings.length > 0) {
      setStatusNotice({
        type: 'warning',
        text: `Placed ${inst.name}. Advisory: ${warnings[0].message}`,
      });
    } else if (inst.department !== room.id) {
      setStatusNotice({
        type: 'info',
        text: `Placed cross-wing apparatus ${inst.name} (${getLabRoomById(inst.department).shortName}) onto workbench.`,
      });
    } else {
      setStatusNotice({
        type: 'success',
        text: `Placed ${inst.name} on the ${room.shortName} island workbench.`,
      });
    }
  };

  const addChemicalToBench = (chem: ChemicalSubstance) => {
    if (!chemistryEnabled) {
      setStatusNotice({
        type: 'warning',
        text: 'Switch to Chemistry Lab or open a Personal Lab to place reagent bottles here.',
      });
      return;
    }
    const offset = chemicalItems.length;
    const initAmt = chem.stateAtRoomTemp === 'Solid' ? 10 : 100;
    const item: WorkbenchChemicalItem = {
      instanceId: createInstanceId('chem'),
      chemicalId: chem.id,
      xPercent: Math.min(86, 18 + (offset % 5) * 14),
      yPercent: 74,
      amount: initAmt,
      capacity: initAmt,
      unit: chem.stateAtRoomTemp === 'Solid' ? 'g' : 'mL',
    };
    setChemicalItems((prev) => [...prev, item]);
    setSelectedChemicalInstanceId(item.instanceId);
    setSelectedInstanceId(null);
    setStatusNotice({
      type: 'success',
      text: `Placed ${getBottleDisplayLabel(item, chem)} (${chem.symbol}) on the bench. Drag it beside or over a container to pour.`,
    });
  };

  const handleBenchDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const instrumentId = e.dataTransfer.getData('text/instrument-id');
    if (!instrumentId || !benchRef.current) return;
    const inst = getInstrumentById(instrumentId);
    if (!inst) return;
    const rect = benchRef.current.getBoundingClientRect();
    const xPct = ((e.clientX - rect.left) / rect.width) * 100;
    const yPct = ((e.clientY - rect.top) / rect.height) * 100;
    addInstrumentToBench(inst, xPct, yPct);
  };

  const numberedLabels = useMemo(
    () => buildNumberedInstrumentLabels(workbenchItems),
    [workbenchItems]
  );

  // Live hover proximity feedback while dragging a chemical bottle
  const activeDragProximity = useMemo(() => {
    if (!chemistryEnabled || !draggingId || draggingId.kind !== 'chem') return null;
    const bottle = chemicalItems.find((c) => c.instanceId === draggingId.id);
    if (!bottle) return null;
    const rect = benchRef.current?.getBoundingClientRect();
    return evaluateBottleProximity({
      sourceBottle: bottle,
      workbenchItems,
      otherBottles: chemicalItems,
      vesselMixtures,
      benchWidthPx: rect?.width ?? 760,
      benchHeightPx: rect?.height ?? 440,
    });
  }, [chemistryEnabled, draggingId, chemicalItems, workbenchItems, vesselMixtures]);

  const evaluateAndTriggerProximity = (
    movedKind: 'inst' | 'chem',
    movedId: string,
    latestChemItems: WorkbenchChemicalItem[] = chemicalItems,
    latestWorkbenchItems: WorkbenchItem[] = workbenchItems
  ) => {
    if (!chemistryEnabled) return;
    const rect = benchRef.current?.getBoundingClientRect();
    const benchW = rect?.width ?? 760;
    const benchH = rect?.height ?? 440;

    if (movedKind === 'chem') {
      const bottle = latestChemItems.find((c) => c.instanceId === movedId);
      if (!bottle || lockedObjectIds.has(bottle.instanceId)) return;

      const evalRes = evaluateBottleProximity({
        sourceBottle: bottle,
        workbenchItems: latestWorkbenchItems,
        otherBottles: latestChemItems,
        vesselMixtures,
        benchWidthPx: benchW,
        benchHeightPx: benchH,
      });

      // Clear hysteresis suppression for pairs that have moved sufficiently far apart
      for (const key of Array.from(suppressedPairsRef.current)) {
        if (key.startsWith(`${bottle.instanceId}::`)) {
          const dist = evalRes.allDistancesByPairKey[key];
          if (dist === undefined || dist > SEPARATION_HYSTERESIS_PX) {
            suppressedPairsRef.current.delete(key);
          }
        }
      }

      const unsuppressed = evalRes.compatibleTargets.filter(
        (t) =>
          !suppressedPairsRef.current.has(makePairKey(bottle.instanceId, t.targetInstanceId)) &&
          !lockedObjectIds.has(t.targetInstanceId)
      );

      if (unsuppressed.length > 0) {
        setIncompatibleFeedback(null);
        setActivePourPrompt({
          sourceInstanceId: bottle.instanceId,
          candidates: unsuppressed,
          selectedTargetId: unsuppressed.length === 1 ? unsuppressed[0].targetInstanceId : null,
          anchorXPercent: bottle.xPercent,
          anchorYPercent: bottle.yPercent,
        });
      } else {
        // Close prompt if bottle moved away from currently prompted source
        setActivePourPrompt((prev) =>
          prev?.sourceInstanceId === bottle.instanceId ? null : prev
        );
        if (evalRes.compatibleTargets.length === 0 && evalRes.incompatibleNearest) {
          setIncompatibleFeedback({
            message:
              evalRes.incompatibleNearest.incompatibilityReason ||
              'Target cannot receive poured chemicals.',
            xPercent: bottle.xPercent,
            yPercent: bottle.yPercent,
          });
        } else {
          setIncompatibleFeedback(null);
        }
      }
      return;
    }

    // If a receiving container itself was moved near a bottle, check hysteresis & nearby bottles
    for (const bottle of latestChemItems) {
      if (lockedObjectIds.has(bottle.instanceId)) continue;
      const evalRes = evaluateBottleProximity({
        sourceBottle: bottle,
        workbenchItems: latestWorkbenchItems,
        otherBottles: latestChemItems,
        vesselMixtures,
        benchWidthPx: benchW,
        benchHeightPx: benchH,
      });
      const pairKey = makePairKey(bottle.instanceId, movedId);
      const dist = evalRes.allDistancesByPairKey[pairKey];
      if (dist !== undefined && dist > SEPARATION_HYSTERESIS_PX) {
        suppressedPairsRef.current.delete(pairKey);
      }
      const match = evalRes.compatibleTargets.find(
        (t) =>
          t.targetInstanceId === movedId &&
          !suppressedPairsRef.current.has(pairKey) &&
          !lockedObjectIds.has(movedId)
      );
      if (match) {
        const unsuppressed = evalRes.compatibleTargets.filter(
          (t) => !suppressedPairsRef.current.has(makePairKey(bottle.instanceId, t.targetInstanceId))
        );
        setIncompatibleFeedback(null);
        setActivePourPrompt({
          sourceInstanceId: bottle.instanceId,
          candidates: unsuppressed,
          selectedTargetId: unsuppressed.length === 1 ? unsuppressed[0].targetInstanceId : null,
          anchorXPercent: bottle.xPercent,
          anchorYPercent: bottle.yPercent,
        });
        break;
      }
    }
  };

  const handleObjectPointerDown = (
    e: React.PointerEvent<HTMLDivElement>,
    kind: 'inst' | 'chem',
    id: string
  ) => {
    e.stopPropagation();
    if (lockedObjectIds.has(id)) {
      setStatusNotice({
        type: 'warning',
        text: 'Transfer animation in progress. Wait until pouring completes before moving locked containers.',
      });
      return;
    }
    if (kind === 'inst' && connectingFromId) {
      const item = workbenchItems.find((w) => w.instanceId === id);
      if (item) handleItemClick(item);
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Synthetic pointer events in tests may not support capture
    }

    dragMetaRef.current = {
      kind,
      id,
      pointerId: e.pointerId,
      startClientX: e.clientX,
      startClientY: e.clientY,
      didMove: false,
    };
    setDraggingId({ kind, id });
    setIncompatibleFeedback(null);

    if (kind === 'inst') {
      setSelectedInstanceId(id);
      setSelectedChemicalInstanceId(null);
    } else {
      setSelectedChemicalInstanceId(id);
      setSelectedInstanceId(null);
      setActivePourPrompt(null);
    }
  };

  const handleObjectPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const meta = dragMetaRef.current;
    if (!meta || !benchRef.current) return;
    if (e.pointerId !== meta.pointerId && e.pointerId !== 0) return;

    const dx = e.clientX - meta.startClientX;
    const dy = e.clientY - meta.startClientY;
    if (!meta.didMove && Math.hypot(dx, dy) >= 4) {
      meta.didMove = true;
    }
    if (!meta.didMove) return;

    const rect = benchRef.current.getBoundingClientRect();
    const xPct = Math.min(90, Math.max(10, ((e.clientX - rect.left) / rect.width) * 100));
    const yPct = Math.min(84, Math.max(18, ((e.clientY - rect.top) / rect.height) * 100));
    meta.latestXPct = xPct;
    meta.latestYPct = yPct;

    if (meta.kind === 'inst') {
      setWorkbenchItems((prev) =>
        prev.map((item) =>
          item.instanceId === meta.id ? { ...item, xPercent: xPct, yPercent: yPct } : item
        )
      );
    } else {
      setChemicalItems((prev) =>
        prev.map((item) =>
          item.instanceId === meta.id ? { ...item, xPercent: xPct, yPercent: yPct } : item
        )
      );
    }
  };

  const handleObjectPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    const meta = dragMetaRef.current;
    if (!meta) return;
    try {
      if (e.currentTarget.hasPointerCapture(e.pointerId)) {
        e.currentTarget.releasePointerCapture(e.pointerId);
      }
    } catch {
      // Ignore synthetic event cleanup errors
    }

    const finishedKind = meta.kind;
    const finishedId = meta.id;
    const wasMoved = meta.didMove;
    let finalXPct = meta.latestXPct;
    let finalYPct = meta.latestYPct;

    if (wasMoved && benchRef.current && (finalXPct === undefined || finalYPct === undefined)) {
      const rect = benchRef.current.getBoundingClientRect();
      finalXPct = Math.min(90, Math.max(10, ((e.clientX - rect.left) / rect.width) * 100));
      finalYPct = Math.min(84, Math.max(18, ((e.clientY - rect.top) / rect.height) * 100));
    }

    dragMetaRef.current = null;
    setDraggingId(null);

    if (wasMoved) {
      let nextChemItems = chemicalItems;
      let nextWorkbenchItems = workbenchItems;
      if (finalXPct !== undefined && finalYPct !== undefined) {
        if (finishedKind === 'chem') {
          nextChemItems = chemicalItems.map((item) =>
            item.instanceId === finishedId
              ? { ...item, xPercent: finalXPct!, yPercent: finalYPct! }
              : item
          );
          setChemicalItems(nextChemItems);
        } else {
          nextWorkbenchItems = workbenchItems.map((item) =>
            item.instanceId === finishedId
              ? { ...item, xPercent: finalXPct!, yPercent: finalYPct! }
              : item
          );
          setWorkbenchItems(nextWorkbenchItems);
        }
      }
      evaluateAndTriggerProximity(finishedKind, finishedId, nextChemItems, nextWorkbenchItems);
    } else if (finishedKind === 'inst') {
      const item = workbenchItems.find((w) => w.instanceId === finishedId);
      if (item) handleItemClick(item);
    }
  };

  const handleItemClick = (item: WorkbenchItem) => {
    setSelectedChemicalInstanceId(null);
    if (connectingFromId) {
      if (connectingFromId === item.instanceId) {
        setConnectingFromId(null);
        return;
      }
      const fromItem = workbenchItems.find((w) => w.instanceId === connectingFromId);
      const fromInst = fromItem ? getInstrumentById(fromItem.instrumentId) : undefined;
      const toInst = getInstrumentById(item.instrumentId);
      if (fromItem && fromInst && toInst) {
        const already = connections.some(
          (c) =>
            (c.fromInstanceId === fromItem.instanceId && c.toInstanceId === item.instanceId) ||
            (c.fromInstanceId === item.instanceId && c.toInstanceId === fromItem.instanceId)
        );
        if (already) {
          setStatusNotice({
            type: 'info',
            text: `${fromInst.name} and ${toInst.name} are already connected.`,
          });
          setConnectingFromId(null);
          return;
        }
        const check = checkInstrumentConnection(fromInst, toInst);
        if (!check.valid) {
          setStatusNotice({ type: 'warning', text: check.note });
          setConnectingFromId(null);
          return;
        }
        setConnections((prev) => [
          ...prev,
          {
            id: `conn-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
            fromInstanceId: fromItem.instanceId,
            toInstanceId: item.instanceId,
            connectionType: check.connectionType,
            valid: true,
            note: check.note,
          },
        ]);
        setStatusNotice({ type: 'success', text: check.note });
      }
      setConnectingFromId(null);
      setSelectedInstanceId(item.instanceId);
      return;
    }

    setSelectedInstanceId(item.instanceId);
  };

  const nudgeSelected = (dx: number, dy: number) => {
    if (selectedInstanceId && !lockedObjectIds.has(selectedInstanceId)) {
      const updated = workbenchItems.map((w) =>
        w.instanceId === selectedInstanceId
          ? {
              ...w,
              xPercent: Math.min(90, Math.max(10, w.xPercent + dx)),
              yPercent: Math.min(84, Math.max(18, w.yPercent + dy)),
            }
          : w
      );
      setWorkbenchItems(updated);
      evaluateAndTriggerProximity('inst', selectedInstanceId, chemicalItems, updated);
    } else if (selectedChemicalInstanceId && !lockedObjectIds.has(selectedChemicalInstanceId)) {
      const updated = chemicalItems.map((c) =>
        c.instanceId === selectedChemicalInstanceId
          ? {
              ...c,
              xPercent: Math.min(90, Math.max(10, c.xPercent + dx)),
              yPercent: Math.min(84, Math.max(18, c.yPercent + dy)),
            }
          : c
      );
      setChemicalItems(updated);
      evaluateAndTriggerProximity('chem', selectedChemicalInstanceId, updated, workbenchItems);
    }
  };

  const rotateSelected = () => {
    if (!selectedInstanceId || lockedObjectIds.has(selectedInstanceId)) return;
    setWorkbenchItems((prev) =>
      prev.map((w) =>
        w.instanceId === selectedInstanceId
          ? { ...w, rotationDeg: (w.rotationDeg + 15) % 360 }
          : w
      )
    );
  };

  const removeSelected = () => {
    if (selectedInstanceId && !lockedObjectIds.has(selectedInstanceId)) {
      setWorkbenchItems((prev) => prev.filter((w) => w.instanceId !== selectedInstanceId));
      setVesselMixtures((prev) => prev.filter((m) => m.vesselInstanceId !== selectedInstanceId));
      setConnections((prev) =>
        prev.filter(
          (c) => c.fromInstanceId !== selectedInstanceId && c.toInstanceId !== selectedInstanceId
        )
      );
      setSelectedInstanceId(null);
      setActivePourPrompt(null);
    } else if (selectedChemicalInstanceId && !lockedObjectIds.has(selectedChemicalInstanceId)) {
      setChemicalItems((prev) => prev.filter((c) => c.instanceId !== selectedChemicalInstanceId));
      setSelectedChemicalInstanceId(null);
      setActivePourPrompt(null);
    }
  };

  const recordTransferHistoryEntry = (entry: Omit<TransferHistoryEntry, 'id' | 'sequence' | 'timestamp'>) => {
    setTransferHistory((prev) => [
      {
        ...entry,
        id: `tx-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
        sequence: prev.length + 1,
        timestamp: new Date().toISOString(),
      },
      ...prev,
    ]);
  };

  const isTargetHeated = (vesselInstanceId: string) => {
    const vessel = workbenchItems.find((w) => w.instanceId === vesselInstanceId);
    if (!vessel) return false;
    const heaters = workbenchItems.filter(
      (w) => getInstrumentById(w.instrumentId)?.visualKind === 'heater'
    );
    return heaters.some((h) => {
      const dist = Math.hypot(h.xPercent - vessel.xPercent, h.yPercent - vessel.yPercent);
      const linked = connections.some(
        (c) =>
          (c.fromInstanceId === h.instanceId && c.toInstanceId === vessel.instanceId) ||
          (c.fromInstanceId === vessel.instanceId && c.toInstanceId === h.instanceId)
      );
      return dist < 34 || linked;
    });
  };

  const executeAnimatedPour = (
    sourceId: string,
    targetId: string,
    requestedAmount: number,
    requestedUnit: string
  ) => {
    const sourceBottle = chemicalItems.find((c) => c.instanceId === sourceId);
    const targetItem = workbenchItems.find((w) => w.instanceId === targetId);
    if (!sourceBottle || !targetItem) return;

    const substance = getChemicalById(sourceBottle.chemicalId);
    const sourceName = getBottleDisplayLabel(sourceBottle, substance);
    const targetName = numberedLabels[targetItem.instanceId] ?? 'Vessel';

    const validation = validateTransferAttempt({
      sourceBottle,
      targetItem,
      requestedAmount,
      requestedUnit,
      vesselMixtures,
      lockedIds: lockedObjectIds,
      heaterNearTarget: isTargetHeated(targetItem.instanceId),
      liveTempC: liveWaterTempC,
      isSimRunning: isRunning,
    });

    if (!validation.valid) {
      recordTransferHistoryEntry({
        sourceInstanceId: sourceBottle.instanceId,
        sourceName,
        sourceChemicalId: sourceBottle.chemicalId,
        sourceSymbol: substance?.symbol ?? sourceBottle.chemicalId,
        destinationInstanceId: targetItem.instanceId,
        destinationName: targetName,
        requestedAmount,
        requestedUnit,
        transferredAmountMlOrG: 0,
        normalizedUnit: sourceBottle.unit,
        sourceAfter: sourceBottle.amount,
        destinationAfter: getVesselCurrentAmount(targetItem.instanceId, vesselMixtures),
        status: 'blocked',
        reason: validation.errorMessage,
      });
      setStatusNotice({
        type: 'warning',
        text: validation.errorMessage || 'Transfer blocked.',
      });
      return;
    }

    // Close modal & prompt; lock objects and launch 10-step pouring animation
    setQuantityModalTarget(null);
    setActivePourPrompt(null);

    const startX = sourceBottle.xPercent;
    const startY = sourceBottle.yPercent;
    const destX = targetItem.xPercent;
    const destY = targetItem.yPercent;
    // Place bottle slightly left or right above rim depending on bench room
    const pourFromLeft = destX > 26;
    const hoverX = pourFromLeft ? Math.max(12, destX - 11) : Math.min(88, destX + 11);
    const hoverY = Math.max(20, destY - 12);
    const tiltTargetDeg = pourFromLeft ? 54 : -54;
    const destMouthX = destX;
    const destMouthY = Math.max(16, destY - 5);

    const bottleCap = sourceBottle.capacity ?? Math.max(sourceBottle.amount, sourceBottle.unit === 'g' ? 10 : 100);
    const startDestAmt = getVesselCurrentAmount(targetItem.instanceId, vesselMixtures);
    const destCapacity = getContainerCapacity(targetItem);

    const commitTransfer = () => {
      const qty = validation.normalizedAmount;
      setChemicalItems((prev) =>
        prev.map((c) =>
          c.instanceId === sourceId
            ? {
                ...c,
                amount: validation.sourceAfter,
                xPercent: hoverX,
                yPercent: Math.min(82, destY + 4),
              }
            : c
        )
      );
      setVesselMixtures((prev) => {
        const idx = prev.findIndex(
          (m) => m.vesselInstanceId === targetId && m.chemicalId === sourceBottle.chemicalId
        );
        if (idx >= 0) {
          return prev.map((m, i) =>
            i === idx
              ? { ...m, amountMlOrG: Number((m.amountMlOrG + qty).toFixed(2)) }
              : m
          );
        }
        return [
          ...prev,
          {
            vesselInstanceId: targetId,
            chemicalId: sourceBottle.chemicalId,
            amountMlOrG: qty,
            unit: sourceBottle.unit,
          },
        ];
      });
      suppressedPairsRef.current.add(makePairKey(sourceId, targetId));
      recordTransferHistoryEntry({
        sourceInstanceId: sourceId,
        sourceName,
        sourceChemicalId: sourceBottle.chemicalId,
        sourceSymbol: substance?.symbol ?? sourceBottle.chemicalId,
        destinationInstanceId: targetId,
        destinationName: targetName,
        requestedAmount,
        requestedUnit,
        transferredAmountMlOrG: qty,
        normalizedUnit: sourceBottle.unit,
        sourceAfter: validation.sourceAfter,
        destinationAfter: validation.destAfter,
        status: 'success',
      });
      setPourAnimation(null);
      setStatusNotice({
        type: 'success',
        text: `Transferred ${qty} ${sourceBottle.unit} of ${getShortMaterialName(substance!)} into ${targetName}. (${targetName}: ${validation.destAfter}/${destCapacity} ${sourceBottle.unit})`,
      });
    };

    if (reducedMotion) {
      setPourAnimation({
        sourceId,
        targetId,
        phase: 'pouring',
        progress01: 0.7,
        bottleX: hoverX,
        bottleY: hoverY,
        bottleTiltDeg: tiltTargetDeg,
        spoutX: pourFromLeft ? hoverX + 5 : hoverX - 5,
        spoutY: hoverY + 2,
        destMouthX,
        destMouthY,
        colorHex: substance?.bottleColor ?? '#38BDF8',
        isSolid: substance?.stateAtRoomTemp === 'Solid',
        startBottleAmt: sourceBottle.amount,
        endBottleAmt: validation.sourceAfter,
        bottleCap,
        startDestAmt,
        endDestAmt: validation.destAfter,
        destCapacity,
      });
      window.setTimeout(commitTransfer, 160);
      return;
    }

    const tApproach = 260;
    const tTilt = 220;
    const tPour = 920;
    const tReturn = 260;
    const totalDur = tApproach + tTilt + tPour + tReturn;
    const startTs = performance.now();

    const step = (now: number) => {
      const elapsed = now - startTs;
      if (elapsed >= totalDur) {
        commitTransfer();
        return;
      }

      if (elapsed < tApproach) {
        const u = elapsed / tApproach;
        const ease = 1 - Math.pow(1 - u, 3);
        const bx = startX + (hoverX - startX) * ease;
        const by = startY + (hoverY - startY) * ease;
        setPourAnimation({
          sourceId,
          targetId,
          phase: 'approaching',
          progress01: 0,
          bottleX: bx,
          bottleY: by,
          bottleTiltDeg: 0,
          spoutX: bx,
          spoutY: by,
          destMouthX,
          destMouthY,
          colorHex: substance?.bottleColor ?? '#38BDF8',
          isSolid: substance?.stateAtRoomTemp === 'Solid',
          startBottleAmt: sourceBottle.amount,
          endBottleAmt: validation.sourceAfter,
          bottleCap,
          startDestAmt,
          endDestAmt: validation.destAfter,
          destCapacity,
        });
      } else if (elapsed < tApproach + tTilt) {
        const u = (elapsed - tApproach) / tTilt;
        setPourAnimation({
          sourceId,
          targetId,
          phase: 'tilting',
          progress01: 0,
          bottleX: hoverX,
          bottleY: hoverY,
          bottleTiltDeg: tiltTargetDeg * u,
          spoutX: pourFromLeft ? hoverX + 4.5 * u : hoverX - 4.5 * u,
          spoutY: hoverY + 1.5 * u,
          destMouthX,
          destMouthY,
          colorHex: substance?.bottleColor ?? '#38BDF8',
          isSolid: substance?.stateAtRoomTemp === 'Solid',
          startBottleAmt: sourceBottle.amount,
          endBottleAmt: validation.sourceAfter,
          bottleCap,
          startDestAmt,
          endDestAmt: validation.destAfter,
          destCapacity,
        });
      } else if (elapsed < tApproach + tTilt + tPour) {
        const u = (elapsed - tApproach - tTilt) / tPour;
        setPourAnimation({
          sourceId,
          targetId,
          phase: 'pouring',
          progress01: u,
          bottleX: hoverX,
          bottleY: hoverY,
          bottleTiltDeg: tiltTargetDeg,
          spoutX: pourFromLeft ? hoverX + 4.6 : hoverX - 4.6,
          spoutY: hoverY + 1.6,
          destMouthX,
          destMouthY,
          colorHex: substance?.bottleColor ?? '#38BDF8',
          isSolid: substance?.stateAtRoomTemp === 'Solid',
          startBottleAmt: sourceBottle.amount,
          endBottleAmt: validation.sourceAfter,
          bottleCap,
          startDestAmt,
          endDestAmt: validation.destAfter,
          destCapacity,
        });
      } else {
        const u = (elapsed - tApproach - tTilt - tPour) / tReturn;
        const settleY = Math.min(82, destY + 4);
        setPourAnimation({
          sourceId,
          targetId,
          phase: 'returning',
          progress01: 1,
          bottleX: hoverX,
          bottleY: hoverY + (settleY - hoverY) * u,
          bottleTiltDeg: tiltTargetDeg * (1 - u),
          spoutX: hoverX,
          spoutY: hoverY,
          destMouthX,
          destMouthY,
          colorHex: substance?.bottleColor ?? '#38BDF8',
          isSolid: substance?.stateAtRoomTemp === 'Solid',
          startBottleAmt: sourceBottle.amount,
          endBottleAmt: validation.sourceAfter,
          bottleCap,
          startDestAmt,
          endDestAmt: validation.destAfter,
          destCapacity,
        });
      }

      pourRafRef.current = requestAnimationFrame(step);
    };

    pourRafRef.current = requestAnimationFrame(step);
  };

  const selectedItem = workbenchItems.find((w) => w.instanceId === selectedInstanceId) ?? null;
  const selectedInstrument = selectedItem ? getInstrumentById(selectedItem.instrumentId) ?? null : null;
  const selectedChemPlacement =
    chemicalItems.find((c) => c.instanceId === selectedChemicalInstanceId) ?? null;
  const selectedChemSubstance = selectedChemPlacement
    ? getChemicalById(selectedChemPlacement.chemicalId) ?? null
    : null;

  // Strictly enforce room isolation inside the Equipment Drawer
  const roomOnlyInstruments = useMemo(
    () => LAB_INSTRUMENTS.filter((i) => i.department === room.id),
    [room.id]
  );

  const drawerInstruments = useMemo(() => {
    const q = drawerSearch.trim();
    if (drawerScopeAllWings) {
      return searchCentralRegistry({
        query: q,
        department: 'all',
        includeChemicals: false,
        sortBy: 'relevance',
      })
        .map((e) => e.instrument)
        .filter((x): x is LabInstrument => Boolean(x));
    }
    let list: LabInstrument[];
    if (activeRackId && !q) {
      const rack = room.racks.find((r) => r.id === activeRackId);
      list = rack
        ? rack.instrumentIds
            .map((id) => getInstrumentById(id))
            .filter((x): x is LabInstrument => x !== undefined && x.department === room.id)
        : roomOnlyInstruments;
    } else {
      list = roomOnlyInstruments;
    }
    if (!q) return list;
    return searchCentralRegistry({
      query: q,
      department: room.id,
      includeChemicals: false,
      sortBy: 'relevance',
    })
      .map((e) => e.instrument)
      .filter((x): x is LabInstrument => Boolean(x));
  }, [activeRackId, drawerSearch, drawerScopeAllWings, room, roomOnlyInstruments]);

  const otherRoomMatch = useMemo(() => {
    const q = drawerSearch.trim().toLowerCase();
    if (!q || drawerInstruments.length > 0) return null;
    return (
      LAB_INSTRUMENTS.find(
        (i) => i.department !== room.id && i.name.toLowerCase().includes(q)
      ) ?? null
    );
  }, [drawerSearch, drawerInstruments.length, room.id]);

  // Live visual state passed to each SVG instrument
  const getSimStateForItem = (item: WorkbenchItem): EquipmentSimState => {
    const spec = RECEIVING_CONTAINER_SPECS[item.instrumentId];
    const isVessel = isReceivingVessel(item.instrumentId);
    const capacity = isVessel ? getContainerCapacity(item) : 0;

    let vesselOverride: Partial<EquipmentSimState> = {};
    if (chemistryEnabled && isVessel) {
      const visual = getVesselLiquidVisual(item.instanceId, vesselMixtures, capacity);
      let fillRatio01 = visual.fillRatio01;
      let liquidColorHex = visual.liquidColorHex;
      let liquidOpacity = visual.liquidOpacity;

      // Interpolate liquid height smoothly while pour animation targets this vessel
      if (pourAnimation && pourAnimation.targetId === item.instanceId) {
        const interpAmt =
          pourAnimation.startDestAmt +
          (pourAnimation.endDestAmt - pourAnimation.startDestAmt) * pourAnimation.progress01;
        fillRatio01 =
          interpAmt <= 0 ? 0 : Math.min(1, Math.max(0.05, interpAmt / Math.max(1, capacity)));
        if (interpAmt > 0 && visual.isEmpty) {
          liquidColorHex = pourAnimation.colorHex;
          liquidOpacity = 0.62;
        }
      }

      const thisVesselHasReaction =
        !visual.isEmpty &&
        vesselMixtures.some((m) => m.vesselInstanceId === item.instanceId && m.amountMlOrG > 0);

      vesselOverride = {
        fillRatio01,
        liquidColorHex:
          thisVesselHasReaction && chemOutcome && !chemOutcome.blocked
            ? chemOutcome.liquidColorHex
            : liquidColorHex,
        liquidOpacity: fillRatio01 > 0 ? liquidOpacity : 0,
        vesselKindOverride: spec?.vesselShape,
        isReceiving:
          activeDragProximity?.compatibleTargets.some(
            (t) => t.targetInstanceId === item.instanceId
          ) || pourAnimation?.targetId === item.instanceId,
        gasActive: thisVesselHasReaction ? Boolean(chemOutcome?.gasEvolution.active) : false,
        precipitateColorHex:
          thisVesselHasReaction && chemOutcome?.precipitateOrDeposit.active
            ? chemOutcome.precipitateOrDeposit.colorHex
            : undefined,
        liveTempC: thisVesselHasReaction && chemOutcome ? chemOutcome.vesselTempC : 25,
        isBoiling: thisVesselHasReaction ? Boolean(chemOutcome?.isBoiling) : false,
        phValue: thisVesselHasReaction ? chemOutcome?.phEstimate ?? undefined : undefined,
      };
    }

    if (experiment.id === 'boiling-point') {
      const pressure = params.pressure ?? 101.325;
      const isBoiling = liveWaterTempC >= targetBoilingC - 0.05 && isRunning;
      return {
        isRunning,
        phase: simTimeSec * 2.4,
        liveTempC: isRunning || simTimeSec > 0 ? liveWaterTempC : 25,
        boilingTempC: targetBoilingC,
        pressureKpa: pressure,
        powerW: item.config.power ?? heaterPowerW,
        isBoiling,
        ...vesselOverride,
      };
    }
    if (experiment.id === 'pendulum-period') {
      const period = Math.max(0.4, result.primaryValue || 2.0);
      const angle = isRunning
        ? Math.cos((2 * Math.PI * simTimeSec) / period) * 0.42
        : 0.25;
      return { isRunning, phase: simTimeSec, pendulumAngleRad: angle };
    }
    if (experiment.id === 'voltage-current') {
      return {
        isRunning,
        phase: simTimeSec,
        voltage: params.voltage ?? 5,
        currentA: result.primaryValue,
      };
    }
    if (experiment.id === 'photosynthesis-rate') {
      return {
        isRunning,
        phase: simTimeSec * 2,
        lightIntensity: params.intensity ?? 200,
      };
    }
    if (experiment.id === 'acid-ph') {
      return {
        isRunning,
        phase: simTimeSec,
        phValue: result.primaryValue,
        ...vesselOverride,
      };
    }
    if (experiment.id === 'mass-volume-density') {
      return {
        isRunning,
        massG: result.primaryValue,
        volumeCm3: params.volume ?? 50,
        ...vesselOverride,
      };
    }
    return { isRunning, phase: simTimeSec * 2, ...vesselOverride };
  };

  const handleSaveDesignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date().toISOString();
    const design: SavedLabDesign = {
      id: `lab-design-${Date.now()}`,
      title: designTitleInput.trim() || `${room.shortName} · ${experiment.shortTitle}`,
      department: room.id,
      experimentId: experiment.id,
      workbenchItems,
      chemicalItems,
      vesselMixtures,
      transferHistory,
      connections,
      parameters: { ...params },
      notes: designNotesInput.trim(),
      modelVersion: 'v2.0-campus',
      status: simTimeSec > 0 || transferHistory.length > 0 ? 'completed' : 'draft',
      createdAt: now,
      updatedAt: now,
    };
    saveLabDesign(design);
    setSaveModalOpen(false);
    setDesignTitleInput('');
    setDesignNotesInput('');
    setStatusNotice({
      type: 'success',
      text: `Saved lab design "${design.title}" to My Learning.`,
    });
  };

  const handleStationClick = (st: RoomStation) => {
    if (st.opensChemicalCabinet && chemistryEnabled) {
      setChemicalCabinetOpen(true);
      setDrawerOpen(false);
      setActiveStationInfo(null);
      return;
    }
    if (st.targetRackId) {
      setActiveRackId(st.targetRackId);
      setDrawerOpen(true);
      setActiveStationInfo(null);
      return;
    }
    setActiveStationInfo(st);
  };

  const leftRacks = room.racks.filter((r) => r.zonePosition.startsWith('left'));
  const rightRacks = room.racks.filter((r) => r.zonePosition.startsWith('right'));

  return (
    <div className="space-y-4">
      {/* FRONT DOOR NAVIGATION & ROOM ARCHITECTURAL HEADER */}
      <div className="rounded-xl border border-slate-200 bg-white p-3.5 sm:p-4 space-y-3 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={onExitToCampus}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 hover:border-blue-400 hover:text-blue-700 flex items-center gap-1.5 min-h-[40px]"
            >
              <DoorOpen className="w-4 h-4 text-blue-700" />
              Exit to Science Campus
            </button>
            <div>
              <div className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-2 text-blue-700 font-semibold">
                <Building2 className="w-3.5 h-3.5" />
                {isPersonalLabSession
                  ? `PERSONAL LAB · ${activePersonalLab?.name || 'Custom Room'}`
                  : `${room.wingCode} · ${room.roomDimensionsLabel}`}
              </div>
              <h2 className="text-lg sm:text-xl font-display font-bold text-slate-900 leading-tight">
                {isPersonalLabSession ? activePersonalLab?.name || room.name : room.name}
              </h2>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {isPersonalLabSession && (
              <button
                type="button"
                onClick={() => navigate('personal-lab')}
                className="px-3 py-2 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 min-h-[40px]"
              >
                <Wrench className="w-3.5 h-3.5" />
                Back to Personal Builder
              </button>
            )}
            {experiment.id === 'boiling-point' && chemistryEnabled && (
              <button
                type="button"
                onClick={onOpenBoilingAltitudeDemo}
                className="px-3 py-2 rounded-lg bg-amber-500 text-white text-xs font-bold hover:bg-amber-600 flex items-center gap-1.5 min-h-[40px]"
              >
                <Mountain className="w-4 h-4" />
                Sea Level vs Altitude Dual Demo
              </button>
            )}
            {chemistryEnabled && (
              <button
                type="button"
                onClick={() => {
                  setChemicalCabinetOpen(true);
                  setDrawerOpen(false);
                }}
                className="px-3.5 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center gap-1.5 min-h-[40px]"
              >
                <Atom className="w-4 h-4" />
                Chemical Vault ({CHEMISTRY_CHEMICAL_VAULT.length})
              </button>
            )}
            <button
              type="button"
              onClick={() => applyRecommendedKit(experiment.id)}
              className="px-3 py-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-semibold text-blue-700 hover:bg-blue-100 flex items-center gap-1.5 min-h-[40px]"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Load Recommended Kit
            </button>
            <button
              type="button"
              onClick={() => setBenchFocusMode((v) => !v)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-700 hover:border-slate-400 flex items-center gap-1.5 min-h-[40px]"
            >
              {benchFocusMode ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
              {benchFocusMode ? 'Full Room View' : 'Focus Workbench'}
            </button>
          </div>
        </div>

        {/* 10-Wing Quick Hallway Switcher */}
        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {LAB_ROOMS.map((r) => {
            const active = r.id === room.id;
            return (
              <button
                key={r.id}
                type="button"
                onClick={() => handleSelectDepartment(r.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap shrink-0 border transition-colors min-h-[36px] ${
                  active
                    ? 'bg-blue-700 text-white font-bold border-blue-700'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                {r.shortName}
              </button>
            );
          })}
        </div>

        <InlineLabTutorStrip
          experimentId={experiment.id}
          division={activeDivision}
          onOpenFullTutor={() => navigate('lab-tutor', { experimentId: experiment.id })}
        />
      </div>

      {/* Status & Safety Compatibility Notice */}
      {statusNotice && (
        <div
          className={`rounded-xl border px-4 py-2.5 text-xs flex items-center justify-between gap-3 ${
            statusNotice.type === 'warning'
              ? 'border-rose-200 bg-rose-50 text-rose-800'
              : statusNotice.type === 'success'
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-blue-200 bg-blue-50 text-blue-800'
          }`}
        >
          <span className="flex items-center gap-2 font-medium">
            {statusNotice.type === 'warning' ? (
              <AlertTriangle className="w-4 h-4 shrink-0" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            )}
            {statusNotice.text}
          </span>
          <button
            type="button"
            onClick={() => setStatusNotice(null)}
            className="text-xs underline shrink-0"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Prominent In-Room Apparatus Search & AI Equipment-to-Experiment Discovery */}
      <WorkbenchDiscoveryBar
        roomId={room.id}
        experimentId={experiment.id}
        workbenchItems={workbenchItems}
        chemicalItems={chemicalItems}
        onAddInstrument={(inst) => addInstrumentToBench(inst)}
        onAddChemical={(chem) => addChemicalToBench(chem)}
        onSelectExperiment={(expId) => {
          onSelectExperiment(expId);
          setStatusNotice({
            type: 'success',
            text: `Confirmed and loaded validated simulation model "${expId}".`,
          });
        }}
        onSwitchRoom={(dept) => handleSelectDepartment(dept)}
        division={activeDivision}
        levelLabel={currentLevelLabel}
        language={language}
        onGoToCreator={(prefillPrompt) => {
          setCreatorPrefillPrompt(prefillPrompt);
          navigate('creator');
        }}
        isPersonalLabMode={isPersonalLabSession}
      />

      {/* ========================================================================
          REALISTIC ARCHITECTURAL PHYSICAL LABORATORY STAGE (DAYLIGHT ROOM)
         ======================================================================== */}
      <div className="relative rounded-2xl border border-slate-200 overflow-hidden shadow-md bg-[#F1F5F9]">
        {/* TOP EXECUTION & ROOM SAFETY CONTROL BAR */}
        <div className="relative z-20 flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 bg-white/95 px-4 py-2.5 backdrop-blur-sm">
          <div className="flex items-center gap-2 text-xs text-emerald-700">
            <ShieldCheck className="w-4 h-4 shrink-0" />
            <span className="font-semibold">{room.safetyZoneLabel}</span>
            <span className="hidden md:inline text-slate-500">· {room.safetyZoneNote}</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRunning((r) => !r)}
              className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 min-h-[36px]"
            >
              {isRunning ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              {isRunning ? 'Pause' : simTimeSec > 0 ? 'Resume' : 'Start Experiment'}
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRunning(false);
                setSimTimeSec(0);
                setLiveWaterTempC(25);
              }}
              className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-700 hover:text-slate-900 flex items-center gap-1 min-h-[36px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset
            </button>
            <div className="flex items-center gap-0.5 bg-slate-100 border border-slate-200 rounded-lg p-0.5">
              {([1, 2, 5] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSimSpeed(s)}
                  className={`px-2 py-1 rounded text-[11px] font-mono ${
                    simSpeed === s ? 'bg-blue-700 text-white font-bold' : 'text-slate-600'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => {
                if (connectingFromId) {
                  setConnectingFromId(null);
                } else if (selectedInstanceId) {
                  setConnectingFromId(selectedInstanceId);
                  setStatusNotice({
                    type: 'info',
                    text: 'Click a second instrument on the center workbench to connect them.',
                  });
                } else if (workbenchItems[0]) {
                  setConnectingFromId(workbenchItems[0].instanceId);
                  setStatusNotice({
                    type: 'info',
                    text: 'Click a target instrument on the workbench to complete coupling.',
                  });
                }
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold flex items-center gap-1.5 min-h-[36px] ${
                connectingFromId
                  ? 'border-amber-400 bg-amber-50 text-amber-800'
                  : 'border-slate-200 bg-white text-slate-800 hover:border-blue-400'
              }`}
            >
              <Link2 className="w-3.5 h-3.5" />
              {connectingFromId ? 'Cancel Link' : 'Connect'}
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveRackId(null);
                setDrawerOpen((o) => !o);
              }}
              className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-1.5 min-h-[36px]"
            >
              <Plus className="w-3.5 h-3.5 text-blue-700" />
              Equipment Registry ({LAB_INSTRUMENTS.length})
            </button>
            {chemistryEnabled && (
              <button
                type="button"
                onClick={() => setHistoryModalOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-emerald-400 flex items-center gap-1.5 min-h-[36px]"
              >
                <History className="w-3.5 h-3.5 text-emerald-700" />
                Transfer Log ({transferHistory.length})
              </button>
            )}
            {workbenchItems.some(
              (w) => getInstrumentById(w.instrumentId)?.visualKind === 'microscope'
            ) && (
              <button
                type="button"
                onClick={() => setMicroscopeOpen(true)}
                className="px-3 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-xs font-bold text-emerald-800 hover:bg-emerald-100 flex items-center gap-1.5 min-h-[36px]"
              >
                <Microscope className="w-3.5 h-3.5" />
                View Specimens (40×–400×)
              </button>
            )}
          </div>
        </div>

        {/* FULL ARCHITECTURAL ROOM INTERIOR WITH DAYLIGHT CEILING, WINDOWS, BACK WALL, LEFT/RIGHT RACKS, TILED FLOOR & ISLAND BENCH */}
        <div className="relative min-h-[600px] sm:min-h-[650px] flex flex-col justify-between overflow-hidden select-none">
          {/* LAYER 1: Bright Daylight Architectural Room Perspective Backdrop SVG */}
          <svg
            viewBox="0 0 1200 680"
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full pointer-events-none"
            aria-hidden="true"
          >
            <defs>
              <linearGradient id="dayCeilingGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFFFFF" />
                <stop offset="100%" stopColor="#E2E8F0" />
              </linearGradient>
              <linearGradient id="dayFloorGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#E2E8F0" />
                <stop offset="100%" stopColor="#CBD5E1" />
              </linearGradient>
              <radialGradient id="dayBenchWash" cx="50%" cy="46%" r="52%">
                <stop offset="0%" stopColor={room.accentColor} stopOpacity="0.08" />
                <stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
              </radialGradient>
            </defs>

            {/* Ceiling */}
            <polygon points="0,0 1200,0 1010,96 190,96" fill="url(#dayCeilingGrad)" />
            {/* Recessed Daylight Ceiling Diffusers */}
            <polygon points="320,24 540,24 525,52 335,52" fill="#FFFFFF" stroke="#94A3B8" strokeOpacity="0.6" strokeWidth="1.5" />
            <polygon points="660,24 880,24 865,52 675,52" fill="#FFFFFF" stroke="#94A3B8" strokeOpacity="0.6" strokeWidth="1.5" />

            {/* Left Perspective Wall */}
            <polygon points="0,0 190,96 190,410 0,580" fill="#E9EEF5" stroke="#CBD5E1" />
            {/* Right Perspective Wall */}
            <polygon points="1200,0 1010,96 1010,410 1200,580" fill="#E9EEF5" stroke="#CBD5E1" />

            {/* Back Wall */}
            <rect x="190" y="96" width="820" height="314" fill="#F4F7FA" stroke="#CBD5E1" />

            {/* Back Wall Exterior Window or Astronomy Dome Aperture */}
            {room.id === 'astronomy' ? (
              <g>
                <path d="M 480,96 Q 600,115 720,96 L 700,230 L 500,230 Z" fill="#0F172A" stroke="#475569" strokeWidth="2.5" />
                {[
                  [540, 145],
                  [595, 130],
                  [645, 165],
                  [570, 195],
                  [665, 128],
                  [520, 175],
                ].map(([cx, cy], idx) => (
                  <circle key={idx} cx={cx} cy={cy} r="2" fill="#FFFFFF" opacity="0.9" />
                ))}
              </g>
            ) : (
              <g>
                <rect x="495" y="116" width="210" height="96" rx="4" fill="#E0F2FE" stroke="#94A3B8" strokeWidth="2.5" />
                <line x1="600" y1="116" x2="600" y2="212" stroke="#94A3B8" strokeWidth="2" />
                <line x1="495" y1="164" x2="705" y2="164" stroke="#94A3B8" strokeWidth="1.5" />
              </g>
            )}

            {/* Tiled Laboratory Floor */}
            <polygon points="190,410 1010,410 1200,680 0,680" fill="url(#dayFloorGrad)" />
            {[0.2, 0.35, 0.5, 0.65, 0.8].map((t) => {
              const xTop = 190 + t * 820;
              const xBot = t * 1200;
              return (
                <line
                  key={t}
                  x1={xTop}
                  y1={410}
                  x2={xBot}
                  y2={680}
                  stroke="#94A3B8"
                  strokeOpacity="0.28"
                  strokeWidth="1"
                />
              );
            })}
            {[455, 510, 575, 640].map((y) => (
              <line key={y} x1="0" y1={y} x2="1200" y2={y} stroke="#94A3B8" strokeOpacity="0.24" strokeWidth="1" />
            ))}

            {/* Soft Ambient Wash over Island Workbench */}
            <ellipse cx="600" cy="445" rx="420" ry="180" fill="url(#dayBenchWash)" />

            {/* Oak / Steel Island Workbench Structural Pedestal & Lab Stools */}
            <rect x="275" y="545" width="26" height="86" fill="#94A3B8" stroke="#64748B" />
            <rect x="899" y="545" width="26" height="86" fill="#94A3B8" stroke="#64748B" />
            <rect x="301" y="555" width="598" height="44" fill="#E2E8F0" stroke="#94A3B8" />
            {[390, 600, 810].map((cx) => (
              <g key={cx}>
                <ellipse cx={cx} cy="596" rx="28" ry="8" fill="#334155" stroke="#64748B" strokeWidth="1.5" />
                <line x1={cx} y1="604" x2={cx} y2="652" stroke="#64748B" strokeWidth="4" />
                <line x1={cx - 18} y1="654" x2={cx + 18} y2="654" stroke="#475569" strokeWidth="3" strokeLinecap="round" />
              </g>
            ))}
          </svg>

          {/* LAYER 2: Interactive Back Wall Stations + Left/Right Storage Racks + Center Island Workbench */}
          {!benchFocusMode && (
            <div className="relative z-10 px-3 sm:px-6 pt-3 pb-2 grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2">
              {room.stations.map((st) => {
                const isChemVault = st.opensChemicalCabinet;
                return (
                  <button
                    key={st.id}
                    type="button"
                    onClick={() => handleStationClick(st)}
                    className={`rounded-lg border px-2.5 py-2 text-left transition-colors backdrop-blur-sm min-h-[52px] shadow-sm ${
                      isChemVault
                        ? 'border-emerald-300 bg-emerald-50/95 hover:bg-emerald-100'
                        : 'border-slate-200 bg-white/95 hover:border-blue-400'
                    }`}
                  >
                    <div
                      className={`text-[10px] font-mono uppercase tracking-wider flex items-center gap-1 font-semibold ${
                        isChemVault ? 'text-emerald-700' : 'text-blue-700'
                      }`}
                    >
                      {st.kind === 'fume-hood' && <Flame className="w-3 h-3" />}
                      {st.kind === 'wash-sink' && <Droplets className="w-3 h-3" />}
                      {st.kind === 'chemical-cabinet' && <Atom className="w-3 h-3" />}
                      {st.kind === 'safety-shower' && <ShieldCheck className="w-3 h-3" />}
                      {st.kind.replace('-', ' ')}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-900 truncate mt-0.5">
                      {st.label}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          {/* Back-Wall Station Popover Info */}
          {activeStationInfo && (
            <div className="relative z-20 mx-4 sm:mx-6 rounded-xl border border-blue-200 bg-white/95 px-4 py-2.5 text-xs flex items-center justify-between gap-3 shadow-md">
              <div>
                <strong className="text-slate-900">{activeStationInfo.label}:</strong>{' '}
                <span className="text-slate-600">{activeStationInfo.description}</span>
              </div>
              <button
                type="button"
                onClick={() => setActiveStationInfo(null)}
                className="text-slate-500 hover:text-slate-900 shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* CENTER FLOOR AREA: Left Wall Racks + Center Island Workbench + Right Wall Racks */}
          <div className="relative z-10 flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 px-3 sm:px-5 py-3 items-stretch">
            {/* LEFT WALL CABINETS & RACKS */}
            {!benchFocusMode && (
              <div className="lg:col-span-2 flex flex-row lg:flex-col gap-2.5 justify-center">
                {leftRacks.map((rack) => {
                  const isOpen = drawerOpen && activeRackId === rack.id;
                  return (
                    <button
                      key={rack.id}
                      type="button"
                      onClick={() => {
                        setActiveRackId(rack.id);
                        setDrawerOpen(true);
                        setChemicalCabinetOpen(false);
                      }}
                      className={`flex-1 lg:flex-none rounded-xl border p-3 text-left transition-all shadow-sm ${
                        isOpen
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 bg-white/95 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-slate-500">
                        <span>WALL RACK</span>
                        <span className="tabular-nums font-bold text-blue-700">
                          {rack.instrumentIds.length}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                        {rack.title}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {rack.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}

            {/* CENTER EXPERIMENTAL ISLAND WORKBENCH TABLE (Phenolic chemical-resistant slate surface for razor-sharp SVG contrast) */}
            <div
              className={`${benchFocusMode ? 'lg:col-span-12' : 'lg:col-span-8'} flex flex-col justify-center`}
            >
              <div
                ref={benchRef}
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleBenchDrop}
                className="relative h-[420px] sm:h-[460px] rounded-2xl border-2 border-slate-400 shadow-xl overflow-hidden bg-gradient-to-b from-slate-800 via-slate-800 to-slate-900"
              >
                {/* Epoxy Benchtop Mat Grid */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-45"
                  style={{
                    backgroundImage:
                      'linear-gradient(to right, rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.06) 1px, transparent 1px)',
                    backgroundSize: '36px 36px',
                  }}
                />
                {/* Brushed Steel Front Edge Bevel */}
                <div className="absolute inset-x-0 bottom-0 h-3 bg-gradient-to-b from-slate-400 to-slate-600 border-t border-slate-300 pointer-events-none" />

                {/* Live Telemetry Readout Plaque Mounted on Back Edge of Island Bench */}
                <div className="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
                  <div className="rounded-lg border border-slate-200 bg-white/95 px-3 py-1.5 text-xs shadow-sm">
                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">
                      Center Island Bench · {experiment.shortTitle}
                    </div>
                    <div className="font-mono font-bold text-blue-700 tabular-nums text-xs sm:text-sm">
                      {experiment.id === 'boiling-point'
                        ? `Water: ${(isRunning || simTimeSec > 0 ? liveWaterTempC : 25).toFixed(1)} °C · T_boil = ${targetBoilingC.toFixed(2)} °C (${(params.pressure ?? 101.325).toFixed(1)} kPa)`
                        : `${result.primarySymbol} = ${result.primaryValue} ${result.primaryUnit}`}
                    </div>
                  </div>
                  <div className="rounded-lg border border-slate-200 bg-white/95 px-2.5 py-1 text-[11px] font-mono text-slate-700 tabular-nums shadow-sm">
                    Apparatus: {workbenchItems.length}
                    {room.id === 'chemistry' ? ` · Chemicals: ${chemicalItems.length}` : ''}
                    {` · Links: ${connections.length}`}
                  </div>
                </div>

                {/* SVG Connection Cables Layer */}
                <svg
                  className="absolute inset-0 w-full h-full pointer-events-none z-10"
                  viewBox="0 0 100 100"
                  preserveAspectRatio="none"
                >
                  {connections.map((conn) => {
                    const from = workbenchItems.find((w) => w.instanceId === conn.fromInstanceId);
                    const to = workbenchItems.find((w) => w.instanceId === conn.toInstanceId);
                    if (!from || !to) return null;
                    const stroke = CONNECTION_COLORS[conn.connectionType] || '#35D5F2';
                    return (
                      <line
                        key={conn.id}
                        x1={from.xPercent}
                        y1={from.yPercent}
                        x2={to.xPercent}
                        y2={to.yPercent}
                        stroke={stroke}
                        strokeWidth="0.75"
                        strokeDasharray={isRunning ? '1.8 1.2' : undefined}
                        strokeOpacity="0.9"
                      />
                    );
                  })}
                </svg>

                {/* Animated Liquid Pour Stream Layer */}
                {pourAnimation &&
                  (pourAnimation.phase === 'pouring' || pourAnimation.phase === 'tilting') && (
                    <PourStreamOverlay
                      fromXPercent={pourAnimation.spoutX}
                      fromYPercent={pourAnimation.spoutY}
                      toXPercent={pourAnimation.destMouthX}
                      toYPercent={pourAnimation.destMouthY}
                      colorHex={pourAnimation.colorHex}
                      progress01={pourAnimation.progress01}
                      isSolid={pourAnimation.isSolid}
                    />
                  )}

                {/* Empty Workbench Prompt */}
                {workbenchItems.length === 0 && chemicalItems.length === 0 && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 pointer-events-none">
                    <FlaskConical className="w-10 h-10 text-[#35D5F2]/50 mb-2" />
                    <div className="text-sm font-semibold text-white">
                      {room.shortName} Center Workbench Ready
                    </div>
                    <p className="text-xs text-[#A9BCD3] max-w-sm mt-1">
                      Click any wall rack on the left or right{room.id === 'chemistry' ? ', open the Chemical Vault,' : ''} or click &ldquo;Load Recommended Kit&rdquo;.
                    </p>
                  </div>
                )}

                {/* Placed Instruments on Island Bench */}
                {workbenchItems.map((item) => {
                  const inst = getInstrumentById(item.instrumentId);
                  if (!inst) return null;
                  const isSelected = item.instanceId === selectedInstanceId;
                  const isConnectSource = item.instanceId === connectingFromId;
                  const isDraggingThis =
                    draggingId?.kind === 'inst' && draggingId.id === item.instanceId;
                  const isLocked = lockedObjectIds.has(item.instanceId);
                  const isCompatibleHover = Boolean(
                    activeDragProximity?.compatibleTargets.some(
                      (t) => t.targetInstanceId === item.instanceId
                    )
                  );
                  const isIncompatibleHover =
                    activeDragProximity?.incompatibleNearest?.targetInstanceId === item.instanceId;

                  const vessel = isReceivingVessel(item.instrumentId);
                  const vesselCap = vessel ? getContainerCapacity(item) : 0;
                  const liveVesselAmt =
                    pourAnimation && pourAnimation.targetId === item.instanceId
                      ? Number(
                          (
                            pourAnimation.startDestAmt +
                            (pourAnimation.endDestAmt - pourAnimation.startDestAmt) *
                              pourAnimation.progress01
                          ).toFixed(1)
                        )
                      : vessel
                        ? getVesselCurrentAmount(item.instanceId, vesselMixtures)
                        : 0;

                  const displayLabel = chemistryEnabled
                    ? numberedLabels[item.instanceId] ?? inst.name
                    : inst.name;

                  return (
                    <div
                      key={item.instanceId}
                      data-workbench-object="instrument"
                      data-instance-id={item.instanceId}
                      data-instrument-id={item.instrumentId}
                      data-rotation-deg={item.rotationDeg}
                      role="button"
                      tabIndex={0}
                      onPointerDown={(e) => handleObjectPointerDown(e, 'inst', item.instanceId)}
                      onPointerMove={handleObjectPointerMove}
                      onPointerUp={handleObjectPointerUp}
                      onPointerCancel={handleObjectPointerUp}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                          e.preventDefault();
                          handleItemClick(item);
                        }
                      }}
                      style={{
                        left: `${item.xPercent}%`,
                        top: `${item.yPercent}%`,
                        transform: 'translate(-50%, -50%)',
                        touchAction: 'none',
                      }}
                      className={`absolute flex flex-col items-center select-none rounded-xl p-1.5 transition-shadow ${
                        isDraggingThis
                          ? 'z-40 cursor-grabbing ring-2 ring-[#35D5F2] bg-[#35D5F2]/15 shadow-2xl scale-105'
                          : isLocked
                            ? 'z-25 cursor-not-allowed ring-2 ring-emerald-400 bg-emerald-500/15'
                            : isCompatibleHover
                              ? 'z-25 ring-2 ring-emerald-400 bg-emerald-400/20 shadow-lg'
                              : isIncompatibleHover
                                ? 'z-25 ring-2 ring-rose-400 bg-rose-500/20'
                                : isConnectSource
                                  ? 'z-20 cursor-grab ring-2 ring-[#F5B942] bg-[#F5B942]/15'
                                  : isSelected
                                    ? 'z-20 cursor-grab ring-2 ring-[#35D5F2] bg-[#35D5F2]/10'
                                    : 'z-20 cursor-grab hover:bg-white/5'
                      }`}
                    >
                      {isCompatibleHover && (
                        <span className="mb-0.5 px-1.5 py-0.5 rounded bg-emerald-600 text-white text-[9px] font-bold uppercase tracking-wider shadow">
                          Drop to pour
                        </span>
                      )}
                      {isIncompatibleHover && (
                        <span className="mb-0.5 px-1.5 py-0.5 rounded bg-rose-600 text-white text-[9px] font-bold uppercase tracking-wider shadow">
                          Cannot pour here
                        </span>
                      )}
                      {isLocked && (
                        <span className="mb-0.5 px-1.5 py-0.5 rounded bg-emerald-700 text-white text-[9px] font-mono flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" />
                          Pouring
                        </span>
                      )}
                      <div
                        data-equipment-visual="true"
                        style={{ transform: `rotate(${item.rotationDeg}deg)` }}
                        className="pointer-events-none transition-transform"
                      >
                        <EquipmentIllustration
                          kind={inst.visualKind}
                          sim={getSimStateForItem(item)}
                          className="w-16 h-16 sm:w-20 sm:h-20 drop-shadow-xl pointer-events-none"
                        />
                      </div>
                      <span
                        data-equipment-label="true"
                        className="mt-0.5 px-2 py-0.5 rounded bg-[#07111F]/92 border border-white/15 text-[10px] font-medium text-white whitespace-nowrap max-w-[155px] truncate pointer-events-none"
                      >
                        {displayLabel}
                        {chemistryEnabled && vessel
                          ? ` · ${liveVesselAmt}/${vesselCap} mL`
                          : ''}
                      </span>
                    </div>
                  );
                })}

                {/* Placed Virtual Chemical Sample Bottles */}
                {chemistryEnabled &&
                  chemicalItems.map((chemItem) => {
                    const chem = getChemicalById(chemItem.chemicalId);
                    if (!chem) return null;
                    const isSelected = chemItem.instanceId === selectedChemicalInstanceId;
                    const isDraggingThis =
                      draggingId?.kind === 'chem' && draggingId.id === chemItem.instanceId;
                    const isPouringThis = pourAnimation?.sourceId === chemItem.instanceId;
                    const isLocked = lockedObjectIds.has(chemItem.instanceId);

                    const displayX = isPouringThis ? pourAnimation!.bottleX : chemItem.xPercent;
                    const displayY = isPouringThis ? pourAnimation!.bottleY : chemItem.yPercent;
                    const displayTilt = isPouringThis ? pourAnimation!.bottleTiltDeg : 0;
                    const cap = chemItem.capacity ?? Math.max(chemItem.amount, chemItem.unit === 'g' ? 10 : 100);
                    const liveAmt = isPouringThis
                      ? Number(
                          (
                            pourAnimation!.startBottleAmt +
                            (pourAnimation!.endBottleAmt - pourAnimation!.startBottleAmt) *
                              pourAnimation!.progress01
                          ).toFixed(1)
                        )
                      : chemItem.amount;
                    const fillRatio = cap > 0 ? Math.min(1, Math.max(0, liveAmt / cap)) : 0;
                    const hasValidTargetNearby = Boolean(
                      isDraggingThis && activeDragProximity && activeDragProximity.compatibleTargets.length > 0
                    );
                    const hasInvalidHover = Boolean(
                      isDraggingThis &&
                        activeDragProximity &&
                        activeDragProximity.compatibleTargets.length === 0 &&
                        activeDragProximity.incompatibleNearest
                    );

                    return (
                      <div
                        key={chemItem.instanceId}
                        data-workbench-object="chemical-bottle"
                        data-instance-id={chemItem.instanceId}
                        data-chemical-id={chemItem.chemicalId}
                        role="button"
                        tabIndex={0}
                        onPointerDown={(e) => handleObjectPointerDown(e, 'chem', chemItem.instanceId)}
                        onPointerMove={handleObjectPointerMove}
                        onPointerUp={handleObjectPointerUp}
                        onPointerCancel={handleObjectPointerUp}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            setSelectedChemicalInstanceId(chemItem.instanceId);
                            setSelectedInstanceId(null);
                          }
                        }}
                        style={{
                          left: `${displayX}%`,
                          top: `${displayY}%`,
                          transform: `translate(-50%, -50%) rotate(${displayTilt}deg)`,
                          touchAction: 'none',
                        }}
                        className={`absolute flex flex-col items-center select-none rounded-xl p-1 transition-shadow ${
                          isDraggingThis
                            ? `z-40 cursor-grabbing shadow-2xl scale-105 ${
                                hasValidTargetNearby
                                  ? 'ring-2 ring-emerald-400 bg-emerald-400/20'
                                  : hasInvalidHover
                                    ? 'ring-2 ring-rose-400 bg-rose-500/20'
                                    : 'ring-2 ring-[#35C98A] bg-[#35C98A]/15'
                              }`
                            : isPouringThis
                              ? 'z-40 cursor-not-allowed ring-2 ring-emerald-400 bg-emerald-400/15'
                              : isLocked
                                ? 'z-25 cursor-not-allowed'
                                : isSelected
                                  ? 'z-25 cursor-grab ring-2 ring-[#35C98A] bg-[#35C98A]/10'
                                  : 'z-20 cursor-grab hover:bg-white/5'
                        }`}
                      >
                        <EquipmentIllustration
                          kind="chemical-bottle"
                          sim={{
                            bottleColor: chem.bottleColor,
                            chemicalFormula: chem.formula,
                            chemicalSymbol: chem.symbol,
                            concentrationLabel: chem.standardConcentrationOrPurity.split('(')[0].trim(),
                            bottleFillRatio01: fillRatio,
                            capOpen:
                              isPouringThis &&
                              (pourAnimation?.phase === 'tilting' ||
                                pourAnimation?.phase === 'pouring'),
                            isPouring: isPouringThis,
                          }}
                          className="w-14 h-14 sm:w-16 sm:h-16 drop-shadow-lg pointer-events-none"
                        />
                        <span className="px-1.5 py-0.5 rounded bg-[#07111F]/92 border border-[#35C98A]/35 text-[10px] font-mono tabular-nums text-[#35C98A] whitespace-nowrap pointer-events-none">
                          {chem.symbol} · {liveAmt} {chemItem.unit}
                        </span>
                      </div>
                    );
                  })}

                {/* Contextual "READY TO POUR?" Popup */}
                {chemistryEnabled &&
                  activePourPrompt &&
                  (() => {
                    const srcBottle = chemicalItems.find(
                      (c) => c.instanceId === activePourPrompt.sourceInstanceId
                    );
                    const srcSub = srcBottle ? getChemicalById(srcBottle.chemicalId) : null;
                    if (!srcBottle || !srcSub) return null;
                    return (
                      <PourProximityPopup
                        prompt={activePourPrompt}
                        sourceBottle={srcBottle}
                        sourceSubstance={srcSub}
                        onSelectTarget={(targetId) =>
                          setActivePourPrompt((prev) =>
                            prev ? { ...prev, selectedTargetId: targetId } : prev
                          )
                        }
                        onOpenQuantityModal={(targetId) => {
                          setQuantityModalTarget({
                            sourceId: activePourPrompt.sourceInstanceId,
                            targetId,
                          });
                          setActivePourPrompt(null);
                        }}
                        onDismiss={() => {
                          for (const cand of activePourPrompt.candidates) {
                            suppressedPairsRef.current.add(
                              makePairKey(activePourPrompt.sourceInstanceId, cand.targetInstanceId)
                            );
                          }
                          setActivePourPrompt(null);
                        }}
                      />
                    );
                  })()}

                {/* Non-blocking Incompatible Drop Explanation */}
                {chemistryEnabled && incompatibleFeedback && !activePourPrompt && (
                  <div
                    role="status"
                    onPointerDown={(e) => e.stopPropagation()}
                    style={{
                      left: `${Math.min(72, Math.max(28, incompatibleFeedback.xPercent))}%`,
                      top: `${Math.max(16, incompatibleFeedback.yPercent - 14)}%`,
                      transform: 'translate(-50%, -100%)',
                    }}
                    className="absolute z-40 w-[min(300px,calc(100%-24px))] rounded-xl border border-rose-300 bg-rose-50 px-3 py-2 text-xs text-rose-900 shadow-xl flex items-start gap-2"
                  >
                    <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <div className="font-bold text-[11px] uppercase tracking-wide text-rose-800">
                        Incompatible Target
                      </div>
                      <p className="leading-snug mt-0.5">{incompatibleFeedback.message}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIncompatibleFeedback(null)}
                      aria-label="Dismiss incompatible notice"
                      className="text-rose-600 hover:text-rose-900"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* RIGHT WALL CABINETS & RACKS */}
            {!benchFocusMode && (
              <div className="lg:col-span-2 flex flex-row lg:flex-col gap-2.5 justify-center">
                {chemistryEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      setChemicalCabinetOpen(true);
                      setDrawerOpen(false);
                    }}
                    className="flex-1 lg:flex-none rounded-xl border border-emerald-300 bg-emerald-50/95 hover:bg-emerald-100 p-3 text-left transition-all shadow-sm"
                  >
                    <div className="flex items-center justify-between text-[10px] font-mono text-emerald-700 font-bold">
                      <span>CHEMICAL VAULT</span>
                      <span className="tabular-nums">{CHEMISTRY_CHEMICAL_VAULT.length}</span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 mt-1">
                      Chemical &amp; Reagent Cabinet
                    </div>
                    <div className="text-[11px] text-emerald-800 mt-0.5">
                      Elements, Acids, Bases, Salts, Indicators
                    </div>
                  </button>
                )}

                {rightRacks.map((rack) => {
                  const isOpen = drawerOpen && activeRackId === rack.id;
                  return (
                    <button
                      key={rack.id}
                      type="button"
                      onClick={() => {
                        setActiveRackId(rack.id);
                        setDrawerOpen(true);
                        setChemicalCabinetOpen(false);
                      }}
                      className={`flex-1 lg:flex-none rounded-xl border p-3 text-left transition-all shadow-sm ${
                        isOpen
                          ? 'border-blue-500 bg-blue-50 shadow-md'
                          : 'border-slate-200 bg-white/95 hover:border-blue-400'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-1 text-[10px] font-mono text-slate-500">
                        <span>WALL RACK</span>
                        <span className="tabular-nums font-bold text-blue-700">
                          {rack.instrumentIds.length}
                        </span>
                      </div>
                      <div className="text-xs font-bold text-slate-900 mt-1 leading-snug">
                        {rack.title}
                      </div>
                      <div className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">
                        {rack.subtitle}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* BOTTOM WORKBENCH ACTION FOOTER INSIDE ROOM */}
          <div className="relative z-20 border-t border-slate-200 bg-white/95 px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 backdrop-blur-sm">
            <div className="text-xs text-slate-600">
              <span className="text-slate-900 font-semibold">Tip:</span>{' '}
              {room.id === 'chemistry'
                ? 'Drag any chemical bottle beside or directly over a Beaker, Flask, or Cylinder to initiate a guided liquid transfer.'
                : 'Drag apparatus across the island bench, or select an item to adjust parameters, rotate, or couple tools.'}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setWorkbenchItems([]);
                  setChemicalItems([]);
                  setVesselMixtures([]);
                  setTransferHistory([]);
                  setActivePourPrompt(null);
                  setQuantityModalTarget(null);
                  setIncompatibleFeedback(null);
                  suppressedPairsRef.current.clear();
                  setConnections([]);
                  setSelectedInstanceId(null);
                  setSelectedChemicalInstanceId(null);
                  setIsRunning(false);
                }}
                className="px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-600 hover:text-rose-700 min-h-[36px]"
              >
                Clear Bench
              </button>
              <button
                type="button"
                disabled={trialsCount >= 10}
                onClick={onRecordTrial}
                className="px-3.5 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 disabled:opacity-40 flex items-center gap-1.5 min-h-[36px]"
              >
                <Save className="w-3.5 h-3.5" />
                Record Trial ({trialsCount}/10)
              </button>
              <button
                type="button"
                onClick={() => {
                  setDesignTitleInput(`${room.shortName} · ${experiment.shortTitle}`);
                  setSaveModalOpen(true);
                }}
                className="px-3.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 text-xs font-semibold hover:bg-emerald-100 flex items-center gap-1.5 min-h-[36px]"
              >
                <Save className="w-3.5 h-3.5" />
                Save Lab Design
              </button>
            </div>
          </div>

          {/* DOCKED SIDE EQUIPMENT STORAGE DRAWER */}
          {drawerOpen && (
            <div
              className="fixed inset-y-0 left-0 z-40 w-full max-w-md bg-white border-r border-slate-200 shadow-2xl flex flex-col"
              role="dialog"
              aria-label={`${room.shortName} Equipment Drawer`}
            >
              <div className="p-4 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-2">
                <div>
                  <div className="text-[11px] font-mono uppercase tracking-wider text-blue-700 font-semibold">
                    {room.wingCode} · Room-Isolated Inventory
                  </div>
                  <h3 className="text-base font-display font-bold text-slate-900 mt-0.5">
                    {activeRackId
                      ? room.racks.find((r) => r.id === activeRackId)?.title
                      : `${room.shortName} Complete Rack`}
                  </h3>
                </div>
                <button
                  type="button"
                  onClick={() => setDrawerOpen(false)}
                  aria-label="Close equipment drawer"
                  className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="p-3.5 border-b border-slate-200 space-y-2.5 bg-white">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="search"
                    value={drawerSearch}
                    onChange={(e) => setDrawerSearch(e.target.value)}
                    placeholder={`Search inside ${room.shortName}...`}
                    className="w-full pl-8 pr-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
                  />
                </div>
                <div className="flex gap-1.5 overflow-x-auto pb-1">
                  <button
                    type="button"
                    onClick={() => setDrawerScopeAllWings(false)}
                    className={`px-2.5 py-1 rounded text-[11px] border whitespace-nowrap ${
                      !drawerScopeAllWings
                        ? 'bg-blue-700 text-white border-blue-700 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    {room.shortName} ({roomOnlyInstruments.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDrawerScopeAllWings(true);
                      setActiveRackId(null);
                    }}
                    className={`px-2.5 py-1 rounded text-[11px] border whitespace-nowrap ${
                      drawerScopeAllWings
                        ? 'bg-emerald-700 text-white border-emerald-700 font-bold'
                        : 'bg-slate-50 text-slate-600 border-slate-200'
                    }`}
                  >
                    All Wings ({LAB_INSTRUMENTS.length})
                  </button>
                  {!drawerScopeAllWings &&
                    room.racks.map((rk) => (
                      <button
                        key={rk.id}
                        type="button"
                        onClick={() => setActiveRackId(rk.id)}
                        className={`px-2.5 py-1 rounded text-[11px] border whitespace-nowrap ${
                          activeRackId === rk.id
                            ? 'bg-blue-700 text-white border-blue-700 font-bold'
                            : 'bg-slate-50 text-slate-600 border-slate-200'
                        }`}
                      >
                        {rk.title.replace(' Rack', '').replace(' Cabinet', '')}
                      </button>
                    ))}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 bg-slate-50/50">
                {recentEquipmentIds.some((id) => getInstrumentById(id)?.department === room.id) && (
                  <div className="rounded-lg border border-slate-200 bg-white p-2.5 flex flex-wrap items-center gap-1.5 text-[11px]">
                    <span className="text-slate-500">Recent in {room.shortName}:</span>
                    {recentEquipmentIds
                      .filter((id) => getInstrumentById(id)?.department === room.id)
                      .slice(0, 4)
                      .map((id) => {
                        const inst = getInstrumentById(id);
                        if (!inst) return null;
                        return (
                          <button
                            key={id}
                            type="button"
                            onClick={() => addInstrumentToBench(inst)}
                            className="px-2 py-1 rounded border border-slate-200 bg-slate-50 text-blue-700 font-medium"
                          >
                            + {inst.name.split('(')[0].trim()}
                          </button>
                        );
                      })}
                  </div>
                )}

                {drawerInstruments.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-slate-300 bg-white p-5 text-center space-y-2 text-xs text-slate-600">
                    <div>No instrument matching &ldquo;{drawerSearch}&rdquo; inside {room.shortName}.</div>
                    {otherRoomMatch && (
                      <button
                        type="button"
                        onClick={() => handleSelectDepartment(otherRoomMatch.department)}
                        className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold"
                      >
                        Go to {getLabRoomById(otherRoomMatch.department).shortName} for {otherRoomMatch.name}
                      </button>
                    )}
                  </div>
                ) : (
                  drawerInstruments.map((inst) => (
                    <div
                      key={inst.id}
                      draggable
                      onDragStart={(e) => e.dataTransfer.setData('text/instrument-id', inst.id)}
                      className="rounded-xl border border-slate-200 bg-white p-3 flex items-start gap-3 cursor-grab active:cursor-grabbing hover:border-blue-400 shadow-sm"
                    >
                      <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-200 flex items-center justify-center shrink-0">
                        <EquipmentIllustration kind={inst.visualKind} className="w-10 h-10" />
                      </div>
                      <div className="min-w-0 flex-1 space-y-1">
                        <div className="text-xs font-bold text-slate-900 leading-tight">{inst.name}</div>
                        <div className="text-[11px] text-slate-600 line-clamp-2">{inst.functionSummary}</div>
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <span
                            className={`text-[10px] font-semibold ${
                              inst.simulationLinked ? 'text-emerald-700' : 'text-amber-700'
                            }`}
                          >
                            {inst.simulationLinked ? 'Simulation-Linked' : 'Conceptual Assembly'}
                          </span>
                          <button
                            type="button"
                            onClick={() => addInstrumentToBench(inst)}
                            className="px-2.5 py-1 rounded bg-blue-700 text-white text-[11px] font-bold hover:bg-blue-800 min-h-[28px]"
                          >
                            + Place
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* LIVE CHEMISTRY BENCH REACTION READOUT & SAFETY INTERLOCK */}
      {chemistryEnabled && chemOutcome && (
        <div
          className={`rounded-xl border p-4 sm:p-5 space-y-3 shadow-sm ${
            chemOutcome.blocked
              ? 'border-rose-300 bg-rose-50'
              : 'border-emerald-200 bg-white'
          }`}
        >
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-xs font-semibold uppercase tracking-wide text-blue-700 flex items-center gap-1.5">
                <FlaskConical className="w-4 h-4" />
                Live Chemistry Bench Reaction Readout
              </div>
              <h3 className="text-base font-display font-bold text-slate-900 mt-0.5">
                {chemOutcome.title}
              </h3>
              <div className="font-mono text-xs text-blue-800 font-semibold mt-0.5">
                {chemOutcome.equation}
              </div>
            </div>
            <span
              className={`px-3 py-1 rounded-lg border text-xs font-semibold ${
                getSafetyBadgeMeta(chemOutcome.safetyLevel).bgClass
              } ${getSafetyBadgeMeta(chemOutcome.safetyLevel).borderClass} ${
                getSafetyBadgeMeta(chemOutcome.safetyLevel).colorClass
              }`}
            >
              {getSafetyBadgeMeta(chemOutcome.safetyLevel).label}
            </span>
          </div>

          {chemOutcome.blocked && chemOutcome.blockReason && (
            <div className="rounded-lg border border-rose-300 bg-white px-3.5 py-2.5 text-xs text-rose-900 font-semibold flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700" />
              {chemOutcome.blockReason}
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5 flex items-center gap-2">
              <span
                className="w-4 h-4 rounded border border-slate-300 shrink-0"
                style={{ backgroundColor: chemOutcome.liquidColorHex }}
              />
              <div>
                <div className="text-[10px] text-slate-500">Solution Colour</div>
                <div className="font-mono font-semibold text-slate-900">{chemOutcome.liquidColorHex}</div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div className="text-[10px] text-slate-500">Vessel Temp</div>
              <div className="font-mono font-semibold text-slate-900 tabular-nums">
                {chemOutcome.vesselTempC.toFixed(1)} °C
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div className="text-[10px] text-slate-500">Estimated pH</div>
              <div className="font-mono font-semibold text-slate-900 tabular-nums">
                {chemOutcome.phEstimate !== null ? chemOutcome.phEstimate.toFixed(1) : 'N/A'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div className="text-[10px] text-slate-500">Gas Evolution</div>
              <div className="font-semibold text-slate-900 truncate">
                {chemOutcome.gasEvolution.active ? chemOutcome.gasEvolution.formula : 'None'}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
              <div className="text-[10px] text-slate-500">Precipitate / Condenser</div>
              <div className="font-semibold text-slate-900 truncate">
                {chemOutcome.precipitateOrDeposit.active
                  ? 'Solid / Crystals'
                  : chemOutcome.condensationActive
                    ? 'Distillate Active'
                    : 'Clear Liquid'}
              </div>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
              <div className="font-semibold text-slate-900">Observed Effects</div>
              <ul className="list-disc pl-4 space-y-0.5 text-slate-700">
                {chemOutcome.visualObservations.map((obs, idx) => (
                  <li key={idx}>{obs}</li>
                ))}
                {chemOutcome.precipitateOrDeposit.active && (
                  <li>{chemOutcome.precipitateOrDeposit.description}</li>
                )}
              </ul>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1">
              <div className="font-semibold text-slate-900">Particle-Level Mechanism</div>
              <p className="text-slate-700">{chemOutcome.particleLevelExplanation}</p>
              <p className="text-[11px] text-slate-500 pt-1">
                <strong>Scope:</strong> {chemOutcome.scientificLimitationNote}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* BELOW ROOM: COMPACT INSPECTOR, CONNECTIONS & EXPERIMENT MODEL SWITCHER */}
      <div className="grid lg:grid-cols-12 gap-4">
        {/* Selected Instrument OR Selected Chemical Sample Inspector */}
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
              <Wrench className="w-3.5 h-3.5" />
              {selectedChemSubstance
                ? 'Selected Virtual Chemical Sample'
                : 'Selected Workbench Apparatus Inspector'}
            </div>
            {(selectedItem || selectedChemPlacement) && (
              <button
                type="button"
                onClick={removeSelected}
                aria-label="Remove selected item from workbench"
                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>

          {selectedChemSubstance && selectedChemPlacement ? (
            <div className="space-y-3 text-xs">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {getBottleDisplayLabel(selectedChemPlacement, selectedChemSubstance)} ({selectedChemSubstance.symbol})
                </div>
                <div className="text-[11px] text-emerald-700 font-medium">
                  {selectedChemSubstance.category} · {selectedChemSubstance.standardConcentrationOrPurity}
                </div>
              </div>
              <div className="flex items-center justify-between rounded-lg bg-slate-50 p-2.5 border border-slate-200">
                <span className="text-slate-600">Remaining Quantity</span>
                <div className="flex items-center gap-2">
                  <span className="font-mono font-bold tabular-nums text-emerald-700 text-sm">
                    {selectedChemPlacement.amount} {selectedChemPlacement.unit}
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      const resetAmt = selectedChemSubstance.stateAtRoomTemp === 'Solid' ? 10 : 100;
                      setChemicalItems((prev) =>
                        prev.map((c) =>
                          c.instanceId === selectedChemPlacement.instanceId
                            ? { ...c, amount: resetAmt, capacity: resetAmt }
                            : c
                        )
                      );
                      setStatusNotice({
                        type: 'info',
                        text: `Refilled ${getBottleDisplayLabel(selectedChemPlacement, selectedChemSubstance)} to ${resetAmt} ${selectedChemPlacement.unit}.`,
                      });
                    }}
                    className="px-2 py-1 rounded border border-slate-200 bg-white text-[11px] font-semibold text-slate-700 hover:border-blue-400"
                  >
                    Refill
                  </button>
                </div>
              </div>
              <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-2.5 text-emerald-950 leading-relaxed">
                <strong className="font-semibold">How to Pour:</strong> Drag this bottle beside or directly over a Beaker, Conical Flask, Test Tube, or Measuring Cylinder on the workbench to open the guided transfer prompt.
              </div>
              <div className="text-slate-600 bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <strong className="text-slate-900">Safety Note:</strong> {selectedChemSubstance.safetyNote}
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <button type="button" onClick={() => nudgeSelected(-6, 0)} className="p-2 rounded border border-slate-200 bg-slate-50 text-slate-800" aria-label="Move left">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => nudgeSelected(0, -6)} className="p-2 rounded border border-slate-200 bg-slate-50 text-slate-800" aria-label="Move up">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => nudgeSelected(0, 6)} className="p-2 rounded border border-slate-200 bg-slate-50 text-slate-800" aria-label="Move down">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => nudgeSelected(6, 0)} className="p-2 rounded border border-slate-200 bg-slate-50 text-slate-800" aria-label="Move right">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ) : !selectedItem || !selectedInstrument ? (
            <p className="text-xs text-slate-600">
              Select any apparatus{room.id === 'chemistry' ? ' or virtual reagent bottle' : ''} on the center island workbench to inspect its principle, adjust live settings, nudge position, rotate, or couple tools.
            </p>
          ) : (
            <div className="space-y-3 text-xs">
              <div>
                <div className="text-sm font-bold text-slate-900">
                  {room.id === 'chemistry'
                    ? numberedLabels[selectedItem.instanceId] ?? selectedInstrument.name
                    : selectedInstrument.name}
                </div>
                <div className="text-[11px] text-blue-700 font-medium">
                  {selectedInstrument.category} · {selectedInstrument.units}
                </div>
              </div>
              <p className="text-slate-600 leading-relaxed">{selectedInstrument.description}</p>
              <div className="rounded-lg bg-slate-50 p-2.5 border border-slate-200 space-y-1">
                <div>
                  <strong className="text-slate-900">Function:</strong>{' '}
                  <span className="text-slate-600">{selectedInstrument.functionSummary}</span>
                </div>
                <div>
                  <strong className="text-slate-900">Principle:</strong>{' '}
                  <span className="text-slate-600">{selectedInstrument.scientificPrinciple}</span>
                </div>
              </div>

              {isReceivingVessel(selectedItem.instrumentId) && (
                <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-2.5 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-emerald-900">
                      Vessel Contents ({getVesselCurrentAmount(selectedItem.instanceId, vesselMixtures)} /{' '}
                      {getContainerCapacity(selectedItem)} mL)
                    </span>
                    {vesselMixtures.some((m) => m.vesselInstanceId === selectedItem.instanceId) && (
                      <button
                        type="button"
                        onClick={() => {
                          setVesselMixtures((prev) =>
                            prev.filter((m) => m.vesselInstanceId !== selectedItem.instanceId)
                          );
                          setStatusNotice({
                            type: 'info',
                            text: `Rinsed and emptied ${numberedLabels[selectedItem.instanceId] ?? 'vessel'}.`,
                          });
                        }}
                        className="px-2 py-0.5 rounded border border-emerald-300 bg-white text-[11px] font-semibold text-emerald-800 hover:bg-emerald-100"
                      >
                        Empty &amp; Rinse
                      </button>
                    )}
                  </div>
                  {vesselMixtures.some((m) => m.vesselInstanceId === selectedItem.instanceId) ? (
                    <div className="flex flex-wrap gap-1.5">
                      {vesselMixtures
                        .filter((m) => m.vesselInstanceId === selectedItem.instanceId)
                        .map((m) => {
                          const sub = getChemicalById(m.chemicalId);
                          return (
                            <span
                              key={m.chemicalId}
                              className="px-2 py-0.5 rounded bg-white border border-emerald-200 font-mono text-[11px] text-emerald-900"
                            >
                              {sub?.symbol ?? m.chemicalId}: {m.amountMlOrG} {m.unit}
                            </span>
                          );
                        })}
                    </div>
                  ) : (
                    <p className="text-[11px] text-emerald-800">
                      Empty vessel. Drag a chemical bottle near or onto it to transfer reagents.
                    </p>
                  )}
                </div>
              )}

              {selectedInstrument.visualKind === 'microscope' && (
                <button
                  type="button"
                  onClick={() => setMicroscopeOpen(true)}
                  className="w-full py-2 px-3 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center justify-center gap-1.5"
                >
                  <Microscope className="w-4 h-4" />
                  Open Microscope Eyepiece (40× / 100× / 400×)
                </button>
              )}

              {selectedInstrument.configurations.length > 0 && (
                <div className="space-y-2 pt-2 border-t border-slate-200">
                  {selectedInstrument.configurations.map((cfg) => {
                    const val =
                      params[cfg.key] !== undefined
                        ? params[cfg.key]
                        : selectedItem.config[cfg.key] ?? cfg.defaultValue;
                    return (
                      <div key={cfg.key} className="space-y-1">
                        <div className="flex justify-between">
                          <span className="text-slate-600">{cfg.label}</span>
                          <span className="font-mono font-bold text-blue-700 tabular-nums">
                            {val} {cfg.unit}
                          </span>
                        </div>
                        <input
                          type="range"
                          min={cfg.min}
                          max={cfg.max}
                          step={cfg.step}
                          value={val}
                          onChange={(e) => {
                            const next = Number(e.target.value);
                            setWorkbenchItems((prev) =>
                              prev.map((w) =>
                                w.instanceId === selectedItem.instanceId
                                  ? { ...w, config: { ...w.config, [cfg.key]: next } }
                                  : w
                              )
                            );
                            if (experiment.parameters.some((p) => p.key === cfg.key)) {
                              onParamChange(cfg.key, next);
                            }
                          }}
                          className="w-full accent-blue-700 cursor-pointer"
                        />
                      </div>
                    );
                  })}
                </div>
              )}

              <div className="flex flex-wrap items-center gap-1.5 pt-2 border-t border-slate-200">
                <button type="button" onClick={() => nudgeSelected(-6, 0)} className="p-1.5 rounded border border-slate-200 bg-slate-50 text-slate-800" aria-label="Move left">
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => nudgeSelected(0, -6)} className="p-1.5 rounded border border-slate-200 bg-slate-50 text-slate-800" aria-label="Move up">
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => nudgeSelected(0, 6)} className="p-1.5 rounded border border-slate-200 bg-slate-50 text-slate-800" aria-label="Move down">
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button type="button" onClick={() => nudgeSelected(6, 0)} className="p-1.5 rounded border border-slate-200 bg-slate-50 text-slate-800" aria-label="Move right">
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={rotateSelected}
                  className="px-2.5 py-1.5 rounded border border-slate-200 bg-slate-50 text-slate-800 flex items-center gap-1"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                  15°
                </button>
                <button
                  type="button"
                  onClick={() => setConnectingFromId(selectedItem.instanceId)}
                  className="px-2.5 py-1.5 rounded border border-blue-200 bg-blue-50 text-blue-700 font-semibold"
                >
                  Connect
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Active Connections & Supported Simulations Panel */}
        <div className="lg:col-span-6 space-y-4">
          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5 shadow-sm">
            <div className="text-xs font-semibold text-slate-900">
              Active Benchtop Couplings ({connections.length})
            </div>
            {connections.length === 0 ? (
              <p className="text-xs text-slate-600">
                No instruments connected yet. Select an apparatus and click &ldquo;Connect&rdquo; to wire compatible sensors, power supplies, heaters, or vessels.
              </p>
            ) : (
              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                {connections.map((conn) => {
                  const from = workbenchItems.find((w) => w.instanceId === conn.fromInstanceId);
                  const to = workbenchItems.find((w) => w.instanceId === conn.toInstanceId);
                  const fInst = from ? getInstrumentById(from.instrumentId) : null;
                  const tInst = to ? getInstrumentById(to.instrumentId) : null;
                  return (
                    <div
                      key={conn.id}
                      className="flex items-center justify-between gap-2 rounded-lg bg-slate-50 px-3 py-2 border border-slate-200 text-[11px]"
                    >
                      <span className="text-slate-900 font-medium truncate">
                        <span
                          className="inline-block w-2 h-2 rounded-full mr-1.5"
                          style={{ backgroundColor: CONNECTION_COLORS[conn.connectionType] }}
                        />
                        {fInst?.name ?? 'Item'} ↔ {tInst?.name ?? 'Item'}
                      </span>
                      <button
                        type="button"
                        onClick={() =>
                          setConnections((prev) => prev.filter((c) => c.id !== conn.id))
                        }
                        aria-label="Remove connection"
                        className="text-slate-400 hover:text-rose-600"
                      >
                        <Unlink className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
            <div className="text-xs font-semibold text-slate-900">Switch Validated Simulation Engine</div>
            <div className="flex flex-wrap gap-1.5">
              {EXPERIMENTS.map((exp) => (
                <button
                  key={exp.id}
                  type="button"
                  onClick={() => onSelectExperiment(exp.id)}
                  className={`px-2.5 py-1 rounded text-[11px] border ${
                    exp.id === experiment.id
                      ? 'border-blue-700 bg-blue-50 text-blue-700 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {exp.number}. {exp.shortTitle}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* CHEMICAL & SUBSTANCE CABINET DRAWER */}
      {chemistryEnabled && (
        <ChemicalCabinetDrawer
          open={chemicalCabinetOpen}
          onClose={() => setChemicalCabinetOpen(false)}
          onAddChemicalToBench={addChemicalToBench}
          onSelectCompatibleModel={(expId) => {
            setChemicalCabinetOpen(false);
            onSelectExperiment(expId);
          }}
        />
      )}

      {/* LIVE ELECTRONICS OSCILLOSCOPE READOUT WHEN CIRCUIT / SCOPE PLACED */}
      {(room.id === 'electronics' ||
        workbenchItems.some((w) =>
          ['elec-oscilloscope', 'phys-oscilloscope', 'elec-dc-supply', 'phys-dc-supply'].includes(
            w.instrumentId
          )
        )) && (
        <OscilloscopeBenchPanel
          voltage={
            workbenchItems.find((w) => w.config.voltage !== undefined)?.config.voltage ??
            params.voltage ??
            9
          }
          resistance={
            workbenchItems.find((w) => w.config.resistance !== undefined)?.config.resistance ??
            params.resistance ??
            15
          }
          frequencyHz={
            workbenchItems.find((w) => w.config.frequency !== undefined)?.config.frequency ?? 120
          }
          isRunning={isRunning}
        />
      )}

      {/* VIRTUAL MICROSCOPE SPECIMEN VIEWER MODAL */}
      <VirtualMicroscopeModal
        open={microscopeOpen}
        onClose={() => setMicroscopeOpen(false)}
        division={activeDivision}
      />

      {/* POUR QUANTITY & LIVE PREVIEW MODAL */}
      {(() => {
        const qBottle = quantityModalTarget
          ? chemicalItems.find((c) => c.instanceId === quantityModalTarget.sourceId) ?? null
          : null;
        const qTarget = quantityModalTarget
          ? workbenchItems.find((w) => w.instanceId === quantityModalTarget.targetId) ?? null
          : null;
        const qSub = qBottle ? getChemicalById(qBottle.chemicalId) ?? null : null;
        return (
          <PourQuantityModal
            open={Boolean(quantityModalTarget && qBottle && qTarget && qSub)}
            sourceBottle={qBottle}
            sourceSubstance={qSub}
            targetItem={qTarget}
            targetLabel={qTarget ? numberedLabels[qTarget.instanceId] ?? 'Vessel' : 'Vessel'}
            vesselMixtures={vesselMixtures}
            lockedIds={lockedObjectIds}
            heaterNearTarget={qTarget ? isTargetHeated(qTarget.instanceId) : false}
            liveTempC={liveWaterTempC}
            isSimRunning={isRunning}
            onConfirmPour={(amt, unit) => {
              if (!qBottle || !qTarget) return;
              executeAnimatedPour(qBottle.instanceId, qTarget.instanceId, amt, unit);
            }}
            onCancel={(reason) => {
              if (qBottle && qTarget) {
                recordTransferHistoryEntry({
                  sourceInstanceId: qBottle.instanceId,
                  sourceName: getBottleDisplayLabel(qBottle, qSub ?? undefined),
                  sourceChemicalId: qBottle.chemicalId,
                  sourceSymbol: qSub?.symbol ?? qBottle.chemicalId,
                  destinationInstanceId: qTarget.instanceId,
                  destinationName: numberedLabels[qTarget.instanceId] ?? 'Vessel',
                  requestedAmount: 0,
                  requestedUnit: qBottle.unit,
                  transferredAmountMlOrG: 0,
                  normalizedUnit: qBottle.unit,
                  sourceAfter: qBottle.amount,
                  destinationAfter: getVesselCurrentAmount(qTarget.instanceId, vesselMixtures),
                  status: 'cancelled',
                  reason: reason || 'Cancelled before confirmation',
                });
                suppressedPairsRef.current.add(makePairKey(qBottle.instanceId, qTarget.instanceId));
              }
              setQuantityModalTarget(null);
            }}
          />
        );
      })()}

      {/* TRANSFER HISTORY MODAL */}
      <TransferHistoryModal
        open={historyModalOpen}
        onClose={() => setHistoryModalOpen(false)}
        entries={transferHistory}
      />

      {/* SAVE LAB DESIGN MODAL */}
      <Modal
        open={saveModalOpen}
        onClose={() => setSaveModalOpen(false)}
        title="Save Virtual Lab Workbench Design"
      >
        <form onSubmit={handleSaveDesignSubmit} className="space-y-4">
          <div>
            <label htmlFor="design-title" className="text-xs font-semibold text-slate-900 block mb-1">
              Design Title
            </label>
            <input
              id="design-title"
              type="text"
              value={designTitleInput}
              onChange={(e) => setDesignTitleInput(e.target.value)}
              required
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
            />
          </div>
          <div>
            <label htmlFor="design-notes" className="text-xs font-semibold text-slate-900 block mb-1">
              Setup &amp; Observation Notes
            </label>
            <textarea
              id="design-notes"
              rows={3}
              value={designNotesInput}
              onChange={(e) => setDesignNotesInput(e.target.value)}
              placeholder="Document which instruments and virtual samples you arranged..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={() => setSaveModalOpen(false)}
              className="px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-600"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800"
            >
              Save to My Learning
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
