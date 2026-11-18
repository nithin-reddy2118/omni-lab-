import React, { useId } from 'react';
import type { EquipmentVisualKind } from '../../types/science';

export interface EquipmentSimState {
  isRunning?: boolean;
  phase?: number;
  liveTempC?: number;
  boilingTempC?: number;
  pressureKpa?: number;
  powerW?: number;
  isBoiling?: boolean;
  pendulumAngleRad?: number;
  voltage?: number;
  currentA?: number;
  lightIntensity?: number;
  phValue?: number;
  massG?: number;
  volumeCm3?: number;
  bottleColor?: string;
  chemicalFormula?: string;
  chemicalSymbol?: string;
  concentrationLabel?: string;
  liquidColorHex?: string;
  liquidOpacity?: number;
  gasActive?: boolean;
  precipitateColorHex?: string;
  fillRatio01?: number;
  bottleFillRatio01?: number;
  capOpen?: boolean;
  isPouring?: boolean;
  isReceiving?: boolean;
  vesselKindOverride?:
    | 'beaker'
    | 'conical-flask'
    | 'test-tubes'
    | 'measuring-cylinder'
    | 'volumetric-flask'
    | 'burette';
}

interface EquipmentIllustrationProps {
  kind: EquipmentVisualKind;
  sim?: EquipmentSimState;
  className?: string;
}

export function EquipmentIllustration({
  kind,
  sim = {},
  className = 'w-20 h-20',
}: EquipmentIllustrationProps) {
  const uid = useId().replace(/:/g, '');
  const phase = sim.phase ?? 0;
  const isRunning = Boolean(sim.isRunning);
  const isBoiling = Boolean(sim.isBoiling);
  const liveTemp = sim.liveTempC ?? 25;
  const powerW = sim.powerW ?? 0;

  switch (kind) {
    case 'beaker': {
      const hasExplicitFill = sim.fillRatio01 !== undefined;
      const fillRatio = hasExplicitFill ? Math.min(1, Math.max(0, sim.fillRatio01!)) : 0.62;
      const hasLiquid = fillRatio > 0.005;
      const bubbleFactor = hasLiquid
        ? isBoiling || sim.gasActive
          ? 1
          : isRunning && liveTemp > 60
            ? 0.35
            : 0
        : 0;
      const tempRatio = Math.min(1, Math.max(0, (liveTemp - 20) / 100));
      const liquidColor =
        sim.liquidColorHex || (tempRatio > 0.75 ? '#35D5F2' : tempRatio > 0.45 ? '#2694C9' : '#1E4B7A');
      const liquidOpacity = hasLiquid ? (sim.liquidOpacity ?? 0.68) : 0;
      // Interior cavity: top y=16, bottom y=82 (height 66 px usable up to ~y=22 max)
      const liquidTopY = 82 - fillRatio * 58;
      const clipId = `beaker-clip-${uid}`;
      const bubbles = [0, 1.1, 2.3, 3.6, 4.8].map((seed, idx) => {
        const progress = ((phase * (isBoiling || sim.gasActive ? 1.8 : 0.7) + seed) % 3) / 3;
        return {
          cx: 28 + (idx % 4) * 11 + Math.sin(phase + idx) * 2.5,
          cy: Math.max(liquidTopY + 3, 80 - progress * Math.max(8, 80 - liquidTopY)),
          r: isBoiling || sim.gasActive ? 2.1 + progress * 2.0 : 1.4,
          opacity: bubbleFactor * (1 - progress * 0.55),
        };
      });

      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <path d="M24 16 L72 16 L72 78 Q72 82 68 82 L28 82 Q24 82 24 78 Z" />
            </clipPath>
          </defs>
          {/* Glass Body */}
          <path
            d="M22 14 L22 78 Q22 84 28 84 L68 84 Q74 84 74 78 L74 14"
            fill="rgba(15,23,42,0.42)"
            stroke={sim.isReceiving ? '#35C98A' : '#B8C9DF'}
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          {/* Pouring lip */}
          <path d="M18 14 L22 14 M74 14 L78 14" stroke="#E2E8F0" strokeWidth="2.4" strokeLinecap="round" />
          {/* Clipped Liquid */}
          {hasLiquid && (
            <g clipPath={`url(#${clipId})`}>
              <rect
                x="22"
                y={liquidTopY}
                width="52"
                height={84 - liquidTopY}
                fill={liquidColor}
                fillOpacity={liquidOpacity}
              />
              <ellipse
                cx="48"
                cy={liquidTopY}
                rx="24"
                ry="2.2"
                fill="#FFFFFF"
                fillOpacity="0.28"
                stroke="#BAE6FD"
                strokeWidth="1.2"
              />
              {sim.precipitateColorHex && (
                <g fill={sim.precipitateColorHex}>
                  {[30, 38, 46, 54, 62].map((x, idx) => (
                    <circle key={x} cx={x} cy={79 - (idx % 2) * 2} r="2.5" />
                  ))}
                </g>
              )}
              {bubbleFactor > 0 &&
                bubbles.map((b, i) => (
                  <circle key={i} cx={b.cx} cy={b.cy} r={b.r} fill="#FFFFFF" opacity={b.opacity} />
                ))}
            </g>
          )}
          {/* Glass highlight reflection */}
          <line x1="27" y1="20" x2="27" y2="76" stroke="#FFFFFF" strokeOpacity="0.22" strokeWidth="1.8" strokeLinecap="round" />
          {/* Graduation lines */}
          {[32, 46, 60, 72].map((y) => (
            <line key={y} x1="25" y1={y} x2="34" y2={y} stroke="#E2E8F0" strokeOpacity="0.7" strokeWidth="1.3" />
          ))}
          {isBoiling && hasLiquid && (
            <g opacity={0.68}>
              <path
                d={`M36 ${Math.max(10, liquidTopY - 8)} Q ${34 + Math.sin(phase * 2) * 3} ${Math.max(4, liquidTopY - 18)} 38 6`}
                stroke="#CBD5E1"
                strokeWidth="1.6"
                fill="none"
              />
              <path
                d={`M56 ${Math.max(10, liquidTopY - 8)} Q ${58 - Math.sin(phase * 2) * 3} ${Math.max(4, liquidTopY - 18)} 54 6`}
                stroke="#CBD5E1"
                strokeWidth="1.6"
                fill="none"
              />
            </g>
          )}
        </svg>
      );
    }

    case 'heater': {
      const glowing = isRunning && powerW > 0;
      const coilColor = glowing ? '#F5B942' : '#4A6382';
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="12" y="50" width="72" height="32" rx="6" fill="#12243A" stroke="#A9BCD3" strokeWidth="2" />
          <rect x="18" y="38" width="60" height="12" rx="4" fill="#07111F" stroke={glowing ? '#F5B942' : '#64748B'} strokeWidth="2" />
          <path
            d="M24 44 Q30 39 36 44 T48 44 T60 44 T72 44"
            fill="none"
            stroke={coilColor}
            strokeWidth={glowing ? '2.8' : '2'}
          />
          <circle cx="28" cy="66" r="5" fill={glowing ? '#35C98A' : '#334155'} />
          <rect x="44" y="60" width="32" height="12" rx="3" fill="#07111F" stroke="rgba(255,255,255,0.2)" />
          <text x="60" y="69" textAnchor="middle" fill="#35D5F2" fontSize="8" fontFamily="monospace">
            {powerW > 0 ? `${powerW}W` : 'HEAT'}
          </text>
        </svg>
      );
    }

    case 'thermometer': {
      const fillH = Math.min(44, Math.max(8, ((liveTemp - 10) / 130) * 44));
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="40" y="10" width="16" height="58" rx="8" fill="#07111F" stroke="#A9BCD3" strokeWidth="2" />
          <circle cx="48" cy="74" r="12" fill="#07111F" stroke="#A9BCD3" strokeWidth="2" />
          <rect x="45" y={64 - fillH} width="6" height={fillH + 4} rx="3" fill="#F06A6A" />
          <circle cx="48" cy="74" r="7.5" fill="#F06A6A" />
          {[22, 34, 46, 58].map((y) => (
            <line key={y} x1="56" y1={y} x2="64" y2={y} stroke="#A9BCD3" strokeWidth="1.4" />
          ))}
        </svg>
      );
    }

    case 'barometer': {
      const p = sim.pressureKpa ?? 101.325;
      const ratio = Math.min(1, Math.max(0, (p - 10) / 490));
      const angle = -125 + ratio * 250;
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="48" cy="48" r="34" fill="#07111F" stroke="#35D5F2" strokeWidth="2.4" />
          <circle cx="48" cy="48" r="27" fill="none" stroke="rgba(255,255,255,0.14)" strokeDasharray="3 4" strokeWidth="2" />
          <g transform={`rotate(${angle} 48 48)`}>
            <line x1="48" y1="48" x2="48" y2="22" stroke="#F5B942" strokeWidth="2.5" strokeLinecap="round" />
          </g>
          <circle cx="48" cy="48" r="4" fill="#E2E8F0" />
          <text x="48" y="68" textAnchor="middle" fill="#35D5F2" fontSize="8" fontFamily="monospace">
            {p.toFixed(0)}kPa
          </text>
        </svg>
      );
    }

    case 'pendulum': {
      const ang = sim.pendulumAngleRad ?? (isRunning ? Math.sin(phase * 1.8) * 0.42 : 0.25);
      const bobX = 48 + Math.sin(ang) * 44;
      const bobY = 18 + Math.cos(ang) * 44;
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <line x1="20" y1="18" x2="76" y2="18" stroke="#A9BCD3" strokeWidth="3" strokeLinecap="round" />
          <line x1="48" y1="18" x2="48" y2="82" stroke="rgba(255,255,255,0.12)" strokeDasharray="3 3" />
          <line x1="48" y1="18" x2={bobX} y2={bobY} stroke="#E2E8F0" strokeWidth="2.2" />
          <circle cx={bobX} cy={bobY} r="9" fill="#35D5F2" stroke="#FFFFFF" strokeWidth="1.6" />
        </svg>
      );
    }

    case 'spring': {
      const stretch = isRunning ? Math.sin(phase * 2.5) * 6 : 0;
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <line x1="22" y1="14" x2="74" y2="14" stroke="#A9BCD3" strokeWidth="3" strokeLinecap="round" />
          <path
            d={`M48 14 L48 22 L38 28 L58 35 L38 42 L58 49 L38 56 L48 ${62 + stretch * 0.5}`}
            fill="none"
            stroke="#35D5F2"
            strokeWidth="2.4"
            strokeLinejoin="round"
          />
          <rect x="38" y={62 + stretch * 0.5} width="20" height="16" rx="3" fill="#F5B942" stroke="#FFFFFF" strokeWidth="1.2" />
        </svg>
      );
    }

    case 'power-supply': {
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="12" y="20" width="72" height="56" rx="7" fill="#12243A" stroke="#478BFF" strokeWidth="2" />
          <rect x="20" y="28" width="56" height="18" rx="3" fill="#07111F" stroke="#35D5F2" strokeWidth="1.2" />
          <text x="48" y="40" textAnchor="middle" fill="#35D5F2" fontSize="10" fontFamily="monospace">
            {(sim.voltage ?? 5).toFixed(1)}V DC
          </text>
          <circle cx="30" cy="60" r="6" fill="#F06A6A" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="48" cy="60" r="6" fill="#1E293B" stroke="#FFFFFF" strokeWidth="1.2" />
          <circle cx="68" cy="60" r="5" fill={isRunning ? '#35C98A' : '#475569'} />
        </svg>
      );
    }

    case 'resistor':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <line x1="8" y1="48" x2="26" y2="48" stroke="#A9BCD3" strokeWidth="3" />
          <line x1="70" y1="48" x2="88" y2="48" stroke="#A9BCD3" strokeWidth="3" />
          <rect x="26" y="34" width="44" height="28" rx="6" fill="#2A3A4F" stroke="#E2E8F0" strokeWidth="1.8" />
          <rect x="34" y="34" width="5" height="28" fill="#F5B942" />
          <rect x="44" y="34" width="5" height="28" fill="#F06A6A" />
          <rect x="54" y="34" width="5" height="28" fill="#35D5F2" />
        </svg>
      );

    case 'capacitor':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <line x1="12" y1="48" x2="38" y2="48" stroke="#A9BCD3" strokeWidth="3" />
          <line x1="58" y1="48" x2="84" y2="48" stroke="#A9BCD3" strokeWidth="3" />
          <line x1="38" y1="22" x2="38" y2="74" stroke="#35D5F2" strokeWidth="5" strokeLinecap="round" />
          <line x1="58" y1="22" x2="58" y2="74" stroke="#F5B942" strokeWidth="5" strokeLinecap="round" />
          <text x="48" y="88" textAnchor="middle" fill="#A9BCD3" fontSize="9" fontFamily="monospace">
            µF / p-n
          </text>
        </svg>
      );

    case 'meter':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="18" y="14" width="60" height="68" rx="8" fill="#12243A" stroke="#35D5F2" strokeWidth="2" />
          <rect x="25" y="22" width="46" height="22" rx="3" fill="#07111F" />
          <text x="48" y="37" textAnchor="middle" fill="#35C98A" fontSize="9.5" fontFamily="monospace">
            {sim.currentA !== undefined
              ? `${sim.currentA.toFixed(2)}A`
              : sim.phValue !== undefined
                ? `pH ${sim.phValue.toFixed(1)}`
                : 'METER'}
          </text>
          <circle cx="48" cy="60" r="10" fill="#07111F" stroke="#A9BCD3" strokeWidth="1.8" />
          <line x1="48" y1="60" x2="54" y2="53" stroke="#35D5F2" strokeWidth="2" />
        </svg>
      );

    case 'wave-gen':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="12" y="18" width="72" height="60" rx="6" fill="#07111F" stroke="#35D5F2" strokeWidth="2" />
          <rect x="18" y="24" width="60" height="32" rx="3" fill="#091D2C" stroke="#1E3A5F" />
          <path
            d="M20 40 Q30 24 40 40 T60 40 T76 40"
            fill="none"
            stroke="#35C98A"
            strokeWidth="2.2"
          />
          <circle cx="30" cy="66" r="5" fill="#12243A" stroke="#A9BCD3" strokeWidth="1.5" />
          <circle cx="50" cy="66" r="5" fill="#12243A" stroke="#A9BCD3" strokeWidth="1.5" />
          <circle cx="68" cy="66" r="4" fill="#F5B942" />
        </svg>
      );

    case 'light-source':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <circle cx="44" cy="48" r="16" fill="#F5B942" fillOpacity={isRunning ? 0.92 : 0.5} stroke="#FFFBEB" strokeWidth="1.8" />
          <rect x="14" y="42" width="16" height="12" rx="2" fill="#334155" />
          {isRunning && (
            <g stroke="#F5B942" strokeWidth="2" strokeLinecap="round">
              <line x1="64" y1="48" x2="86" y2="48" />
              <line x1="60" y1="34" x2="80" y2="22" />
              <line x1="60" y1="62" x2="80" y2="74" />
            </g>
          )}
        </svg>
      );

    case 'plant-chamber': {
      const rate = sim.lightIntensity ?? 200;
      const bubbleOn = isRunning && rate > 20;
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="18" y="18" width="60" height="62" rx="8" fill="#0A1F1D" stroke="#35C98A" strokeWidth="2" />
          <ellipse cx="48" cy="54" rx="20" ry="12" fill="#1F6F50" stroke="#35C98A" strokeWidth="1.8" />
          <line x1="34" y1="54" x2="62" y2="54" stroke="#35C98A" strokeWidth="1.4" />
          {bubbleOn && (
            <>
              <circle cx="40" cy={36 - ((phase * 8) % 12)} r="2.5" fill="#35D5F2" />
              <circle cx="56" cy={34 - ((phase * 6) % 10)} r="2.2" fill="#35D5F2" />
            </>
          )}
        </svg>
      );
    }

    case 'cell-model':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <ellipse cx="48" cy="48" rx="34" ry="26" fill="#0F2E26" stroke="#35C98A" strokeWidth="2.4" />
          <circle cx="48" cy="46" r="11" fill="#35D5F2" fillOpacity="0.35" stroke="#35D5F2" strokeWidth="2" />
          <circle cx="48" cy="46" r="4" fill="#F5B942" />
          <ellipse cx="28" cy="44" rx="5" ry="3" fill="#EC4899" />
          <ellipse cx="66" cy="56" rx="6" ry="3.5" fill="#35C98A" />
        </svg>
      );

    case 'dna-helix':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <path d="M32 14 C64 26, 32 42, 64 56 C32 70, 64 78, 32 84" fill="none" stroke="#35D5F2" strokeWidth="3" strokeLinecap="round" />
          <path d="M64 14 C32 26, 64 42, 32 56 C64 70, 32 78, 64 84" fill="none" stroke="#EC4899" strokeWidth="3" strokeLinecap="round" />
          {[22, 35, 48, 62, 74].map((y) => (
            <line key={y} x1="36" y1={y} x2="60" y2={y} stroke="#F5B942" strokeWidth="2" strokeOpacity="0.85" />
          ))}
        </svg>
      );

    case 'microscope':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="24" y="76" width="48" height="8" rx="3" fill="#A9BCD3" />
          <path d="M56 76 C68 64, 68 38, 54 28" fill="none" stroke="#35D5F2" strokeWidth="5" strokeLinecap="round" />
          <rect x="34" y="18" width="12" height="34" rx="3" transform="rotate(-15 40 35)" fill="#E2E8F0" />
          <rect x="26" y="58" width="32" height="4" rx="1.5" fill="#35C98A" />
        </svg>
      );

    case 'balance':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="20" y="34" width="56" height="8" rx="3" fill="#A9BCD3" />
          <rect x="16" y="42" width="64" height="36" rx="6" fill="#12243A" stroke="#35D5F2" strokeWidth="2" />
          <rect x="26" y="52" width="44" height="16" rx="3" fill="#07111F" />
          <text x="48" y="63" textAnchor="middle" fill="#35D5F2" fontSize="9" fontFamily="monospace">
            {sim.massG !== undefined ? `${sim.massG.toFixed(1)}g` : '0.00 g'}
          </text>
        </svg>
      );

    case 'volumetric': {
      const hasExplicitFill = sim.fillRatio01 !== undefined;
      const fillRatio = hasExplicitFill ? Math.min(1, Math.max(0, sim.fillRatio01!)) : 0.55;
      const hasLiquid = fillRatio > 0.005;
      const liquidColor = sim.liquidColorHex || '#35D5F2';
      const liquidOpacity = hasLiquid ? (sim.liquidOpacity ?? 0.65) : 0;
      const clipId = `vol-clip-${uid}`;

      if (sim.vesselKindOverride === 'measuring-cylinder') {
        const liquidTopY = 78 - fillRatio * 56;
        return (
          <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
            <defs>
              <clipPath id={clipId}>
                <rect x="38" y="16" width="20" height="62" rx="2" />
              </clipPath>
            </defs>
            <polygon points="35,14 38,18 38,78 58,78 58,16 61,14" fill="rgba(15,23,42,0.45)" stroke={sim.isReceiving ? '#35C98A' : '#B8C9DF'} strokeWidth="2.2" strokeLinejoin="round" />
            {hasLiquid && (
              <g clipPath={`url(#${clipId})`}>
                <rect x="37" y={liquidTopY} width="22" height={80 - liquidTopY} fill={liquidColor} fillOpacity={liquidOpacity} />
                <ellipse cx="48" cy={liquidTopY} rx="9" ry="1.8" fill="#BAE6FD" fillOpacity="0.6" />
              </g>
            )}
            {[26, 36, 46, 56, 66].map((y) => (
              <line key={y} x1="40" y1={y} x2="47" y2={y} stroke="#E2E8F0" strokeOpacity="0.7" strokeWidth="1.2" />
            ))}
            <polygon points="28,84 68,84 64,78 32,78" fill="#64748B" stroke="#CBD5E1" strokeWidth="1.5" />
          </svg>
        );
      }

      const liquidTopY = 78 - fillRatio * 46;
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <path d="M43 16 L53 16 L53 40 A20 20 0 1 1 43 40 Z" />
            </clipPath>
          </defs>
          <path
            d="M43 14 L53 14 L53 40 A20 20 0 1 1 43 40 Z"
            fill="rgba(15,23,42,0.45)"
            stroke={sim.isReceiving ? '#35C98A' : '#B8C9DF'}
            strokeWidth="2.2"
          />
          {hasLiquid && (
            <g clipPath={`url(#${clipId})`}>
              <rect x="24" y={liquidTopY} width="48" height={84 - liquidTopY} fill={liquidColor} fillOpacity={liquidOpacity} />
              <line x1="28" y1={liquidTopY} x2="68" y2={liquidTopY} stroke="#BAE6FD" strokeWidth="1.4" />
            </g>
          )}
          <line x1="41" y1="26" x2="55" y2="26" stroke="#35D5F2" strokeWidth="1.6" />
          <line x1="34" y1="81" x2="62" y2="81" stroke="#E2E8F0" strokeWidth="2.4" strokeLinecap="round" />
        </svg>
      );
    }

    case 'burette': {
      const hasExplicitFill = sim.fillRatio01 !== undefined;
      const fillRatio = hasExplicitFill ? Math.min(1, Math.max(0, sim.fillRatio01!)) : 0.6;
      const hasLiquid = fillRatio > 0.005;
      const liquidColor = sim.liquidColorHex || '#35D5F2';
      const liquidTopY = 68 - fillRatio * 52;
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <line x1="28" y1="14" x2="28" y2="84" stroke="#94A3B8" strokeWidth="3" />
          <line x1="16" y1="84" x2="46" y2="84" stroke="#94A3B8" strokeWidth="3" />
          <line x1="28" y1="36" x2="50" y2="36" stroke="#CBD5E1" strokeWidth="2.5" />
          <rect x="50" y="12" width="8" height="58" rx="2" fill="rgba(15,23,42,0.5)" stroke={sim.isReceiving ? '#35C98A' : '#35D5F2'} strokeWidth="1.8" />
          {hasLiquid && (
            <rect x="51" y={liquidTopY} width="6" height={69 - liquidTopY} fill={liquidColor} fillOpacity={sim.liquidOpacity ?? 0.72} />
          )}
          <line x1="46" y1="64" x2="62" y2="64" stroke="#F5B942" strokeWidth="3" />
          <polygon points="52,70 56,70 54,82" fill={hasLiquid ? liquidColor : '#94A3B8'} />
        </svg>
      );
    }

    case 'funnel':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <polygon points="20,20 76,20 53,54 53,82 43,82 43,54" fill="rgba(53,213,242,0.25)" stroke="#E2E8F0" strokeWidth="2.2" strokeLinejoin="round" />
          <line x1="28" y1="28" x2="68" y2="28" stroke="#F5B942" strokeWidth="1.6" strokeDasharray="3 2" />
        </svg>
      );

    case 'centrifuge':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <path d="M18 46 L26 24 L70 24 L78 46 L78 78 L18 78 Z" fill="#12243A" stroke="#35D5F2" strokeWidth="2" />
          <line x1="22" y1="46" x2="74" y2="46" stroke="#A9BCD3" strokeWidth="1.8" />
          <rect x="30" y="54" width="36" height="14" rx="3" fill="#07111F" />
          <text x="48" y="64" textAnchor="middle" fill="#35C98A" fontSize="8" fontFamily="monospace">
            {isRunning ? '4000 RPM' : 'SPIN'}
          </text>
        </svg>
      );

    case 'safety-gear':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <path d="M18 42 Q26 32 42 40 L54 40 Q70 32 78 42 L74 58 Q62 62 52 50 L44 50 Q34 62 22 58 Z" fill="rgba(53,201,138,0.28)" stroke="#35C98A" strokeWidth="2.4" />
          <path d="M48 16 L60 21 L60 30 C60 36 48 40 48 40 C48 40 36 36 36 30 L36 21 Z" fill="#12243A" stroke="#35D5F2" strokeWidth="1.8" />
        </svg>
      );

    case 'chemical-bottle': {
      const color = sim.bottleColor || '#35C98A';
      const fillRatio = sim.bottleFillRatio01 !== undefined ? Math.min(1, Math.max(0, sim.bottleFillRatio01)) : 0.78;
      const hasLiquid = fillRatio > 0.005;
      const clipId = `bottle-clip-${uid}`;
      // Body interior goes from y=32 to y=81 (usable height ~47)
      const liquidTopY = 81 - fillRatio * 46;
      const labelText = (sim.chemicalSymbol || sim.chemicalFormula || 'REAGENT').slice(0, 8);
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <path d="M39 26 L57 26 L66 39 L66 77 Q66 81 62 81 L34 81 Q30 81 30 77 L30 39 Z" />
            </clipPath>
          </defs>
          {/* Removable Bottle Cap / Stopper */}
          <g
            transform={sim.capOpen ? 'translate(18, -10) rotate(28 48 16)' : undefined}
            style={{ transition: 'transform 180ms ease-out' }}
          >
            <rect x="38" y="10" width="20" height="10" rx="2.5" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.2" />
            <line x1="42" y1="12" x2="42" y2="18" stroke="#94A3B8" strokeWidth="1" />
            <line x1="48" y1="12" x2="48" y2="18" stroke="#94A3B8" strokeWidth="1" />
            <line x1="54" y1="12" x2="54" y2="18" stroke="#94A3B8" strokeWidth="1" />
          </g>
          {/* Bottle Neck Rim */}
          <rect x="37" y="21" width="22" height="4" rx="1.5" fill="#CBD5E1" />
          {/* Glass Body */}
          <path
            d="M38 25 L58 25 L68 38 L68 78 Q68 83 63 83 L33 83 Q28 83 28 78 L28 38 Z"
            fill="#0D1B2A"
            stroke={color}
            strokeWidth="2.3"
            strokeLinejoin="round"
          />
          {/* Clipped Reagent Liquid */}
          {hasLiquid && (
            <g clipPath={`url(#${clipId})`}>
              <rect
                x="28"
                y={liquidTopY}
                width="40"
                height={84 - liquidTopY}
                fill={color}
                fillOpacity="0.62"
              />
              <ellipse cx="48" cy={liquidTopY} rx="18" ry="1.8" fill="#FFFFFF" fillOpacity="0.32" />
            </g>
          )}
          {/* Graduation / Quantity Tick Marks */}
          {[46, 58, 70].map((y) => (
            <line key={y} x1="60" y1={y} x2="66" y2={y} stroke="#CBD5E1" strokeOpacity="0.55" strokeWidth="1.2" />
          ))}
          {/* Label Badge */}
          <rect x="32" y="45" width="32" height="20" rx="2.5" fill="#07111F" fillOpacity="0.92" stroke="rgba(255,255,255,0.3)" />
          <text x="48" y="55" textAnchor="middle" fill="#FFFFFF" fontSize="8" fontWeight="bold" fontFamily="monospace">
            {labelText}
          </text>
          {sim.concentrationLabel && (
            <text x="48" y="62.5" textAnchor="middle" fill="#94A3B8" fontSize="5.2" fontFamily="monospace">
              {sim.concentrationLabel.slice(0, 10)}
            </text>
          )}
        </svg>
      );
    }

    case 'telescope':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <line x1="48" y1="50" x2="28" y2="82" stroke="#A9BCD3" strokeWidth="3" strokeLinecap="round" />
          <line x1="48" y1="50" x2="68" y2="82" stroke="#A9BCD3" strokeWidth="3" strokeLinecap="round" />
          <rect x="20" y="30" width="54" height="14" rx="4" transform="rotate(-22 48 40)" fill="#E2E8F0" stroke="#A78BFA" strokeWidth="2" />
          <circle cx="72" cy="24" r="5" fill="#35D5F2" />
        </svg>
      );

    case 'rocket':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <path d="M48 12 C60 26 62 46 60 66 L36 66 C34 46 36 26 48 12 Z" fill="#E2E8F0" stroke="#A78BFA" strokeWidth="2" />
          <circle cx="48" cy="38" r="6" fill="#35D5F2" />
          <polygon points="36,54 24,70 36,66" fill="#F06A6A" />
          <polygon points="60,54 72,70 60,66" fill="#F06A6A" />
          {isRunning && <polygon points="42,68 48,88 54,68" fill="#F5B942" />}
        </svg>
      );

    case 'robotics':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="16" y="24" width="64" height="48" rx="6" fill="#0F2942" stroke="#478BFF" strokeWidth="2" />
          <rect x="30" y="36" width="36" height="24" rx="3" fill="#1E293B" stroke="#35D5F2" strokeWidth="1.5" />
          {[24, 38, 52, 66].map((x) => (
            <circle key={x} cx={x} cy="29" r="2.2" fill="#F5B942" />
          ))}
          <circle cx="24" cy="64" r="3" fill="#35C98A" />
        </svg>
      );

    case 'weather':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <line x1="48" y1="22" x2="48" y2="82" stroke="#A9BCD3" strokeWidth="3" />
          <line x1="22" y1="30" x2="74" y2="30" stroke="#35D5F2" strokeWidth="2.5" />
          <circle cx="22" cy="30" r="6" fill="#35D5F2" />
          <circle cx="74" cy="30" r="6" fill="#35D5F2" />
          <rect x="34" y="48" width="28" height="22" rx="4" fill="#12243A" stroke="#35C98A" strokeWidth="1.6" />
        </svg>
      );

    case 'optics':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <polygon points="48,18 22,72 74,72" fill="#35D5F2" fillOpacity="0.22" stroke="#35D5F2" strokeWidth="2.2" />
          <line x1="10" y1="50" x2="36" y2="46" stroke="#FFFFFF" strokeWidth="2.2" />
          <line x1="60" y1="45" x2="86" y2="36" stroke="#F06A6A" strokeWidth="2" />
          <line x1="62" y1="49" x2="86" y2="49" stroke="#35C98A" strokeWidth="2" />
          <line x1="63" y1="53" x2="86" y2="62" stroke="#A78BFA" strokeWidth="2" />
        </svg>
      );

    case 'mechanics':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <line x1="12" y1="66" x2="84" y2="66" stroke="#A9BCD3" strokeWidth="3" />
          <rect x="26" y="42" width="38" height="18" rx="4" fill="#478BFF" stroke="#FFFFFF" strokeWidth="1.5" />
          <circle cx="34" cy="62" r="5" fill="#E2E8F0" />
          <circle cx="56" cy="62" r="5" fill="#E2E8F0" />
          <line x1="64" y1="51" x2="84" y2="51" stroke="#35D5F2" strokeWidth="2.5" />
          <polygon points="84,51 77,46 77,56" fill="#35D5F2" />
        </svg>
      );

    case 'math-tool':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="14" y="22" width="68" height="52" rx="6" fill="#07111F" stroke="#F5B942" strokeWidth="2" />
          <polyline points="22,64 36,52 50,40 66,30 76,26" fill="none" stroke="#35D5F2" strokeWidth="2.4" />
          <circle cx="50" cy="40" r="3" fill="#F5B942" />
        </svg>
      );

    case 'calculator':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="22" y="12" width="52" height="72" rx="7" fill="#12243A" stroke="#F5B942" strokeWidth="2" />
          <rect x="29" y="20" width="38" height="18" rx="3" fill="#07111F" stroke="#35D5F2" strokeWidth="1.2" />
          <text x="48" y="32" textAnchor="middle" fill="#35C98A" fontSize="9" fontFamily="monospace">
            f(x)
          </text>
          {[46, 58, 70].map((y) =>
            [32, 46, 60].map((x) => (
              <rect key={`${x}-${y}`} x={x - 3} y={y - 3} width="8" height="8" rx="1.5" fill="#334155" />
            ))
          )}
        </svg>
      );

    case 'sensor':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="24" y="18" width="48" height="60" rx="8" fill="#12243A" stroke="#35D5F2" strokeWidth="2" />
          <circle cx="48" cy="40" r="12" fill="#07111F" stroke="#35C98A" strokeWidth="2" />
          <circle cx="48" cy="40" r="5" fill="#35C98A" />
          <rect x="32" y="60" width="32" height="8" rx="2" fill="#07111F" />
        </svg>
      );

    case 'pipette':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          {/* Precision calibrated pipette / micropipette */}
          <path
            d="M44 10 L52 10 L54 24 L50 28 L50 58 L46 58 L46 28 L42 24 Z"
            fill="#1E293B"
            stroke="#35D5F2"
            strokeWidth="1.8"
          />
          <rect x="44" y="8" width="8" height="6" rx="2" fill="#F5B942" />
          <path d="M46 58 L50 58 L48.8 84 L47.2 84 Z" fill="rgba(56,189,248,0.35)" stroke="#B8C9DF" strokeWidth="1.5" />
          <path d="M47 72 L49 72 L48.5 83 L47.5 83 Z" fill={sim.liquidColorHex || '#35D5F2'} />
          <circle cx="48" cy="87" r="2.2" fill={sim.liquidColorHex || '#35D5F2'} opacity={sim.isRunning ? 0.95 : 0.65} />
          {[34, 42, 50].map((y) => (
            <line key={y} x1="46" y1={y} x2="50" y2={y} stroke="#E2E8F0" strokeWidth="1" />
          ))}
        </svg>
      );

    case 'petri-dish':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <ellipse cx="48" cy="54" rx="34" ry="18" fill="rgba(15,23,42,0.5)" stroke="#94A3B8" strokeWidth="2" />
          <ellipse cx="48" cy="50" rx="31" ry="15" fill={sim.liquidColorHex || 'rgba(245,185,66,0.28)'} stroke="#35D5F2" strokeWidth="1.4" />
          <ellipse cx="48" cy="44" rx="33" ry="16" fill="rgba(226,232,240,0.08)" stroke="#E2E8F0" strokeWidth="1.5" />
          {/* Microbial colonies / crystal nuclei */}
          <circle cx="38" cy="49" r="3.2" fill="#35C98A" />
          <circle cx="52" cy="46" r="2.6" fill="#F5B942" />
          <circle cx="59" cy="53" r="3.5" fill="#35D5F2" />
          <circle cx="44" cy="55" r="2.2" fill="#A78BFA" />
        </svg>
      );

    case 'stirrer':
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <rect x="16" y="48" width="64" height="32" rx="7" fill="#1E293B" stroke="#64748B" strokeWidth="2" />
          <ellipse cx="48" cy="46" rx="26" ry="7" fill="#E2E8F0" stroke="#94A3B8" strokeWidth="1.8" />
          {/* Stir bar magnet rotating */}
          <g transform={`rotate(${Math.round((phase * 120) % 360)} 48 45)`}>
            <rect x="39" y="42.5" width="18" height="5" rx="2.5" fill="#FFFFFF" stroke="#35D5F2" strokeWidth="1.3" />
          </g>
          <circle cx="32" cy="65" r="5" fill="#0F172A" stroke="#35D5F2" strokeWidth="1.6" />
          <line x1="32" y1="65" x2="35" y2="62" stroke="#35D5F2" strokeWidth="1.6" strokeLinecap="round" />
          <circle cx="64" cy="65" r="5" fill="#0F172A" stroke="#35C98A" strokeWidth="1.6" />
          <rect x="42" y="61" width="12" height="8" rx="2" fill="#07111F" />
        </svg>
      );

    default: {
      const hasExplicitFill = sim.fillRatio01 !== undefined;
      const fillRatio = hasExplicitFill ? Math.min(1, Math.max(0, sim.fillRatio01!)) : 0.45;
      const hasLiquid = fillRatio > 0.005;
      const liquidColor = sim.liquidColorHex || '#1E4B7A';
      const liquidOpacity = hasLiquid ? (sim.liquidOpacity ?? 0.62) : 0;
      const showBubbles = hasLiquid && Boolean(sim.gasActive || isBoiling);
      const clipId = `flask-clip-${uid}`;

      if (sim.vesselKindOverride === 'test-tubes') {
        const tubeLiquidTop = 70 - fillRatio * 42;
        return (
          <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
            <rect x="18" y="28" width="60" height="5" rx="2" fill="#94A3B8" />
            <rect x="18" y="72" width="60" height="7" rx="2" fill="#64748B" />
            {[30, 48, 66].map((cx, idx) => (
              <g key={cx}>
                <defs>
                  <clipPath id={`${clipId}-t${idx}`}>
                    <path d={`M${cx - 5} 18 L${cx + 5} 18 L${cx + 5} 66 A5 5 0 0 1 ${cx - 5} 66 Z`} />
                  </clipPath>
                </defs>
                <path
                  d={`M${cx - 5} 16 L${cx + 5} 16 L${cx + 5} 66 A5 5 0 0 1 ${cx - 5} 66 Z`}
                  fill="rgba(15,23,42,0.45)"
                  stroke={sim.isReceiving ? '#35C98A' : '#B8C9DF'}
                  strokeWidth="1.8"
                />
                {hasLiquid && (
                  <g clipPath={`url(#${clipId}-t${idx})`}>
                    <rect
                      x={cx - 6}
                      y={tubeLiquidTop}
                      width="12"
                      height={74 - tubeLiquidTop}
                      fill={liquidColor}
                      fillOpacity={liquidOpacity}
                    />
                    <line x1={cx - 5} y1={tubeLiquidTop} x2={cx + 5} y2={tubeLiquidTop} stroke="#BAE6FD" strokeWidth="1.2" />
                  </g>
                )}
              </g>
            ))}
          </svg>
        );
      }

      const liquidTopY = 78 - fillRatio * 46;
      return (
        <svg viewBox="0 0 96 96" className={className} aria-hidden="true">
          <defs>
            <clipPath id={clipId}>
              <path d="M40 16 L56 16 L56 34 L72 72 Q74 78 66 78 L30 78 Q22 78 24 72 L40 34 Z" />
            </clipPath>
          </defs>
          <path
            d="M40 16 L56 16 L56 34 L72 72 Q74 78 66 78 L30 78 Q22 78 24 72 L40 34 Z"
            fill="rgba(15,23,42,0.45)"
            stroke={sim.isReceiving ? '#35C98A' : '#35D5F2'}
            strokeWidth="2.2"
            strokeLinejoin="round"
          />
          <line x1="37" y1="16" x2="59" y2="16" stroke="#E2E8F0" strokeWidth="2.2" strokeLinecap="round" />
          {hasLiquid && (
            <g clipPath={`url(#${clipId})`}>
              <rect
                x="20"
                y={liquidTopY}
                width="56"
                height={82 - liquidTopY}
                fill={liquidColor}
                fillOpacity={liquidOpacity}
              />
              <line x1="24" y1={liquidTopY} x2="72" y2={liquidTopY} stroke="#BAE6FD" strokeWidth="1.5" />
              {sim.precipitateColorHex && (
                <g fill={sim.precipitateColorHex}>
                  {[34, 42, 50, 58].map((x) => (
                    <circle key={x} cx={x} cy={74} r="2.3" />
                  ))}
                </g>
              )}
              {showBubbles && (
                <g fill="#FFFFFF" opacity={0.85}>
                  <circle cx="42" cy={Math.max(liquidTopY + 3, 74 - ((phase * 14) % 16))} r="2" />
                  <circle cx="52" cy={Math.max(liquidTopY + 3, 72 - ((phase * 11) % 14))} r="1.8" />
                </g>
              )}
            </g>
          )}
          {[46, 58, 68].map((y) => (
            <line key={y} x1="36" y1={y} x2="43" y2={y} stroke="#E2E8F0" strokeOpacity="0.6" strokeWidth="1.2" />
          ))}
        </svg>
      );
    }
  }
}
