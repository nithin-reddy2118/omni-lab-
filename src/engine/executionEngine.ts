import { getInstrumentById } from '../data/labEquipment';
import { EXPERIMENTS } from './experiments';
import type {
  ApparatusReadout,
  ExecutionStatus,
  ExperimentCalculationResult,
  ExperimentExecutionResponse,
  WorkbenchConnection,
  WorkbenchItem,
  WorkbenchValidationResult,
} from '../types/science';

interface RequiredApparatusSlot {
  label: string;
  acceptIds: string[];
}

interface ExperimentSetupRule {
  requiredSlots: RequiredApparatusSlot[];
  requireConnectionCount?: number;
  connectionDescription?: string;
  requireThermalCoupling?: boolean;
  requireClosedElectricalLoop?: boolean;
  requireOpticalAlignment?: boolean;
}

const SETUP_RULES: Record<string, ExperimentSetupRule> = {
  'boiling-point': {
    requiredSlots: [
      { label: 'Heat-resistant Vessel (Beaker or Conical Flask)', acceptIds: ['chem-beaker', 'chem-conical-flask'] },
      { label: 'Laboratory Hot Plate / Heater', acceptIds: ['chem-hot-plate'] },
      { label: 'Digital RTD Thermometer', acceptIds: ['chem-thermometer', 'phys-thermometer'] },
    ],
    requireThermalCoupling: true,
    connectionDescription: 'Place the Beaker near/above the Hot Plate or connect them thermally using Connect.',
  },
  'voltage-current': {
    requiredSlots: [
      { label: 'Low-Voltage DC Power Supply / Battery', acceptIds: ['phys-dc-supply', 'elec-dc-supply', 'phys-battery', 'eng-battery'] },
      { label: 'Resistor / Load Component', acceptIds: ['phys-resistor', 'elec-resistor-kit', 'phys-bulb', 'eng-servo'] },
      { label: 'Ammeter or Multimeter', acceptIds: ['phys-ammeter', 'elec-multimeter', 'phys-voltmeter'] },
    ],
    requireConnectionCount: 2,
    requireClosedElectricalLoop: true,
    connectionDescription: 'Wire the DC Power Supply, Resistor, and Ammeter/Voltmeter into a connected circuit using Connect.',
  },
  'rc-circuit-decay': {
    requiredSlots: [
      { label: 'DC Power Supply', acceptIds: ['elec-dc-supply', 'phys-dc-supply'] },
      { label: 'Resistor Kit', acceptIds: ['elec-resistor-kit', 'phys-resistor'] },
      { label: 'Capacitor Module', acceptIds: ['elec-capacitor-diode'] },
      { label: 'Oscilloscope or Multimeter', acceptIds: ['elec-oscilloscope', 'phys-oscilloscope', 'elec-multimeter'] },
    ],
    requireConnectionCount: 2,
    requireClosedElectricalLoop: true,
    connectionDescription: 'Connect Power Supply, Resistor, Capacitor, and Oscilloscope into a valid RC measurement circuit.',
  },
  'acid-ph': {
    requiredSlots: [
      { label: 'Aqueous Vessel (Beaker / Flask)', acceptIds: ['chem-beaker', 'chem-conical-flask', 'env-water-sim'] },
      { label: 'Digital pH Meter / Probe', acceptIds: ['chem-ph-meter', 'env-ph-probe'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Connect the pH Probe to the solution Beaker/Vessel.',
  },
  'acid-base-titration': {
    requiredSlots: [
      { label: '50 mL Class A Burette', acceptIds: ['chem-burette'] },
      { label: 'Conical Flask or Beaker', acceptIds: ['chem-conical-flask', 'chem-beaker'] },
      { label: 'Digital pH Meter', acceptIds: ['chem-ph-meter'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Link the Burette above the Conical Flask or connect the pH Meter to monitor endpoint pH.',
  },
  'reaction-rate': {
    requiredSlots: [
      { label: 'Conical Flask or Beaker', acceptIds: ['chem-conical-flask', 'chem-beaker'] },
      { label: 'Hot Plate / Thermal Source', acceptIds: ['chem-hot-plate'] },
      { label: 'Thermometer', acceptIds: ['chem-thermometer', 'phys-thermometer'] },
    ],
    requireThermalCoupling: true,
    connectionDescription: 'Couple the Hot Plate and Conical Flask so reaction temperature is controlled.',
  },
  'pendulum-period': {
    requiredSlots: [
      { label: 'Simple Pendulum Rig', acceptIds: ['phys-pendulum'] },
      { label: 'Precision Stopwatch', acceptIds: ['phys-stopwatch', 'math-stopwatch'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Couple the Simple Pendulum Rig with the Precision Stopwatch for timing oscillations.',
  },
  'force-acceleration': {
    requiredSlots: [
      { label: 'Dynamics Trolley / Track / Actuator', acceptIds: ['phys-trolley', 'phys-track', 'eng-servo'] },
      { label: 'Force Sensor or Spring Balance', acceptIds: ['phys-force-sensor', 'phys-spring-balance'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Link the Force Sensor to the Dynamics Trolley along the track.',
  },
  'mass-volume-density': {
    requiredSlots: [
      { label: 'Digital Balance', acceptIds: ['chem-digital-balance', 'chem-analytical-balance'] },
      { label: 'Graduated Measuring Cylinder', acceptIds: ['chem-measuring-cylinder'] },
    ],
    requireConnectionCount: 0,
  },
  'light-distance': {
    requiredSlots: [
      { label: 'Ray Box / Light Source', acceptIds: ['phys-ray-box', 'bio-growth-lamp'] },
      { label: 'Light Intensity Photometer', acceptIds: ['phys-photometer', 'bio-par-probe'] },
    ],
    requireOpticalAlignment: true,
    requireConnectionCount: 1,
    connectionDescription: 'Align and link the Ray Box light path to the Photometer sensor.',
  },
  'thin-lens-optics': {
    requiredSlots: [
      { label: 'Ray Box Light Source', acceptIds: ['phys-ray-box'] },
      { label: 'Converging Convex Lens', acceptIds: ['phys-lenses'] },
      { label: 'Image Viewing Screen', acceptIds: ['phys-screen'] },
    ],
    requireOpticalAlignment: true,
    requireConnectionCount: 2,
    connectionDescription: 'Connect the Ray Box → Convex Lens → Viewing Screen along the optical path.',
  },
  'photosynthesis-rate': {
    requiredSlots: [
      { label: 'Adjustable PAR Growth Lamp', acceptIds: ['bio-growth-lamp'] },
      { label: 'Photosynthesis Plant Chamber', acceptIds: ['bio-plant-chamber'] },
      { label: 'Light / O₂ PAR Probe', acceptIds: ['bio-par-probe'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Couple the Growth Lamp and PAR Probe to the Plant Chamber.',
  },
  'plant-growth-model': {
    requiredSlots: [
      { label: 'Adjustable PAR Growth Lamp', acceptIds: ['bio-growth-lamp'] },
      { label: 'Plant Growth Chamber', acceptIds: ['bio-plant-chamber'] },
      { label: 'Environmental Sensor / PAR Probe', acceptIds: ['bio-par-probe'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Link the Growth Lamp and Sensor Probe to the Plant Growth Chamber.',
  },
  'newtons-cooling': {
    requiredSlots: [
      { label: 'Thermal Calorimeter', acceptIds: ['phys-calorimeter', 'chem-beaker'] },
      { label: 'Thermometer Probe', acceptIds: ['phys-thermometer', 'chem-thermometer'] },
      { label: 'Stopwatch Timer', acceptIds: ['phys-stopwatch', 'math-stopwatch'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Couple the Thermometer probe to the Calorimeter vessel.',
  },
  'michaelis-menten': {
    requiredSlots: [
      { label: 'Biomolecule Assay / Cuvette Module', acceptIds: ['biotech-biomolecule'] },
      { label: 'Precision Micropipette', acceptIds: ['biotech-micropipette', 'chem-micropipette'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Link the Micropipette reagent delivery to the Enzyme Assay module.',
  },
  'beer-lambert': {
    requiredSlots: [
      { label: 'UV-Vis Cuvette / Biomolecule Analyzer', acceptIds: ['biotech-biomolecule'] },
      { label: 'Precision Micropipette', acceptIds: ['biotech-micropipette', 'chem-micropipette'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Link the prepared Cuvette sample to the UV-Vis Analyzer.',
  },
  'bacterial-growth': {
    requiredSlots: [
      { label: 'Shaking Incubator', acceptIds: ['mb-incubator'] },
      { label: 'Nutrient Agar Plates / Flask', acceptIds: ['mb-agar-plates'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Link the Culture Plates inside the Incubator chamber.',
  },
  'half-life-decay': {
    requiredSlots: [
      { label: 'Counter / Interval Sensor', acceptIds: ['phys-force-sensor', 'phys-ammeter', 'elec-multimeter'] },
      { label: 'Stopwatch Timer', acceptIds: ['phys-stopwatch', 'math-stopwatch'] },
    ],
    requireConnectionCount: 1,
    connectionDescription: 'Link the Interval Sensor to the Stopwatch timer.',
  },
};

export interface ValidationInput {
  experimentId: string;
  params: Record<string, number>;
  workbenchItems: WorkbenchItem[];
  connections: WorkbenchConnection[];
}

export function validateWorkbenchSetup({
  experimentId,
  params,
  workbenchItems,
  connections,
}: ValidationInput): WorkbenchValidationResult {
  const exp = EXPERIMENTS.find((e) => e.id === experimentId);
  if (!exp) {
    return {
      status: 'invalid_configuration',
      valid: false,
      missingEquipmentIds: [],
      missingEquipmentNames: [],
      compatibilityErrors: [`Experiment model "${experimentId}" does not exist or is not executable.`],
      guidanceSteps: ['Select a validated experiment model from the Lab Selector or Curriculum Catalog.'],
      wiringChecked: false,
    };
  }

  // 1. Validate numeric parameters against scientific bounds
  const paramErrors: string[] = [];
  for (const p of exp.parameters) {
    const val = params[p.key];
    if (val === undefined || val === null || !Number.isFinite(val)) {
      paramErrors.push(`Parameter "${p.label}" (${p.symbol}) is missing or not a finite number.`);
    } else if (val < p.min - 1e-9 || val > p.max + 1e-9) {
      paramErrors.push(
        `Parameter "${p.label}" (${val} ${p.unit}) is outside valid range [${p.min}, ${p.max}] ${p.unit}.`
      );
    }
  }

  // 2. Empty workbench check
  if (!workbenchItems || workbenchItems.length === 0) {
    const rule = SETUP_RULES[experimentId];
    const missingNames = rule ? rule.requiredSlots.map((s) => s.label) : ['Required experiment apparatus'];
    const missingIds = rule ? rule.requiredSlots.map((s) => s.acceptIds[0]) : [];
    return {
      status: 'not_configured',
      valid: false,
      missingEquipmentIds: missingIds,
      missingEquipmentNames: missingNames,
      compatibilityErrors: [
        'Workbench is empty. Place the required apparatus on the island workbench before running the simulation.',
        ...paramErrors,
      ],
      guidanceSteps: [
        'Click "Load Recommended Kit" or drag the required instruments onto the center workbench.',
        'Connect linked instruments when required (e.g. circuit loop or heater + vessel).',
      ],
      wiringChecked: false,
    };
  }

  const rule = SETUP_RULES[experimentId];
  const placedIds = new Set(workbenchItems.map((w) => w.instrumentId));
  const missingNames: string[] = [];
  const missingIds: string[] = [];

  if (rule) {
    for (const slot of rule.requiredSlots) {
      const satisfied = slot.acceptIds.some((id) => placedIds.has(id));
      if (!satisfied) {
        missingNames.push(slot.label);
        missingIds.push(slot.acceptIds[0]);
      }
    }
  }

  if (missingNames.length > 0) {
    return {
      status: 'missing_equipment',
      valid: false,
      missingEquipmentIds: missingIds,
      missingEquipmentNames: missingNames,
      compatibilityErrors: [
        `Missing required equipment on bench: ${missingNames.join(', ')}.`,
        ...paramErrors,
      ],
      guidanceSteps: [
        `Add the missing apparatus (${missingNames.join(', ')}) from Room Inventory or click "Load Recommended Kit".`,
      ],
      wiringChecked: false,
    };
  }

  // 3. Parameter bounds check
  if (paramErrors.length > 0) {
    return {
      status: 'invalid_configuration',
      valid: false,
      missingEquipmentIds: [],
      missingEquipmentNames: [],
      compatibilityErrors: paramErrors,
      guidanceSteps: ['Adjust out-of-range parameters back inside the stated validity range.'],
      wiringChecked: true,
    };
  }

  // 4. Connection / physical arrangement checks
  const validConns = (connections || []).filter((c) => {
    const hasFrom = workbenchItems.some((w) => w.instanceId === c.fromInstanceId);
    const hasTo = workbenchItems.some((w) => w.instanceId === c.toInstanceId);
    return hasFrom && hasTo && c.valid !== false;
  });

  if (rule?.requireThermalCoupling) {
    const vessels = workbenchItems.filter((w) =>
      ['chem-beaker', 'chem-conical-flask', 'chem-crucible'].includes(w.instrumentId)
    );
    const heaters = workbenchItems.filter(
      (w) => getInstrumentById(w.instrumentId)?.visualKind === 'heater'
    );
    const coupled = vessels.some((v) =>
      heaters.some((h) => {
        const dist = Math.hypot(h.xPercent - v.xPercent, h.yPercent - v.yPercent);
        const linked = validConns.some(
          (c) =>
            (c.fromInstanceId === h.instanceId && c.toInstanceId === v.instanceId) ||
            (c.fromInstanceId === v.instanceId && c.toInstanceId === h.instanceId)
        );
        return dist < 42 || linked;
      })
    );
    if (!coupled) {
      return {
        status: 'invalid_configuration',
        valid: false,
        missingEquipmentIds: [],
        missingEquipmentNames: [],
        compatibilityErrors: [
          'Thermal coupling missing: Drag the Beaker/Flask onto or near the Hot Plate, or link them with Connect.',
        ],
        guidanceSteps: [
          rule.connectionDescription || 'Couple the heater and vessel before starting the experiment.',
        ],
        wiringChecked: true,
      };
    }
  }

  if (rule?.requireClosedElectricalLoop) {
    const minLinks = rule.requireConnectionCount ?? 2;
    if (validConns.length < minLinks) {
      return {
        status: 'invalid_configuration',
        valid: false,
        missingEquipmentIds: [],
        missingEquipmentNames: [],
        compatibilityErrors: [
          `Open or incomplete electrical circuit (${validConns.length}/${minLinks} required wire links). ${
            rule.connectionDescription || ''
          }`,
        ],
        guidanceSteps: [
          'Select an electrical component and click "Connect", then click the next component to complete the circuit.',
        ],
        wiringChecked: true,
      };
    }
  } else if (rule?.requireConnectionCount && validConns.length < rule.requireConnectionCount) {
    return {
      status: 'invalid_configuration',
      valid: false,
      missingEquipmentIds: [],
      missingEquipmentNames: [],
      compatibilityErrors: [
        `Apparatus setup is not coupled (${validConns.length}/${rule.requireConnectionCount} links). ${
          rule.connectionDescription || ''
        }`,
      ],
      guidanceSteps: [
        rule.connectionDescription || 'Connect your placed instruments using the Connect tool.',
      ],
      wiringChecked: true,
    };
  }

  return {
    status: 'ready',
    valid: true,
    missingEquipmentIds: [],
    missingEquipmentNames: [],
    compatibilityErrors: [],
    guidanceSteps: ['Apparatus, couplings, and parameters verified. Ready to run calculation.'],
    wiringChecked: true,
  };
}

function buildApparatusReadouts(
  experimentId: string,
  params: Record<string, number>,
  result: ExperimentCalculationResult
): ApparatusReadout[] {
  switch (experimentId) {
    case 'voltage-current':
      return [
        { label: 'DC Power Supply', value: `${(params.voltage ?? 5).toFixed(2)} V` },
        { label: 'Resistor Load', value: `${(params.resistance ?? 10).toFixed(1)} Ω` },
        { label: 'Digital Ammeter', value: `${result.primaryValue} ${result.primaryUnit}` },
        ...result.secondaryMetrics.map((m) => ({
          label: m.label,
          value: `${m.value} ${m.unit}`,
        })),
      ];
    case 'boiling-point':
      return [
        { label: 'Digital Barometer', value: `${(params.pressure ?? 101.325).toFixed(2)} kPa` },
        { label: 'RTD Thermometer (T_boil)', value: `${result.primaryValue} °C` },
        ...result.secondaryMetrics.map((m) => ({
          label: m.label,
          value: `${m.value} ${m.unit}`,
        })),
      ];
    case 'pendulum-period':
      return [
        { label: 'Pendulum Length', value: `${(params.length ?? 1).toFixed(2)} m` },
        { label: 'Stopwatch Period (T)', value: `${result.primaryValue} s` },
        ...result.secondaryMetrics.map((m) => ({
          label: m.label,
          value: `${m.value} ${m.unit}`,
        })),
      ];
    default:
      return [
        {
          label: result.primaryLabel,
          value: `${result.primaryValue} ${result.primaryUnit}`,
        },
        ...result.secondaryMetrics.map((m) => ({
          label: m.label,
          value: `${m.value} ${m.unit}`,
        })),
      ];
  }
}

export function executeScientificExperiment(input: ValidationInput): ExperimentExecutionResponse {
  const executedAt = new Date().toISOString();
  const validation = validateWorkbenchSetup(input);
  const exp = EXPERIMENTS.find((e) => e.id === input.experimentId);

  if (!validation.valid || !exp) {
    return {
      ok: false,
      status: validation.status,
      experimentId: input.experimentId,
      executedAt,
      validation,
      error: validation.compatibilityErrors[0] || 'Workbench configuration is incomplete or invalid.',
      limitations: exp?.limitations ?? [],
    };
  }

  try {
    const result = exp.calculate(input.params);
    if (!Number.isFinite(result.primaryValue)) {
      throw new Error('Simulation solver produced a non-finite value.');
    }
    const apparatusReadouts = buildApparatusReadouts(exp.id, input.params, result);
    const scientificExplanation = `${exp.principle} Calculated ${result.primaryLabel} (${result.primarySymbol}) = ${result.primaryValue} ${result.primaryUnit}. ${exp.graphInterpretation.conclusion}`;

    return {
      ok: true,
      status: 'completed',
      experimentId: exp.id,
      executedAt,
      validation: { ...validation, status: 'completed' as ExecutionStatus },
      result,
      apparatusReadouts,
      scientificExplanation,
      limitations: exp.limitations,
    };
  } catch (err) {
    return {
      ok: false,
      status: 'failed',
      experimentId: input.experimentId,
      executedAt,
      validation: {
        ...validation,
        status: 'failed',
        valid: false,
        compatibilityErrors: [
          err instanceof Error ? err.message : 'Unexpected mathematical solver error.',
        ],
      },
      error: err instanceof Error ? err.message : 'Simulation execution failed.',
      limitations: exp.limitations,
    };
  }
}
