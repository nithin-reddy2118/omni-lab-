import React, { useEffect, useMemo, useState } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceDot,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  Flame,
  Gauge,
  Mountain,
  Pause,
  Play,
  RotateCcw,
  Save,
  Thermometer,
  Video,
} from 'lucide-react';
import { getExperimentById, interpolateWaterBoilingPoint } from '../../engine/experiments';
import type { TrialRecord } from '../../types/science';
import { EquipmentIllustration } from './EquipmentIllustration';

interface BoilingAltitudeLabProps {
  onRecordTrial: (trial: TrialRecord) => { ok: boolean; error?: string };
  onOpenVideoTab: () => void;
  existingTrialsCount: number;
}

const ALTITUDE_PRESETS = [
  { label: 'Sea Level (0 m)', pressure: 101.325 },
  { label: 'Shimla (~2,200 m)', pressure: 77.5 },
  { label: 'Leh (~3,500 m)', pressure: 65.0 },
  { label: 'Everest Base (~5,360 m)', pressure: 52.0 },
  { label: 'Everest Summit (8,849 m)', pressure: 33.7 },
  { label: 'Pressure Cooker (2 atm)', pressure: 200.0 },
];

const INITIAL_WATER_TEMP_C = 25.0;

export function BoilingAltitudeLab({
  onRecordTrial,
  onOpenVideoTab,
  existingTrialsCount,
}: BoilingAltitudeLabProps) {
  const boilingExp = useMemo(() => getExperimentById('boiling-point'), []);

  // Station A: Reference Sea Level
  const pressureA = 101.325;
  const [powerA, setPowerA] = useState(500);

  // Station B: Adjustable Altitude / Pressure
  const [pressureB, setPressureB] = useState(52.0);
  const [powerB, setPowerB] = useState(500);
  const [syncHeating, setSyncHeating] = useState(true);

  // Dynamic Thermal Simulation State
  const [tempA, setTempA] = useState(INITIAL_WATER_TEMP_C);
  const [tempB, setTempB] = useState(INITIAL_WATER_TEMP_C);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const [speed, setSpeed] = useState<1 | 2 | 5>(2);
  const [phase, setPhase] = useState(0);
  const [feedback, setFeedback] = useState<string | null>(null);

  const boilTempA = useMemo(() => interpolateWaterBoilingPoint(pressureA), []);
  const boilTempB = useMemo(() => interpolateWaterBoilingPoint(pressureB), [pressureB]);

  const isBoilingA = tempA >= boilTempA - 0.05;
  const isBoilingB = tempB >= boilTempB - 0.05;

  const effectivePowerB = syncHeating ? powerA : powerB;

  useEffect(() => {
    if (!isRunning) return;
    let rafId = 0;
    let last = performance.now();

    const step = (now: number) => {
      const dtReal = Math.min(0.08, (now - last) / 1000);
      last = now;
      const dtSim = dtReal * speed;

      setPhase((p) => (p + dtReal * 3.5) % (Math.PI * 20));
      setElapsedSec((s) => s + dtSim);

      // 250 mL water heat capacity ~ 1046 J/K -> scale virtual thermal ramp clearly (10x accelerated virtual lab clock so 500W heats ~4.78 °C/sim-sec)
      const rateA = (powerA / 104.6);
      const rateB = (effectivePowerB / 104.6);

      setTempA((prev) => Math.min(boilTempA, prev + rateA * dtSim));
      setTempB((prev) => Math.min(boilTempB, prev + rateB * dtSim));

      rafId = requestAnimationFrame(step);
    };

    rafId = requestAnimationFrame(step);
    return () => cancelAnimationFrame(rafId);
  }, [isRunning, speed, powerA, effectivePowerB, boilTempA, boilTempB]);

  // Clamp live temps if user lowers pressure while boiling
  useEffect(() => {
    setTempB((prev) => Math.min(prev, boilTempB));
  }, [boilTempB]);

  const handleReset = () => {
    setIsRunning(false);
    setTempA(INITIAL_WATER_TEMP_C);
    setTempB(INITIAL_WATER_TEMP_C);
    setElapsedSec(0);
    setFeedback(null);
  };

  const handleRecordStationBTrial = () => {
    const calc = boilingExp.calculate({ pressure: pressureB });
    const res = onRecordTrial({
      id: `trial-${Date.now()}-${Math.random().toString(36).slice(2, 5)}`,
      experimentId: 'boiling-point',
      name: `Altitude Trial (${pressureB.toFixed(1)} kPa @ ${effectivePowerB} W)`,
      inputs: { pressure: pressureB },
      units: { pressure: 'kPa' },
      primaryOutput: {
        label: calc.primaryLabel,
        symbol: calc.primarySymbol,
        value: calc.primaryValue,
        unit: calc.primaryUnit,
      },
      secondaryOutputs: calc.secondaryMetrics,
      timestamp: new Date().toISOString(),
      dataType: 'Deterministic Virtual Simulation',
      modelVersion: 'v1.2-validated',
      notes: `Compared against Sea Level (101.325 kPa → ${boilTempA.toFixed(2)} °C). Station B boiled at ${boilTempB.toFixed(2)} °C with ${effectivePowerB} W heating.`,
    });
    if (res.ok) {
      setFeedback(
        `Saved Station B trial (${pressureB.toFixed(1)} kPa → ${boilTempB.toFixed(2)} °C) to Trials Manager.`
      );
    } else {
      setFeedback(res.error || 'Could not record trial.');
    }
  };

  const saturationCurve = useMemo(
    () => boilingExp.calculate({ pressure: pressureB }).curvePoints,
    [boilingExp, pressureB]
  );

  return (
    <div className="space-y-6">
      {/* Header & Controls Bar */}
      <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
              <Mountain className="w-4 h-4" />
              Featured Virtual Lab · Side-by-Side Dual-Station Simulation
            </div>
            <h2 className="text-xl sm:text-2xl font-display font-bold text-slate-900 mt-1">
              Water Boiling at Sea Level vs High Altitude
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-3xl">
              Compare how atmospheric pressure fixes the boiling temperature while heating plate power controls how rapidly water reaches that boiling point.
            </p>
          </div>

          <button
            type="button"
            onClick={onOpenVideoTab}
            className="px-3.5 py-2 rounded-lg border border-slate-300 bg-slate-50 text-xs font-semibold text-blue-700 hover:bg-blue-50 flex items-center gap-1.5 min-h-[40px]"
          >
            <Video className="w-4 h-4" />
            Watch Related Boiling Video
          </button>
        </div>

        {/* Simulation Playback Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setIsRunning((r) => !r)}
              className="px-4 py-2.5 rounded-lg bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-1.5 min-h-[42px]"
            >
              {isRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              {isRunning ? 'Pause Heating' : elapsedSec > 0 ? 'Resume Heating' : 'Start Heating Both Stations'}
            </button>

            <button
              type="button"
              onClick={handleReset}
              className="px-3.5 py-2.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800 hover:bg-slate-50 flex items-center gap-1.5 min-h-[42px]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset to 25.0 °C
            </button>

            <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 rounded-lg p-1">
              <span className="text-[11px] text-slate-600 px-2">Speed:</span>
              {([1, 2, 5] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSpeed(s)}
                  className={`px-2.5 py-1 rounded text-xs font-mono ${
                    speed === s ? 'bg-blue-700 text-white font-bold' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {s}×
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={syncHeating}
                onChange={(e) => setSyncHeating(e.target.checked)}
                className="accent-blue-700"
              />
              Synchronize Heating Power
            </label>
            <button
              type="button"
              disabled={existingTrialsCount >= 10}
              onClick={handleRecordStationBTrial}
              className="px-3.5 py-2 rounded-lg bg-teal-700 text-white text-xs font-semibold hover:bg-teal-800 disabled:opacity-40 flex items-center gap-1.5 min-h-[40px]"
            >
              <Save className="w-3.5 h-3.5" />
              Record Comparison Trial ({existingTrialsCount}/10)
            </button>
          </div>
        </div>

        {feedback && (
          <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs text-emerald-900">
            {feedback}
          </div>
        )}
      </div>

      {/* Dual Experimental Stations Side-by-Side */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Station A: Sea Level */}
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-slate-500">Station A · Reference Control</div>
              <h3 className="text-lg font-display font-bold text-slate-900">Sea Level Atmosphere</h3>
            </div>
            <span
              className={`px-3 py-1 rounded-lg border text-xs font-semibold ${
                isBoilingA
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : isRunning
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {isBoilingA ? 'BOILING AT 100.00 °C' : isRunning ? 'HEATING LIQUID' : 'READY (25.0 °C)'}
            </span>
          </div>

          {/* Visual Bench Apparatus Stage */}
          <div className="rounded-xl border border-slate-200 bg-slate-900 p-4">
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="flex flex-col items-center">
                <EquipmentIllustration
                  kind="thermometer"
                  sim={{ liveTempC: tempA, isRunning }}
                  className="w-16 h-16"
                />
                <div className="text-xs font-mono font-bold tabular-nums text-white mt-1">
                  {tempA.toFixed(1)} °C
                </div>
                <div className="text-[10px] text-slate-300">Temp Sensor</div>
              </div>

              <div className="flex flex-col items-center">
                <EquipmentIllustration
                  kind="beaker"
                  sim={{ liveTempC: tempA, isRunning, isBoiling: isBoilingA, phase }}
                  className="w-24 h-24"
                />
                <EquipmentIllustration
                  kind="heater"
                  sim={{ isRunning, powerW: powerA }}
                  className="w-20 h-14 -mt-3"
                />
              </div>

              <div className="flex flex-col items-center">
                <EquipmentIllustration
                  kind="barometer"
                  sim={{ pressureKpa: pressureA }}
                  className="w-16 h-16"
                />
                <div className="text-xs font-mono font-bold tabular-nums text-sky-300 mt-1">
                  {pressureA.toFixed(2)} kPa
                </div>
                <div className="text-[10px] text-slate-300">Fixed 1 atm</div>
              </div>
            </div>
          </div>

          {/* Station A Controls & Readouts */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-600 flex items-center gap-1">
                <Flame className="w-3.5 h-3.5 text-amber-600" />
                Heating Plate Power:
              </span>
              <span className="font-mono font-bold text-slate-900 tabular-nums">{powerA} W</span>
            </div>
            <input
              type="range"
              aria-label="Station A heating power"
              min={100}
              max={1000}
              step={50}
              value={powerA}
              onChange={(e) => setPowerA(Number(e.target.value))}
              className="w-full accent-amber-600"
            />

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div className="text-slate-500">Calculated Boiling Point</div>
                <div className="text-lg font-mono font-bold text-slate-900 tabular-nums">
                  {boilTempA.toFixed(2)} °C
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div className="text-slate-500">Time to Boil (from 25 °C)</div>
                <div className="text-lg font-mono font-bold text-emerald-700 tabular-nums">
                  {(((boilTempA - 25) * 104.6) / powerA).toFixed(1)} s
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Station B: Adjustable High Altitude / Pressure */}
        <section className="rounded-xl border-2 border-blue-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-blue-700">Station B · Experimental Variable</div>
              <h3 className="text-lg font-display font-bold text-slate-900">High Altitude / Custom Pressure</h3>
            </div>
            <span
              className={`px-3 py-1 rounded-lg border text-xs font-semibold ${
                isBoilingB
                  ? 'border-blue-300 bg-blue-50 text-blue-800'
                  : isRunning
                    ? 'border-amber-300 bg-amber-50 text-amber-800'
                    : 'border-slate-200 bg-slate-50 text-slate-600'
              }`}
            >
              {isBoilingB
                ? `BOILING AT ${boilTempB.toFixed(1)} °C`
                : isRunning
                  ? 'HEATING LIQUID'
                  : 'READY (25.0 °C)'}
            </span>
          </div>

          {/* Visual Bench Apparatus Stage */}
          <div className="rounded-xl border border-slate-200 bg-slate-900 p-4">
            <div className="grid grid-cols-3 items-center gap-2">
              <div className="flex flex-col items-center">
                <EquipmentIllustration
                  kind="thermometer"
                  sim={{ liveTempC: tempB, isRunning }}
                  className="w-16 h-16"
                />
                <div className="text-xs font-mono font-bold tabular-nums text-white mt-1">
                  {tempB.toFixed(1)} °C
                </div>
                <div className="text-[10px] text-slate-300">Temp Sensor</div>
              </div>

              <div className="flex flex-col items-center">
                <EquipmentIllustration
                  kind="beaker"
                  sim={{ liveTempC: tempB, isRunning, isBoiling: isBoilingB, phase: phase + 0.8 }}
                  className="w-24 h-24"
                />
                <EquipmentIllustration
                  kind="heater"
                  sim={{ isRunning, powerW: effectivePowerB }}
                  className="w-20 h-14 -mt-3"
                />
              </div>

              <div className="flex flex-col items-center">
                <EquipmentIllustration
                  kind="barometer"
                  sim={{ pressureKpa: pressureB }}
                  className="w-16 h-16"
                />
                <div className="text-xs font-mono font-bold tabular-nums text-sky-300 mt-1">
                  {pressureB.toFixed(1)} kPa
                </div>
                <div className="text-[10px] text-slate-300">Adjustable Dome</div>
              </div>
            </div>
          </div>

          {/* Station B Pressure & Power Controls */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 flex items-center gap-1">
                  <Gauge className="w-3.5 h-3.5 text-blue-700" />
                  External Pressure (P):
                </span>
                <span className="font-mono font-bold text-blue-700 tabular-nums">
                  {pressureB.toFixed(1)} kPa
                </span>
              </div>
              <input
                type="range"
                aria-label="Station B pressure"
                min={10}
                max={500}
                step={0.5}
                value={pressureB}
                onChange={(e) => setPressureB(Number(e.target.value))}
                className="w-full accent-blue-700"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {ALTITUDE_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setPressureB(preset.pressure)}
                    className={`px-2 py-1 rounded text-[11px] border ${
                      Math.abs(pressureB - preset.pressure) < 0.2
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-slate-600 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5 text-amber-600" />
                  Heating Plate Power {syncHeating ? '(Synced to Station A)' : ''}:
                </span>
                <span className="font-mono font-bold text-slate-900 tabular-nums">{effectivePowerB} W</span>
              </div>
              <input
                type="range"
                aria-label="Station B heating power"
                min={100}
                max={1000}
                step={50}
                disabled={syncHeating}
                value={effectivePowerB}
                onChange={(e) => setPowerB(Number(e.target.value))}
                className="w-full accent-amber-600 disabled:opacity-45"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs pt-1">
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div className="text-slate-500">Calculated Boiling Point</div>
                <div className="text-lg font-mono font-bold text-blue-700 tabular-nums">
                  {boilTempB.toFixed(2)} °C
                </div>
              </div>
              <div className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                <div className="text-slate-500">Difference vs Sea Level</div>
                <div className="text-lg font-mono font-bold text-amber-700 tabular-nums">
                  {(boilTempB - boilTempA >= 0 ? '+' : '') + (boilTempB - boilTempA).toFixed(2)} °C
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Live Comparison Table + Saturation Graph */}
      <div className="grid lg:grid-cols-12 gap-6">
        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-xs">
          <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
            <Thermometer className="w-4 h-4 text-blue-700" />
            Side-by-Side Comparison &amp; Concept Check
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-200 text-slate-600">
                  <th className="py-2 pr-2">Measurement</th>
                  <th className="py-2 px-2">Station A (Sea Level)</th>
                  <th className="py-2 pl-2 text-blue-700">Station B (Custom)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono tabular-nums">
                <tr>
                  <td className="py-2 font-sans text-slate-600">External Pressure</td>
                  <td className="py-2 text-slate-900">{pressureA.toFixed(2)} kPa</td>
                  <td className="py-2 text-blue-700 font-semibold">{pressureB.toFixed(2)} kPa</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans text-slate-600">Current Temp</td>
                  <td className="py-2 text-slate-900">{tempA.toFixed(1)} °C</td>
                  <td className="py-2 text-blue-700 font-semibold">{tempB.toFixed(1)} °C</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans text-slate-600">Boiling Point T_b</td>
                  <td className="py-2 text-slate-900">{boilTempA.toFixed(2)} °C</td>
                  <td className="py-2 text-blue-700 font-semibold">{boilTempB.toFixed(2)} °C</td>
                </tr>
                <tr>
                  <td className="py-2 font-sans text-slate-600">Heater Power</td>
                  <td className="py-2 text-slate-900">{powerA} W</td>
                  <td className="py-2 text-blue-700 font-semibold">{effectivePowerB} W</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 space-y-2 text-xs text-slate-700">
            <div>
              <strong className="text-slate-900">Why does boiling point drop on mountains?</strong> A liquid boils when its internal vapor pressure equals surrounding atmospheric pressure. Thinner mountain air pushes down less, so water molecules escape into vapor bubbles at a lower temperature.
            </div>
            <div>
              <strong className="text-slate-900">Heating Power vs Boiling Temperature:</strong> Turning the heating plate from 200 W to 900 W heats the water faster, <em>but never changes the boiling temperature</em>—only external pressure changes T_b.
            </div>
          </div>
        </div>

        <div className="lg:col-span-6 rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-xs">
          <div className="flex items-center justify-between text-xs">
            <span className="text-sm font-semibold text-slate-900">
              Water Boiling Point vs Pressure Curve (IAPWS-IF97)
            </span>
            <span className="font-mono text-blue-700">10–500 kPa</span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={saturationCurve}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="x"
                  type="number"
                  domain={[0, 500]}
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{ value: 'Pressure (kPa)', position: 'insideBottom', offset: -2, fill: '#475569', fontSize: 11 }}
                />
                <YAxis
                  domain={[40, 160]}
                  stroke="#64748B"
                  tick={{ fontSize: 11, fill: '#475569' }}
                  label={{ value: 'T_b (°C)', angle: -90, position: 'insideLeft', fill: '#475569', fontSize: 11 }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FFFFFF',
                    border: '1px solid #E2E8F0',
                    color: '#0F172A',
                    fontSize: 12,
                  }}
                />
                <Line type="monotone" dataKey="y" name="T_boil (°C)" stroke="#1D4ED8" strokeWidth={2.4} dot={false} />
                <ReferenceDot x={pressureA} y={boilTempA} r={6} fill="#059669" stroke="#FFFFFF" />
                <ReferenceDot x={pressureB} y={boilTempB} r={6} fill="#D97706" stroke="#FFFFFF" />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div className="flex flex-wrap gap-4 text-[11px] text-slate-600">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              Station A Sea Level ({boilTempA.toFixed(2)} °C)
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-600 inline-block" />
              Station B Custom ({boilTempB.toFixed(2)} °C)
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
