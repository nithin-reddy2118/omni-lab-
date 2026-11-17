import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Atom,
  BookOpen,
  CheckCircle2,
  Compass,
  Cpu,
  Dna,
  FlaskConical,
  Globe2,
  HelpCircle,
  SplitSquareHorizontal,
} from 'lucide-react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { useLab } from '../context/LabContext';
import { checkInstrumentConnection, getLabRoomById, LAB_INSTRUMENTS } from '../data/labEquipment';
import { EXPERIMENTS, getExperimentById } from '../engine/experiments';
import { matchLocalScienceTopic } from '../engine/localFallback';
import { evaluateSafety } from '../engine/safetyEngine';

type InnovationTab = 'parallel-twin' | 'failure-detective' | 'molecular' | 'earth-bioinf' | 'textbook-profile';

const CODON_TABLE: Record<string, string> = {
  UUU: 'Phe', UUC: 'Phe', UUA: 'Leu', UUG: 'Leu',
  CUU: 'Leu', CUC: 'Leu', CUA: 'Leu', CUG: 'Leu',
  AUU: 'Ile', AUC: 'Ile', AUA: 'Ile', AUG: 'Met(Start)',
  GUU: 'Val', GUC: 'Val', GUA: 'Val', GUG: 'Val',
  UCU: 'Ser', UCC: 'Ser', UCA: 'Ser', UCG: 'Ser',
  CCU: 'Pro', CCC: 'Pro', CCA: 'Pro', CCG: 'Pro',
  ACU: 'Thr', ACC: 'Thr', ACA: 'Thr', ACG: 'Thr',
  GCU: 'Ala', GCC: 'Ala', GCA: 'Ala', GCG: 'Ala',
  UAU: 'Tyr', UAC: 'Tyr', UAA: 'STOP', UAG: 'STOP',
  CAU: 'His', CAC: 'His', CAA: 'Gln', CAG: 'Gln',
  AAU: 'Asn', AAC: 'Asn', AAA: 'Lys', AAG: 'Lys',
  GAU: 'Asp', GAC: 'Asp', GAA: 'Glu', GAG: 'Glu',
  UGU: 'Cys', UGC: 'Cys', UGA: 'STOP', UGG: 'Trp',
  CGU: 'Arg', CGC: 'Arg', CGA: 'Arg', CGG: 'Arg',
  AGU: 'Ser', AGC: 'Ser', AGA: 'Arg', AGG: 'Arg',
  GGU: 'Gly', GGC: 'Gly', GGA: 'Gly', GGG: 'Gly',
};

const MOLECULES = [
  {
    id: 'h2o',
    name: 'Water (H₂O)',
    geometry: 'Bent · 104.5° bond angle',
    polarity: 'Strongly Polar · Hydrogen Bonding',
    macroLink: 'High normal boiling point (100.0 °C at 101.3 kPa) due to hydrogen-bond network between δ− O and δ+ H.',
    atoms: [
      { label: 'O', x: 100, y: 78, r: 22, color: '#EF4444' },
      { label: 'H', x: 56, y: 118, r: 14, color: '#38BDF8' },
      { label: 'H', x: 144, y: 118, r: 14, color: '#38BDF8' },
    ],
    bonds: [[0, 1], [0, 2]],
  },
  {
    id: 'co2',
    name: 'Carbon Dioxide (CO₂)',
    geometry: 'Linear · 180° bond angle',
    polarity: 'Non-Polar Molecule (Symmetric C=O dipoles cancel)',
    macroLink: 'Sublimes readily as gas; absorbs infrared vibrational radiation in planetary atmospheres.',
    atoms: [
      { label: 'O', x: 46, y: 95, r: 19, color: '#EF4444' },
      { label: 'C', x: 100, y: 95, r: 21, color: '#334155' },
      { label: 'O', x: 154, y: 95, r: 19, color: '#EF4444' },
    ],
    bonds: [[0, 1], [1, 2]],
  },
  {
    id: 'nacl',
    name: 'Sodium Chloride (NaCl Crystal)',
    geometry: 'Face-Centered Cubic Ionic Lattice',
    polarity: 'Electrostatic Na⁺ / Cl⁻ Lattice',
    macroLink: 'Dissociates into free mobile Na⁺ and Cl⁻ electrolyte ions in water and boosts boiling point marginally.',
    atoms: [
      { label: 'Na⁺', x: 64, y: 65, r: 17, color: '#8B5CF6' },
      { label: 'Cl⁻', x: 136, y: 65, r: 21, color: '#10B981' },
      { label: 'Cl⁻', x: 64, y: 128, r: 21, color: '#10B981' },
      { label: 'Na⁺', x: 136, y: 128, r: 17, color: '#8B5CF6' },
    ],
    bonds: [[0, 1], [0, 2], [1, 3], [2, 3]],
  },
  {
    id: 'hcl',
    name: 'Hydrogen Chloride (HCl)',
    geometry: 'Linear Polar Covalent',
    polarity: 'Strongly Acidic Proton Donor in Water',
    macroLink: 'Ionizes ~100% into H₃O⁺ and Cl⁻ in aqueous solution, dropping pH cleanly to 1.00 at 0.1 M.',
    atoms: [
      { label: 'H', x: 62, y: 95, r: 14, color: '#38BDF8' },
      { label: 'Cl', x: 132, y: 95, r: 24, color: '#10B981' },
    ],
    bonds: [[0, 1]],
  },
];

const FAILURE_CASES = [
  {
    id: 'fail-h2-burner',
    title: 'Hydrogen Gas Vessel Near Lit Bunsen Burner',
    setup: 'Student placed H₂ sample cylinder beside active hot plate during a boiling lesson.',
    fault: 'Flammable gas H₂ (lower explosion limit ~4% in air) coupled directly with ignition heat source.',
    hint: 'Check Compatibility & Safety Rules between combustible gases and thermal stations.',
    fix: 'Remove H₂ from heating zone; keep flammable reagents inside vented containment and heat pure water/NaCl only.',
  },
  {
    id: 'fail-scope-heat',
    title: 'Phase Microscope Coupled to Hot Plate',
    setup: 'Student tried connecting Optical Microscope and Hot Plate to watch warm droplets.',
    fault: 'Direct thermal distortion warps optical objective alignment and condensates steam onto lenses.',
    hint: 'Compare thermal apparatus compatibility against precision optics in Equipment Checker.',
    fix: 'Separate thermal prep bench from microscopy station; cool slides to ambient before focusing.',
  },
  {
    id: 'fail-beer-saturation',
    title: 'Spectrophotometer Reading A = 3.20 AU Too High',
    setup: 'Higher Ed student measured concentrated dye without diluting and got non-linear Beer–Lambert data.',
    fault: 'Above A ≈ 1.5–2.0 AU, only < 1–3% photon light reaches detector; stray light violates linear A = εlc.',
    hint: 'Calculate %T = 100 · 10^(-A) for A = 3.20.',
    fix: 'Perform serial 1:10 dilution until absorbance falls cleanly in the optimal 0.20–1.00 AU window.',
  },
];

export function InnovationSuitePage() {
  const {
    trialsByExperiment,
    curriculumCompletedIds,
    masteredInstrumentIds,
    researchNotebookEntries,
    savedReports,
    personalLabs,
    savedLabDesigns,
    setCreatorPrefillPrompt,
    setWorkbenchHandoff,
    navigate,
  } = useLab();
  const [tab, setTab] = useState<InnovationTab>('parallel-twin');
  const [textbookText, setTextbookText] = useState(
    'A student dissolves 0.1 M HCl and titrates it with 0.1 M NaOH using phenolphthalein indicator to determine the equivalence point.'
  );

  // Tab 1: Parallel Universe Digital Twin state
  const [expId, setExpId] = useState('boiling-point');
  const exp = getExperimentById(expId) ?? EXPERIMENTS[0];
  const [paramsA, setParamsA] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    exp.parameters.forEach((p) => (init[p.key] = p.defaultValue));
    return init;
  });
  const [paramsB, setParamsB] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    exp.parameters.forEach((p, idx) => (init[p.key] = idx === 0 ? Math.max(p.min, Number((p.defaultValue * 0.7).toFixed(2))) : p.defaultValue));
    return init;
  });

  const handleSelectTwinExp = (nextId: string) => {
    setExpId(nextId);
    const nextExp = getExperimentById(nextId) ?? EXPERIMENTS[0];
    const pA: Record<string, number> = {};
    const pB: Record<string, number> = {};
    nextExp.parameters.forEach((p, idx) => {
      pA[p.key] = p.defaultValue;
      pB[p.key] = idx === 0 ? Math.min(p.max, Math.max(p.min, Number((p.defaultValue * 0.68).toFixed(2)))) : p.defaultValue;
    });
    setParamsA(pA);
    setParamsB(pB);
  };

  const resA = useMemo(() => exp.calculate(paramsA), [exp, paramsA]);
  const resB = useMemo(() => exp.calculate(paramsB), [exp, paramsB]);

  const combinedChartData = useMemo(() => {
    const len = Math.max(resA.curvePoints.length, resB.curvePoints.length);
    const rows = [];
    for (let i = 0; i < len; i++) {
      const a = resA.curvePoints[i];
      const b = resB.curvePoints[i];
      rows.push({
        x: a?.x ?? b?.x ?? i,
        universeA: a?.y ?? null,
        universeB: b?.y ?? null,
      });
    }
    return rows;
  }, [resA, resB]);

  // Tab 2: Compatibility & Failure Detective state
  const [instAId, setInstAId] = useState('chem-hot-plate');
  const [instBId, setInstBId] = useState('bio-microscope');
  const [revealedFixes, setRevealedFixes] = useState<Record<string, boolean>>({});
  const instA = LAB_INSTRUMENTS.find((i) => i.id === instAId) ?? LAB_INSTRUMENTS[0];
  const instB = LAB_INSTRUMENTS.find((i) => i.id === instBId) ?? LAB_INSTRUMENTS[1];
  const compatResult = checkInstrumentConnection(instA, instB);

  // Tab 3: Molecular Explorer state
  const [molId, setMolId] = useState('h2o');
  const activeMol = MOLECULES.find((m) => m.id === molId) ?? MOLECULES[0];

  // Tab 4: Planet Earth Lab + Bioinformatics Sequence Console
  const [co2Ppm, setCo2Ppm] = useState(420);
  const [albedoPct, setAlbedoPct] = useState(30);
  const [dnaInput, setDnaInput] = useState('ATGGCCATTGTAATGGGCCGCTGAAAGGGTGCCCGATAG');

  const earthMetrics = useMemo(() => {
    // Deterministic radiative forcing approximation ΔF = 5.35 * ln(C/280)
    const forcingWm2 = 5.35 * Math.log(Math.max(180, co2Ppm) / 280);
    const albedoOffsetC = (30 - albedoPct) * 0.65;
    const eqShiftC = forcingWm2 * 0.8 + albedoOffsetC;
    return {
      forcingWm2: Number(forcingWm2.toFixed(2)),
      tempShiftC: Number(eqShiftC.toFixed(2)),
    };
  }, [co2Ppm, albedoPct]);

  const bioSeqAnalysis = useMemo(() => {
    const clean = dnaInput.toUpperCase().replace(/[^ATCG]/g, '');
    const complement = clean
      .split('')
      .map((b) => ({ A: 'T', T: 'A', C: 'G', G: 'C' }[b] || b))
      .join('');
    const mrna = clean.replace(/T/g, 'U');
    const gcCount = clean.split('').filter((b) => b === 'G' || b === 'C').length;
    const gcPct = clean.length ? (gcCount / clean.length) * 100 : 0;
    const codons: string[] = [];
    const aminoAcids: string[] = [];
    for (let i = 0; i + 2 < mrna.length; i += 3) {
      const codon = mrna.slice(i, i + 3);
      codons.push(codon);
      aminoAcids.push(CODON_TABLE[codon] ?? '?');
    }
    return { clean, complement, mrna, gcPct, codons, aminoAcids };
  }, [dnaInput]);

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
            <SplitSquareHorizontal className="w-4 h-4" />
            OmniLab Advanced Simulation &amp; Discovery Suite
          </div>
          <h1 className="text-2xl font-display font-bold text-slate-900">
            Digital Twin, Parallel Universes, Failure Detective &amp; Molecular/Bioinformatics Console
          </h1>
        </div>

        <div className="flex flex-wrap gap-2">
          {[
            { id: 'parallel-twin' as const, label: 'AI Digital Twin & Parallel Universe A/B', icon: SplitSquareHorizontal },
            { id: 'failure-detective' as const, label: 'Failure Detective & Compatibility Checker', icon: HelpCircle },
            { id: 'molecular' as const, label: 'Molecular World & Micro-to-Macro', icon: Atom },
            { id: 'earth-bioinf' as const, label: 'Planet Earth Lab & Bioinformatics', icon: Dna },
            { id: 'textbook-profile' as const, label: 'Textbook-to-Experiment & Learner Profile', icon: BookOpen },
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
      </div>

      {tab === 'parallel-twin' && (
        <div className="space-y-6">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-display font-bold text-slate-900">
                  Parallel Universe A vs B Physical Comparison ({exp.title})
                </h2>
                <p className="text-xs text-slate-600">
                  Formula: <span className="font-mono text-blue-700">{exp.formula}</span> · Compare two regimes simultaneously using deterministic physical laws.
                </p>
              </div>
              <select
                value={expId}
                onChange={(e) => handleSelectTwinExp(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-900"
              >
                {EXPERIMENTS.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.number}. {item.shortTitle}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Universe A */}
              <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-blue-800 uppercase">Universe A (Control)</span>
                  <span className="font-mono text-base font-bold text-blue-900 tabular-nums">
                    {resA.primarySymbol} = {resA.primaryValue} {resA.primaryUnit}
                  </span>
                </div>
                {exp.parameters.map((p) => (
                  <div key={`A-${p.key}`} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-700">{p.label}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {paramsA[p.key] ?? p.defaultValue} {p.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={paramsA[p.key] ?? p.defaultValue}
                      onChange={(e) => setParamsA((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))}
                      className="w-full accent-blue-700 cursor-pointer"
                    />
                  </div>
                ))}
              </div>

              {/* Universe B */}
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Universe B (Perturbed)</span>
                  <span className="font-mono text-base font-bold text-emerald-900 tabular-nums">
                    {resB.primarySymbol} = {resB.primaryValue} {resB.primaryUnit}
                  </span>
                </div>
                {exp.parameters.map((p) => (
                  <div key={`B-${p.key}`} className="space-y-1 text-xs">
                    <div className="flex justify-between">
                      <span className="text-slate-700">{p.label}</span>
                      <span className="font-mono font-bold text-slate-900 tabular-nums">
                        {paramsB[p.key] ?? p.defaultValue} {p.unit}
                      </span>
                    </div>
                    <input
                      type="range"
                      min={p.min}
                      max={p.max}
                      step={p.step}
                      value={paramsB[p.key] ?? p.defaultValue}
                      onChange={(e) => setParamsB((prev) => ({ ...prev, [p.key]: Number(e.target.value) }))}
                      className="w-full accent-emerald-700 cursor-pointer"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Numeric Digital Twin Delta Banner */}
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 flex flex-wrap items-center justify-between gap-3 text-xs">
              <span className="font-semibold text-slate-900">
                Digital Twin Live Delta (B − A):
              </span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">
                Δ{resA.primarySymbol} = {(resB.primaryValue - resA.primaryValue).toFixed(4)} {resA.primaryUnit}
              </span>
            </div>

            {/* Overlaid Chart */}
            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={combinedChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                  <XAxis dataKey="x" tick={{ fontSize: 11 }} label={{ value: `${resA.xAxisLabel} (${resA.xAxisUnit})`, position: 'insideBottom', offset: -2, fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="universeA" name="Universe A" stroke="#1D4ED8" strokeWidth={2.5} dot={false} />
                  <Line type="monotone" dataKey="universeB" name="Universe B" stroke="#059669" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}

      {tab === 'failure-detective' && (
        <div className="space-y-6">
          {/* Interactive Smart Equipment Compatibility Checker */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-5 h-5 text-blue-700" />
              Smart Equipment Compatibility Checker
            </h2>
            <p className="text-xs text-slate-600">
              Test any pair of instruments from our 10 labs to check thermal, electrical, optical, fluid, and safety coupling rules before building on the bench.
            </p>
            <div className="grid sm:grid-cols-2 gap-3">
              <select
                value={instAId}
                onChange={(e) => setInstAId(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
              >
                {LAB_INSTRUMENTS.map((i) => (
                  <option key={i.id} value={i.id}>[{i.department}] {i.name}</option>
                ))}
              </select>
              <select
                value={instBId}
                onChange={(e) => setInstBId(e.target.value)}
                className="px-3 py-2.5 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
              >
                {LAB_INSTRUMENTS.map((i) => (
                  <option key={i.id} value={i.id}>[{i.department}] {i.name}</option>
                ))}
              </select>
            </div>
            <div
              className={`rounded-xl border p-4 text-xs flex items-start gap-2.5 ${
                compatResult.valid
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-950'
                  : 'border-rose-200 bg-rose-50 text-rose-950'
              }`}
            >
              {compatResult.valid ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-700 shrink-0 mt-0.5" />
              )}
              <div>
                <div className="font-bold">
                  {compatResult.valid ? `Compatible (${compatResult.connectionType})` : 'Incompatible / Safety Warning'}
                </div>
                <div className="mt-0.5">{compatResult.note}</div>
              </div>
            </div>
          </div>

          {/* Experiment Failure Detective Case Studies */}
          <div className="grid md:grid-cols-3 gap-4">
            {FAILURE_CASES.map((fc) => {
              const revealed = Boolean(revealedFixes[fc.id]);
              return (
                <div key={fc.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-3">
                  <div className="text-[11px] font-mono uppercase text-rose-700 font-bold">
                    Failure Case Study
                  </div>
                  <h3 className="text-sm font-display font-bold text-slate-900">{fc.title}</h3>
                  <p className="text-xs text-slate-600">{fc.setup}</p>
                  <div className="rounded-lg bg-amber-50 border border-amber-200 p-2.5 text-xs text-amber-900">
                    <strong>Hint:</strong> {fc.hint}
                  </div>
                  {revealed ? (
                    <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-950 space-y-1">
                      <div>
                        <strong>Root Cause:</strong> {fc.fault}
                      </div>
                      <div>
                        <strong>Corrected Setup:</strong> {fc.fix}
                      </div>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setRevealedFixes((p) => ({ ...p, [fc.id]: true }))}
                      className="w-full py-2 px-3 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800"
                    >
                      Inspect Diagnostic Fix
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {tab === 'molecular' && (
        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-5">
          <div className="flex flex-wrap gap-2">
            {MOLECULES.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMolId(m.id)}
                className={`px-3.5 py-2 rounded-lg text-xs font-semibold border ${
                  molId === m.id
                    ? 'bg-blue-700 text-white border-blue-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {m.name}
              </button>
            ))}
          </div>

          <div className="grid md:grid-cols-12 gap-6 items-center">
            <div className="md:col-span-5 rounded-xl border border-slate-200 bg-slate-950 p-4 flex items-center justify-center">
              <svg viewBox="0 0 200 180" className="w-full max-w-[260px] h-auto">
                {activeMol.bonds.map(([a, b], idx) => (
                  <line
                    key={idx}
                    x1={activeMol.atoms[a].x}
                    y1={activeMol.atoms[a].y}
                    x2={activeMol.atoms[b].x}
                    y2={activeMol.atoms[b].y}
                    stroke="#94A3B8"
                    strokeWidth="4"
                  />
                ))}
                {activeMol.atoms.map((atom, idx) => (
                  <g key={idx}>
                    <circle cx={atom.x} cy={atom.y} r={atom.r} fill={atom.color} stroke="#FFFFFF" strokeWidth="2" />
                    <text
                      x={atom.x}
                      y={atom.y + 4}
                      textAnchor="middle"
                      fill="#FFFFFF"
                      fontSize="11"
                      fontWeight="bold"
                      fontFamily="monospace"
                    >
                      {atom.label}
                    </text>
                  </g>
                ))}
              </svg>
            </div>
            <div className="md:col-span-7 space-y-3 text-xs">
              <h2 className="text-xl font-display font-bold text-slate-900">{activeMol.name}</h2>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
                <div>
                  <strong className="text-slate-900">Molecular Geometry:</strong> {activeMol.geometry}
                </div>
                <div>
                  <strong className="text-slate-900">Bond Polarity / Interaction:</strong> {activeMol.polarity}
                </div>
              </div>
              <div className="rounded-lg border border-blue-200 bg-blue-50 p-3 text-blue-950 leading-relaxed">
                <strong>Microscopic → Macroscopic Connection:</strong> {activeMol.macroLink}
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'earth-bioinf' && (
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Planet Earth Lab */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
              <Globe2 className="w-5 h-5 text-emerald-700" />
              Planet Earth Radiative &amp; Albedo Balance Lab
            </h2>
            <p className="text-xs text-slate-600">
              Deterministic IPCC-style radiative forcing model: ΔF = 5.35 · ln(C / 280 ppm) combined with surface ice/cloud albedo percentage.
            </p>
            <div className="space-y-3 text-xs">
              <div>
                <div className="flex justify-between font-medium">
                  <span>Atmospheric CO₂ Concentration</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">{co2Ppm} ppm</span>
                </div>
                <input
                  type="range"
                  min={180}
                  max={850}
                  step={10}
                  value={co2Ppm}
                  onChange={(e) => setCo2Ppm(Number(e.target.value))}
                  className="w-full accent-emerald-700 cursor-pointer"
                />
              </div>
              <div>
                <div className="flex justify-between font-medium">
                  <span>Planetary Reflectivity (Albedo)</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">{albedoPct}%</span>
                </div>
                <input
                  type="range"
                  min={22}
                  max={38}
                  step={0.5}
                  value={albedoPct}
                  onChange={(e) => setAlbedoPct(Number(e.target.value))}
                  className="w-full accent-blue-700 cursor-pointer"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500">Radiative Forcing ΔF</div>
                <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                  {earthMetrics.forcingWm2 >= 0 ? '+' : ''}
                  {earthMetrics.forcingWm2} W/m²
                </div>
              </div>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                <div className="text-[11px] text-slate-500">Equilibrium ΔT Estimate</div>
                <div className="text-lg font-mono font-bold text-blue-700 tabular-nums">
                  {earthMetrics.tempShiftC >= 0 ? '+' : ''}
                  {earthMetrics.tempShiftC} °C
                </div>
              </div>
            </div>
          </div>

          {/* Deterministic Bioinformatics Sequence Console */}
          <div className="rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
            <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
              <Dna className="w-5 h-5 text-violet-700" />
              Bioinformatics DNA → mRNA → Polypeptide Workbench
            </h2>
            <p className="text-xs text-slate-600">
              Enter any DNA coding sequence (A, T, C, G) to deterministically compute complement, GC%, mRNA transcript, and translated peptide chain.
            </p>
            <textarea
              rows={2}
              value={dnaInput}
              onChange={(e) => setDnaInput(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 font-mono text-xs text-slate-900"
            />
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="text-[10px] text-slate-500">Valid Bases</div>
                <div className="font-mono font-bold text-slate-900 tabular-nums">{bioSeqAnalysis.clean.length} bp</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="text-[10px] text-slate-500">GC Content</div>
                <div className="font-mono font-bold text-violet-700 tabular-nums">{bioSeqAnalysis.gcPct.toFixed(1)}%</div>
              </div>
              <div className="rounded-lg border border-slate-200 bg-slate-50 p-2.5">
                <div className="text-[10px] text-slate-500">Codons</div>
                <div className="font-mono font-bold text-slate-900 tabular-nums">{bioSeqAnalysis.codons.length}</div>
              </div>
            </div>
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5 text-[11px] font-mono break-all">
              <div>
                <strong className="text-slate-900">5&prime;→3&prime; mRNA:</strong>{' '}
                <span className="text-blue-800">{bioSeqAnalysis.mrna || '—'}</span>
              </div>
              <div>
                <strong className="text-slate-900">3&prime;→5&prime; Complement:</strong>{' '}
                <span className="text-slate-700">{bioSeqAnalysis.complement || '—'}</span>
              </div>
              <div>
                <strong className="text-slate-900">Peptide Chain:</strong>{' '}
                <span className="text-emerald-800 font-bold">
                  {bioSeqAnalysis.aminoAcids.join(' - ') || '—'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {tab === 'textbook-profile' && (() => {
        const safety = evaluateSafety(textbookText);
        const match = matchLocalScienceTopic(textbookText);
        const matchedModel = match.matchedExperimentId ? getExperimentById(match.matchedExperimentId) : null;
        const roomMeta = getLabRoomById(match.department);
        const totalTrials = Object.values(trialsByExperiment).flat().length;
        const activeModelCount = Object.values(trialsByExperiment).filter((a) => a.length > 0).length;

        return (
          <div className="grid lg:grid-cols-12 gap-6">
            {/* Textbook-to-Experiment Converter */}
            <div className="lg:col-span-7 rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                  <BookOpen className="w-5 h-5 text-blue-700" />
                  Textbook-to-Experiment Converter
                </h2>
                <p className="text-xs text-slate-600">
                  Paste any textbook science problem, numerical word question, or paragraph to screen safety, match a campus laboratory wing &amp; deterministic equation, and launch directly onto a virtual workbench.
                </p>
              </div>

              <textarea
                rows={4}
                value={textbookText}
                onChange={(e) => setTextbookText(e.target.value)}
                placeholder="Paste a physics, chemistry, biology, or electronics textbook problem..."
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900"
              />

              {safety.level === 'RED' ? (
                <div className="rounded-xl border border-rose-300 bg-rose-50 p-4 text-xs text-rose-950 space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-rose-700" />
                    Blocked by Safety Guardian ({safety.level})
                  </div>
                  <p>{safety.summary}</p>
                  <p className="text-emerald-800 font-medium">
                    Safe Virtual Alternative: {safety.safeVirtualAlternative}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">
                      Recommended Wing: {roomMeta.wingCode} · {roomMeta.name}
                    </span>
                    <span className="font-mono font-semibold text-emerald-700">
                      Safety: {safety.level}
                    </span>
                  </div>
                  <p className="text-slate-700">{match.reason}</p>
                  {matchedModel && (
                    <div className="rounded-lg border border-blue-200 bg-white p-3 space-y-1">
                      <div className="font-bold text-blue-900">
                        Matched Validated Model #{matchedModel.number}: {matchedModel.title}
                      </div>
                      <div className="font-mono text-blue-700">{matchedModel.formula}</div>
                      <div className="text-slate-600">
                        Variables: {matchedModel.independentVariable} → {matchedModel.dependentVariable}
                      </div>
                    </div>
                  )}

                  <div className="flex flex-wrap gap-2 pt-1">
                    {matchedModel && (
                      <button
                        type="button"
                        onClick={() => {
                          setWorkbenchHandoff({
                            department: match.department,
                            experimentId: matchedModel.id,
                            equipmentIds: match.recommendedEquipmentIds,
                            chemicalIds: match.recommendedChemicalIds,
                            enterRoomDirectly: true,
                          });
                          navigate('virtual-lab', { department: match.department, experimentId: matchedModel.id });
                        }}
                        className="px-4 py-2 rounded-lg bg-blue-700 text-white font-bold hover:bg-blue-800 flex items-center gap-1.5"
                      >
                        <FlaskConical className="w-3.5 h-3.5" />
                        Open Matched Lab Room
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => {
                        setCreatorPrefillPrompt(textbookText.trim());
                        navigate('creator');
                      }}
                      className="px-4 py-2 rounded-lg border border-slate-300 bg-white text-slate-800 font-semibold hover:border-blue-500 flex items-center gap-1.5"
                    >
                      <Compass className="w-3.5 h-3.5 text-blue-700" />
                      Build Full Protocol in Experiment Creator
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Personal Science Intelligence Profile & Lab Anywhere Resume */}
            <div className="lg:col-span-5 rounded-2xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
              <div className="space-y-1">
                <h2 className="text-lg font-display font-bold text-slate-900 flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-emerald-700" />
                  Personal Science Profile (Genuine Records)
                </h2>
                <p className="text-xs text-slate-600">
                  Real activity summary calculated exclusively from saved trials, lab designs, notebook entries, and completed syllabus checks.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-2.5 text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] text-slate-500 uppercase">Recorded Trials</div>
                  <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">{totalTrials}</div>
                  <div className="text-[11px] text-slate-600">across {activeModelCount} / {EXPERIMENTS.length} models</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] text-slate-500 uppercase">Syllabus Done</div>
                  <div className="text-xl font-mono font-bold text-emerald-700 tabular-nums">{curriculumCompletedIds.length}</div>
                  <div className="text-[11px] text-slate-600">marked practicals</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] text-slate-500 uppercase">Instruments Used</div>
                  <div className="text-xl font-mono font-bold text-blue-700 tabular-nums">{masteredInstrumentIds.length}</div>
                  <div className="text-[11px] text-slate-600">placed on bench</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-3">
                  <div className="text-[10px] text-slate-500 uppercase">Notes &amp; Reports</div>
                  <div className="text-xl font-mono font-bold text-slate-900 tabular-nums">
                    {researchNotebookEntries.length + savedReports.length}
                  </div>
                  <div className="text-[11px] text-slate-600">{personalLabs.length} personal labs</div>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200 space-y-2">
                <div className="text-xs font-bold text-slate-900">Continue Workspaces Anywhere</div>
                {personalLabs.length === 0 && savedLabDesigns.length === 0 ? (
                  <p className="text-xs text-slate-600">
                    Save a Personal Lab or Bench Design to resume it directly from here.
                  </p>
                ) : (
                  <div className="space-y-2">
                    {personalLabs.slice(0, 2).map((pl) => (
                      <button
                        key={pl.id}
                        type="button"
                        onClick={() => navigate('personal-lab')}
                        className="w-full text-left rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs hover:border-blue-400 flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-900 truncate">{pl.name}</span>
                        <span className="text-blue-700 font-bold shrink-0">Open →</span>
                      </button>
                    ))}
                    {savedLabDesigns.slice(0, 2).map((d) => (
                      <button
                        key={d.id}
                        type="button"
                        onClick={() => {
                          setWorkbenchHandoff({ savedDesignId: d.id, enterRoomDirectly: true });
                          navigate('virtual-lab', { department: d.department, experimentId: d.experimentId });
                        }}
                        className="w-full text-left rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs hover:border-blue-400 flex items-center justify-between"
                      >
                        <span className="font-semibold text-slate-900 truncate">{d.title}</span>
                        <span className="text-emerald-700 font-bold shrink-0">Resume →</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
