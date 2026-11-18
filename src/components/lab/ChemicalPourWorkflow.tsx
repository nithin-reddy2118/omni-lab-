import React, { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  CheckCircle2,
  Droplets,
  X,
} from 'lucide-react';
import {
  getAllowedTransferUnits,
  getBottleDisplayLabel,
  getContainerCapacity,
  getQuickAmountPresets,
  getShortMaterialName,
  getVesselCurrentAmount,
  validateTransferAttempt,
  type ProximityCandidate,
} from '../../engine/chemistryBenchEngine';
import type {
  ChemicalSubstance,
  TransferHistoryEntry,
  VesselMixtureEntry,
  WorkbenchChemicalItem,
  WorkbenchItem,
} from '../../types/science';
import { Modal } from '../ui/Modal';

export interface ActivePourPrompt {
  sourceInstanceId: string;
  candidates: ProximityCandidate[];
  selectedTargetId: string | null;
  anchorXPercent: number;
  anchorYPercent: number;
}

interface PourProximityPopupProps {
  prompt: ActivePourPrompt;
  sourceBottle: WorkbenchChemicalItem;
  sourceSubstance: ChemicalSubstance;
  onSelectTarget: (targetInstanceId: string) => void;
  onOpenQuantityModal: (targetInstanceId: string) => void;
  onDismiss: () => void;
}

export function PourProximityPopup({
  prompt,
  sourceBottle,
  sourceSubstance,
  onSelectTarget,
  onOpenQuantityModal,
  onDismiss,
}: PourProximityPopupProps) {
  const bottleLabel = getBottleDisplayLabel(sourceBottle, sourceSubstance);
  const materialName = getShortMaterialName(sourceSubstance);
  const singleTarget = prompt.candidates.length === 1 ? prompt.candidates[0] : null;
  const activeTarget =
    singleTarget ??
    prompt.candidates.find((c) => c.targetInstanceId === prompt.selectedTargetId) ??
    null;

  // Smart workbench-clamped positioning so popup never clips out of the benchtop
  const clampedLeft = Math.min(72, Math.max(28, prompt.anchorXPercent));
  const showBelow = prompt.anchorYPercent < 42;

  return (
    <div
      role="dialog"
      aria-label="Ready to pour prompt"
      onPointerDown={(e) => e.stopPropagation()}
      style={{
        left: `${clampedLeft}%`,
        top: showBelow
          ? `${Math.min(70, prompt.anchorYPercent + 14)}%`
          : `${Math.max(16, prompt.anchorYPercent - 16)}%`,
        transform: showBelow ? 'translate(-50%, 0)' : 'translate(-50%, -100%)',
      }}
      className="absolute z-40 w-[min(320px,calc(100%-24px))] rounded-xl border-2 border-emerald-400 bg-white p-3.5 shadow-2xl space-y-2.5 text-slate-900"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-1.5 text-[11px] font-mono font-bold uppercase tracking-wider text-emerald-700">
          <Droplets className="w-3.5 h-3.5 shrink-0" />
          READY TO POUR?
        </div>
        <button
          type="button"
          onClick={onDismiss}
          aria-label="Dismiss pour prompt"
          className="p-1 rounded-md text-slate-400 hover:text-slate-800 hover:bg-slate-100"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {singleTarget ? (
        <div className="space-y-1 text-xs">
          <p className="font-semibold text-slate-900">
            {bottleLabel} is near {singleTarget.targetLabel}.
          </p>
          <p className="text-slate-600 leading-snug">
            Would you like to transfer {materialName} into this{' '}
            {singleTarget.targetLabel.toLowerCase()}?
          </p>
        </div>
      ) : (
        <div className="space-y-2 text-xs">
          <p className="font-semibold text-slate-900">
            {bottleLabel} is near {prompt.candidates.length} containers.
          </p>
          <p className="text-slate-600">Select the container you want to pour into:</p>
          <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
            {prompt.candidates.map((cand) => {
              const selected = cand.targetInstanceId === prompt.selectedTargetId;
              return (
                <button
                  key={cand.targetInstanceId}
                  type="button"
                  onClick={() => onSelectTarget(cand.targetInstanceId)}
                  className={`w-full rounded-lg border px-2.5 py-2 text-left flex items-center justify-between gap-2 transition-colors min-h-[40px] ${
                    selected
                      ? 'border-blue-600 bg-blue-50 text-blue-950 font-semibold'
                      : 'border-slate-200 bg-slate-50 text-slate-800 hover:border-blue-400'
                  }`}
                >
                  <span className="truncate">{cand.targetLabel}</span>
                  <span className="font-mono text-[11px] tabular-nums text-slate-600 shrink-0">
                    {cand.currentQuantity}/{cand.capacity} {cand.unit}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2 pt-0.5">
        <button
          type="button"
          disabled={!activeTarget || sourceBottle.amount <= 0}
          onClick={() => activeTarget && onOpenQuantityModal(activeTarget.targetInstanceId)}
          className="flex-1 px-3 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 disabled:opacity-40 min-h-[44px] flex items-center justify-center gap-1.5"
        >
          <Droplets className="w-3.5 h-3.5" />
          POUR
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-700 hover:bg-slate-100 min-h-[44px]"
        >
          NOT NOW
        </button>
      </div>
    </div>
  );
}

interface PourQuantityModalProps {
  open: boolean;
  sourceBottle: WorkbenchChemicalItem | null;
  sourceSubstance: ChemicalSubstance | null;
  targetItem: WorkbenchItem | null;
  targetLabel: string;
  vesselMixtures: VesselMixtureEntry[];
  lockedIds: Set<string>;
  heaterNearTarget: boolean;
  liveTempC: number;
  isSimRunning: boolean;
  onConfirmPour: (requestedAmount: number, requestedUnit: string) => void;
  onCancel: (reason?: string) => void;
}

export function PourQuantityModal({
  open,
  sourceBottle,
  sourceSubstance,
  targetItem,
  targetLabel,
  vesselMixtures,
  lockedIds,
  heaterNearTarget,
  liveTempC,
  isSimRunning,
  onConfirmPour,
  onCancel,
}: PourQuantityModalProps) {
  const baseUnit = sourceBottle?.unit ?? 'mL';
  const allowedUnits = useMemo(
    () => getAllowedTransferUnits(sourceSubstance ?? undefined),
    [sourceSubstance]
  );

  const [selectedUnit, setSelectedUnit] = useState<string>(baseUnit);
  const [amountInput, setAmountInput] = useState<string>('10');
  const [customMode, setCustomMode] = useState<boolean>(false);

  useEffect(() => {
    if (open && sourceBottle) {
      setSelectedUnit(sourceBottle.unit);
      const defaultAmt =
        sourceBottle.unit === 'g'
          ? Math.min(sourceBottle.amount, 2)
          : Math.min(sourceBottle.amount, 10);
      setAmountInput(String(defaultAmt > 0 ? defaultAmt : 10));
      setCustomMode(false);
    }
  }, [open, sourceBottle?.instanceId]);

  if (!open || !sourceBottle || !sourceSubstance || !targetItem) {
    return null;
  }

  const bottleLabel = getBottleDisplayLabel(sourceBottle, sourceSubstance);
  const destCapacity = getContainerCapacity(targetItem);
  const destCurrent = getVesselCurrentAmount(targetItem.instanceId, vesselMixtures);
  const parsedAmount = Number(amountInput);

  const validation = validateTransferAttempt({
    sourceBottle,
    targetItem,
    requestedAmount: Number.isFinite(parsedAmount) ? parsedAmount : 0,
    requestedUnit: selectedUnit,
    vesselMixtures,
    lockedIds,
    heaterNearTarget,
    liveTempC,
    isSimRunning,
  });

  const quickPresets = getQuickAmountPresets(sourceSubstance, selectedUnit);

  // Max value in current display unit for slider
  const maxSlider = (() => {
    if (selectedUnit === 'L') return Number((sourceBottle.amount / 1000).toFixed(3));
    if (selectedUnit === 'drops') return Math.round(sourceBottle.amount * 20);
    if (selectedUnit === 'mg') return Math.round(sourceBottle.amount * 1000);
    return Math.max(sourceBottle.amount, 1);
  })();

  const sliderStep =
    selectedUnit === 'L' ? 0.005 : selectedUnit === 'drops' ? 1 : selectedUnit === 'mg' ? 50 : 1;

  const existingMix = vesselMixtures.filter(
    (m) => m.vesselInstanceId === targetItem.instanceId && m.amountMlOrG > 0
  );

  return (
    <Modal open={open} onClose={() => onCancel('Cancelled transfer panel')} title="Prepare Liquid & Reagent Transfer">
      <div className="space-y-4 text-xs sm:text-sm">
        {/* Source & Destination Cards */}
        <div className="grid sm:grid-cols-2 gap-3">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Source
            </div>
            <div className="text-sm font-bold text-slate-900">{bottleLabel}</div>
            <div className="text-[11px] font-mono text-slate-600">
              {sourceSubstance.symbol} · {sourceSubstance.standardConcentrationOrPurity}
            </div>
            <div className="pt-1 text-xs text-slate-700">
              Available quantity:{' '}
              <span className="font-mono font-bold tabular-nums text-emerald-700">
                {sourceBottle.amount} {sourceBottle.unit}
              </span>
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-1">
            <div className="text-[10px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
              Destination
            </div>
            <div className="text-sm font-bold text-slate-900">{targetLabel}</div>
            <div className="text-xs text-slate-700 flex items-center justify-between">
              <span>Current quantity:</span>
              <span className="font-mono font-bold tabular-nums text-blue-700">
                {destCurrent} {baseUnit}
              </span>
            </div>
            <div className="text-xs text-slate-700 flex items-center justify-between">
              <span>Capacity:</span>
              <span className="font-mono font-semibold tabular-nums text-slate-900">
                {destCapacity} {baseUnit}
              </span>
            </div>
            {existingMix.length > 0 && (
              <div className="text-[11px] text-slate-500 pt-0.5 truncate">
                Contains: {existingMix.map((e) => `${e.amountMlOrG}${e.unit}`).join(' + ')}
              </div>
            )}
          </div>
        </div>

        {/* Transfer Input + Unit + Slider + Quick Choices */}
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-3.5 space-y-3">
          <div className="font-semibold text-slate-900">
            How much would you like to pour?
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex-1 min-w-[140px]">
              <label htmlFor="pour-amount-input" className="sr-only">
                Transfer quantity
              </label>
              <input
                id="pour-amount-input"
                type="number"
                min={0}
                step="any"
                value={amountInput}
                onChange={(e) => {
                  setAmountInput(e.target.value);
                  setCustomMode(true);
                }}
                className="w-full px-3 py-2.5 rounded-lg border border-slate-300 bg-white font-mono text-base font-bold text-slate-900 tabular-nums focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label htmlFor="pour-unit-select" className="sr-only">
                Quantity unit
              </label>
              <select
                id="pour-unit-select"
                value={selectedUnit}
                onChange={(e) => setSelectedUnit(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-slate-300 bg-white font-mono text-sm font-semibold text-slate-900 min-h-[44px]"
              >
                {allowedUnits.map((u) => (
                  <option key={u} value={u}>
                    {u}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Slider */}
          <div className="space-y-1">
            <input
              type="range"
              aria-label="Adjust transfer quantity"
              min={0}
              max={maxSlider}
              step={sliderStep}
              value={
                Number.isFinite(parsedAmount)
                  ? Math.min(maxSlider, Math.max(0, parsedAmount))
                  : 0
              }
              onChange={(e) => {
                setAmountInput(e.target.value);
                setCustomMode(false);
              }}
              className="w-full accent-blue-700 cursor-pointer"
            />
            <div className="flex justify-between text-[11px] font-mono text-slate-500 tabular-nums">
              <span>0 {selectedUnit}</span>
              <span>Max available: {maxSlider} {selectedUnit}</span>
            </div>
          </div>

          {/* Quick Quantity Choices */}
          <div className="flex flex-wrap gap-1.5">
            {quickPresets.map((preset) => {
              const active = !customMode && Math.abs(parsedAmount - preset.value) < 0.0001;
              return (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setAmountInput(String(preset.value));
                    setCustomMode(false);
                  }}
                  className={`px-3 py-1.5 rounded-lg border text-xs font-mono font-semibold transition-colors min-h-[36px] ${
                    active
                      ? 'border-blue-700 bg-blue-700 text-white'
                      : 'border-slate-200 bg-white text-slate-800 hover:border-blue-400'
                  }`}
                >
                  {preset.label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => {
                setCustomMode(true);
                const input = document.getElementById('pour-amount-input');
                input?.focus();
              }}
              className={`px-3 py-1.5 rounded-lg border text-xs font-semibold transition-colors min-h-[36px] ${
                customMode
                  ? 'border-blue-700 bg-blue-100 text-blue-900'
                  : 'border-slate-200 bg-white text-slate-700 hover:border-blue-400'
              }`}
            >
              Custom amount
            </button>
          </div>
        </div>

        {/* Live Calculated Preview */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 space-y-2">
          <div className="text-[11px] font-mono uppercase tracking-wider text-slate-500 font-semibold">
            Live Transfer Preview
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-xs">
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="text-slate-500">Source after transfer</div>
              <div
                className={`font-mono font-bold tabular-nums text-sm mt-0.5 ${
                  validation.sourceAfter < 0 ? 'text-rose-700' : 'text-slate-900'
                }`}
              >
                {validation.sourceAfter} {baseUnit}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="text-slate-500">{targetLabel.split(' ')[0]} after transfer</div>
              <div
                className={`font-mono font-bold tabular-nums text-sm mt-0.5 ${
                  validation.destAfter > destCapacity ? 'text-rose-700' : 'text-blue-700'
                }`}
              >
                {validation.destAfter} {baseUnit}
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-white p-2.5">
              <div className="text-slate-500">Remaining capacity</div>
              <div
                className={`font-mono font-bold tabular-nums text-sm mt-0.5 ${
                  validation.remainingCapacity < 0 ? 'text-rose-700' : 'text-emerald-700'
                }`}
              >
                {validation.remainingCapacity} {baseUnit}
              </div>
            </div>
          </div>
        </div>

        {/* Validation Error / Safety Block */}
        {!validation.valid && validation.errorMessage && (
          <div
            role="alert"
            className="rounded-xl border border-rose-300 bg-rose-50 px-3.5 py-2.5 text-xs text-rose-900 font-semibold flex items-start gap-2"
          >
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-700 mt-0.5" />
            <span>{validation.errorMessage}</span>
          </div>
        )}

        {/* Confirmation Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2.5 pt-1">
          <button
            type="button"
            onClick={() => onCancel('Cancelled by student before confirmation')}
            className="px-4 py-2.5 rounded-lg border border-slate-300 bg-white text-xs sm:text-sm font-semibold text-slate-700 hover:bg-slate-50 min-h-[44px]"
          >
            CANCEL
          </button>
          <button
            type="button"
            disabled={!validation.valid}
            onClick={() => onConfirmPour(parsedAmount, selectedUnit)}
            className="px-5 py-2.5 rounded-lg bg-emerald-700 text-white text-xs sm:text-sm font-bold hover:bg-emerald-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 min-h-[44px]"
          >
            <CheckCircle2 className="w-4 h-4" />
            CONFIRM POUR
          </button>
        </div>
      </div>
    </Modal>
  );
}

interface PourStreamOverlayProps {
  fromXPercent: number;
  fromYPercent: number;
  toXPercent: number;
  toYPercent: number;
  colorHex: string;
  progress01: number;
  isSolid?: boolean;
}

export function PourStreamOverlay({
  fromXPercent,
  fromYPercent,
  toXPercent,
  toYPercent,
  colorHex,
  progress01,
  isSolid = false,
}: PourStreamOverlayProps) {
  const midX = (fromXPercent + toXPercent) / 2;
  const ctrlY = Math.min(fromYPercent, toYPercent) + 3;
  const dashOffset = -(progress01 * 48);

  return (
    <svg
      className="absolute inset-0 w-full h-full pointer-events-none z-30"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {/* Subtle stream glow */}
      <path
        d={`M ${fromXPercent} ${fromYPercent} Q ${midX} ${ctrlY} ${toXPercent} ${toYPercent}`}
        fill="none"
        stroke={colorHex}
        strokeWidth={isSolid ? '1.2' : '1.9'}
        strokeOpacity="0.35"
        strokeLinecap="round"
      />
      {/* Main animated liquid stream */}
      <path
        d={`M ${fromXPercent} ${fromYPercent} Q ${midX} ${ctrlY} ${toXPercent} ${toYPercent}`}
        fill="none"
        stroke={colorHex}
        strokeWidth={isSolid ? '0.9' : '1.15'}
        strokeDasharray={isSolid ? '1.1 1.4' : '4 1.6'}
        strokeDashoffset={dashOffset}
        strokeLinecap="round"
        strokeOpacity="0.95"
      />
      {/* Splash droplet ring inside vessel opening */}
      <ellipse
        cx={toXPercent}
        cy={toYPercent}
        rx={1.4 + (progress01 % 0.35) * 3}
        ry="0.7"
        fill="none"
        stroke="#FFFFFF"
        strokeOpacity="0.55"
        strokeWidth="0.35"
      />
    </svg>
  );
}

interface TransferHistoryModalProps {
  open: boolean;
  onClose: () => void;
  entries: TransferHistoryEntry[];
}

export function TransferHistoryModal({ open, onClose, entries }: TransferHistoryModalProps) {
  return (
    <Modal open={open} onClose={onClose} title={`Reagent Transfer Log (${entries.length})`}>
      <div className="space-y-3">
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-6 text-center text-xs text-slate-600">
            No liquid or reagent transfers recorded yet. Drag any chemical bottle beside or over a beaker or flask to start pouring.
          </div>
        ) : (
          <div className="space-y-2 max-h-[380px] overflow-y-auto pr-1">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs space-y-1"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 font-semibold text-slate-900">
                    <span className="font-mono text-slate-400">#{entry.sequence}</span>
                    <span>{entry.sourceName}</span>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <span>{entry.destinationName}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      entry.status === 'success'
                        ? 'bg-emerald-100 text-emerald-800'
                        : entry.status === 'blocked'
                          ? 'bg-rose-100 text-rose-800'
                          : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {entry.status}
                  </span>
                </div>
                <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-slate-600">
                  <span className="font-mono tabular-nums">
                    {entry.status === 'success'
                      ? `Poured ${entry.transferredAmountMlOrG} ${entry.normalizedUnit} (${entry.sourceSymbol})`
                      : `Requested ${entry.requestedAmount} ${entry.requestedUnit} (${entry.sourceSymbol})`}
                  </span>
                  <span className="font-mono tabular-nums text-slate-500">
                    {new Date(entry.timestamp).toLocaleTimeString()}
                  </span>
                </div>
                {entry.status === 'success' && (
                  <div className="text-[11px] font-mono text-slate-500 tabular-nums">
                    Source after: {entry.sourceAfter} {entry.normalizedUnit} · Destination after:{' '}
                    {entry.destinationAfter} {entry.normalizedUnit}
                  </div>
                )}
                {entry.reason && (
                  <div className="text-[11px] text-slate-600 italic">{entry.reason}</div>
                )}
              </div>
            ))}
          </div>
        )}
        <div className="flex justify-end pt-1">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 min-h-[40px]"
          >
            Close Log
          </button>
        </div>
      </div>
    </Modal>
  );
}
