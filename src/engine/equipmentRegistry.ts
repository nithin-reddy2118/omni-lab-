import { CHEMISTRY_CHEMICAL_VAULT } from '../data/chemicals';
import { LAB_INSTRUMENTS, LAB_ROOMS } from '../data/labEquipment';
import { EXPERIMENTS } from './experiments';
import type {
  ChemicalSubstance,
  LabDepartmentId,
  LabInstrument,
  WorkbenchChemicalItem,
  WorkbenchItem,
} from '../types/science';

export interface CentralRegistryEntry {
  kind: 'instrument' | 'chemical';
  id: string;
  name: string;
  subtitle: string;
  department: LabDepartmentId;
  wingName: string;
  category: string;
  units: string;
  searchKeywords: string[];
  compatibleWith: string[];
  supportedModels: string[];
  instrument?: LabInstrument;
  chemical?: ChemicalSubstance;
}

const SYNONYM_MAP: Record<string, string[]> = {
  beaker: ['vessel', 'glassware', 'container', 'borosilicate', 'cup'],
  flask: ['erlenmeyer', 'conical', 'volumetric', 'titration'],
  cylinder: ['graduated', 'volume', 'measuring'],
  pipette: ['micropipette', 'dropper', 'aliquot', 'transfer'],
  burette: ['titration', 'stopcock', 'acid-base'],
  burner: ['heat', 'hot plate', 'thermal', 'boil', 'warming'],
  heater: ['hot plate', 'heat', 'thermal', 'boil'],
  thermometer: ['temperature', 'probe', 'rtd', 'celsius', 'kelvin'],
  balance: ['scale', 'mass', 'weight', 'gram', 'analytical'],
  barometer: ['pressure', 'altitude', 'kpa', 'vacuum'],
  multimeter: ['ammeter', 'voltmeter', 'ohmmeter', 'voltage', 'current', 'resistance'],
  meter: ['ph', 'sensor', 'gauge', 'probe', 'stopwatch'],
  stopwatch: ['timer', 'clock', 'period', 'time'],
  microscope: ['optics', 'lens', 'slide', 'cell', 'magnify'],
  oscilloscope: ['waveform', 'signal', 'voltage', 'frequency'],
  resistor: ['ohm', 'decade', 'circuit', 'load'],
  supply: ['battery', 'dc', 'voltage', 'power'],
  pendulum: ['bob', 'oscillation', 'gravity', 'shm'],
  telescope: ['astronomy', 'star', 'planet', 'orbit'],
  spectro: ['prism', 'optics', 'wavelength', 'absorbance'],
};

const ROOM_NAME_BY_ID = new Map(LAB_ROOMS.map((r) => [r.id, r.shortName]));

function buildKeywords(parts: string[]): string[] {
  const joined = parts.join(' ').toLowerCase();
  const extra: string[] = [];
  for (const [token, aliases] of Object.entries(SYNONYM_MAP)) {
    if (joined.includes(token)) {
      extra.push(...aliases);
    }
  }
  return Array.from(new Set([...joined.split(/[^a-z0-9+µ]+/).filter(Boolean), ...extra]));
}

export const CENTRAL_EQUIPMENT_REGISTRY: CentralRegistryEntry[] = [
  ...LAB_INSTRUMENTS.map((inst): CentralRegistryEntry => ({
    kind: 'instrument',
    id: inst.id,
    name: inst.name,
    subtitle: inst.functionSummary,
    department: inst.department,
    wingName: ROOM_NAME_BY_ID.get(inst.department) || inst.department,
    category: inst.category,
    units: inst.units,
    searchKeywords: buildKeywords([
      inst.id,
      inst.name,
      inst.category,
      inst.department,
      inst.description,
      inst.functionSummary,
      inst.scientificPrinciple,
      inst.units,
    ]),
    compatibleWith: inst.compatibleWith,
    supportedModels: inst.supportedModels,
    instrument: inst,
  })),
  ...CHEMISTRY_CHEMICAL_VAULT.map((chem): CentralRegistryEntry => ({
    kind: 'chemical',
    id: chem.id,
    name: `${chem.commonName} (${chem.symbol})`,
    subtitle: `${chem.iupacName} · ${chem.standardConcentrationOrPurity}`,
    department: 'chemistry',
    wingName: 'Chemistry Wing (Reagent)',
    category: `Chemical · ${chem.category}`,
    units: chem.units,
    searchKeywords: buildKeywords([
      chem.id,
      chem.name,
      chem.commonName,
      chem.iupacName,
      chem.formula,
      chem.symbol,
      chem.category,
      chem.stateAtRoomTemp,
    ]),
    compatibleWith: ['chem-beaker', 'chem-conical-flask', 'chem-test-tubes', 'chem-volumetric-flask', 'chem-burette'],
    supportedModels: chem.compatibleExperiments,
    chemical: chem,
  })),
];

export type RegistrySortMode = 'relevance' | 'name-asc' | 'category';

export interface RegistrySearchOptions {
  query?: string;
  department?: 'all' | LabDepartmentId;
  category?: 'all' | string;
  includeChemicals?: boolean;
  sortBy?: RegistrySortMode;
}

export function getCentralRegistryCategories(includeChemicals = false): string[] {
  const cats = new Set<string>();
  for (const entry of CENTRAL_EQUIPMENT_REGISTRY) {
    if (!includeChemicals && entry.kind === 'chemical') continue;
    cats.add(entry.category);
  }
  return ['all', ...Array.from(cats).sort()];
}

export function searchCentralRegistry(opts: RegistrySearchOptions = {}): CentralRegistryEntry[] {
  const q = (opts.query ?? '').trim().toLowerCase();
  const tokens = q ? q.split(/\s+/).filter(Boolean) : [];
  const dept = opts.department ?? 'all';
  const cat = opts.category ?? 'all';
  const includeChemicals = opts.includeChemicals ?? false;
  const sortBy = opts.sortBy ?? 'relevance';

  const scored = CENTRAL_EQUIPMENT_REGISTRY.filter((entry) => {
    if (!includeChemicals && entry.kind === 'chemical') return false;
    if (dept !== 'all' && entry.department !== dept) return false;
    if (cat !== 'all' && entry.category !== cat) return false;
    if (tokens.length === 0) return true;
    const haystack = `${entry.name} ${entry.subtitle} ${entry.category} ${entry.wingName} ${entry.searchKeywords.join(' ')}`.toLowerCase();
    return tokens.every((tk) => haystack.includes(tk));
  }).map((entry) => {
    let score = 0;
    if (tokens.length > 0) {
      const lowerName = entry.name.toLowerCase();
      for (const tk of tokens) {
        if (lowerName === tk) score += 100;
        else if (lowerName.startsWith(tk)) score += 40;
        else if (lowerName.includes(tk)) score += 20;
        else if (entry.category.toLowerCase().includes(tk)) score += 10;
        else score += 4;
      }
    }
    return { entry, score };
  });

  scored.sort((a, b) => {
    if (sortBy === 'name-asc') return a.entry.name.localeCompare(b.entry.name);
    if (sortBy === 'category') {
      const c = a.entry.category.localeCompare(b.entry.category);
      return c !== 0 ? c : a.entry.name.localeCompare(b.entry.name);
    }
    if (b.score !== a.score) return b.score - a.score;
    return a.entry.name.localeCompare(b.entry.name);
  });

  return scored.map((s) => s.entry);
}

export interface InstrumentPlacementWarning {
  severity: 'info' | 'warning';
  message: string;
}

export function checkInstrumentPlacementCompatibility(
  candidate: LabInstrument,
  placedItems: WorkbenchItem[]
): InstrumentPlacementWarning[] {
  const warnings: InstrumentPlacementWarning[] = [];
  const placedIds = placedItems.map((i) => i.instrumentId);
  const placedInsts = placedIds
    .map((id) => LAB_INSTRUMENTS.find((x) => x.id === id))
    .filter((x): x is LabInstrument => Boolean(x));

  const isCandidateHeater = candidate.visualKind === 'heater';
  const hasMicroscopeOrOptics = placedInsts.some(
    (p) => p.visualKind === 'microscope' || p.visualKind === 'optics'
  );
  const hasHeater = placedInsts.some((p) => p.visualKind === 'heater');
  const isCandidateSensitiveOptics =
    candidate.visualKind === 'microscope' || candidate.visualKind === 'optics';

  if ((isCandidateHeater && hasMicroscopeOrOptics) || (isCandidateSensitiveOptics && hasHeater)) {
    warnings.push({
      severity: 'warning',
      message: `Thermal separation advisory: keep ${candidate.name} away from active heating plates to protect precision lenses.`,
    });
  }

  const isCandidatePower = candidate.visualKind === 'power-supply' || candidate.category.toLowerCase().includes('electricity');
  const hasOpenLiquidVessel = placedInsts.some(
    (p) => p.department === 'chemistry' && (p.visualKind === 'beaker' || p.visualKind === 'volumetric')
  );
  if (
    (isCandidatePower && hasOpenLiquidVessel && candidate.department !== 'chemistry') ||
    (candidate.department === 'chemistry' && candidate.visualKind === 'beaker' && placedInsts.some((p) => p.visualKind === 'power-supply'))
  ) {
    warnings.push({
      severity: 'info',
      message: `Electrical-wet bench advisory: isolate DC power rails from wet aqueous containers unless running dedicated electrolysis.`,
    });
  }

  return warnings;
}

export interface CompatibleExperimentMatch {
  experimentId: string;
  title: string;
  shortTitle: string;
  subject: string;
  matchedInstruments: number;
  requiredCount: number;
  readinessLabel: 'Ready' | 'Partial Kit';
}

export function findExperimentsForBenchSetup(
  placedItems: WorkbenchItem[],
  chemicalItems: WorkbenchChemicalItem[] = []
): CompatibleExperimentMatch[] {
  const presentIds = new Set(placedItems.map((w) => w.instrumentId));
  const expMatches: CompatibleExperimentMatch[] = [];

  for (const exp of EXPERIMENTS) {
    const linked = LAB_INSTRUMENTS.filter((inst) => inst.supportedModels.includes(exp.id));
    if (linked.length === 0) continue;
    const matched = linked.filter((inst) => presentIds.has(inst.id)).length;
    if (matched === 0 && !(exp.id === 'acid-ph' && chemicalItems.length > 0)) continue;
    expMatches.push({
      experimentId: exp.id,
      title: exp.title,
      shortTitle: exp.shortTitle,
      subject: exp.subject,
      matchedInstruments: matched,
      requiredCount: Math.min(linked.length, 3),
      readinessLabel: matched >= Math.min(linked.length, 2) ? 'Ready' : 'Partial Kit',
    });
  }

  return expMatches.sort((a, b) => b.matchedInstruments - a.matchedInstruments);
}
