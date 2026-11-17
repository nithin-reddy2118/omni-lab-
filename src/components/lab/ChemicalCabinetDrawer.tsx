import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Atom,
  FlaskConical,
  Plus,
  Search,
  ShieldCheck,
  X,
} from 'lucide-react';
import {
  CHEMICAL_CATEGORIES,
  CHEMISTRY_CHEMICAL_VAULT,
  searchChemicals,
} from '../../data/chemicals';
import type { ChemicalCategory, ChemicalSubstance } from '../../types/science';
import { EquipmentIllustration } from './EquipmentIllustration';

interface ChemicalCabinetDrawerProps {
  open: boolean;
  onClose: () => void;
  onAddChemicalToBench: (chemical: ChemicalSubstance) => void;
  onSelectCompatibleModel?: (experimentId: string) => void;
}

export function ChemicalCabinetDrawer({
  open,
  onClose,
  onAddChemicalToBench,
  onSelectCompatibleModel,
}: ChemicalCabinetDrawerProps) {
  const [category, setCategory] = useState<ChemicalCategory | 'All'>('All');
  const [query, setQuery] = useState('');
  const [inspected, setInspected] = useState<ChemicalSubstance>(
    CHEMISTRY_CHEMICAL_VAULT.find((c) => c.id === 'chem-sub-h2o') ?? CHEMISTRY_CHEMICAL_VAULT[0]
  );

  const filtered = useMemo(() => searchChemicals(query, category), [query, category]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl bg-white border-l border-slate-200 shadow-2xl flex flex-col"
      role="dialog"
      aria-label="Chemistry Chemical Storage Cabinet"
    >
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-200 bg-slate-50 flex items-start justify-between gap-3">
        <div>
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <Atom className="w-4 h-4" />
            Chemistry Wing Only · Ventilated Glass-Front Reagent Cabinet
          </div>
          <h3 className="text-lg font-display font-bold text-slate-900 mt-0.5">
            Chemical &amp; Substance Storage Vault ({CHEMISTRY_CHEMICAL_VAULT.length} Virtual Reagents)
          </h3>
          <p className="text-xs text-slate-600 mt-0.5">
            Search by formula (H2O, NaCl, H2SO4, CaCO3, C6H12O6), symbol, IUPAC name, or common name.
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close Chemical Storage Cabinet"
          className="p-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-slate-900 min-w-[40px] min-h-[40px] flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Search & Category Tabs */}
      <div className="p-4 border-b border-slate-200 space-y-3 bg-white">
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search formula, symbol, IUPAC or common name (e.g. HCl, NaOH, Limewater)..."
            className="w-full pl-9 pr-3 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400"
          />
        </div>

        <div className="flex gap-1.5 overflow-x-auto pb-1">
          {(['All', ...CHEMICAL_CATEGORIES] as const).map((cat) => {
            const active = category === cat;
            return (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-2.5 py-1.5 rounded-lg text-[11px] font-medium whitespace-nowrap shrink-0 border transition-colors ${
                  active
                    ? 'bg-emerald-700 text-white border-emerald-700 font-semibold'
                    : 'bg-slate-50 text-slate-600 border-slate-200 hover:text-slate-900'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>
      </div>

      {/* Split Body: Scrollable Shelf Grid + Inspected Substance Card */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50/50">
        {/* Selected Substance Detail Inspector */}
        <div className="rounded-xl border border-emerald-200 bg-white p-4 space-y-3 shadow-sm">
          <div className="flex items-start gap-3">
            <div className="w-14 h-14 rounded-xl bg-slate-900 border border-slate-200 flex items-center justify-center shrink-0">
              <EquipmentIllustration
                kind="chemical-bottle"
                sim={{ bottleColor: inspected.bottleColor, chemicalFormula: inspected.formula }}
                className="w-12 h-12"
              />
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-mono text-emerald-700">
                  {inspected.category} · Formula: <strong className="text-slate-900">{inspected.symbol}</strong> ({inspected.formula})
                </div>
                <span
                  className={`text-[11px] font-semibold ${
                    inspected.safetyLevel === 'AMBER' ? 'text-amber-700' : 'text-emerald-700'
                  }`}
                >
                  {inspected.hazardClass}
                </span>
              </div>
              <h4 className="text-base font-display font-bold text-slate-900 mt-0.5">{inspected.name}</h4>
              <div className="text-xs text-slate-600">
                Common: <span className="text-slate-900 font-medium">{inspected.commonName}</span> · IUPAC:{' '}
                <span className="text-slate-900 font-medium">{inspected.iupacName}</span>
              </div>
            </div>
          </div>

          <div className="grid sm:grid-cols-3 gap-2 text-xs bg-slate-50 rounded-lg p-3 border border-slate-200">
            <div>
              <div className="text-[11px] text-slate-500">State (25 °C)</div>
              <div className="font-semibold text-slate-900">{inspected.stateAtRoomTemp}</div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Molar Mass</div>
              <div className="font-mono font-semibold text-slate-900 tabular-nums">
                {inspected.molarMassGmol > 0 ? `${inspected.molarMassGmol} g/mol` : 'Mixture'}
              </div>
            </div>
            <div>
              <div className="text-[11px] text-slate-500">Units / Grade</div>
              <div className="font-semibold text-blue-700">{inspected.units}</div>
            </div>
          </div>

          <div className="text-xs space-y-1.5">
            <div className="text-slate-600">
              <strong className="text-slate-900">Standard Spec:</strong> {inspected.standardConcentrationOrPurity}
            </div>
            <div className="text-slate-600">
              <strong className="text-slate-900">Educational Uses:</strong> {inspected.educationalApplications.join(' · ')}
            </div>
            <div
              className={`rounded-lg p-2.5 border flex items-start gap-2 ${
                inspected.safetyLevel === 'AMBER'
                  ? 'border-amber-200 bg-amber-50 text-amber-900'
                  : 'border-emerald-200 bg-emerald-50 text-emerald-900'
              }`}
            >
              {inspected.safetyLevel === 'AMBER' ? (
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-700" />
              ) : (
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5 text-emerald-700" />
              )}
              <span>
                <strong>Virtual Handling Notice:</strong> {inspected.safetyNote}
              </span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
            <div className="flex flex-wrap items-center gap-1.5">
              {inspected.compatibleExperiments.slice(0, 3).map((expId) => (
                <button
                  key={expId}
                  type="button"
                  onClick={() => onSelectCompatibleModel?.(expId)}
                  className="px-2.5 py-1 rounded border border-slate-200 bg-slate-50 text-[11px] text-blue-700 font-medium hover:border-blue-300"
                >
                  Load {expId}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => onAddChemicalToBench(inspected)}
              className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center gap-1.5 min-h-[38px]"
            >
              <Plus className="w-4 h-4" />
              Place Virtual Sample on Bench
            </button>
          </div>
        </div>

        {/* Reagent Shelves List */}
        {filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-xs text-slate-600">
            No virtual chemical or educational material matches &ldquo;{query}&rdquo;.
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 gap-2.5">
            {filtered.map((chem) => {
              const isSelected = chem.id === inspected.id;
              return (
                <div
                  key={chem.id}
                  onClick={() => setInspected(chem)}
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setInspected(chem);
                    }
                  }}
                  className={`rounded-xl border p-3 flex items-center gap-3 cursor-pointer transition-colors ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50'
                      : 'border-slate-200 bg-white hover:border-emerald-300'
                  }`}
                >
                  <div className="w-11 h-11 rounded-lg bg-slate-900 border border-slate-200 flex items-center justify-center shrink-0">
                    <EquipmentIllustration
                      kind="chemical-bottle"
                      sim={{ bottleColor: chem.bottleColor, chemicalFormula: chem.formula }}
                      className="w-10 h-10"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-1">
                      <span className="text-[10px] font-mono text-emerald-700 font-semibold">
                        {chem.category} · {chem.symbol}
                      </span>
                      <span className="text-[10px] text-slate-500 tabular-nums">
                        {chem.molarMassGmol > 0 ? `${chem.molarMassGmol} g/mol` : chem.stateAtRoomTemp}
                      </span>
                    </div>
                    <div className="text-xs font-bold text-slate-900 truncate">{chem.name}</div>
                    <div className="text-[11px] text-slate-600 truncate">{chem.commonName}</div>
                  </div>
                  <button
                    type="button"
                    aria-label={`Place ${chem.name} on bench`}
                    onClick={(e) => {
                      e.stopPropagation();
                      setInspected(chem);
                      onAddChemicalToBench(chem);
                    }}
                    className="p-2 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-700 hover:text-white shrink-0 transition-colors"
                  >
                    <FlaskConical className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
