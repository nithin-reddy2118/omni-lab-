import React, { useMemo, useState } from 'react';
import {
  Atom,
  BookOpen,
  CheckCircle2,
  Cpu,
  Download,
  FlaskConical,
  FolderOpen,
  Layers,
  Plus,
  Save,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { CHEMISTRY_CHEMICAL_VAULT, getChemicalById } from '../data/chemicals';
import { getInstrumentById, getLabRoomById, LAB_INSTRUMENTS } from '../data/labEquipment';
import { EXPERIMENTS } from '../engine/experiments';
import type {
  LabDepartmentId,
  PersonalLabDomain,
  PersonalLabLayout,
  PersonalLabWorkspace,
  WorkbenchItem,
} from '../types/science';
import { EquipmentIllustration } from '../components/lab/EquipmentIllustration';

const DOMAIN_TEMPLATES: {
  id: PersonalLabDomain;
  label: string;
  department: LabDepartmentId;
  defaultExperimentId: string;
  defaultLayout: PersonalLabLayout;
  description: string;
}[] = [
  {
    id: 'chemistry',
    label: 'Chemistry Lab',
    department: 'chemistry',
    defaultExperimentId: 'acid-base-titration',
    defaultLayout: 'bench-central',
    description: 'Titration burettes, heating plates, pH meters & reagent vault.',
  },
  {
    id: 'physics',
    label: 'Physics Lab',
    department: 'physics',
    defaultExperimentId: 'pendulum-period',
    defaultLayout: 'dual-wing',
    description: 'Mechanics, SHM oscillation rigs, optics benches & cooling calorimetry.',
  },
  {
    id: 'biotechnology',
    label: 'Biotechnology Lab',
    department: 'biotechnology',
    defaultExperimentId: 'michaelis-menten',
    defaultLayout: 'clean-hood',
    description: 'UV-Vis spectrophotometers, thermal cyclers & enzyme kinetic setups.',
  },
  {
    id: 'molecular-biology',
    label: 'Molecular Biology Lab',
    department: 'biotechnology',
    defaultExperimentId: 'beer-lambert',
    defaultLayout: 'clean-hood',
    description: 'Nucleic acid quantification (260/280 nm) and electrophoresis rigs.',
  },
  {
    id: 'microbiology',
    label: 'Microbiology Lab',
    department: 'microbiology',
    defaultExperimentId: 'bacterial-growth',
    defaultLayout: 'clean-hood',
    description: 'Biosafety laminar workstation, shaking incubators & colony counters.',
  },
  {
    id: 'electronics',
    label: 'Electronics Lab',
    department: 'electronics',
    defaultExperimentId: 'rc-circuit-decay',
    defaultLayout: 'dual-wing',
    description: 'Dual-trace oscilloscopes, RC decay boards, DC supplies & multimeters.',
  },
  {
    id: 'environmental',
    label: 'Environmental Science Lab',
    department: 'environmental',
    defaultExperimentId: 'photosynthesis-rate',
    defaultLayout: 'bench-central',
    description: 'Water quality probes, soil pH testers, turbidity & carbon uptake.',
  },
  {
    id: 'engineering',
    label: 'Engineering & Materials Lab',
    department: 'engineering',
    defaultExperimentId: 'force-acceleration',
    defaultLayout: 'dual-wing',
    description: 'Dynamic carts, material load testers, PWM servo & sensor testbenches.',
  },
  {
    id: 'computational',
    label: 'Computational Research Lab',
    department: 'math',
    defaultExperimentId: 'half-life-decay',
    defaultLayout: 'computational-cluster',
    description: 'Statistical curve fitting, bioinformatics sequence tools & ML algorithms.',
  },
];

const LAYOUT_OPTIONS: { id: PersonalLabLayout; label: string; detail: string }[] = [
  { id: 'bench-central', label: 'Central Island Bench', detail: '360° reagent & apparatus workstation' },
  { id: 'dual-wing', label: 'Dual-Wing Apparatus Bench', detail: 'Separated source & measurement probes' },
  { id: 'clean-hood', label: 'Cleanroom / Biosafety Hood', detail: 'Sterile containment & cuvette racks' },
  { id: 'computational-cluster', label: 'Computational Research Cluster', detail: 'Algorithmic modeling & telemetry' },
];

export function MyPersonalLabPage() {
  const {
    personalLabs,
    activePersonalLabId,
    setActivePersonalLabId,
    savePersonalLab,
    deletePersonalLab,
    savedLabDesigns,
    setWorkbenchHandoff,
    navigate,
  } = useLab();

  const [labName, setLabName] = useState('My Custom Discovery Workspace');
  const [domain, setDomain] = useState<PersonalLabDomain>('chemistry');
  const [layout, setLayout] = useState<PersonalLabLayout>('bench-central');
  const [activeExperimentId, setActiveExperimentId] = useState('acid-base-titration');
  const [selectedEquipIds, setSelectedEquipIds] = useState<string[]>([
    'chem-beaker',
    'chem-burette',
    'chem-ph-meter',
  ]);
  const [selectedChemicalIds, setSelectedChemicalIds] = useState<string[]>([
    'hcl',
    'naoh',
    'phenolphthalein',
  ]);
  const [customRacks, setCustomRacks] = useState<{ id: string; title: string; instrumentIds: string[] }[]>([
    { id: 'rack-primary', title: 'Primary Measurement Rack', instrumentIds: ['chem-burette', 'chem-ph-meter'] },
  ]);
  const [newRackName, setNewRackName] = useState('');
  const [notes, setNotes] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const selectedTemplate = useMemo(
    () => DOMAIN_TEMPLATES.find((t) => t.id === domain) ?? DOMAIN_TEMPLATES[0],
    [domain]
  );

  const domainInstruments = useMemo(() => {
    const dept = selectedTemplate.department;
    const primary = LAB_INSTRUMENTS.filter((i) => i.department === dept);
    return primary.length > 0 ? primary : LAB_INSTRUMENTS.slice(0, 12);
  }, [selectedTemplate.department]);

  const handleSelectDomain = (nextDomain: PersonalLabDomain) => {
    const tpl = DOMAIN_TEMPLATES.find((d) => d.id === nextDomain) ?? DOMAIN_TEMPLATES[0];
    setDomain(nextDomain);
    setLayout(tpl.defaultLayout);
    setActiveExperimentId(tpl.defaultExperimentId);
    const deptInsts = LAB_INSTRUMENTS.filter((i) => i.department === tpl.department).slice(0, 4);
    setSelectedEquipIds(deptInsts.map((i) => i.id));
    if (tpl.department !== 'chemistry') {
      setSelectedChemicalIds([]);
    }
  };

  const toggleEquip = (id: string) => {
    setSelectedEquipIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const toggleChemical = (id: string) => {
    setSelectedChemicalIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const addCustomRack = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newRackName.trim();
    if (!clean) return;
    setCustomRacks((prev) => [
      ...prev,
      {
        id: `rack-${Date.now()}`,
        title: clean,
        instrumentIds: selectedEquipIds.slice(0, 3),
      },
    ]);
    setNewRackName('');
  };

  const buildWorkbenchItems = (equipIds: string[]): WorkbenchItem[] =>
    equipIds.map((eqId, idx) => {
      const inst = getInstrumentById(eqId);
      const config: Record<string, number> = {};
      inst?.configurations.forEach((c) => {
        config[c.key] = c.defaultValue;
      });
      return {
        instanceId: `plab-${Date.now()}-${idx}`,
        instrumentId: eqId,
        xPercent: 20 + (idx % 4) * 20,
        yPercent: 34 + Math.floor(idx / 4) * 24,
        rotationDeg: 0,
        config,
      };
    });

  const handleSaveWorkspace = () => {
    const now = new Date().toISOString();
    const workspace: PersonalLabWorkspace = {
      id: activePersonalLabId || `personal-lab-${Date.now()}`,
      name: labName.trim() || `${selectedTemplate.label} Workspace`,
      domain,
      department: selectedTemplate.department,
      layout,
      customRacks,
      workbenchItems: buildWorkbenchItems(selectedEquipIds),
      chemicalIds: selectedChemicalIds,
      activeExperimentId,
      notes: notes.trim(),
      createdAt: now,
      updatedAt: now,
    };
    savePersonalLab(workspace);
    setStatusMessage(`Saved personal laboratory "${workspace.name}" locally.`);
  };

  const handleLoadWorkspace = (ws: PersonalLabWorkspace) => {
    setActivePersonalLabId(ws.id);
    setLabName(ws.name);
    setDomain(ws.domain);
    setLayout(ws.layout);
    setActiveExperimentId(ws.activeExperimentId);
    setCustomRacks(ws.customRacks);
    setSelectedEquipIds(ws.workbenchItems.map((w) => w.instrumentId));
    setSelectedChemicalIds(ws.chemicalIds);
    setNotes(ws.notes);
    setStatusMessage(`Loaded workspace "${ws.name}" into editor.`);
  };

  const handleOpenInVirtualRoom = (ws?: PersonalLabWorkspace) => {
    const targetDept = ws?.department ?? selectedTemplate.department;
    const targetExp = ws?.activeExperimentId ?? activeExperimentId;
    const equipIds = ws ? ws.workbenchItems.map((w) => w.instrumentId) : selectedEquipIds;
    const chemIds = ws ? ws.chemicalIds : selectedChemicalIds;

    setWorkbenchHandoff({
      department: targetDept,
      experimentId: targetExp,
      equipmentIds: equipIds,
      chemicalIds: chemIds,
      enterRoomDirectly: true,
    });
    navigate('virtual-lab', { department: targetDept, experimentId: targetExp });
  };

  const handleExportLabPlan = () => {
    const payload = {
      platform: 'OMNILAB — WHERE CURIOSITY BECOMES DISCOVERY',
      workspaceName: labName,
      domain,
      department: selectedTemplate.department,
      layout,
      experimentId: activeExperimentId,
      equipment: selectedEquipIds.map((id) => getInstrumentById(id)?.name ?? id),
      chemicals: selectedChemicalIds.map((id) => getChemicalById(id)?.name ?? id),
      customRacks,
      notes,
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `omnilab-personal-lab-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-3">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <div className="text-xs font-semibold uppercase tracking-wider text-blue-700 flex items-center gap-1.5">
              <Wrench className="w-4 h-4" />
              OmniLab Personal Research &amp; Learning Environment
            </div>
            <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
              My Personal Laboratory
            </h1>
            <p className="text-sm text-slate-600 max-w-3xl">
              Build your own private virtual laboratory across 9 scientific domains—configure custom benches, organize named apparatus racks, save multi-experiment workspaces, and resume unfinished investigations anytime.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleExportLabPlan}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-1.5"
            >
              <Download className="w-3.5 h-3.5" />
              Export Lab Setup
            </button>
            <button
              type="button"
              onClick={() => handleOpenInVirtualRoom()}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Launch Setup in Lab Room
            </button>
          </div>
        </div>

        {statusMessage && (
          <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-900 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            {statusMessage}
          </div>
        )}
      </div>

      {/* Continue Unfinished Workspaces & Saved Lab Designs */}
      {(personalLabs.length > 0 || savedLabDesigns.length > 0) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-700" />
            Saved Personal Labs &amp; Continue Unfinished Experiments ({personalLabs.length + savedLabDesigns.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {personalLabs.map((ws) => (
              <div
                key={ws.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-blue-700">
                    <span>{ws.domain.toUpperCase()}</span>
                    <span>{ws.layout}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{ws.name}</div>
                  <div className="text-xs text-slate-600">
                    {ws.workbenchItems.length} instruments · {ws.chemicalIds.length} reagents · {ws.customRacks.length} racks
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 border-t border-slate-200">
                  <button
                    type="button"
                    onClick={() => handleLoadWorkspace(ws)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-800 hover:border-blue-400"
                  >
                    Edit Config
                  </button>
                  <button
                    type="button"
                    onClick={() => handleOpenInVirtualRoom(ws)}
                    className="flex-1 py-1.5 px-2.5 rounded-lg bg-blue-700 text-white text-[11px] font-bold hover:bg-blue-800"
                  >
                    Enter Room
                  </button>
                  <button
                    type="button"
                    onClick={() => deletePersonalLab(ws.id)}
                    aria-label="Delete personal lab"
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}

            {savedLabDesigns.slice(0, 3).map((d) => (
              <div
                key={d.id}
                className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 flex flex-col justify-between space-y-3"
              >
                <div className="space-y-1">
                  <div className="flex items-center justify-between text-[11px] font-mono text-amber-800">
                    <span>{getLabRoomById(d.department).shortName}</span>
                    <span>{d.status === 'draft' ? 'Unfinished Draft' : 'Saved Setup'}</span>
                  </div>
                  <div className="text-sm font-bold text-slate-900">{d.title}</div>
                  <div className="text-xs text-slate-600">
                    {d.workbenchItems.length} placed instruments · Model: {d.experimentId}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setWorkbenchHandoff({ savedDesignId: d.id, enterRoomDirectly: true });
                    navigate('virtual-lab', { department: d.department, experimentId: d.experimentId });
                  }}
                  className="w-full py-1.5 px-3 rounded-lg bg-amber-600 text-white text-[11px] font-bold hover:bg-amber-700"
                >
                  Continue Unfinished Experiment
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Domain Templates */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-700" />
          1. Choose Scientific Domain Template (9 Disciplines)
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {DOMAIN_TEMPLATES.map((tpl) => {
            const active = domain === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleSelectDomain(tpl.id)}
                className={`text-left rounded-xl border p-3.5 transition-all ${
                  active
                    ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-200'
                    : 'border-slate-200 bg-slate-50 hover:border-blue-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{tpl.label}</div>
                <div className="text-[11px] text-slate-600 mt-1">{tpl.description}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Custom Lab Architect */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-5">
          {/* Workspace Metadata & Layout */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-display font-bold text-slate-900">
              2. Configure Laboratory Layout &amp; Primary Model
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Personal Laboratory Name
                </label>
                <input
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-slate-700 block mb-1">
                  Default Simulation Engine
                </label>
                <select
                  value={activeExperimentId}
                  onChange={(e) => setActiveExperimentId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900"
                >
                  {EXPERIMENTS.map((exp) => (
                    <option key={exp.id} value={exp.id}>
                      {exp.number}. {exp.shortTitle}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-2.5">
              {LAYOUT_OPTIONS.map((opt) => (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => setLayout(opt.id)}
                  className={`text-left rounded-xl border p-3 ${
                    layout === opt.id
                      ? 'border-blue-600 bg-blue-50 text-blue-950'
                      : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="text-xs font-bold">{opt.label}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{opt.detail}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Select Bench Equipment */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-display font-bold text-slate-900">
              3. Assign Instruments to Your Bench ({selectedEquipIds.length} selected)
            </h2>
            <div className="grid sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {domainInstruments.map((inst) => {
                const picked = selectedEquipIds.includes(inst.id);
                return (
                  <button
                    key={inst.id}
                    type="button"
                    onClick={() => toggleEquip(inst.id)}
                    className={`rounded-xl border p-2.5 flex items-center gap-2.5 text-left transition-colors ${
                      picked
                        ? 'border-blue-600 bg-blue-50'
                        : 'border-slate-200 bg-slate-50 hover:border-blue-300'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 p-1">
                      <EquipmentIllustration kind={inst.visualKind} className="w-8 h-8" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-bold text-slate-900 truncate">{inst.name}</div>
                      <div className="text-[10px] text-slate-600 truncate">
                        {inst.units || inst.category}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            {selectedTemplate.department === 'chemistry' && (
              <div className="pt-3 border-t border-slate-200 space-y-2.5">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Atom className="w-4 h-4 text-emerald-700" />
                  Select Virtual Reagents for Chemistry Rack ({selectedChemicalIds.length} selected)
                </div>
                <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                  {CHEMISTRY_CHEMICAL_VAULT.map((c) => {
                    const picked = selectedChemicalIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleChemical(c.id)}
                        className={`px-2.5 py-1 rounded-lg border text-[11px] font-medium ${
                          picked
                            ? 'border-emerald-700 bg-emerald-700 text-white font-semibold'
                            : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-emerald-400'
                        }`}
                      >
                        {c.symbol} · {c.commonName}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Custom Racks, Notes & Save */}
        <div className="lg:col-span-5 space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-700" />
              4. Custom Storage Racks
            </h2>
            <form onSubmit={addCustomRack} className="flex gap-2">
              <input
                type="text"
                value={newRackName}
                onChange={(e) => setNewRackName(e.target.value)}
                placeholder="New rack name (e.g. Spectroscopy Shelf)..."
                className="flex-1 px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900"
              />
              <button
                type="submit"
                className="px-3 py-2 rounded-lg bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Rack
              </button>
            </form>
            <div className="space-y-2">
              {customRacks.map((rack) => (
                <div
                  key={rack.id}
                  className="rounded-xl border border-slate-200 bg-slate-50 p-3 flex items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="font-bold text-slate-900">{rack.title}</div>
                    <div className="text-[11px] text-slate-600">
                      {rack.instrumentIds.map((id) => getInstrumentById(id)?.name ?? id).join(', ') || 'Empty rack'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setCustomRacks((prev) => prev.filter((r) => r.id !== rack.id))}
                    className="text-slate-400 hover:text-rose-600 p-1"
                    aria-label="Remove rack"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-700" />
              5. Personal Lab Protocol &amp; Save
            </h2>
            <textarea
              rows={4}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write personal apparatus arrangement rules, target parameters, or experiment goals..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={handleSaveWorkspace}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center justify-center gap-1.5"
              >
                <Save className="w-4 h-4" />
                Save Personal Lab
              </button>
              <button
                type="button"
                onClick={() => {
                  handleSaveWorkspace();
                  handleOpenInVirtualRoom();
                }}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center justify-center gap-1.5"
              >
                <FlaskConical className="w-4 h-4" />
                Save &amp; Enter Room
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
