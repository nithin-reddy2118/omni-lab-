import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  Atom,
  BookOpen,
  CheckCircle2,
  Copy,
  Cpu,
  Download,
  FlaskConical,
  FolderOpen,
  Layers,
  Plus,
  RotateCw,
  Save,
  Search,
  Sparkles,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { CHEMISTRY_CHEMICAL_VAULT, getChemicalById } from '../data/chemicals';
import { getInstrumentById, getLabRoomById, LAB_INSTRUMENTS, LAB_ROOMS } from '../data/labEquipment';
import { EXPERIMENTS } from '../engine/experiments';
import {
  checkInstrumentPlacementCompatibility,
  findExperimentsForBenchSetup,
  getCentralRegistryCategories,
  searchCentralRegistry,
  type InstrumentPlacementWarning,
  type RegistrySortMode,
} from '../engine/equipmentRegistry';
import type {
  LabDepartmentId,
  LabInstrument,
  PersonalLabDomain,
  PersonalLabLayout,
  PersonalLabWorkspace,
  WorkbenchItem,
} from '../types/science';
import { EquipmentIllustration } from '../components/lab/EquipmentIllustration';
import { AudioNarrationBar } from '../components/ui/AudioNarrationBar';

const DOMAIN_TEMPLATES: {
  id: PersonalLabDomain;
  label: string;
  department: LabDepartmentId;
  defaultExperimentId: string;
  defaultLayout: PersonalLabLayout;
  description: string;
}[] = [
  {
    id: 'custom-blank',
    label: 'Blank Custom Room (Start from Zero)',
    department: 'chemistry',
    defaultExperimentId: 'acid-base-titration',
    defaultLayout: 'bench-central',
    description: 'Empty clean bench—search all 133+ instruments and 30 reagents across all 10 wings.',
  },
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

function createDefaultWorkbenchItem(instrumentId: string, existingCount: number): WorkbenchItem {
  const inst = getInstrumentById(instrumentId);
  const config: Record<string, number> = {};
  inst?.configurations.forEach((c) => {
    config[c.key] = c.defaultValue;
  });
  return {
    instanceId: `plab-${Date.now()}-${Math.random().toString(36).slice(2, 6)}-${existingCount}`,
    instrumentId,
    xPercent: 18 + (existingCount % 4) * 20,
    yPercent: 32 + Math.floor(existingCount / 4) * 22,
    rotationDeg: 0,
    config,
  };
}

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

  const initialLab = useMemo(
    () => (activePersonalLabId ? personalLabs.find((p) => p.id === activePersonalLabId) ?? null : null),
    [activePersonalLabId, personalLabs]
  );

  const [editingLabId, setEditingLabId] = useState<string | null>(() => initialLab?.id ?? null);
  const [labName, setLabName] = useState(
    () => initialLab?.name ?? 'My Custom Discovery Workspace'
  );
  const [domain, setDomain] = useState<PersonalLabDomain>(
    () => initialLab?.domain ?? 'chemistry'
  );
  const [layout, setLayout] = useState<PersonalLabLayout>(
    () => initialLab?.layout ?? 'bench-central'
  );
  const [activeExperimentId, setActiveExperimentId] = useState(
    () => initialLab?.activeExperimentId ?? 'acid-base-titration'
  );
  const [workbenchItems, setWorkbenchItems] = useState<WorkbenchItem[]>(() =>
    initialLab
      ? initialLab.workbenchItems
      : [
          createDefaultWorkbenchItem('chem-beaker', 0),
          createDefaultWorkbenchItem('chem-burette', 1),
          createDefaultWorkbenchItem('chem-ph-meter', 2),
        ]
  );
  const [selectedChemicalIds, setSelectedChemicalIds] = useState<string[]>(() =>
    initialLab
      ? initialLab.chemicalIds
      : ['chem-sub-hcl', 'chem-sub-naoh', 'chem-sub-phenol']
  );
  const [customRacks, setCustomRacks] = useState<{ id: string; title: string; instrumentIds: string[] }[]>(
    () =>
      initialLab?.customRacks ?? [
        {
          id: 'rack-primary',
          title: 'Primary Measurement Rack',
          instrumentIds: ['chem-burette', 'chem-ph-meter'],
        },
      ]
  );
  const [newRackName, setNewRackName] = useState('');
  const [notes, setNotes] = useState(() => initialLab?.notes ?? '');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [advisoryWarnings, setAdvisoryWarnings] = useState<InstrumentPlacementWarning[]>([]);

  // Central Registry Search & Filter Controls
  const [equipQuery, setEquipQuery] = useState('');
  const [equipWingFilter, setEquipWingFilter] = useState<'all' | LabDepartmentId>('all');
  const [equipCategoryFilter, setEquipCategoryFilter] = useState<string>('all');
  const [equipSortBy, setEquipSortBy] = useState<RegistrySortMode>('relevance');
  const [chemQuery, setChemQuery] = useState('');

  const selectedTemplate = useMemo(
    () => DOMAIN_TEMPLATES.find((t) => t.id === domain) ?? DOMAIN_TEMPLATES[0],
    [domain]
  );

  const registryCategories = useMemo(() => getCentralRegistryCategories(false), []);

  const searchResults = useMemo(() => {
    const res = searchCentralRegistry({
      query: equipQuery,
      department: equipWingFilter,
      category: equipCategoryFilter,
      includeChemicals: false,
      sortBy: equipSortBy,
    });
    return res
      .map((entry) => entry.instrument)
      .filter((inst): inst is LabInstrument => Boolean(inst));
  }, [equipQuery, equipWingFilter, equipCategoryFilter, equipSortBy]);

  const filteredChemicals = useMemo(() => {
    const q = chemQuery.trim().toLowerCase();
    if (!q) return CHEMISTRY_CHEMICAL_VAULT;
    return CHEMISTRY_CHEMICAL_VAULT.filter(
      (c) =>
        c.name.toLowerCase().includes(q) ||
        c.commonName.toLowerCase().includes(q) ||
        c.symbol.toLowerCase().includes(q) ||
        c.formula.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
    );
  }, [chemQuery]);

  const suggestedCompatibleExperiments = useMemo(
    () => findExperimentsForBenchSetup(workbenchItems).slice(0, 4),
    [workbenchItems]
  );

  const handleCreateNewBlankLab = () => {
    setEditingLabId(null);
    setActivePersonalLabId(null);
    setDomain('custom-blank');
    setLabName(`Custom Lab #${personalLabs.length + 1}`);
    setLayout('bench-central');
    setActiveExperimentId('acid-base-titration');
    setWorkbenchItems([]);
    setSelectedChemicalIds([]);
    setCustomRacks([]);
    setNotes('');
    setAdvisoryWarnings([]);
    setEquipWingFilter('all');
    setStatusMessage('Started a new Blank Custom Personal Room. Search the Central Registry to place any tools.');
  };

  const handleSelectDomain = (nextDomain: PersonalLabDomain) => {
    const tpl = DOMAIN_TEMPLATES.find((d) => d.id === nextDomain) ?? DOMAIN_TEMPLATES[0];
    setDomain(nextDomain);
    setLayout(tpl.defaultLayout);
    setActiveExperimentId(tpl.defaultExperimentId);
    setAdvisoryWarnings([]);

    if (nextDomain === 'custom-blank') {
      setWorkbenchItems([]);
      setSelectedChemicalIds([]);
      setCustomRacks([]);
      setEquipWingFilter('all');
      setStatusMessage('Loaded Blank Custom Room with an empty workbench.');
      return;
    }

    const deptInsts = LAB_INSTRUMENTS.filter((i) => i.department === tpl.department).slice(0, 4);
    setWorkbenchItems(deptInsts.map((inst, idx) => createDefaultWorkbenchItem(inst.id, idx)));
    if (tpl.department === 'chemistry') {
      setSelectedChemicalIds(['chem-sub-hcl', 'chem-sub-naoh', 'chem-sub-phenol']);
    } else {
      setSelectedChemicalIds([]);
    }
    setEquipWingFilter(tpl.department);
  };

  const handleAddInstrumentToPersonalBench = (inst: LabInstrument) => {
    const warnings = checkInstrumentPlacementCompatibility(inst, workbenchItems);
    setAdvisoryWarnings(warnings);
    const nextItem = createDefaultWorkbenchItem(inst.id, workbenchItems.length);
    setWorkbenchItems((prev) => [...prev, nextItem]);
    setStatusMessage(
      `Added ${inst.name} (${getLabRoomById(inst.department).shortName}) to bench.`
    );
  };

  const handleRemoveWorkbenchItem = (instanceId: string) => {
    setWorkbenchItems((prev) => prev.filter((item) => item.instanceId !== instanceId));
  };

  const handleRotateItem = (instanceId: string, deltaDeg: number) => {
    setWorkbenchItems((prev) =>
      prev.map((item) =>
        item.instanceId === instanceId
          ? { ...item, rotationDeg: (item.rotationDeg + deltaDeg + 360) % 360 }
          : item
      )
    );
  };

  const handleUpdateItemPosition = (
    instanceId: string,
    axis: 'xPercent' | 'yPercent',
    val: number
  ) => {
    const min = axis === 'xPercent' ? 10 : 18;
    const max = axis === 'xPercent' ? 90 : 84;
    const clamped = Math.min(max, Math.max(min, Number.isFinite(val) ? val : min));
    setWorkbenchItems((prev) =>
      prev.map((item) => (item.instanceId === instanceId ? { ...item, [axis]: clamped } : item))
    );
  };

  const handleUpdateItemConfig = (instanceId: string, key: string, val: number) => {
    if (!Number.isFinite(val)) return;
    setWorkbenchItems((prev) =>
      prev.map((item) =>
        item.instanceId === instanceId
          ? { ...item, config: { ...item.config, [key]: val } }
          : item
      )
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
        instrumentIds: Array.from(new Set(workbenchItems.map((w) => w.instrumentId))).slice(0, 6),
      },
    ]);
    setNewRackName('');
  };

  const buildWorkspaceSnapshot = (): PersonalLabWorkspace => {
    const existing = editingLabId ? personalLabs.find((p) => p.id === editingLabId) : null;
    const now = new Date().toISOString();
    const labId = editingLabId || `personal-lab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`;
    return {
      id: labId,
      name: labName.trim() || `${selectedTemplate.label} Workspace`,
      domain,
      department: selectedTemplate.department,
      layout,
      customRacks,
      workbenchItems,
      chemicalIds: selectedChemicalIds,
      activeExperimentId,
      notes: notes.trim(),
      createdAt: existing?.createdAt ?? now,
      updatedAt: now,
    };
  };

  const handleSaveWorkspace = (): PersonalLabWorkspace => {
    const workspace = buildWorkspaceSnapshot();
    setEditingLabId(workspace.id);
    savePersonalLab(workspace);
    setStatusMessage(
      `Saved personal laboratory "${workspace.name}" (${workspace.workbenchItems.length} placed apparatus, ${workspace.chemicalIds.length} reagents).`
    );
    return workspace;
  };

  const handleDuplicateWorkspace = (ws: PersonalLabWorkspace) => {
    const now = new Date().toISOString();
    const copy: PersonalLabWorkspace = {
      ...ws,
      id: `personal-lab-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      name: `${ws.name} (Copy)`,
      workbenchItems: ws.workbenchItems.map((item, idx) => ({
        ...item,
        instanceId: `plab-${Date.now()}-${idx}`,
      })),
      createdAt: now,
      updatedAt: now,
    };
    savePersonalLab(copy);
    handleLoadWorkspace(copy);
    setStatusMessage(`Duplicated "${ws.name}" as "${copy.name}".`);
  };

  const handleLoadWorkspace = (ws: PersonalLabWorkspace) => {
    setEditingLabId(ws.id);
    setActivePersonalLabId(ws.id);
    setLabName(ws.name);
    setDomain(ws.domain);
    setLayout(ws.layout);
    setActiveExperimentId(ws.activeExperimentId);
    setCustomRacks(ws.customRacks);
    setWorkbenchItems(ws.workbenchItems);
    setSelectedChemicalIds(ws.chemicalIds);
    setNotes(ws.notes);
    setAdvisoryWarnings([]);
    setStatusMessage(`Loaded workspace "${ws.name}" into editor.`);
  };

  const handleOpenInVirtualRoom = (ws?: PersonalLabWorkspace) => {
    const targetWs = ws ?? handleSaveWorkspace();
    setActivePersonalLabId(targetWs.id);
    setWorkbenchHandoff({
      personalLabId: targetWs.id,
      department: targetWs.department,
      experimentId: targetWs.activeExperimentId,
      workbenchItems: targetWs.workbenchItems,
      equipmentIds: targetWs.workbenchItems.map((w) => w.instrumentId),
      chemicalIds: targetWs.chemicalIds,
      customRacks: targetWs.customRacks,
      enterRoomDirectly: true,
    });
    navigate('virtual-lab', {
      department: targetWs.department,
      experimentId: targetWs.activeExperimentId,
    });
  };

  const handleExportLabPlan = () => {
    const payload = {
      platform: 'OMNILAB — WHERE CURIOSITY BECOMES DISCOVERY',
      workspaceName: labName,
      domain,
      department: selectedTemplate.department,
      layout,
      experimentId: activeExperimentId,
      workbenchItems: workbenchItems.map((item) => ({
        ...item,
        name: getInstrumentById(item.instrumentId)?.name ?? item.instrumentId,
      })),
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

  const personalGuidanceNarration = useMemo(() => {
    const activeExp = EXPERIMENTS.find((e) => e.id === activeExperimentId);
    const placedNames = workbenchItems
      .map((w) => getInstrumentById(w.instrumentId)?.name)
      .filter(Boolean)
      .slice(0, 6)
      .join(', ');
    return [
      `Personal laboratory: ${labName}. Domain template: ${selectedTemplate.label}.`,
      placedNames
        ? `Currently placed on your workbench: ${placedNames}.`
        : 'Your workbench is currently empty. Search the Central Registry to place equipment.',
      activeExp
        ? `Linked simulation model: ${activeExp.title}. ${activeExp.explanation}`
        : '',
      notes.trim() ? `Research notes: ${notes.trim()}` : '',
    ]
      .filter(Boolean)
      .join(' ');
  }, [labName, selectedTemplate.label, workbenchItems, activeExperimentId, notes]);

  return (
    <div className="space-y-6 pb-16">
      {/* Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
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
              Start from a blank workspace or any scientific domain template, search all {LAB_INSTRUMENTS.length} instruments &amp; {CHEMISTRY_CHEMICAL_VAULT.length} reagents across every wing, customize layout &amp; orientations, and persist every run across reloads.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={handleCreateNewBlankLab}
              data-testid="new-blank-lab-btn"
              className="px-3.5 py-2 rounded-lg border border-blue-200 bg-blue-50 text-xs font-bold text-blue-800 hover:bg-blue-100 flex items-center gap-1.5 min-h-[40px]"
            >
              <Plus className="w-3.5 h-3.5" />
              New Blank Room
            </button>
            <button
              type="button"
              onClick={handleExportLabPlan}
              className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-1.5 min-h-[40px]"
            >
              <Download className="w-3.5 h-3.5" />
              Export Setup
            </button>
            <button
              type="button"
              onClick={() => handleOpenInVirtualRoom()}
              data-testid="launch-personal-room-btn"
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 min-h-[40px]"
            >
              <FlaskConical className="w-3.5 h-3.5" />
              Save &amp; Launch in Lab Room
            </button>
          </div>
        </div>

        <AudioNarrationBar
          title="Personal Lab Experiment Guidance"
          text={personalGuidanceNarration}
          compact
        />

        {statusMessage && (
          <div
            role="status"
            className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-2 text-xs text-emerald-900 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-700 shrink-0" />
            {statusMessage}
          </div>
        )}
      </div>

      {/* Saved Personal Labs & Unfinished Designs */}
      {(personalLabs.length > 0 || savedLabDesigns.length > 0) && (
        <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
            <FolderOpen className="w-4 h-4 text-blue-700" />
            Saved Personal Labs &amp; Unfinished Experiments ({personalLabs.length + savedLabDesigns.length})
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {personalLabs.map((ws) => {
              const isEditingThis = editingLabId === ws.id;
              return (
                <div
                  key={ws.id}
                  data-testid={`saved-personal-lab-${ws.id}`}
                  className={`rounded-xl border p-4 flex flex-col justify-between space-y-3 ${
                    isEditingThis
                      ? 'border-blue-600 bg-blue-50/40 ring-1 ring-blue-200'
                      : 'border-slate-200 bg-slate-50'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[11px] font-mono text-blue-700">
                      <span>{ws.domain.toUpperCase()}</span>
                      <span>{isEditingThis ? 'ACTIVE IN EDITOR' : ws.layout}</span>
                    </div>
                    <div className="text-sm font-bold text-slate-900">{ws.name}</div>
                    <div className="text-xs text-slate-600">
                      {ws.workbenchItems.length} instruments · {ws.chemicalIds.length} reagents · {ws.customRacks.length} racks
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 pt-2 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleLoadWorkspace(ws)}
                      className="flex-1 py-1.5 px-2 rounded-lg border border-slate-300 bg-white text-[11px] font-semibold text-slate-800 hover:border-blue-400"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleOpenInVirtualRoom(ws)}
                      className="flex-1 py-1.5 px-2 rounded-lg bg-blue-700 text-white text-[11px] font-bold hover:bg-blue-800"
                    >
                      Enter Room
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDuplicateWorkspace(ws)}
                      aria-label={`Duplicate ${ws.name}`}
                      className="p-1.5 rounded-lg text-slate-500 hover:text-blue-700 bg-white border border-slate-200"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        deletePersonalLab(ws.id);
                        if (editingLabId === ws.id) setEditingLabId(null);
                      }}
                      aria-label={`Delete ${ws.name}`}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 bg-white border border-slate-200"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}

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

      {/* Domain Templates (Blank + 9 Scientific Disciplines) */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
          <Layers className="w-4 h-4 text-blue-700" />
          1. Choose Starter Room Template (Blank Custom Room + 9 Scientific Disciplines)
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {DOMAIN_TEMPLATES.map((tpl) => {
            const active = domain === tpl.id;
            return (
              <button
                key={tpl.id}
                type="button"
                data-testid={`domain-template-${tpl.id}`}
                onClick={() => handleSelectDomain(tpl.id)}
                className={`text-left rounded-xl border p-3.5 transition-all ${
                  active
                    ? 'border-blue-600 bg-blue-50/70 ring-1 ring-blue-200'
                    : tpl.id === 'custom-blank'
                      ? 'border-dashed border-blue-400 bg-blue-50/20 hover:bg-blue-50/50'
                      : 'border-slate-200 bg-slate-50 hover:border-blue-300'
                }`}
              >
                <div className="text-xs font-bold text-slate-900">{tpl.label}</div>
                <div className="text-[11px] text-slate-600 mt-1 leading-snug">{tpl.description}</div>
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
              2. Configure Laboratory Name, Layout &amp; Simulation Model
            </h2>
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="personal-lab-name"
                  className="text-xs font-semibold text-slate-700 block mb-1"
                >
                  Personal Laboratory Name
                </label>
                <input
                  id="personal-lab-name"
                  type="text"
                  value={labName}
                  onChange={(e) => setLabName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900"
                />
              </div>
              <div>
                <label
                  htmlFor="personal-lab-model"
                  className="text-xs font-semibold text-slate-700 block mb-1"
                >
                  Default Simulation Engine
                </label>
                <select
                  id="personal-lab-model"
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

            {suggestedCompatibleExperiments.length > 0 && (
              <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 space-y-1.5">
                <div className="text-[11px] font-semibold text-blue-900 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-blue-700" />
                  Compatible Experiments Detected for Current Bench Apparatus:
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {suggestedCompatibleExperiments.map((match) => (
                    <button
                      key={match.experimentId}
                      type="button"
                      onClick={() => setActiveExperimentId(match.experimentId)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                        activeExperimentId === match.experimentId
                          ? 'bg-blue-700 text-white border-blue-700'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-blue-400'
                      }`}
                    >
                      {match.shortTitle} ({match.readinessLabel})
                    </button>
                  ))}
                </div>
              </div>
            )}

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

          {/* Central Searchable Equipment Registry (All 133+ Instruments Across All Wings) */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2 className="text-base font-display font-bold text-slate-900">
                3. Central Equipment Search &amp; Cross-Wing Registry ({LAB_INSTRUMENTS.length} Instruments)
              </h2>
              <span className="text-xs font-mono text-blue-700 font-semibold">
                {searchResults.length} matching
              </span>
            </div>

            {/* Search, Wing Filter, Category Filter, Sort */}
            <div className="space-y-2.5">
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="search"
                  data-testid="personal-equip-search"
                  value={equipQuery}
                  onChange={(e) => setEquipQuery(e.target.value)}
                  placeholder="Search all wings: Beaker, Multimeter, Stopwatch, Microscope, Oscilloscope, Pipette..."
                  className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 bg-slate-50 text-xs sm:text-sm text-slate-900 focus:border-blue-600 focus:bg-white outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <select
                  aria-label="Filter by Wing"
                  value={equipWingFilter}
                  onChange={(e) => setEquipWingFilter(e.target.value as 'all' | LabDepartmentId)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900"
                >
                  <option value="all">All 10 Lab Wings</option>
                  {LAB_ROOMS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.shortName}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Filter by Category"
                  value={equipCategoryFilter}
                  onChange={(e) => setEquipCategoryFilter(e.target.value)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900"
                >
                  {registryCategories.map((c) => (
                    <option key={c} value={c}>
                      {c === 'all' ? 'All Categories' : c}
                    </option>
                  ))}
                </select>

                <select
                  aria-label="Sort equipment"
                  value={equipSortBy}
                  onChange={(e) => setEquipSortBy(e.target.value as RegistrySortMode)}
                  className="px-2.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900"
                >
                  <option value="relevance">Sort: Relevance</option>
                  <option value="name-asc">Sort: Name (A–Z)</option>
                  <option value="category">Sort: Category</option>
                </select>
              </div>
            </div>

            {advisoryWarnings.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs text-amber-950 space-y-1">
                {advisoryWarnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                    <span>{w.message}</span>
                  </div>
                ))}
              </div>
            )}

            <div className="grid sm:grid-cols-2 gap-2.5 max-h-80 overflow-y-auto pr-1">
              {searchResults.length === 0 ? (
                <div className="sm:col-span-2 rounded-xl border border-dashed border-slate-300 p-6 text-center text-xs text-slate-600">
                  No instruments matched &ldquo;{equipQuery}&rdquo;. Try clearing the Wing or Category filter.
                </div>
              ) : (
                searchResults.map((inst) => {
                  const placedCount = workbenchItems.filter(
                    (w) => w.instrumentId === inst.id
                  ).length;
                  return (
                    <div
                      key={inst.id}
                      className={`rounded-xl border p-2.5 flex items-center gap-2.5 transition-colors ${
                        placedCount > 0
                          ? 'border-blue-500 bg-blue-50/70'
                          : 'border-slate-200 bg-slate-50 hover:border-blue-300'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 p-1">
                        <EquipmentIllustration kind={inst.visualKind} className="w-8 h-8" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-xs font-bold text-slate-900 truncate" title={inst.name}>
                          {inst.name}
                        </div>
                        <div className="text-[10px] text-slate-600 truncate">
                          {getLabRoomById(inst.department).shortName} · {inst.category}
                          {placedCount > 0 ? ` · ${placedCount} placed` : ''}
                        </div>
                      </div>
                      <button
                        type="button"
                        data-testid={`add-equip-${inst.id}`}
                        onClick={() => handleAddInstrumentToPersonalBench(inst)}
                        className="px-2.5 py-1.5 rounded-lg bg-blue-700 text-white text-[11px] font-bold hover:bg-blue-800 shrink-0 min-h-[34px]"
                      >
                        + Add
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Virtual Reagents Selector (Available for Any Personal Lab) */}
            <div className="pt-3 border-t border-slate-200 space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-bold text-emerald-900 flex items-center gap-1.5">
                  <Atom className="w-4 h-4 text-emerald-700" />
                  Virtual Reagents &amp; Chemicals ({selectedChemicalIds.length} selected)
                </div>
                <input
                  type="search"
                  value={chemQuery}
                  onChange={(e) => setChemQuery(e.target.value)}
                  placeholder="Filter reagents (HCl, NaOH, Water...)"
                  className="px-2.5 py-1 rounded-lg border border-slate-200 bg-slate-50 text-xs text-slate-900"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
                {filteredChemicals.map((c) => {
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
          </div>
        </div>

        {/* Right Column: Placed Bench Items, Rotations, Custom Racks, Notes & Save */}
        <div className="lg:col-span-5 space-y-5">
          {/* Placed Workbench Items with Individual Spatial & Rotation Controls */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-display font-bold text-slate-900">
                4. Placed Bench Apparatus ({workbenchItems.length})
              </h2>
              {workbenchItems.length > 0 && (
                <button
                  type="button"
                  onClick={() => setWorkbenchItems([])}
                  className="text-xs text-rose-600 hover:underline font-medium"
                >
                  Clear All
                </button>
              )}
            </div>

            {workbenchItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs text-slate-600">
                Bench is empty. Use the Central Equipment Search on the left to add instruments.
              </div>
            ) : (
              <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
                {workbenchItems.map((item) => {
                  const inst = getInstrumentById(item.instrumentId);
                  if (!inst) return null;
                  return (
                    <div
                      key={item.instanceId}
                      data-testid={`personal-placed-${item.instrumentId}`}
                      className="rounded-xl border border-slate-200 bg-slate-50 p-3 space-y-2"
                    >
                      <div className="flex items-center gap-2.5">
                        {/* Only the illustration rotates; the label remains horizontal & legible */}
                        <div className="w-11 h-11 rounded-lg bg-slate-900 flex items-center justify-center shrink-0 overflow-hidden">
                          <div style={{ transform: `rotate(${item.rotationDeg}deg)` }}>
                            <EquipmentIllustration kind={inst.visualKind} className="w-8 h-8" />
                          </div>
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="text-xs font-bold text-slate-900 truncate">
                            {inst.name}
                          </div>
                          <div className="text-[10px] font-mono text-slate-600">
                            X:{Math.round(item.xPercent)}% · Y:{Math.round(item.yPercent)}% · {item.rotationDeg}°
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRotateItem(item.instanceId, 15)}
                          className="px-2 py-1 rounded border border-slate-300 bg-white text-[11px] font-semibold text-slate-800 hover:border-blue-400 flex items-center gap-1"
                          title="Rotate apparatus +15°"
                        >
                          <RotateCw className="w-3 h-3" />
                          +15°
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRemoveWorkbenchItem(item.instanceId)}
                          aria-label={`Remove ${inst.name}`}
                          className="p-1.5 rounded text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <div className="grid grid-cols-2 gap-2 text-[11px]">
                        <label className="flex items-center justify-between gap-1 bg-white rounded px-2 py-1 border border-slate-200">
                          <span className="text-slate-500">X %</span>
                          <input
                            type="number"
                            min={10}
                            max={90}
                            value={Math.round(item.xPercent)}
                            onChange={(e) =>
                              handleUpdateItemPosition(
                                item.instanceId,
                                'xPercent',
                                Number(e.target.value)
                              )
                            }
                            className="w-12 text-right font-mono text-slate-900 outline-none"
                          />
                        </label>
                        <label className="flex items-center justify-between gap-1 bg-white rounded px-2 py-1 border border-slate-200">
                          <span className="text-slate-500">Y %</span>
                          <input
                            type="number"
                            min={18}
                            max={84}
                            value={Math.round(item.yPercent)}
                            onChange={(e) =>
                              handleUpdateItemPosition(
                                item.instanceId,
                                'yPercent',
                                Number(e.target.value)
                              )
                            }
                            className="w-12 text-right font-mono text-slate-900 outline-none"
                          />
                        </label>
                      </div>

                      {inst.configurations.length > 0 && (
                        <div className="space-y-1 pt-1 border-t border-slate-200">
                          {inst.configurations.map((cfg) => (
                            <label
                              key={cfg.key}
                              className="flex items-center justify-between gap-2 text-[11px] text-slate-700"
                            >
                              <span className="truncate">{cfg.label}</span>
                              <span className="flex items-center gap-1 font-mono">
                                <input
                                  type="number"
                                  min={cfg.min}
                                  max={cfg.max}
                                  step={cfg.step}
                                  value={item.config[cfg.key] ?? cfg.defaultValue}
                                  onChange={(e) =>
                                    handleUpdateItemConfig(
                                      item.instanceId,
                                      cfg.key,
                                      Number(e.target.value)
                                    )
                                  }
                                  className="w-16 px-1.5 py-0.5 rounded border border-slate-200 bg-white text-right text-slate-900"
                                />
                                <span className="text-slate-500">{cfg.unit}</span>
                              </span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Custom Storage Racks */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-blue-700" />
              5. Custom Storage Racks
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
                      {rack.instrumentIds.map((id) => getInstrumentById(id)?.name ?? id).join(', ') ||
                        'Empty rack'}
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

          {/* Protocol Notes & Save */}
          <div className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-display font-bold text-slate-900 flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-700" />
              6. Personal Lab Protocol &amp; Save
            </h2>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Write personal apparatus arrangement rules, target parameters, or experiment goals..."
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-xs sm:text-sm text-slate-900"
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                data-testid="save-personal-lab-btn"
                onClick={() => handleSaveWorkspace()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-700 text-white text-xs font-bold hover:bg-emerald-800 flex items-center justify-center gap-1.5 min-h-[44px]"
              >
                <Save className="w-4 h-4" />
                Save Personal Lab
              </button>
              <button
                type="button"
                data-testid="save-and-enter-room-btn"
                onClick={() => handleOpenInVirtualRoom()}
                className="flex-1 py-2.5 px-4 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center justify-center gap-1.5 min-h-[44px]"
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
