import React, { useEffect, useState } from 'react';
import { Pause, Play, Sparkles } from 'lucide-react';
import { useLab } from '../../context/LabContext';
import type { VisualFallbackType } from '../../types/science';

interface ScientificIllustrationFallbackProps {
  type: VisualFallbackType;
  conceptTitle: string;
  externalPlaying?: boolean;
  onTogglePlay?: () => void;
}

const MODEL_CAPTIONS: Record<VisualFallbackType, { title: string; caption: string }> = {
  boiling: {
    title: 'Vapor Pressure & Bubble Formation Model',
    caption: 'Heat energy increases vapor pressure inside liquid bubbles until it equals surrounding air pressure.',
  },
  pendulum: {
    title: 'Simple Harmonic Pendulum Model',
    caption: 'Gravity provides a restoring force that swaps gravitational potential energy and kinetic energy.',
  },
  photosynthesis: {
    title: 'Chloroplast Light & Carbon Conversion Model',
    caption: 'Photons energize chlorophyll to combine CO₂ and water into glucose and released oxygen.',
  },
  circuit: {
    title: 'Closed-Loop Electron & Current Flow Model',
    caption: 'Potential difference (voltage) pushes charge carriers steadily around a complete conducting path.',
  },
  rainbow: {
    title: 'Dispersion & Internal Reflection in a Raindrop',
    caption: 'Sunlight refracts at different angles by wavelength and reflects inside droplets to form a spectrum.',
  },
  rocket: {
    title: 'Momentum & Exhaust Thrust Reaction Model',
    caption: 'High-speed downward exhaust gas creates an equal and opposite upward thrust force (Newton III).',
  },
  microscope: {
    title: 'Compound Lens Magnification Ray Model',
    caption: 'Objective and eyepiece convex lenses bend light rays to produce a magnified virtual image.',
  },
  magnet: {
    title: 'Magnetic Flux & Domain Alignment Model',
    caption: 'Field lines leave the north pole and enter the south pole, aligning ferromagnetic domains nearby.',
  },
  'heat-shield': {
    title: 'Atmospheric Compression & Ablative Thermal Shield',
    caption: 'A detached bow shock and heat-absorbing shield material keep extreme entry heat away from the hull.',
  },
  cooling: {
    title: 'Thermal Gradient & Heat Dissipation Model',
    caption: 'Heat flows spontaneously from warmer molecules to cooler surroundings at a rate proportional to ΔT.',
  },
  general: {
    title: 'Cause-and-Effect Scientific Variable Model',
    caption: 'Changing the independent variable produces measurable shifts in the dependent variable.',
  },
};

export function ScientificIllustrationFallback({
  type,
  conceptTitle,
  externalPlaying,
  onTogglePlay,
}: ScientificIllustrationFallbackProps) {
  const { reducedMotion } = useLab();
  const [internalPlaying, setInternalPlaying] = useState(!reducedMotion);
  const [phase, setPhase] = useState(0);

  const isPlaying = externalPlaying ?? internalPlaying;
  const togglePlay = onTogglePlay ?? (() => setInternalPlaying((p) => !p));

  useEffect(() => {
    if (!isPlaying || reducedMotion) return;
    let rafId = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = (now - last) / 1000;
      last = now;
      setPhase((prev) => (prev + dt * 1.6) % (Math.PI * 20));
      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [isPlaying, reducedMotion]);

  const meta = MODEL_CAPTIONS[type] ?? MODEL_CAPTIONS.general;

  const renderDiagram = () => {
    switch (type) {
      case 'boiling': {
        const bubbleOffsets = [0, 1.4, 2.7, 4.1, 5.2].map((seed, i) => {
          const progress = ((phase * 0.6 + seed) % 3) / 3;
          return {
            cx: 135 + (i % 3) * 28 + Math.sin(phase + i) * 5,
            cy: 165 - progress * 85,
            r: 4 + progress * 6,
            opacity: 1 - progress * 0.6,
          };
        });
        return (
          <svg viewBox="0 0 360 210" className="w-full h-full" role="img" aria-label={meta.title}>
            <rect width="360" height="210" fill="#07111F" rx="12" />
            <rect x="115" y="55" width="130" height="120" rx="8" fill="none" stroke="#A9BCD3" strokeWidth="2.5" />
            <rect x="118" y="88" width="124" height="84" rx="4" fill="#1E4B7A" opacity="0.7" />
            {bubbleOffsets.map((b, idx) => (
              <circle key={idx} cx={b.cx} cy={b.cy} r={b.r} fill="#35D5F2" opacity={b.opacity} />
            ))}
            <path d="M135 190 Q150 176 165 190 T195 190 T225 190" stroke="#F5B942" strokeWidth="3" fill="none" />
            <text x="180" y="34" textAnchor="middle" fill="#35D5F2" fontSize="11" fontFamily="monospace">
              P_vapor ≥ P_ambient → Boiling
            </text>
            <text x="275" y="105" fill="#A9BCD3" fontSize="10">Air Pressure ↓</text>
            <path d="M275 112 L252 112" stroke="#A9BCD3" strokeWidth="1.5" />
          </svg>
        );
      }
      case 'pendulum': {
        const angle = Math.sin(phase * 1.4) * 0.48;
        const bobX = 180 + Math.sin(angle) * 105;
        const bobY = 38 + Math.cos(angle) * 105;
        return (
          <svg viewBox="0 0 360 210" className="w-full h-full" role="img" aria-label={meta.title}>
            <rect width="360" height="210" fill="#07111F" rx="12" />
            <line x1="90" y1="38" x2="270" y2="38" stroke="#A9BCD3" strokeWidth="3" />
            <path d="M 122 128 Q 180 162 238 128" fill="none" stroke="#35D5F2" strokeDasharray="4 4" strokeOpacity="0.45" />
            <line x1="180" y1="38" x2={bobX} y2={bobY} stroke="#E2E8F0" strokeWidth="2.5" />
            <circle cx={bobX} cy={bobY} r="14" fill="#35D5F2" stroke="#FFFFFF" strokeWidth="2" />
            <text x="180" y="190" textAnchor="middle" fill="#A9BCD3" fontSize="11" fontFamily="monospace">
              T = 2π √(L / g)
            </text>
          </svg>
        );
      }
      case 'photosynthesis': {
        const pulse = (Math.sin(phase * 2) + 1) / 2;
        return (
          <svg viewBox="0 0 360 210" className="w-full h-full" role="img" aria-label={meta.title}>
            <rect width="360" height="210" fill="#07111F" rx="12" />
            <circle cx="58" cy="52" r={20 + pulse * 3} fill="#F5B942" />
            <line x1="82" y1="66" x2="145" y2="105" stroke="#F5B942" strokeWidth="2" strokeDasharray="5 4" />
            <ellipse cx="195" cy="118" rx="68" ry="38" fill="#1F6F50" stroke="#35C98A" strokeWidth="2.5" />
            <line x1="145" y1="118" x2="245" y2="118" stroke="#35C98A" strokeWidth="1.5" />
            <text x="72" y="148" fill="#A9BCD3" fontSize="11">CO₂ + H₂O →</text>
            <text x="275" y="112" fill="#35C98A" fontSize="11" fontWeight="bold">O₂ ↑</text>
            <text x="195" y="176" textAnchor="middle" fill="#35D5F2" fontSize="11" fontFamily="monospace">
              6CO₂ + 6H₂O + Light → C₆H₁₂O₆ + 6O₂
            </text>
          </svg>
        );
      }
      case 'circuit': {
        const dashOffset = -(phase * 22);
        return (
          <svg viewBox="0 0 360 210" className="w-full h-full" role="img" aria-label={meta.title}>
            <rect width="360" height="210" fill="#07111F" rx="12" />
            <rect
              x="80"
              y="48"
              width="200"
              height="112"
              rx="10"
              fill="none"
              stroke="#35D5F2"
              strokeWidth="3"
              strokeDasharray="10 8"
              strokeDashoffset={dashOffset}
            />
            <rect x="64" y="88" width="32" height="32" rx="6" fill="#12243A" stroke="#F5B942" strokeWidth="2" />
            <text x="80" y="108" textAnchor="middle" fill="#F5B942" fontSize="11" fontWeight="bold">V</text>
            <circle cx="280" cy="104" r="18" fill="#12243A" stroke="#35C98A" strokeWidth="2" />
            <text x="280" y="108" textAnchor="middle" fill="#35C98A" fontSize="11" fontWeight="bold">R</text>
            <text x="180" y="185" textAnchor="middle" fill="#A9BCD3" fontSize="11" fontFamily="monospace">
              Current I = V / R (Closed Circuit)
            </text>
          </svg>
        );
      }
      case 'rainbow': {
        const shift = Math.sin(phase) * 2;
        return (
          <svg viewBox="0 0 360 210" className="w-full h-full" role="img" aria-label={meta.title}>
            <rect width="360" height="210" fill="#07111F" rx="12" />
            <line x1="35" y1="88" x2="150" y2="95" stroke="#FFFFFF" strokeWidth="3" />
            <circle cx="176" cy="102" r="34" fill="#1E4B7A" fillOpacity="0.45" stroke="#35D5F2" strokeWidth="2" />
            <line x1="196" y1="100" x2="320" y2={76 + shift} stroke="#F06A6A" strokeWidth="2.5" />
            <line x1="196" y1="103" x2="320" y2={92 + shift} stroke="#F5B942" strokeWidth="2.5" />
            <line x1="196" y1="106" x2="320" y2={108 + shift} stroke="#35C98A" strokeWidth="2.5" />
            <line x1="196" y1="109" x2="320" y2={124 + shift} stroke="#35D5F2" strokeWidth="2.5" />
            <line x1="196" y1="112" x2="320" y2={140 + shift} stroke="#A78BFA" strokeWidth="2.5" />
            <text x="180" y="185" textAnchor="middle" fill="#A9BCD3" fontSize="11" fontFamily="monospace">
              Refraction + Internal Reflection + Dispersion
            </text>
          </svg>
        );
      }
      case 'rocket': {
        const bob = Math.sin(phase * 3) * 3;
        return (
          <svg viewBox="0 0 360 210" className="w-full h-full" role="img" aria-label={meta.title}>
            <rect width="360" height="210" fill="#07111F" rx="12" />
            <g transform={`translate(0, ${bob})`}>
              <polygon points="180,32 162,72 198,72" fill="#35D5F2" />
              <rect x="162" y="72" width="36" height="62" fill="#E2E8F0" rx="4" />
              <polygon points="162,114 146,138 162,134" fill="#478BFF" />
              <polygon points="198,114 214,138 198,134" fill="#478BFF" />
              <polygon points="168,136 180,174 192,136" fill="#F5B942" opacity="0.9" />
            </g>
            <text x="245" y="70" fill="#35C98A" fontSize="11">↑ Thrust</text>
            <text x="245" y="156" fill="#F5B942" fontSize="11">↓ Exhaust Gas</text>
            <text x="180" y="195" textAnchor="middle" fill="#A9BCD3" fontSize="11" fontFamily="monospace">
              Newton III: Action &amp; Reaction
            </text>
          </svg>
        );
      }
      case 'microscope': {
        const focus = Math.sin(phase * 1.5) * 4;
        return (
          <svg viewBox="0 0 360 210" className="w-full h-full" role="img" aria-label={meta.title}>
            <rect width="360" height="210" fill="#07111F" rx="12" />
            <line x1="65" y1="95" x2="65" y2="115" stroke="#35C98A" strokeWidth="4" />
            <ellipse cx="145" cy="105" rx="8" ry="38" fill="#35D5F2" fillOpacity="0.35" stroke="#35D5F2" strokeWidth="2" />
            <ellipse cx="245" cy="105" rx="9" ry="44" fill="#478BFF" fillOpacity="0.35" stroke="#478BFF" strokeWidth="2" />
            <line x1="65" y1="95" x2="145" y2="85" stroke="#F5B942" strokeWidth="1.5" />
            <line x1="145" y1="85" x2={245 + focus} y2="122" stroke="#F5B942" strokeWidth="1.5" />
            <line x1="65" y1="115" x2="145" y2="125" stroke="#F5B942" strokeWidth="1.5" />
            <line x1="145" y1="125" x2={245 + focus} y2="88" stroke="#F5B942" strokeWidth="1.5" />
            <text x="180" y="185" textAnchor="middle" fill="#A9BCD3" fontSize="11" fontFamily="monospace">
              M_total = M_objective × M_eyepiece
            </text>
          </svg>
        );
      }
      case 'magnet': {
        const pull = Math.sin(phase * 1.8) * 6;
        return (
          <svg viewBox="0 0 360 210" className="w-full h-full" role="img" aria-label={meta.title}>
            <rect width="360" height="210" fill="#07111F" rx="12" />
            <rect x="90" y="84" width="60" height="38" fill="#F06A6A" rx="4" />
            <rect x="150" y="84" width="60" height="38" fill="#478BFF" rx="4" />
            <text x="120" y="108" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold">N</text>
            <text x="180" y="108" textAnchor="middle" fill="#FFFFFF" fontSize="13" fontWeight="bold">S</text>
            <path d="M 110 84 C 110 38, 190 38, 190 84" fill="none" stroke="#35D5F2" strokeWidth="1.5" strokeDasharray="4 3" />
            <path d="M 110 122 C 110 168, 190 168, 190 122" fill="none" stroke="#35D5F2" strokeWidth="1.5" strokeDasharray="4 3" />
            <rect x={256 - pull} y="92" width="28" height="22" rx="4" fill="#A9BCD3" />
            <text x="180" y="190" textAnchor="middle" fill="#A9BCD3" fontSize="11" fontFamily="monospace">
              Magnetic Field Lines (N → S)
            </text>
          </svg>
        );
      }
      case 'heat-shield': {
        const shimmer = Math.sin(phase * 4) * 3;
        return (
          <svg viewBox="0 0 360 210" className="w-full h-full" role="img" aria-label={meta.title}>
            <rect width="360" height="210" fill="#07111F" rx="12" />
            <path d={`M ${135 + shimmer} 50 Q 90 105 ${135 + shimmer} 160`} fill="none" stroke="#F06A6A" strokeWidth="4" />
            <path d="M 148 64 Q 124 105 148 146" fill="none" stroke="#F5B942" strokeWidth="6" />
            <polygon points="154,66 235,88 235,122 154,144" fill="#1E3A5F" stroke="#35D5F2" strokeWidth="2" />
            <text x="65" y="108" fill="#F5B942" fontSize="10">Air Shock →</text>
            <text x="180" y="190" textAnchor="middle" fill="#A9BCD3" fontSize="11" fontFamily="monospace">
              Detached Bow Shock + Thermal Insulation
            </text>
          </svg>
        );
      }
      default: {
        const pulse = Math.sin(phase * 1.6) * 8;
        return (
          <svg viewBox="0 0 360 210" className="w-full h-full" role="img" aria-label={meta.title}>
            <rect width="360" height="210" fill="#07111F" rx="12" />
            <circle cx="180" cy="100" r={38 + pulse * 0.4} fill="none" stroke="#35D5F2" strokeWidth="2" strokeOpacity="0.6" />
            <circle cx="180" cy="100" r="14" fill="#35D5F2" />
            <circle cx={180 + Math.cos(phase) * 56} cy={100 + Math.sin(phase) * 36} r="7" fill="#478BFF" />
            <text x="180" y="185" textAnchor="middle" fill="#A9BCD3" fontSize="11" fontFamily="monospace">
              Interactive Concept Diagram
            </text>
          </svg>
        );
      }
    }
  };

  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-xs font-semibold text-blue-700">
          <Sparkles className="w-4 h-4" />
          Interactive Scientific Animation (Visual Model)
        </div>
        <button
          type="button"
          onClick={togglePlay}
          className="px-3 py-1.5 rounded-lg border border-slate-300 bg-slate-50 text-xs font-medium text-slate-800 hover:bg-slate-100 flex items-center gap-1.5 min-h-[36px]"
        >
          {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {isPlaying ? 'Pause Animation' : 'Play Animation'}
        </button>
      </div>

      <div className="aspect-video w-full overflow-hidden rounded-lg border border-slate-200 bg-[#0F172A]">
        {renderDiagram()}
      </div>

      <div className="space-y-1">
        <div className="text-sm font-semibold text-slate-900">
          {meta.title} — {conceptTitle}
        </div>
        <p className="text-xs text-slate-600 leading-relaxed">{meta.caption}</p>
      </div>
    </div>
  );
}
