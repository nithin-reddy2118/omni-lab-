import React, { useMemo, useState } from 'react';
import { Activity, BookOpen, CheckCircle2, ChevronRight, GraduationCap, Microscope, Sparkles, X } from 'lucide-react';
import { Modal } from '../ui/Modal';
import type { EducationDivision } from '../../types/science';

interface VirtualMicroscopeModalProps {
  open: boolean;
  onClose: () => void;
  division: EducationDivision;
}

interface SpecimenSpec {
  id: string;
  name: string;
  stain: string;
  sizeUm: string;
  schoolNote: string;
  higherNote: string;
  researchNote: string;
}

const SPECIMENS: SpecimenSpec[] = [
  {
    id: 'onion',
    name: 'Onion Epidermis (Allium cepa)',
    stain: 'Iodine / Methylene Blue',
    sizeUm: '120 – 250 µm cell length',
    schoolNote: 'Look for brick-like rectangular plant cell walls and a dark stained nucleus in each cell.',
    higherNote: 'Observe rigid cellulose primary cell walls, large central vacuole pushing cytoplasm peripherally, and distinct nucleoli.',
    researchNote: 'Optical phase contrast reveals pectocellulosic middle lamella and nuclear pore organization; non-chloroplastic epidermal tissue.',
  },
  {
    id: 'elodea',
    name: 'Aquatic Leaf (Elodea canadensis)',
    stain: 'Unstained Wet Mount',
    sizeUm: '40 – 80 µm cell width',
    schoolNote: 'See the tiny green chloroplasts floating inside the watery plant cells!',
    higherNote: 'Chloroplasts (~5 µm diameter) undergo cytoplasmic streaming driven by myosin-actin tracks under warm light.',
    researchNote: 'Double-membrane plastids exhibit chlorophyll-a/b autofluorescence under 450 nm excitation; measure PAR saturation velocity.',
  },
  {
    id: 'cocci',
    name: 'Gram+ Spherical Cocci (Educational Model)',
    stain: 'Crystal Violet (Gram Positive)',
    sizeUm: '0.8 – 1.2 µm diameter',
    schoolNote: 'Tiny purple spheres clustered like grapes—hundreds of times smaller than a plant cell.',
    higherNote: 'Thick peptidoglycan cell wall retains crystal violet–iodine complex during ethanol decolorisation.',
    researchNote: 'Requires 100× oil-immersion (1000× total) in physical labs; modeled here conceptually with 400× phase zoom for morphology only.',
  },
  {
    id: 'bacilli',
    name: 'Gram− Rod Bacilli (Educational Model)',
    stain: 'Safranin Counterstain (Gram Negative)',
    sizeUm: '1.5 – 3.0 µm length',
    schoolNote: 'Pink capsule-shaped tiny rods that swim or float in liquid media.',
    higherNote: 'Thin peptidoglycan layer and outer lipopolysaccharide membrane lose primary dye and absorb pink safranin.',
    researchNote: 'Phase-contrast ring suppresses halo glare around unstained hydrated bacilli; strictly conceptual non-pathogenic illustration.',
  },
  {
    id: 'rbc',
    name: 'Mammalian Erythrocytes (Blood Smear Model)',
    stain: 'Wright–Giemsa Stain',
    sizeUm: '7.0 – 8.0 µm diameter',
    schoolNote: 'Smooth round discs without a nucleus, shaped like soft cushions to carry oxygen.',
    higherNote: 'Biconcave anucleate geometry maximizes surface-area-to-volume ratio for O₂/CO₂ haemoglobin diffusion.',
    researchNote: 'Diameter ~7.5 µm serves as a classic histological scale reference next to polymorphonuclear leukocytes.',
  },
];

export function VirtualMicroscopeModal({ open, onClose, division }: VirtualMicroscopeModalProps) {
  const [specimenId, setSpecimenId] = useState<string>('onion');
  const [mag, setMag] = useState<40 | 100 | 400>(100);
  const [focus, setFocus] = useState<number>(48);

  const specimen = SPECIMENS.find((s) => s.id === specimenId) ?? SPECIMENS[0];
  const blurPx = Math.abs(focus - 50) * 0.22;
  const scaleFactor = mag === 40 ? 0.65 : mag === 100 ? 1 : 1.7;
  const scaleBarUm = mag === 40 ? '100 µm' : mag === 100 ? '40 µm' : '10 µm';

  const explanation =
    division === 'school'
      ? specimen.schoolNote
      : division === 'higher'
        ? specimen.higherNote
        : specimen.researchNote;

  return (
    <Modal open={open} onClose={onClose} title="Virtual Compound & Phase-Contrast Microscope">
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex flex-wrap gap-1.5">
            {SPECIMENS.map((sp) => (
              <button
                key={sp.id}
                type="button"
                onClick={() => setSpecimenId(sp.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-medium border ${
                  specimenId === sp.id
                    ? 'bg-emerald-700 text-white border-emerald-700'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                {sp.name.split('(')[0].trim()}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
            {([40, 100, 400] as const).map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMag(m)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-bold ${
                  mag === m ? 'bg-slate-900 text-white' : 'text-slate-600 hover:text-slate-950'
                }`}
              >
                {m}×
              </button>
            ))}
          </div>
        </div>

        {/* Circular Optical Field of View */}
        <div className="grid sm:grid-cols-12 gap-4 items-center">
          <div className="sm:col-span-7 flex justify-center">
            <div className="relative w-64 h-64 sm:w-72 sm:h-72 rounded-full border-8 border-slate-900 bg-[#F8FAFC] overflow-hidden shadow-inner flex items-center justify-center">
              <div
                style={{
                  filter: `blur(${blurPx.toFixed(1)}px)`,
                  transform: `scale(${scaleFactor})`,
                  transition: 'transform 200ms ease',
                }}
                className="w-full h-full flex items-center justify-center"
              >
                <svg viewBox="0 0 200 200" className="w-full h-full">
                  <rect width="200" height="200" fill={specimenId === 'cocci' || specimenId === 'bacilli' ? '#F1F5F9' : '#FEFCE8'} />
                  {specimenId === 'onion' && (
                    <g stroke="#92400E" strokeWidth="2" fill="#FDE68A" fillOpacity="0.45">
                      {[20, 60, 100, 140].map((y, rIdx) =>
                        [15, 75, 135].map((x, cIdx) => {
                          const offset = rIdx % 2 === 0 ? 0 : 25;
                          return (
                            <g key={`${rIdx}-${cIdx}`}>
                              <rect x={x + offset - 20} y={y} width="58" height="38" rx="3" />
                              <circle cx={x + offset + 12} cy={y + 19} r="5" fill="#4338CA" opacity="0.8" />
                            </g>
                          );
                        })
                      )}
                    </g>
                  )}
                  {specimenId === 'elodea' && (
                    <g stroke="#166534" strokeWidth="2" fill="#DCFCE7" fillOpacity="0.7">
                      {[20, 70, 120].map((y, rIdx) =>
                        [15, 85, 145].map((x, cIdx) => (
                          <g key={`${rIdx}-${cIdx}`}>
                            <rect x={x} y={y} width="64" height="46" rx="4" />
                            {[0, 1, 2, 3, 4, 5].map((d) => (
                              <ellipse
                                key={d}
                                cx={x + 12 + (d % 3) * 18}
                                cy={y + 14 + Math.floor(d / 3) * 18}
                                rx="4.5"
                                ry="3"
                                fill="#16A34A"
                                stroke="none"
                              />
                            ))}
                          </g>
                        ))
                      )}
                    </g>
                  )}
                  {specimenId === 'cocci' && (
                    <g fill="#7E22CE" stroke="#581C87" strokeWidth="0.8">
                      {[
                        [85, 92], [94, 88], [90, 99], [100, 95], [82, 102],
                        [112, 114], [119, 118], [115, 124], [64, 72], [70, 68],
                        [132, 74], [126, 80], [136, 82],
                      ].map(([cx, cy], idx) => (
                        <circle key={idx} cx={cx} cy={cy} r="4.2" />
                      ))}
                    </g>
                  )}
                  {specimenId === 'bacilli' && (
                    <g fill="#EC4899" stroke="#BE185D" strokeWidth="0.8">
                      {[
                        { x: 75, y: 80, r: 22 },
                        { x: 108, y: 95, r: -35 },
                        { x: 92, y: 122, r: 10 },
                        { x: 130, y: 72, r: 58 },
                        { x: 64, y: 118, r: -18 },
                      ].map((rod, idx) => (
                        <rect
                          key={idx}
                          x={rod.x}
                          y={rod.y}
                          width="18"
                          height="5.5"
                          rx="2.7"
                          transform={`rotate(${rod.r} ${rod.x} ${rod.y})`}
                        />
                      ))}
                    </g>
                  )}
                  {specimenId === 'rbc' && (
                    <g>
                      {[
                        [65, 75], [95, 70], [128, 82], [78, 112], [115, 118], [96, 140], [142, 122],
                      ].map(([cx, cy], idx) => (
                        <g key={idx}>
                          <circle cx={cx} cy={cy} r="12" fill="#EF4444" stroke="#B91C1C" strokeWidth="1.2" />
                          <circle cx={cx} cy={cy} r="5" fill="#FCA5A5" opacity="0.65" />
                        </g>
                      ))}
                    </g>
                  )}
                </svg>
              </div>
              {/* Crosshair & Scale bar */}
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-full h-px bg-slate-900/10" />
              </div>
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="h-full w-px bg-slate-900/10" />
              </div>
              <div className="absolute bottom-4 bg-white/90 border border-slate-300 px-2 py-0.5 rounded text-[10px] font-mono font-bold text-slate-900">
                Scale: {scaleBarUm} · {mag}×
              </div>
            </div>
          </div>

          <div className="sm:col-span-5 space-y-3 text-xs">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 space-y-1.5">
              <div className="font-bold text-slate-900 text-sm">{specimen.name}</div>
              <div className="text-slate-600">
                <strong>Stain / Optics:</strong> {specimen.stain}
              </div>
              <div className="text-slate-600 font-mono">
                <strong>Typical Size:</strong> {specimen.sizeUm}
              </div>
            </div>

            <div className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
              <div className="flex justify-between font-medium text-slate-800">
                <span>Fine Focus Knob</span>
                <span className="font-mono text-blue-700 tabular-nums">
                  {Math.abs(focus - 50) <= 4 ? 'In Sharp Focus' : `${focus} µm`}
                </span>
              </div>
              <input
                type="range"
                min={0}
                max={100}
                value={focus}
                onChange={(e) => setFocus(Number(e.target.value))}
                className="w-full accent-blue-700 cursor-pointer"
              />
              <button
                type="button"
                onClick={() => setFocus(50)}
                className="text-[11px] font-semibold text-blue-700 hover:underline"
              >
                Auto-focus stage to focal plane (50 µm)
              </button>
            </div>

            <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-3 space-y-1 text-emerald-950">
              <div className="font-semibold flex items-center gap-1.5">
                <Microscope className="w-3.5 h-3.5 text-emerald-700" />
                Division Observation Note
              </div>
              <p className="leading-relaxed text-emerald-900">{explanation}</p>
            </div>
          </div>
        </div>
      </div>
    </Modal>
  );
}

export function OscilloscopeBenchPanel({
  voltage,
  resistance,
  frequencyHz,
  isRunning,
}: {
  voltage: number;
  resistance: number;
  frequencyHz: number;
  isRunning: boolean;
}) {
  const currentA = voltage / Math.max(0.5, resistance);
  const powerW = voltage * currentA;

  const wavePoints = useMemo(() => {
    const pts: string[] = [];
    for (let x = 0; x <= 280; x += 4) {
      const t = (x / 280) * 2 * Math.PI * Math.max(1, Math.min(4, frequencyHz / 120));
      const amp = Math.min(28, (voltage / 24) * 26);
      const y = 36 - Math.sin(t) * (isRunning ? amp : amp * 0.15);
      pts.push(`${x},${y.toFixed(1)}`);
    }
    return pts.join(' ');
  }, [voltage, frequencyHz, isRunning]);

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="text-xs font-semibold text-indigo-700 flex items-center gap-1.5">
          <Activity className="w-4 h-4" />
          Live Oscilloscope &amp; Circuit Bench Telemetry
        </div>
        <div className="text-xs font-mono text-slate-600 tabular-nums">
          V = {voltage.toFixed(1)} V · R = {resistance.toFixed(1)} Ω · I = {currentA.toFixed(2)} A · P = {powerW.toFixed(1)} W
        </div>
      </div>

      <div className="rounded-lg bg-slate-950 p-3 border border-slate-800">
        <svg viewBox="0 0 280 72" className="w-full h-24">
          {[18, 36, 54].map((y) => (
            <line key={y} x1="0" y1={y} x2="280" y2={y} stroke="#1E293B" strokeWidth="1" />
          ))}
          {[56, 112, 168, 224].map((x) => (
            <line key={x} x1={x} y1="0" x2={x} y2="72" stroke="#1E293B" strokeWidth="1" />
          ))}
          <polyline fill="none" stroke="#38BDF8" strokeWidth="2" points={wavePoints} />
          <line
            x1="0"
            y1={Math.max(8, 60 - (voltage / 24) * 48)}
            x2="280"
            y2={Math.max(8, 60 - (voltage / 24) * 48)}
            stroke="#34D399"
            strokeWidth="1.5"
            strokeDasharray="4 3"
          />
        </svg>
        <div className="flex justify-between text-[10px] font-mono text-slate-400 mt-1">
          <span>CH1 (Cyan): AC Excitation ({frequencyHz} Hz)</span>
          <span>CH2 (Green Dashed): DC Bus Level ({voltage.toFixed(1)} V)</span>
        </div>
      </div>
    </div>
  );
}

const TITAN_TUTOR_STEPS: Record<string, { stage: string; instruction: string; concept: string }[]> = {
  'acid-base-titration': [
    { stage: '1. Prepare Burette & Flask', instruction: 'Verify Burette, Conical Flask, Magnetic Stirrer, and pH Meter are connected on the island bench.', concept: 'Class A burette delivers known base volumes cleanly.' },
    { stage: '2. Dose Acid & Indicator', instruction: 'Pour or select HCl (0.5 M) and Phenolphthalein indicator bottles into your Conical Flask.', concept: 'Phenolphthalein stays colourless below pH 8.2.' },
    { stage: '3. Start Mixing & Pour NaOH', instruction: 'Transfer 25 mL NaOH into the flask containing 25 mL HCl to locate exact equivalence pH 7.00.', concept: 'H₃O⁺ + OH⁻ → 2H₂O releases −57.3 kJ/mol enthalpy.' },
    { stage: '4. Observe Equivalence & Record Trial', instruction: 'Press Start Experiment, inspect the exact pH & ΔT, and record your trial below.', concept: 'Even 1 extra drop past equivalence causes pH to jump rapidly.' },
  ],
  'boiling-point': [
    { stage: '1. Verify Apparatus', instruction: 'Check Hot Plate, Beaker, Thermometer, and Barometer links.', concept: 'Boiling occurs when liquid vapour pressure equals atmospheric pressure.' },
    { stage: '2. Set Altitude Pressure', instruction: 'Adjust Pressure slider (e.g., 101.3 kPa Sea Level vs 70.1 kPa 3 km Mountain).', concept: 'Lower pressure drops the energy required for H₂O bubbles to expand.' },
    { stage: '3. Heat & Observe', instruction: 'Click Start Experiment and watch bubbles form strictly once T reaches T_boil.', concept: 'Thermal plateau persists while latent heat breaks hydrogen bonds.' },
  ],
};

export function InlineLabTutorStrip({
  experimentId,
  division,
  onOpenFullTutor,
}: {
  experimentId: string;
  division: EducationDivision;
  onOpenFullTutor: () => void;
}) {
  const steps = TITAN_TUTOR_STEPS[experimentId] ?? TITAN_TUTOR_STEPS['boiling-point'];
  const [stepIdx, setStepIdx] = useState(0);
  const current = steps[Math.min(stepIdx, steps.length - 1)];

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50/70 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
      <div className="flex items-start gap-3 min-w-0 flex-1">
        <div className="w-8 h-8 rounded-lg bg-blue-700 text-white flex items-center justify-center shrink-0 mt-0.5">
          <GraduationCap className="w-4 h-4" />
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-blue-800">
            <span>Guided Bench Tutor · {division.toUpperCase()} Level</span>
            <span className="font-mono">
              Step {stepIdx + 1}/{steps.length}
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 mt-0.5">
            {current.stage}: <span className="font-medium text-slate-700">{current.instruction}</span>
          </div>
          <div className="text-[11px] text-blue-900 mt-0.5 flex items-center gap-1">
            <BookOpen className="w-3 h-3 shrink-0" />
            {current.concept}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        <button
          type="button"
          onClick={() => setStepIdx((i) => (i + 1) % steps.length)}
          className="px-3 py-1.5 rounded-lg bg-white border border-blue-200 text-xs font-semibold text-blue-800 hover:bg-blue-100 flex items-center gap-1"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          {stepIdx < steps.length - 1 ? 'Next Step' : 'Restart Guide'}
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onOpenFullTutor}
          className="px-3 py-1.5 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1"
        >
          <Sparkles className="w-3.5 h-3.5" />
          16-Stage AI Tutor
        </button>
      </div>
    </div>
  );
}
