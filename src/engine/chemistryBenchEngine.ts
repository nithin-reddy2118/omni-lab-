import { getChemicalById } from '../data/chemicals';
import { getInstrumentById } from '../data/labEquipment';
import type {
  ChemicalSubstance,
  ChemistryBenchSyncState,
  LabInstrument,
  VesselMixtureEntry,
  WorkbenchChemicalItem,
  WorkbenchConnection,
  WorkbenchItem,
} from '../types/science';

// Configurable spatial interaction thresholds (px)
export const PROXIMITY_THRESHOLD_PX = 58;
export const SEPARATION_HYSTERESIS_PX = 96;

export interface ReceivingContainerSpec {
  instrumentId: string;
  baseLabel: string;
  defaultCapacity: number;
  acceptedStates: ('Liquid' | 'Aqueous Solution' | 'Solid')[];
  unit: 'mL';
  vesselShape: 'beaker' | 'conical-flask' | 'test-tubes' | 'measuring-cylinder' | 'volumetric-flask' | 'burette';
}

export const RECEIVING_CONTAINER_SPECS: Record<string, ReceivingContainerSpec> = {
  'chem-beaker': {
    instrumentId: 'chem-beaker',
    baseLabel: 'Beaker',
    defaultCapacity: 250,
    acceptedStates: ['Liquid', 'Aqueous Solution', 'Solid'],
    unit: 'mL',
    vesselShape: 'beaker',
  },
  'chem-conical-flask': {
    instrumentId: 'chem-conical-flask',
    baseLabel: 'Conical Flask',
    defaultCapacity: 250,
    acceptedStates: ['Liquid', 'Aqueous Solution', 'Solid'],
    unit: 'mL',
    vesselShape: 'conical-flask',
  },
  'chem-test-tubes': {
    instrumentId: 'chem-test-tubes',
    baseLabel: 'Test Tube Rack',
    defaultCapacity: 150,
    acceptedStates: ['Liquid', 'Aqueous Solution', 'Solid'],
    unit: 'mL',
    vesselShape: 'test-tubes',
  },
  'chem-volumetric-flask': {
    instrumentId: 'chem-volumetric-flask',
    baseLabel: 'Volumetric Flask',
    defaultCapacity: 250,
    acceptedStates: ['Liquid', 'Aqueous Solution', 'Solid'],
    unit: 'mL',
    vesselShape: 'volumetric-flask',
  },
  'chem-measuring-cylinder': {
    instrumentId: 'chem-measuring-cylinder',
    baseLabel: 'Measuring Cylinder',
    defaultCapacity: 500,
    acceptedStates: ['Liquid', 'Aqueous Solution'],
    unit: 'mL',
    vesselShape: 'measuring-cylinder',
  },
  'chem-burette': {
    instrumentId: 'chem-burette',
    baseLabel: 'Burette',
    defaultCapacity: 50,
    acceptedStates: ['Liquid', 'Aqueous Solution'],
    unit: 'mL',
    vesselShape: 'burette',
  },
  'chem-crucible': {
    instrumentId: 'chem-crucible',
    baseLabel: 'Crucible',
    defaultCapacity: 100,
    acceptedStates: ['Solid', 'Liquid', 'Aqueous Solution'],
    unit: 'mL',
    vesselShape: 'beaker',
  },
  'chem-watch-glass': {
    instrumentId: 'chem-watch-glass',
    baseLabel: 'Watch Glass',
    defaultCapacity: 50,
    acceptedStates: ['Solid', 'Liquid', 'Aqueous Solution'],
    unit: 'mL',
    vesselShape: 'beaker',
  },
  'chem-petri-dish': {
    instrumentId: 'chem-petri-dish',
    baseLabel: 'Petri Dish',
    defaultCapacity: 40,
    acceptedStates: ['Liquid', 'Aqueous Solution', 'Solid'],
    unit: 'mL',
    vesselShape: 'beaker',
  },
  'chem-funnel': {
    instrumentId: 'chem-funnel',
    baseLabel: 'Filter Funnel',
    defaultCapacity: 150,
    acceptedStates: ['Liquid', 'Aqueous Solution'],
    unit: 'mL',
    vesselShape: 'conical-flask',
  },
};

export function isReceivingVessel(instrumentId: string): boolean {
  return instrumentId in RECEIVING_CONTAINER_SPECS;
}

export function getContainerCapacity(item: WorkbenchItem): number {
  const spec = RECEIVING_CONTAINER_SPECS[item.instrumentId];
  if (!spec) return 0;
  if (item.instrumentId === 'chem-beaker' && typeof item.config?.beakerSize === 'number') {
    return Math.max(50, item.config.beakerSize);
  }
  return spec.defaultCapacity;
}

export function getBottleDisplayLabel(chemItem: WorkbenchChemicalItem, chem?: ChemicalSubstance): string {
  const substance = chem ?? getChemicalById(chemItem.chemicalId);
  if (!substance) return 'Chemical bottle';
  if (substance.commonName === 'Water') return 'Water bottle';
  const short = substance.name.split('(')[0].trim();
  return `${short} bottle`;
}

export function getShortMaterialName(substance: ChemicalSubstance): string {
  if (substance.commonName === 'Water') return 'water';
  return substance.name.split('(')[0].trim().toLowerCase();
}

export function buildNumberedInstrumentLabels(items: WorkbenchItem[]): Record<string, string> {
  const counts: Record<string, number> = {};
  const totals: Record<string, number> = {};

  const getBaseName = (instId: string, inst?: LabInstrument): string => {
    const spec = RECEIVING_CONTAINER_SPECS[instId];
    if (spec) return spec.baseLabel;
    return inst?.name.split('(')[0].trim() ?? 'Apparatus';
  };

  for (const item of items) {
    const inst = getInstrumentById(item.instrumentId);
    const base = getBaseName(item.instrumentId, inst);
    totals[base] = (totals[base] ?? 0) + 1;
  }

  const labels: Record<string, string> = {};
  for (const item of items) {
    const inst = getInstrumentById(item.instrumentId);
    const base = getBaseName(item.instrumentId, inst);
    counts[base] = (counts[base] ?? 0) + 1;
    // Always number receiving vessels cleanly (e.g. "Beaker 1", "Beaker 2")
    if (isReceivingVessel(item.instrumentId) || totals[base] > 1) {
      labels[item.instanceId] = `${base} ${counts[base]}`;
    } else {
      labels[item.instanceId] = base;
    }
  }
  return labels;
}

export function getVesselCurrentAmount(
  vesselInstanceId: string,
  mixtures: VesselMixtureEntry[]
): number {
  const sum = mixtures
    .filter((m) => m.vesselInstanceId === vesselInstanceId)
    .reduce((acc, m) => acc + (Number.isFinite(m.amountMlOrG) ? m.amountMlOrG : 0), 0);
  return Number(sum.toFixed(2));
}

export function getVesselLiquidVisual(
  vesselInstanceId: string,
  mixtures: VesselMixtureEntry[],
  capacity: number
): {
  fillRatio01: number;
  currentAmount: number;
  liquidColorHex: string;
  liquidOpacity: number;
  isEmpty: boolean;
} {
  const entries = mixtures.filter((m) => m.vesselInstanceId === vesselInstanceId && m.amountMlOrG > 0);
  const currentAmount = Number(
    entries.reduce((acc, m) => acc + m.amountMlOrG, 0).toFixed(2)
  );
  if (currentAmount <= 0 || entries.length === 0) {
    return {
      fillRatio01: 0,
      currentAmount: 0,
      liquidColorHex: '#38BDF8',
      liquidOpacity: 0,
      isEmpty: true,
    };
  }

  const subs = new Set(entries.map((e) => e.chemicalId));
  const hasHCl = subs.has('chem-sub-hcl') || subs.has('chem-sub-ch3cooh') || subs.has('chem-sub-h2so4');
  const hasBase = subs.has('chem-sub-naoh') || subs.has('chem-sub-koh') || subs.has('chem-sub-nahco3');
  const hasPheno = subs.has('chem-sub-phenol') || subs.has('chem-sub-phenolphthalein');
  const hasUniversal = subs.has('chem-sub-universal');
  const hasMethylOrange = subs.has('chem-sub-methyl-orange');

  let liquidColorHex = '#38BDF8';
  let liquidOpacity = 0.62;

  if (subs.has('chem-sub-cuso4')) {
    liquidColorHex = subs.has('chem-sub-fe') ? '#6EE7B7' : '#0EA5E9';
    liquidOpacity = 0.72;
  } else if (hasUniversal) {
    if (hasHCl && !hasBase) liquidColorHex = '#EF4444';
    else if (hasBase && !hasHCl) liquidColorHex = '#6366F1';
    else if (hasHCl && hasBase) {
      const acidAmt = entries
        .filter((e) => ['chem-sub-hcl', 'chem-sub-ch3cooh', 'chem-sub-h2so4'].includes(e.chemicalId))
        .reduce((a, b) => a + b.amountMlOrG, 0);
      const baseAmt = entries
        .filter((e) => ['chem-sub-naoh', 'chem-sub-koh', 'chem-sub-nahco3'].includes(e.chemicalId))
        .reduce((a, b) => a + b.amountMlOrG, 0);
      liquidColorHex = Math.abs(acidAmt - baseAmt) < 1 ? '#10B981' : acidAmt > baseAmt ? '#F59E0B' : '#4F46E5';
    } else {
      liquidColorHex = '#10B981';
    }
    liquidOpacity = 0.74;
  } else if (hasPheno) {
    if (hasBase && !hasHCl) {
      liquidColorHex = '#EC4899';
      liquidOpacity = 0.72;
    } else if (hasBase && hasHCl) {
      const acidAmt = entries
        .filter((e) => ['chem-sub-hcl', 'chem-sub-ch3cooh', 'chem-sub-h2so4'].includes(e.chemicalId))
        .reduce((a, b) => a + b.amountMlOrG, 0);
      const baseAmt = entries
        .filter((e) => ['chem-sub-naoh', 'chem-sub-koh', 'chem-sub-nahco3'].includes(e.chemicalId))
        .reduce((a, b) => a + b.amountMlOrG, 0);
      liquidColorHex = baseAmt >= acidAmt ? '#EC4899' : '#BAE6FD';
      liquidOpacity = baseAmt >= acidAmt ? 0.72 : 0.45;
    } else {
      liquidColorHex = '#BAE6FD';
      liquidOpacity = 0.42;
    }
  } else if (hasMethylOrange) {
    liquidColorHex = hasHCl ? '#EF4444' : '#F59E0B';
    liquidOpacity = 0.72;
  } else if (subs.has('chem-sub-ethanol')) {
    liquidColorHex = '#C4B5FD';
    liquidOpacity = 0.52;
  } else if (hasHCl || hasBase || subs.has('chem-sub-h2o') || subs.has('chem-sub-saline-1m')) {
    liquidColorHex = '#38BDF8';
    liquidOpacity = 0.56;
  } else {
    const primaryChem = getChemicalById(entries[0].chemicalId);
    liquidColorHex = primaryChem?.bottleColor ?? '#38BDF8';
    liquidOpacity = 0.65;
  }

  const safeCap = Math.max(1, capacity);
  const fillRatio01 = Math.min(1, Math.max(0.05, currentAmount / safeCap));
  return {
    fillRatio01,
    currentAmount,
    liquidColorHex,
    liquidOpacity,
    isEmpty: false,
  };
}

export interface BoundingBox {
  id: string;
  xPx: number;
  yPx: number;
  width: number;
  height: number;
}

export interface ProximityCandidate {
  targetInstanceId: string;
  targetKind: 'inst' | 'chem';
  targetLabel: string;
  edgeDistancePx: number;
  centerDistancePx: number;
  isOverlapping: boolean;
  compatible: boolean;
  incompatibilityReason?: string;
  currentQuantity: number;
  capacity: number;
  unit: string;
}

export interface ProximityEvaluation {
  pairKeysInRange: string[];
  allDistancesByPairKey: Record<string, number>;
  compatibleTargets: ProximityCandidate[];
  incompatibleNearest: ProximityCandidate | null;
}

export function makePairKey(sourceId: string, targetId: string): string {
  return `${sourceId}::${targetId}`;
}

export function computeBoxEdgeDistance(a: BoundingBox, b: BoundingBox): {
  edgeDistancePx: number;
  centerDistancePx: number;
  isOverlapping: boolean;
} {
  const aLeft = a.xPx - a.width / 2;
  const aRight = a.xPx + a.width / 2;
  const aTop = a.yPx - a.height / 2;
  const aBottom = a.yPx + a.height / 2;

  const bLeft = b.xPx - b.width / 2;
  const bRight = b.xPx + b.width / 2;
  const bTop = b.yPx - b.height / 2;
  const bBottom = b.yPx + b.height / 2;

  const dx = Math.max(0, Math.max(aLeft - bRight, bLeft - aRight));
  const dy = Math.max(0, Math.max(aTop - bBottom, bTop - aBottom));
  const edgeDistancePx = Math.hypot(dx, dy);
  const centerDistancePx = Math.hypot(a.xPx - b.xPx, a.yPx - b.yPx);
  const isOverlapping = dx === 0 && dy === 0;

  return { edgeDistancePx, centerDistancePx, isOverlapping };
}

export function checkSourceTargetCompatibility(
  substance: ChemicalSubstance | undefined,
  targetInst: LabInstrument | undefined,
  targetKind: 'inst' | 'chem'
): { compatible: boolean; reason?: string } {
  if (!substance) {
    return { compatible: false, reason: 'Unknown source reagent.' };
  }
  if (targetKind === 'chem') {
    return {
      compatible: false,
      reason: 'Reagent bottles cannot pour directly into another reagent bottle. Place near a Beaker, Flask, or Cylinder.',
    };
  }
  if (!targetInst) {
    return { compatible: false, reason: 'Unrecognized workbench apparatus.' };
  }
  if (substance.stateAtRoomTemp === 'Gas') {
    return {
      compatible: false,
      reason: `${substance.name} is a gas cylinder and cannot be poured like a liquid into an open ${targetInst.name.split('(')[0].trim()}.`,
    };
  }
  const spec = RECEIVING_CONTAINER_SPECS[targetInst.id];
  if (!spec) {
    if (targetInst.visualKind === 'heater') {
      return {
        compatible: false,
        reason: `${targetInst.name.split('(')[0].trim()} cannot hold chemicals directly. Pour into a Beaker or Conical Flask instead.`,
      };
    }
    if (['thermometer', 'barometer', 'meter', 'sensor'].includes(targetInst.visualKind)) {
      return {
        compatible: false,
        reason: `${targetInst.name.split('(')[0].trim()} is a measurement probe, not a receiving container.`,
      };
    }
    if (targetInst.visualKind === 'balance') {
      return {
        compatible: false,
        reason: 'Place a Watch Glass, Beaker, or Crucible on the bench before transferring chemicals for weighing.',
      };
    }
    return {
      compatible: false,
      reason: `${targetInst.name.split('(')[0].trim()} is not a receiving vessel.`,
    };
  }
  if (!spec.acceptedStates.includes(substance.stateAtRoomTemp)) {
    return {
      compatible: false,
      reason: `${spec.baseLabel} is calibrated for liquid volumes and cannot receive ${substance.stateAtRoomTemp.toLowerCase()} samples.`,
    };
  }
  return { compatible: true };
}

export function evaluateBottleProximity(params: {
  sourceBottle: WorkbenchChemicalItem;
  workbenchItems: WorkbenchItem[];
  otherBottles: WorkbenchChemicalItem[];
  vesselMixtures: VesselMixtureEntry[];
  benchWidthPx: number;
  benchHeightPx: number;
}): ProximityEvaluation {
  const { sourceBottle, workbenchItems, otherBottles, vesselMixtures, benchWidthPx, benchHeightPx } = params;
  const w = Math.max(320, benchWidthPx);
  const h = Math.max(260, benchHeightPx);
  const isCompact = w < 520;
  const bottleBox: BoundingBox = {
    id: sourceBottle.instanceId,
    xPx: (sourceBottle.xPercent / 100) * w,
    yPx: (sourceBottle.yPercent / 100) * h,
    width: isCompact ? 54 : 68,
    height: isCompact ? 66 : 82,
  };

  const substance = getChemicalById(sourceBottle.chemicalId);
  const labels = buildNumberedInstrumentLabels(workbenchItems);
  const allDistancesByPairKey: Record<string, number> = {};
  const compatibleTargets: ProximityCandidate[] = [];
  let incompatibleNearest: ProximityCandidate | null = null;

  for (const item of workbenchItems) {
    const inst = getInstrumentById(item.instrumentId);
    const instBox: BoundingBox = {
      id: item.instanceId,
      xPx: (item.xPercent / 100) * w,
      yPx: (item.yPercent / 100) * h,
      width: isCompact ? 68 : 88,
      height: isCompact ? 76 : 96,
    };
    const { edgeDistancePx, centerDistancePx, isOverlapping } = computeBoxEdgeDistance(bottleBox, instBox);
    const key = makePairKey(sourceBottle.instanceId, item.instanceId);
    allDistancesByPairKey[key] = edgeDistancePx;

    const compat = checkSourceTargetCompatibility(substance, inst, 'inst');
    const capacity = getContainerCapacity(item);
    const currentQuantity = getVesselCurrentAmount(item.instanceId, vesselMixtures);

    if (edgeDistancePx <= PROXIMITY_THRESHOLD_PX || isOverlapping) {
      const candidate: ProximityCandidate = {
        targetInstanceId: item.instanceId,
        targetKind: 'inst',
        targetLabel: labels[item.instanceId] ?? inst?.name ?? 'Container',
        edgeDistancePx,
        centerDistancePx,
        isOverlapping,
        compatible: compat.compatible,
        incompatibilityReason: compat.reason,
        currentQuantity,
        capacity,
        unit: sourceBottle.unit === 'g' ? 'g' : 'mL',
      };
      if (compat.compatible) {
        compatibleTargets.push(candidate);
      } else if (
        (isOverlapping || edgeDistancePx <= PROXIMITY_THRESHOLD_PX - 12) &&
        (!incompatibleNearest || edgeDistancePx < incompatibleNearest.edgeDistancePx)
      ) {
        incompatibleNearest = candidate;
      }
    }
  }

  for (const other of otherBottles) {
    if (other.instanceId === sourceBottle.instanceId) continue;
    const otherBox: BoundingBox = {
      id: other.instanceId,
      xPx: (other.xPercent / 100) * w,
      yPx: (other.yPercent / 100) * h,
      width: isCompact ? 54 : 68,
      height: isCompact ? 66 : 82,
    };
    const { edgeDistancePx, centerDistancePx, isOverlapping } = computeBoxEdgeDistance(bottleBox, otherBox);
    const key = makePairKey(sourceBottle.instanceId, other.instanceId);
    allDistancesByPairKey[key] = edgeDistancePx;

    if (isOverlapping || edgeDistancePx <= 22) {
      const candidate: ProximityCandidate = {
        targetInstanceId: other.instanceId,
        targetKind: 'chem',
        targetLabel: getBottleDisplayLabel(other),
        edgeDistancePx,
        centerDistancePx,
        isOverlapping,
        compatible: false,
        incompatibilityReason:
          'Reagent bottles cannot be poured directly into another reagent bottle. Move beside a Beaker, Conical Flask, or Cylinder.',
        currentQuantity: other.amount,
        capacity: other.capacity ?? other.amount,
        unit: other.unit,
      };
      if (!incompatibleNearest || edgeDistancePx < incompatibleNearest.edgeDistancePx) {
        incompatibleNearest = candidate;
      }
    }
  }

  compatibleTargets.sort((a, b) => {
    if (a.isOverlapping !== b.isOverlapping) return a.isOverlapping ? -1 : 1;
    if (Math.abs(a.edgeDistancePx - b.edgeDistancePx) > 4) {
      return a.edgeDistancePx - b.edgeDistancePx;
    }
    return a.centerDistancePx - b.centerDistancePx;
  });

  return {
    pairKeysInRange: compatibleTargets.map((t) => makePairKey(sourceBottle.instanceId, t.targetInstanceId)),
    allDistancesByPairKey,
    compatibleTargets,
    incompatibleNearest,
  };
}

export function getAllowedTransferUnits(substance: ChemicalSubstance | undefined): string[] {
  if (!substance) return ['mL'];
  if (substance.stateAtRoomTemp === 'Solid') return ['g', 'mg'];
  if (substance.category === 'Indicator') return ['mL', 'drops'];
  return ['mL', 'L'];
}

export function getQuickAmountPresets(
  substance: ChemicalSubstance | undefined,
  unit: string
): { label: string; value: number }[] {
  if (unit === 'L') {
    return [
      { label: '0.01 L', value: 0.01 },
      { label: '0.025 L', value: 0.025 },
      { label: '0.05 L', value: 0.05 },
      { label: '0.1 L', value: 0.1 },
    ];
  }
  if (unit === 'drops') {
    return [
      { label: '5 drops', value: 5 },
      { label: '10 drops', value: 10 },
      { label: '20 drops', value: 20 },
      { label: '40 drops', value: 40 },
    ];
  }
  if (unit === 'mg') {
    return [
      { label: '250 mg', value: 250 },
      { label: '500 mg', value: 500 },
      { label: '1000 mg', value: 1000 },
      { label: '2500 mg', value: 2500 },
    ];
  }
  if (substance?.stateAtRoomTemp === 'Solid' || unit === 'g') {
    return [
      { label: '1 g', value: 1 },
      { label: '2 g', value: 2 },
      { label: '5 g', value: 5 },
      { label: '10 g', value: 10 },
    ];
  }
  return [
    { label: '5 mL', value: 5 },
    { label: '10 mL', value: 10 },
    { label: '20 mL', value: 20 },
    { label: '50 mL', value: 50 },
  ];
}

export function convertTransferQuantity(
  amount: number,
  fromUnit: string,
  baseUnit: string
): { ok: boolean; normalizedAmount: number; error?: string } {
  if (!Number.isFinite(amount) || amount <= 0) {
    return { ok: false, normalizedAmount: 0, error: 'Enter a positive transfer quantity greater than 0.' };
  }
  if (fromUnit === baseUnit) {
    return { ok: true, normalizedAmount: Number(amount.toFixed(3)) };
  }
  if (baseUnit === 'mL') {
    if (fromUnit === 'L') return { ok: true, normalizedAmount: Number((amount * 1000).toFixed(3)) };
    if (fromUnit === 'drops') return { ok: true, normalizedAmount: Number((amount / 20).toFixed(3)) };
    return { ok: false, normalizedAmount: 0, error: `Invalid unit "${fromUnit}" for liquid volume transfer (expected mL, L, or drops).` };
  }
  if (baseUnit === 'g') {
    if (fromUnit === 'mg') return { ok: true, normalizedAmount: Number((amount / 1000).toFixed(4)) };
    return { ok: false, normalizedAmount: 0, error: `Invalid unit "${fromUnit}" for solid mass transfer (expected g or mg).` };
  }
  return { ok: false, normalizedAmount: 0, error: `Unsupported unit conversion from ${fromUnit} to ${baseUnit}.` };
}

export interface TransferValidationResult {
  valid: boolean;
  errorCode?:
    | 'LOCKED'
    | 'EMPTY_SOURCE'
    | 'INVALID_QUANTITY'
    | 'INVALID_UNIT'
    | 'EXCEEDS_SOURCE'
    | 'EXCEEDS_CAPACITY'
    | 'INCOMPATIBLE_TARGET'
    | 'SAFETY_BLOCKED';
  errorMessage?: string;
  normalizedAmount: number;
  sourceAfter: number;
  destAfter: number;
  remainingCapacity: number;
}

export function validateTransferAttempt(params: {
  sourceBottle: WorkbenchChemicalItem;
  targetItem: WorkbenchItem;
  requestedAmount: number;
  requestedUnit: string;
  vesselMixtures: VesselMixtureEntry[];
  lockedIds: Set<string>;
  heaterNearTarget?: boolean;
  liveTempC?: number;
  isSimRunning?: boolean;
}): TransferValidationResult {
  const {
    sourceBottle,
    targetItem,
    requestedAmount,
    requestedUnit,
    vesselMixtures,
    lockedIds,
    heaterNearTarget = false,
    liveTempC = 25,
    isSimRunning = false,
  } = params;

  const substance = getChemicalById(sourceBottle.chemicalId);
  const targetInst = getInstrumentById(targetItem.instrumentId);
  const capacity = getContainerCapacity(targetItem);
  const currentDest = getVesselCurrentAmount(targetItem.instanceId, vesselMixtures);

  if (lockedIds.has(sourceBottle.instanceId) || lockedIds.has(targetItem.instanceId)) {
    return {
      valid: false,
      errorCode: 'LOCKED',
      errorMessage: 'A pour is already in progress for this bottle or vessel. Wait for it to finish.',
      normalizedAmount: 0,
      sourceAfter: sourceBottle.amount,
      destAfter: currentDest,
      remainingCapacity: Math.max(0, Number((capacity - currentDest).toFixed(2))),
    };
  }

  const compat = checkSourceTargetCompatibility(substance, targetInst, 'inst');
  if (!compat.compatible) {
    return {
      valid: false,
      errorCode: 'INCOMPATIBLE_TARGET',
      errorMessage: compat.reason || 'Target container cannot receive this substance.',
      normalizedAmount: 0,
      sourceAfter: sourceBottle.amount,
      destAfter: currentDest,
      remainingCapacity: Math.max(0, Number((capacity - currentDest).toFixed(2))),
    };
  }

  if (sourceBottle.amount <= 0) {
    return {
      valid: false,
      errorCode: 'EMPTY_SOURCE',
      errorMessage: `${getBottleDisplayLabel(sourceBottle, substance)} is empty (0 ${sourceBottle.unit} remaining).`,
      normalizedAmount: 0,
      sourceAfter: 0,
      destAfter: currentDest,
      remainingCapacity: Math.max(0, Number((capacity - currentDest).toFixed(2))),
    };
  }

  const conv = convertTransferQuantity(requestedAmount, requestedUnit, sourceBottle.unit);
  if (!conv.ok) {
    const code = conv.error?.includes('Invalid unit') ? 'INVALID_UNIT' : 'INVALID_QUANTITY';
    return {
      valid: false,
      errorCode: code,
      errorMessage: conv.error,
      normalizedAmount: 0,
      sourceAfter: sourceBottle.amount,
      destAfter: currentDest,
      remainingCapacity: Math.max(0, Number((capacity - currentDest).toFixed(2))),
    };
  }

  const transferQty = conv.normalizedAmount;
  const sourceAfterRaw = sourceBottle.amount - transferQty;
  const destAfterRaw = currentDest + transferQty;
  const remainingCapRaw = capacity - destAfterRaw;

  if (sourceAfterRaw < -0.0001) {
    return {
      valid: false,
      errorCode: 'EXCEEDS_SOURCE',
      errorMessage: `Cannot pour ${transferQty} ${sourceBottle.unit}: only ${sourceBottle.amount} ${sourceBottle.unit} available in ${getBottleDisplayLabel(sourceBottle, substance)}.`,
      normalizedAmount: transferQty,
      sourceAfter: Number(sourceAfterRaw.toFixed(2)),
      destAfter: Number(destAfterRaw.toFixed(2)),
      remainingCapacity: Number(remainingCapRaw.toFixed(2)),
    };
  }

  if (destAfterRaw > capacity + 0.0001) {
    const spaceLeft = Math.max(0, Number((capacity - currentDest).toFixed(2)));
    return {
      valid: false,
      errorCode: 'EXCEEDS_CAPACITY',
      errorMessage: `Overflow blocked: ${targetInst?.name.split('(')[0].trim() ?? 'Vessel'} only has ${spaceLeft} ${sourceBottle.unit} capacity remaining (capacity ${capacity} ${sourceBottle.unit}).`,
      normalizedAmount: transferQty,
      sourceAfter: Number(Math.max(0, sourceAfterRaw).toFixed(2)),
      destAfter: Number(destAfterRaw.toFixed(2)),
      remainingCapacity: Number(remainingCapRaw.toFixed(2)),
    };
  }

  // Chemical safety checks inside target vessel
  const existingChemIds = new Set(
    vesselMixtures
      .filter((m) => m.vesselInstanceId === targetItem.instanceId && m.amountMlOrG > 0)
      .map((m) => m.chemicalId)
  );
  if (
    (sourceBottle.chemicalId === 'chem-sub-h2so4' && existingChemIds.has('chem-sub-na')) ||
    (sourceBottle.chemicalId === 'chem-sub-na' && existingChemIds.has('chem-sub-h2so4'))
  ) {
    return {
      valid: false,
      errorCode: 'SAFETY_BLOCKED',
      errorMessage: 'Safety Guardian blocked pouring reactive metal with concentrated acid.',
      normalizedAmount: transferQty,
      sourceAfter: sourceBottle.amount,
      destAfter: currentDest,
      remainingCapacity: Math.max(0, Number((capacity - currentDest).toFixed(2))),
    };
  }

  if (
    sourceBottle.chemicalId === 'chem-sub-ethanol' &&
    heaterNearTarget &&
    (isSimRunning || liveTempC > 55)
  ) {
    return {
      valid: false,
      errorCode: 'SAFETY_BLOCKED',
      errorMessage: 'Safety Guardian blocked pouring flammable Ethanol into an actively heated vessel (> 55 °C). Turn off and cool the heater first.',
      normalizedAmount: transferQty,
      sourceAfter: sourceBottle.amount,
      destAfter: currentDest,
      remainingCapacity: Math.max(0, Number((capacity - currentDest).toFixed(2))),
    };
  }

  return {
    valid: true,
    normalizedAmount: transferQty,
    sourceAfter: Math.max(0, Number(sourceAfterRaw.toFixed(2))),
    destAfter: Number(destAfterRaw.toFixed(2)),
    remainingCapacity: Math.max(0, Number(remainingCapRaw.toFixed(2))),
  };
}

const SUBSTANCE_DENSITIES_G_CM3: Record<string, number> = {
  'chem-sub-h2o': 1.0,
  'chem-sub-ethanol': 0.789,
  'chem-sub-saline-1m': 1.04,
  'chem-sub-nacl': 2.16,
  'chem-sub-hcl': 1.02,
  'chem-sub-naoh': 1.04,
  'chem-sub-cuso4': 1.12,
  'chem-sub-cu': 8.96,
  'chem-sub-fe': 7.87,
  'chem-sub-zn': 7.14,
  'chem-sub-mg': 1.74,
};

export function deriveExperimentSyncFromWorkbench(params: {
  experimentId: string;
  workbenchItems: WorkbenchItem[];
  vesselMixtures: VesselMixtureEntry[];
  connections: WorkbenchConnection[];
  currentParams: Record<string, number>;
}): ChemistryBenchSyncState {
  const { experimentId, workbenchItems, vesselMixtures, currentParams } = params;
  const labels = buildNumberedInstrumentLabels(workbenchItems);

  const vesselSummaries = workbenchItems
    .filter((w) => isReceivingVessel(w.instrumentId))
    .map((v) => {
      const cap = getContainerCapacity(v);
      const entries = vesselMixtures.filter(
        (m) => m.vesselInstanceId === v.instanceId && m.amountMlOrG > 0
      );
      const currentAmount = Number(entries.reduce((a, b) => a + b.amountMlOrG, 0).toFixed(2));
      const substancesSummary =
        entries.length === 0
          ? 'Empty'
          : entries
              .map((e) => {
                const sub = getChemicalById(e.chemicalId);
                return `${sub?.symbol ?? e.chemicalId} (${e.amountMlOrG} ${e.unit})`;
              })
              .join(' + ');
      return {
        instanceId: v.instanceId,
        label: labels[v.instanceId] ?? 'Vessel',
        currentAmount,
        capacity: cap,
        unit: 'mL',
        substancesSummary,
      };
    });

  const totalTransferredMlOrG = Number(
    vesselMixtures.reduce((acc, m) => acc + Math.max(0, m.amountMlOrG), 0).toFixed(2)
  );
  const hasPouredContent = totalTransferredMlOrG > 0;
  const derivedParams: Record<string, number> = { ...currentParams };
  let summaryNote = hasPouredContent
    ? `Synced ${totalTransferredMlOrG} mL/g across ${vesselSummaries.filter((v) => v.currentAmount > 0).length} workbench vessel(s).`
    : 'Pour reagents into a vessel to populate live experiment measurements.';

  if (!hasPouredContent) {
    return {
      experimentId,
      hasPouredContent: false,
      totalTransferredMlOrG: 0,
      derivedParams,
      vesselSummaries,
      summaryNote,
    };
  }

  // Sum poured substances across active vessels
  const totalsByChem: Record<string, number> = {};
  for (const m of vesselMixtures) {
    totalsByChem[m.chemicalId] = (totalsByChem[m.chemicalId] ?? 0) + m.amountMlOrG;
  }

  if (experimentId === 'acid-ph') {
    const acidVol =
      (totalsByChem['chem-sub-hcl'] ?? 0) +
      (totalsByChem['chem-sub-h2so4'] ?? 0) * 2 +
      (totalsByChem['chem-sub-ch3cooh'] ?? 0) * 0.15;
    const baseVol = (totalsByChem['chem-sub-naoh'] ?? 0) + (totalsByChem['chem-sub-koh'] ?? 0);
    const totalLiquid = Math.max(1, totalTransferredMlOrG);
    // Assume 0.1 M stock bottle reagents diluted into total vessel volume
    const netAcidMoles = Math.max(0.0001, (acidVol - baseVol) * 0.1) / totalLiquid;
    const clampedC = Math.min(1.0, Math.max(0.0001, Number(netAcidMoles.toFixed(4))));
    if (acidVol > 0) {
      derivedParams.concentration = clampedC;
      summaryNote = `Derived [H⁺] = ${clampedC} mol/L from ${acidVol.toFixed(1)} mL acid in ${totalLiquid.toFixed(1)} mL total mixture.`;
    }
  } else if (experimentId === 'acid-base-titration') {
    const baseAdded =
      (totalsByChem['chem-sub-naoh'] ?? 0) + (totalsByChem['chem-sub-koh'] ?? 0);
    const acidVol = totalsByChem['chem-sub-hcl'] ?? 0;
    derivedParams.baseVolume = Math.min(50, Math.max(0, Number(baseAdded.toFixed(1))));
    if (acidVol > 0) {
      // Scale effective acidMolarity relative to 25 mL 0.1 M reference if student poured different HCl amount
      const effectiveCa = Math.min(0.25, Math.max(0.05, Number(((acidVol / 25) * 0.1).toFixed(2))));
      derivedParams.acidMolarity = effectiveCa;
    }
    summaryNote = `Synced ${derivedParams.baseVolume} mL NaOH titrant & ${acidVol.toFixed(1)} mL HCl analyte from workbench vessels.`;
  } else if (experimentId === 'mass-volume-density') {
    let totalMassG = 0;
    let totalVolCm3 = 0;
    for (const [chemId, amt] of Object.entries(totalsByChem)) {
      const rho = SUBSTANCE_DENSITIES_G_CM3[chemId] ?? 1.0;
      const sub = getChemicalById(chemId);
      if (sub?.stateAtRoomTemp === 'Solid') {
        totalMassG += amt;
        totalVolCm3 += amt / rho;
      } else {
        totalVolCm3 += amt;
        totalMassG += amt * rho;
      }
    }
    if (totalVolCm3 > 0) {
      const avgRho = Math.min(19.3, Math.max(0.2, Number((totalMassG / totalVolCm3).toFixed(2))));
      const clampedVol = Math.min(500, Math.max(5, Math.round(totalVolCm3)));
      derivedParams.density = avgRho;
      derivedParams.volume = clampedVol;
      summaryNote = `Derived ρ = ${avgRho} g/cm³, V = ${clampedVol} cm³ (m ≈ ${totalMassG.toFixed(1)} g) from poured vessel contents.`;
    }
  }

  return {
    experimentId,
    hasPouredContent,
    totalTransferredMlOrG,
    derivedParams,
    vesselSummaries,
    summaryNote,
  };
}
