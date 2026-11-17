import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Beaker,
  CheckCircle2,
  ClipboardList,
  FlaskConical,
  ShieldCheck,
  Wrench,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { getSafetyBadgeMeta } from '../../engine/safetyEngine';
import type { EquipmentVisualKind } from '../../types/science';
import type { ExperimentPreparationSpec } from '../../types/smartLearning';
import { EquipmentIllustration } from '../lab/EquipmentIllustration';

interface ProcedureFirstExperimentViewProps {
  prep: ExperimentPreparationSpec;
  onJumpToDemo: () => void;
  onJumpToQuiz: () => void;
}

export function ProcedureFirstExperimentView({
  prep,
  onJumpToDemo,
  onJumpToQuiz,
}: ProcedureFirstExperimentViewProps) {
  const { navigate, setWorkbenchHandoff, setActiveDepartment, setActiveExperimentId } = useLab();
  const safetyMeta = getSafetyBadgeMeta(prep.safetyClassification);

  const handleLaunchVirtualLab = () => {
    setActiveDepartment(prep.virtualLabDepartment);
    if (prep.virtualLabExperimentId) {
      setActiveExperimentId(prep.virtualLabExperimentId);
    }
    setWorkbenchHandoff({
      department: prep.virtualLabDepartment,
      experimentId: prep.virtualLabExperimentId ?? undefined,
      equipmentIds: prep.virtualLabEquipmentIds,
      chemicalIds: prep.virtualLabChemicalIds,
      enterRoomDirectly: true,
    });
    navigate('virtual-lab', {
      experimentId: prep.virtualLabExperimentId ?? undefined,
    });
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 space-y-6 shadow-sm">
      {/* Banner */}
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 uppercase tracking-wide flex items-center gap-1.5">
            <ClipboardList className="w-4 h-4" />
            Procedure-First Practical Workflow (Steps 1–10)
          </div>
          <h2 className="text-xl font-display font-bold text-slate-900 mt-1">
            {prep.experimentName}
          </h2>
          <p className="text-sm text-slate-600 mt-1">{prep.aim}</p>
        </div>
        <div
          className={`px-3 py-1.5 rounded-lg border text-xs font-semibold ${safetyMeta.bgClass} ${safetyMeta.borderClass} ${safetyMeta.colorClass}`}
        >
          {safetyMeta.label}
        </div>
      </div>

      {/* Step 1: Understand the Experiment */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="text-xs font-bold text-blue-700 uppercase">Step 1 · Principle &amp; Learning Outcomes</div>
          <p className="text-sm font-medium text-slate-900">{prep.scientificPrinciple}</p>
          <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
            {prep.learningOutcomes.map((lo, idx) => (
              <li key={idx}>{lo}</li>
            ))}
          </ul>
        </div>

        {/* Step 2 & Safety Classification */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="text-xs font-bold text-emerald-700 uppercase flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" />
            Safety Precautions &amp; Protective Gear
          </div>
          <div className="text-xs text-slate-700">
            <strong>Protective Gear:</strong> {prep.protectiveEquipment.join(' · ')}
          </div>
          <ul className="list-disc pl-4 space-y-1 text-xs text-slate-600">
            {prep.safetyPrecautions.map((sp, idx) => (
              <li key={idx}>{sp}</li>
            ))}
          </ul>
        </div>
      </div>

      {/* Step 2: Prepare the Lab — Required Equipment with Illustrations */}
      <div className="space-y-3">
        <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
          <Wrench className="w-4 h-4 text-blue-700" />
          Step 2 · Required Apparatus &amp; Instrument Purpose
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {prep.equipmentRequired.map((eq) => (
            <div
              key={eq.id}
              className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex flex-col gap-2"
            >
              <div className="h-16 rounded-lg bg-slate-900 flex items-center justify-center p-2">
                <EquipmentIllustration
                  kind={(eq.visualKind as EquipmentVisualKind) || 'beaker'}
                  className="w-12 h-12"
                />
              </div>
              <div>
                <div className="text-xs font-semibold text-slate-900">{eq.name}</div>
                <div className="text-[11px] font-mono text-blue-700 mt-0.5">Unit: {eq.unit}</div>
                <p className="text-xs text-slate-600 mt-1">{eq.purpose}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Virtual Substances if Chemistry */}
      {prep.materialsAndChemicals.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase tracking-wide flex items-center gap-1.5">
            <Beaker className="w-4 h-4 text-emerald-700" />
            Virtual Substances &amp; Formulas
          </div>
          <div className="grid sm:grid-cols-3 gap-3">
            {prep.materialsAndChemicals.map((ch) => (
              <div key={ch.id} className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-3 text-xs">
                <div className="font-semibold text-slate-900">
                  {ch.name} <span className="font-mono text-emerald-800">({ch.formula})</span>
                </div>
                <div className="text-slate-600 mt-0.5">{ch.hazardClass}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Steps 3 & 4: Connections / Setup + Numbered Procedure */}
      <div className="grid md:grid-cols-2 gap-4">
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase">Step 3 · Setup &amp; Connections</div>
          <p className="text-xs text-slate-700">{prep.setupDescription}</p>
          <ol className="list-decimal pl-4 space-y-1 text-xs text-slate-600">
            {prep.connectionsAndSetupSteps.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ol>
        </div>

        <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2">
          <div className="text-xs font-bold text-slate-900 uppercase">Step 4 · Numbered Procedure</div>
          <ol className="list-decimal pl-4 space-y-1.5 text-xs text-slate-700">
            {prep.numberedProcedure.map((step, i) => (
              <li key={i}>{step}</li>
            ))}
          </ol>
        </div>
      </div>

      {/* Steps 5, 6, 7 Interactive Bridge */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/70 p-4 flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="text-xs font-bold text-blue-800 uppercase">
            Steps 5–7 · Watch Demonstration &amp; Perform in Virtual Laboratory
          </div>
          <p className="text-xs text-slate-700">
            Review the animated demonstration above, then enter the {prep.virtualLabDepartment} lab room with these exact instruments preloaded.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={onJumpToDemo}
            className="px-3.5 py-2 rounded-lg border border-blue-300 bg-white text-blue-700 text-xs font-semibold hover:bg-blue-50"
          >
            Watch Demo Video
          </button>
          <button
            type="button"
            onClick={handleLaunchVirtualLab}
            className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1.5"
          >
            <FlaskConical className="w-4 h-4" />
            Launch in Virtual Lab <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Steps 8 & 9: Observations Table + Calculations + Result */}
      <div className="space-y-4">
        <div className="text-xs font-bold text-slate-900 uppercase">
          Steps 8–9 · Expected Observations, Table, Calculations &amp; Conclusion
        </div>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-slate-500 font-semibold">Colour Change</div>
            <div className="text-slate-900 mt-1">{prep.expectedObservations.colorChange}</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-slate-500 font-semibold">Gas Evolution</div>
            <div className="text-slate-900 mt-1">{prep.expectedObservations.gasFormation}</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-slate-500 font-semibold">Precipitate / Solid</div>
            <div className="text-slate-900 mt-1">{prep.expectedObservations.precipitateFormation}</div>
          </div>
          <div className="rounded-lg border border-slate-200 p-3">
            <div className="text-slate-500 font-semibold">Temperature Change</div>
            <div className="text-slate-900 mt-1">{prep.expectedObservations.temperatureChange}</div>
          </div>
        </div>

        <div className="overflow-x-auto rounded-xl border border-slate-200">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-100 text-slate-700">
              <tr>
                {prep.observationTableHeaders.map((h) => (
                  <th key={h} className="px-3 py-2 font-semibold">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
              {prep.observationRows.map((row, idx) => (
                <tr key={idx}>
                  {row.map((cell, cIdx) => (
                    <td key={cIdx} className="px-3 py-2 text-slate-800">{cell}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="grid md:grid-cols-2 gap-4 text-xs">
          <div className="rounded-xl border border-emerald-200 bg-emerald-50/70 p-4 space-y-1.5">
            <div className="font-bold text-emerald-900 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-700" />
              Verified Result &amp; Conclusion
            </div>
            <p className="text-slate-800 font-medium">{prep.result}</p>
            <p className="text-slate-600">{prep.conclusion}</p>
          </div>
          <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4 space-y-1.5">
            <div className="font-bold text-amber-900 flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              Calculations &amp; Safe Disposal
            </div>
            {prep.calculations.map((calc, i) => (
              <div key={i} className="font-mono text-slate-800">{calc}</div>
            ))}
            <p className="text-slate-700 pt-1"><strong>Disposal:</strong> {prep.disposalNotes}</p>
          </div>
        </div>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onJumpToQuiz}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 flex items-center gap-1.5"
          >
            Step 10 · Discover &amp; Take 5-Question Quiz <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
