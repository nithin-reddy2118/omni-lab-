import React, { useMemo, useState } from 'react';
import { Atom, FlaskConical, Microscope, Search, ShieldCheck, Wrench } from 'lucide-react';
import { useLab } from '../context/LabContext';
import { CHEMISTRY_CHEMICAL_VAULT } from '../data/chemicals';
import { ADVANCED_INSTRUMENT_GUIDES } from '../data/divisions';
import { LAB_INSTRUMENTS, LAB_ROOMS } from '../data/labEquipment';
import { EquipmentIllustration } from '../components/lab/EquipmentIllustration';
import { AudioNarrationBar } from '../components/ui/AudioNarrationBar';
import type { LabDepartmentId } from '../types/science';

type InventoryTab = 'equipment' | 'chemicals' | 'advanced';

export function InventoryExplorerPage() {
  const {
    activeDivision,
    navigate,
    setWorkbenchHandoff,
    recordMasteredInstrument,
  } = useLab();

  const [tab, setTab] = useState<InventoryTab>(
    activeDivision === 'research' ? 'advanced' : 'equipment'
  );
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState<'all' | LabDepartmentId>('all');

  const q = search.trim().toLowerCase();

  const filteredEquipment = useMemo(
    () =>
      LAB_INSTRUMENTS.filter((inst) => {
        const deptOk = deptFilter === 'all' || inst.department === deptFilter;
        const textOk =
          !q ||
          inst.name.toLowerCase().includes(q) ||
          inst.category.toLowerCase().includes(q) ||
          inst.functionSummary.toLowerCase().includes(q) ||
          inst.scientificPrinciple.toLowerCase().includes(q);
        return deptOk && textOk;
      }),
    [deptFilter, q]
  );

  const filteredChemicals = useMemo(
    () =>
      CHEMISTRY_CHEMICAL_VAULT.filter(
        (chem) =>
          !q ||
          chem.name.toLowerCase().includes(q) ||
          chem.symbol.toLowerCase().includes(q) ||
          chem.category.toLowerCase().includes(q) ||
          chem.iupacName.toLowerCase().includes(q)
      ),
    [q]
  );

  const filteredAdvanced = useMemo(
    () =>
      ADVANCED_INSTRUMENT_GUIDES.filter(
        (g) =>
          !q ||
          g.name.toLowerCase().includes(q) ||
          g.workingPrinciple.toLowerCase().includes(q) ||
          g.components.some((c) => c.toLowerCase().includes(q))
      ),
    [q]
  );

  const launchEquipmentInLab = (instId: string, department: LabDepartmentId, modelId?: string) => {
    recordMasteredInstrument(instId);
    setWorkbenchHandoff({
      department,
      experimentId: modelId,
      equipmentIds: [instId],
      enterRoomDirectly: true,
    });
    navigate('virtual-lab', { department, experimentId: modelId });
  };

  const launchChemicalInLab = (chemId: string, compatibleExp?: string) => {
    setWorkbenchHandoff({
      department: 'chemistry',
      experimentId: compatibleExp || 'boiling-point',
      equipmentIds: ['chem-beaker', 'chem-thermometer'],
      chemicalIds: [chemId],
      enterRoomDirectly: true,
    });
    navigate('virtual-lab', { department: 'chemistry', experimentId: compatibleExp || 'boiling-point' });
  };

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              Global Equipment, Chemicals &amp; Advanced Instrument Explorer
            </div>
            <h1 className="text-2xl font-display font-bold text-slate-900">
              Laboratory Inventory &amp; Instrument Reference
            </h1>
            <p className="text-xs text-slate-600 max-w-2xl">
              Inspect {LAB_INSTRUMENTS.length} instruments across {LAB_ROOMS.length} lab rooms, {CHEMISTRY_CHEMICAL_VAULT.length} Chemistry reagents, and advanced analytical instrument specifications—and place them straight onto a lab workbench.
            </p>
          </div>

          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="search"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search glassware, sensors, PCR, HCl..."
              className="pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 w-72"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="flex flex-wrap gap-2">
            {[
              { id: 'equipment' as const, label: `Equipment (${LAB_INSTRUMENTS.length})`, icon: Wrench },
              { id: 'chemicals' as const, label: `Chemistry Reagents (${CHEMISTRY_CHEMICAL_VAULT.length})`, icon: Atom },
              { id: 'advanced' as const, label: `Advanced Instruments (${ADVANCED_INSTRUMENT_GUIDES.length})`, icon: Microscope },
            ].map((t) => {
              const Icon = t.icon;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className={`px-3.5 py-2 rounded-lg text-xs font-semibold border flex items-center gap-1.5 ${
                    tab === t.id
                      ? 'bg-slate-900 text-white border-slate-900'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {t.label}
                </button>
              );
            })}
          </div>

          {tab === 'equipment' && (
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value as 'all' | LabDepartmentId)}
              className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
            >
              <option value="all">All 10 Lab Rooms</option>
              {LAB_ROOMS.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.shortName} ({r.wingCode})
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {tab === 'equipment' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEquipment.map((inst) => (
            <div
              key={inst.id}
              className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-200 flex items-center justify-center shrink-0">
                  <EquipmentIllustration kind={inst.visualKind} className="w-10 h-10" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-mono uppercase text-blue-700 font-semibold">
                    {inst.department} · {inst.category}
                  </div>
                  <h2 className="text-sm font-display font-bold text-slate-900 leading-snug">
                    {inst.name}
                  </h2>
                  <div className="text-[11px] font-mono text-slate-500 mt-0.5">{inst.units}</div>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">{inst.functionSummary}</p>
              <div className="text-[11px] text-slate-700 bg-slate-50 rounded-lg p-2 border border-slate-100">
                <strong>Principle:</strong> {inst.scientificPrinciple}
              </div>
              <AudioNarrationBar
                compact
                title={inst.name}
                segments={[
                  { label: inst.name, text: inst.functionSummary },
                  { label: 'Scientific Principle', text: inst.scientificPrinciple },
                ]}
              />
              <button
                type="button"
                onClick={() =>
                  launchEquipmentInLab(inst.id, inst.department, inst.supportedModels[0])
                }
                className="w-full py-2 px-3 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center justify-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5" />
                Place on Lab Workbench
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'chemicals' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredChemicals.map((chem) => (
            <div
              key={chem.id}
              className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-lg bg-slate-900 border border-slate-200 flex items-center justify-center shrink-0">
                  <EquipmentIllustration
                    kind="chemical-bottle"
                    sim={{ bottleColor: chem.bottleColor, chemicalFormula: chem.formula }}
                    className="w-10 h-10"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-mono text-emerald-700 font-bold">
                    {chem.symbol} · {chem.category}
                  </div>
                  <h2 className="text-sm font-display font-bold text-slate-900">{chem.name}</h2>
                  <div className="text-[11px] text-slate-500">
                    {chem.stateAtRoomTemp} · M = {chem.molarMassGmol} g/mol
                  </div>
                </div>
              </div>
              <div className="text-xs text-slate-700 bg-slate-50 rounded-lg p-2.5 border border-slate-100 space-y-1">
                <div>
                  <strong>IUPAC:</strong> {chem.iupacName}
                </div>
                <div>
                  <strong>Safety ({chem.safetyLevel}):</strong> {chem.safetyNote}
                </div>
              </div>
              <AudioNarrationBar
                compact
                title={chem.symbol}
                segments={[
                  { label: `${chem.name} (${chem.symbol})`, text: `IUPAC name: ${chem.iupacName}. Molar mass ${chem.molarMassGmol} grams per mole.` },
                  { label: 'Safety', text: chem.safetyNote },
                ]}
              />
              <button
                type="button"
                onClick={() => launchChemicalInLab(chem.id, chem.compatibleExperiments[0])}
                className="w-full py-2 px-3 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center justify-center gap-1.5"
              >
                <Atom className="w-3.5 h-3.5" />
                Load into Chemistry Lab
              </button>
            </div>
          ))}
        </div>
      )}

      {tab === 'advanced' && (
        <div className="space-y-4">
          <div className="rounded-xl border border-violet-200 bg-violet-50/70 px-4 py-3 text-xs text-violet-950 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-violet-700 shrink-0" />
            <span>
              <strong>Empirical Boundary Notice:</strong> Advanced analytical instruments below present accurate operating principles, typical units, and calibration limits for educational preparation—not raw empirical hardware measurements.
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4">
            {filteredAdvanced.map((guide) => (
              <div
                key={guide.id}
                className="rounded-xl border border-slate-200 bg-white p-5 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-[11px] font-mono uppercase text-violet-700 font-semibold">
                      {guide.department} · {guide.divisionMin}+
                    </div>
                    <h2 className="text-base font-display font-bold text-slate-900 mt-0.5">
                      {guide.name}
                    </h2>
                  </div>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">{guide.workingPrinciple}</p>
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-xs">
                  <div>
                    <strong className="text-slate-900">Key Components:</strong>{' '}
                    <span className="text-slate-700">{guide.components.join(' · ')}</span>
                  </div>
                  <div>
                    <strong className="text-slate-900">Operating Parameters:</strong>{' '}
                    <span className="font-mono text-slate-800">{guide.operatingParameters}</span>
                  </div>
                  <div>
                    <strong className="text-slate-900">Units:</strong>{' '}
                    <span className="font-mono text-blue-700">{guide.measurementUnits}</span>
                  </div>
                  <div className="text-amber-900">
                    <strong>Limitations:</strong> {guide.limitations}
                  </div>
                </div>
                <AudioNarrationBar
                  compact
                  title={guide.name}
                  segments={[
                    { label: 'Working Principle', text: guide.workingPrinciple },
                    { label: 'Parameters', text: `Operating parameters: ${guide.operatingParameters}. Units: ${guide.measurementUnits}. Limitations: ${guide.limitations}` },
                  ]}
                />
                {guide.linkedModelId && (
                  <button
                    type="button"
                    onClick={() =>
                      navigate('virtual-lab', {
                        department: guide.department,
                        experimentId: guide.linkedModelId,
                      })
                    }
                    className="w-full py-2 px-3 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                  >
                    Open Linked Simulation Model
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
