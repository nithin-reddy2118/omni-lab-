import React, { useMemo, useState } from 'react';
import {
  Atom,
  Building2,
  Compass,
  Cpu,
  Dna,
  DoorOpen,
  FlaskConical,
  Leaf,
  Microscope,
  Ruler,
  Search,
  Sparkles,
  Telescope,
  Zap,
} from 'lucide-react';
import { useLab } from '../../context/LabContext';
import { CHEMISTRY_CHEMICAL_VAULT } from '../../data/chemicals';
import {
  buildDynamicCampusWelcome,
  getWingProfileContext,
} from '../../data/curriculumEngine';
import { LAB_INSTRUMENTS, LAB_ROOMS } from '../../data/labEquipment';
import type { LabDepartmentId } from '../../types/science';

interface ScienceCampusLobbyProps {
  activeDepartment: LabDepartmentId;
  onEnterLab: (department: LabDepartmentId, autoExperimentId?: string) => void;
}

const DEPT_ICONS: Record<LabDepartmentId, React.ComponentType<{ className?: string }>> = {
  chemistry: FlaskConical,
  physics: Atom,
  biology: Microscope,
  environmental: Leaf,
  engineering: Cpu,
  astronomy: Telescope,
  math: Ruler,
  biotechnology: Dna,
  microbiology: Microscope,
  electronics: Zap,
};

export function ScienceCampusLobby({
  activeDepartment,
  onEnterLab,
}: ScienceCampusLobbyProps) {
  const {
    activeDivision,
    schoolClassLevel,
    higherStage,
    researchTrack,
    selectedBoard,
    engineeringBranch,
    activeSubjectId,
    selectedChapter,
  } = useLab();

  const [filterQuery, setFilterQuery] = useState('');
  const [hoveredWing, setHoveredWing] = useState<LabDepartmentId | null>(null);
  const [showAllLevels, setShowAllLevels] = useState(false);

  const profile = useMemo(
    () => ({
      activeDivision,
      schoolClassLevel,
      higherStage,
      researchTrack,
      selectedBoard,
      engineeringBranch,
      activeSubjectId,
      selectedChapter,
    }),
    [
      activeDivision,
      schoolClassLevel,
      higherStage,
      researchTrack,
      selectedBoard,
      engineeringBranch,
      activeSubjectId,
      selectedChapter,
    ]
  );

  const welcome = useMemo(() => buildDynamicCampusWelcome(profile), [profile]);

  const visibleRooms = useMemo(() => {
    const q = filterQuery.trim().toLowerCase();
    return LAB_ROOMS.filter((room) => {
      if (!q) return true;
      const ctx = getWingProfileContext(room, profile);
      return (
        room.name.toLowerCase().includes(q) ||
        ctx.purposeAtLevel.toLowerCase().includes(q) ||
        room.wingCode.toLowerCase().includes(q) ||
        ctx.syllabusChapters.some((ch) => ch.toLowerCase().includes(q)) ||
        ctx.levelEquipment.some(
          (t) => t.name.toLowerCase().includes(q) || t.category.toLowerCase().includes(q)
        ) ||
        (room.id === 'chemistry' && 'chemicals h2o nacl acid base'.includes(q))
      );
    });
  }, [filterQuery, profile]);

  const focusedRoom =
    LAB_ROOMS.find((r) => r.id === (hoveredWing ?? activeDepartment)) ?? LAB_ROOMS[0];
  const focusedCtx = useMemo(
    () => getWingProfileContext(focusedRoom, profile),
    [focusedRoom, profile]
  );

  const recommendedExpForWing = (roomId: LabDepartmentId) => {
    const ctx = getWingProfileContext(
      LAB_ROOMS.find((r) => r.id === roomId) ?? LAB_ROOMS[0],
      profile
    );
    const linked = ctx.levelExperiments.find((e) => e.modelId)?.modelId;
    return linked || LAB_ROOMS.find((r) => r.id === roomId)?.defaultExperimentId;
  };

  return (
    <div className="space-y-6">
      {/* Dynamic Curriculum-Adapted Campus Atrium Header */}
      <div className="rounded-2xl border border-slate-200 bg-white p-5 sm:p-7 space-y-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1.5 max-w-3xl">
            <div className="text-xs font-semibold text-blue-700 flex items-center gap-2 tracking-wide uppercase">
              <Building2 className="w-4 h-4" />
              {welcome.eyebrow}
            </div>
            <h2 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 tracking-tight">
              {welcome.heading}
            </h2>
            <p className="text-sm text-slate-600 leading-relaxed">{welcome.subtitle}</p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() =>
                onEnterLab(welcome.recommendedDepartment, welcome.recommendedExperimentId)
              }
              className="px-4 py-2.5 rounded-xl bg-blue-700 text-white text-xs font-bold hover:bg-blue-800 flex items-center gap-2 min-h-[44px] shadow-sm whitespace-nowrap shrink-0"
            >
              <Sparkles className="w-4 h-4" />
              Launch {welcome.levelLabel} Recommended Lab
            </button>
            <button
              type="button"
              onClick={() => setShowAllLevels((s) => !s)}
              className={`px-3 py-2 rounded-xl border text-xs font-semibold min-h-[44px] whitespace-nowrap shrink-0 ${
                showAllLevels
                  ? 'border-blue-600 bg-blue-50 text-blue-800'
                  : 'border-slate-200 bg-slate-50 text-slate-700 hover:border-slate-400'
              }`}
            >
              {showAllLevels ? 'Showing All Equipment Tiers' : 'Level-Calibrated View'}
            </button>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="search"
                value={filterQuery}
                onChange={(e) => setFilterQuery(e.target.value)}
                placeholder="Search chapter, wing, or tool..."
                className="pl-9 pr-3 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-900 placeholder-slate-400 w-60"
              />
            </div>
          </div>
        </div>

        {/* Interactive Architectural Campus Floorplan SVG */}
        <div className="grid lg:grid-cols-12 gap-5 items-stretch">
          <div className="lg:col-span-8 rounded-xl border border-slate-200 bg-slate-50 p-3 sm:p-4 flex flex-col justify-between">
            <div className="flex items-center justify-between text-[11px] text-slate-600 mb-2 px-1">
              <span className="flex items-center gap-1.5 font-mono uppercase tracking-wider text-blue-700 font-semibold">
                <Compass className="w-3.5 h-3.5" />
                {welcome.levelLabel} · {LAB_ROOMS.length}-Wing Campus Floorplan
              </span>
              <span className="font-mono tabular-nums text-slate-500">
                {LAB_ROOMS.length} Rooms · {LAB_INSTRUMENTS.length} Instruments ·{' '}
                {CHEMISTRY_CHEMICAL_VAULT.length} Reagents
              </span>
            </div>

            <svg
              viewBox="0 0 980 340"
              className="w-full h-auto rounded-lg border border-slate-200 bg-white"
              role="img"
              aria-label={`Interactive ${welcome.levelLabel} Science Campus architectural floorplan with 10 laboratory rooms`}
            >
              <defs>
                <pattern id="campus-grid-light" width="24" height="24" patternUnits="userSpaceOnUse">
                  <path
                    d="M 24 0 L 0 0 0 24"
                    fill="none"
                    stroke="rgba(148,163,184,0.18)"
                    strokeWidth="1"
                  />
                </pattern>
              </defs>
              <rect width="980" height="340" fill="url(#campus-grid-light)" />

              {/* Central Atrium Corridor */}
              <rect
                x="20"
                y="138"
                width="940"
                height="64"
                rx="8"
                fill="#EFF6FF"
                stroke="#3B82F6"
                strokeOpacity="0.45"
                strokeWidth="1.5"
              />
              <text
                x="490"
                y="166"
                textAnchor="middle"
                fill="#1D4ED8"
                fontSize="11"
                fontWeight="bold"
                letterSpacing="1.5"
              >
                OMNILAB CAMPUS CORRIDOR · {welcome.levelLabel.toUpperCase()}
              </text>
              <text x="490" y="184" textAnchor="middle" fill="#475569" fontSize="9.5">
                Click any wing door to enter with syllabus-adapted benches, safety stations &amp; validation
              </text>

              {/* Top 5 Wing Rooms */}
              {LAB_ROOMS.slice(0, 5).map((room, idx) => {
                const x = 20 + idx * 190;
                const y = 18;
                const isActive = (hoveredWing ?? activeDepartment) === room.id;
                const ctx = getWingProfileContext(room, profile);
                return (
                  <g
                    key={room.id}
                    onMouseEnter={() => setHoveredWing(room.id)}
                    onMouseLeave={() => setHoveredWing(null)}
                    onClick={() => onEnterLab(room.id, recommendedExpForWing(room.id))}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x}
                      y={y}
                      width="178"
                      height="112"
                      rx="8"
                      fill={isActive ? '#F0F9FF' : '#F8FAFC'}
                      stroke={room.accentColor}
                      strokeWidth={isActive ? '2.4' : '1.4'}
                      strokeOpacity={isActive ? 1 : 0.75}
                    />
                    <rect
                      x={x + 44}
                      y={y + 52}
                      width="90"
                      height="24"
                      rx="3"
                      fill="#E2E8F0"
                      stroke={room.accentColor}
                      strokeOpacity="0.55"
                    />
                    <rect x={x + 14} y={y + 18} width="14" height="66" rx="2" fill="#E2E8F0" />
                    <rect x={x + 150} y={y + 18} width="14" height="66" rx="2" fill="#E2E8F0" />
                    <rect x={x + 69} y={y + 108} width="40" height="14" rx="2" fill={room.accentColor} />
                    <text
                      x={x + 89}
                      y={y + 24}
                      textAnchor="middle"
                      fill="#1E293B"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {room.wingCode}
                    </text>
                    <text
                      x={x + 89}
                      y={y + 40}
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize="10.5"
                      fontWeight="bold"
                    >
                      {room.shortName}
                    </text>
                    <text x={x + 89} y={y + 98} textAnchor="middle" fill="#475569" fontSize="8.5">
                      {ctx.validatedModelCount} sims · {ctx.levelEquipment.length} tools
                    </text>
                  </g>
                );
              })}

              {/* Bottom 5 Wing Rooms */}
              {LAB_ROOMS.slice(5, 10).map((room, idx) => {
                const x = 20 + idx * 190;
                const y = 210;
                const isActive = (hoveredWing ?? activeDepartment) === room.id;
                const ctx = getWingProfileContext(room, profile);
                return (
                  <g
                    key={room.id}
                    onMouseEnter={() => setHoveredWing(room.id)}
                    onMouseLeave={() => setHoveredWing(null)}
                    onClick={() => onEnterLab(room.id, recommendedExpForWing(room.id))}
                    className="cursor-pointer"
                  >
                    <rect
                      x={x}
                      y={y}
                      width="178"
                      height="112"
                      rx="8"
                      fill={isActive ? '#F0F9FF' : '#F8FAFC'}
                      stroke={room.accentColor}
                      strokeWidth={isActive ? '2.4' : '1.4'}
                      strokeOpacity={isActive ? 1 : 0.75}
                    />
                    <rect
                      x={x + 44}
                      y={y + 44}
                      width="90"
                      height="24"
                      rx="3"
                      fill="#E2E8F0"
                      stroke={room.accentColor}
                      strokeOpacity="0.55"
                    />
                    <rect x={x + 14} y={y + 24} width="14" height="66" rx="2" fill="#E2E8F0" />
                    <rect x={x + 150} y={y + 24} width="14" height="66" rx="2" fill="#E2E8F0" />
                    <rect x={x + 69} y={y - 10} width="40" height="14" rx="2" fill={room.accentColor} />
                    <text
                      x={x + 89}
                      y={y + 28}
                      textAnchor="middle"
                      fill="#1E293B"
                      fontSize="9"
                      fontFamily="monospace"
                      fontWeight="bold"
                    >
                      {room.wingCode}
                    </text>
                    <text
                      x={x + 89}
                      y={y + 92}
                      textAnchor="middle"
                      fill="#0F172A"
                      fontSize="10.5"
                      fontWeight="bold"
                    >
                      {room.shortName}
                    </text>
                    <text x={x + 89} y={y + 104} textAnchor="middle" fill="#475569" fontSize="8.5">
                      {ctx.validatedModelCount} sims · {ctx.levelEquipment.length} tools
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Right Preview Panel for Hovered / Active Wing */}
          <div className="lg:col-span-4 rounded-xl border border-slate-200 bg-slate-50 p-5 flex flex-col justify-between space-y-4">
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs font-mono">
                <span className="font-bold text-blue-700">{focusedRoom.wingCode}</span>
                <span className="text-slate-500">{welcome.levelLabel}</span>
              </div>
              <h3 className="text-xl font-display font-bold text-slate-900">{focusedRoom.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{focusedCtx.adaptedSubtitle}</p>

              <div className="border-t border-slate-200 pt-3 space-y-2 text-xs">
                <div className="font-semibold text-slate-900">
                  Syllabus Chapters at This Level:
                </div>
                <ul className="list-disc pl-4 space-y-1 text-slate-700">
                  {focusedCtx.syllabusChapters.map((ch) => (
                    <li key={ch}>{ch}</li>
                  ))}
                </ul>
                <div className="pt-1 text-[11px] font-mono text-emerald-700 font-semibold">
                  {focusedCtx.simulationCapabilitiesLabel}
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                onEnterLab(focusedRoom.id, recommendedExpForWing(focusedRoom.id))
              }
              className="w-full py-3 px-4 rounded-xl bg-blue-700 text-white text-sm font-bold hover:bg-blue-800 flex items-center justify-center gap-2 min-h-[46px] shadow-sm transition-colors"
            >
              <DoorOpen className="w-4 h-4" />
              Enter {focusedRoom.shortName}
            </button>
          </div>
        </div>
      </div>

      {/* 10 Dedicated Curriculum-Adapted Laboratory Wing Cards */}
      <div className="grid md:grid-cols-2 xl:grid-cols-4 gap-4">
        {visibleRooms.map((room) => {
          const Icon = DEPT_ICONS[room.id];
          const ctx = getWingProfileContext(room, profile);
          const allToolCount = LAB_INSTRUMENTS.filter((i) => i.department === room.id).length;
          const displayToolCount = showAllLevels ? allToolCount : ctx.levelEquipment.length;
          return (
            <div
              key={room.id}
              onMouseEnter={() => setHoveredWing(room.id)}
              className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all"
            >
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2 text-xs font-mono">
                  <span className="font-bold text-blue-700">{room.wingCode}</span>
                  <span className="text-slate-500 tabular-nums">
                    {displayToolCount}/{allToolCount} tools
                    {room.id === 'chemistry' ? ` · ${CHEMISTRY_CHEMICAL_VAULT.length} reagents` : ''}
                  </span>
                </div>

                <div className="flex items-center gap-2.5">
                  <div
                    className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-200 flex items-center justify-center shrink-0"
                    style={{ color: room.accentColor }}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <h3 className="text-base font-display font-bold text-slate-900 leading-snug">
                    {room.name}
                  </h3>
                </div>

                <p className="text-xs text-slate-600 leading-relaxed">{ctx.adaptedSubtitle}</p>

                <div className="text-[11px] text-slate-700 pt-2 border-t border-slate-100 space-y-1">
                  <div>
                    <strong className="text-slate-900">Chapters:</strong>{' '}
                    {ctx.syllabusChapters.slice(0, 2).join(' · ')}
                  </div>
                  <div className="text-emerald-800 font-medium">
                    {ctx.simulationCapabilitiesLabel}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onEnterLab(room.id, recommendedExpForWing(room.id))}
                className="w-full py-2.5 px-3 rounded-lg bg-slate-50 border border-slate-200 text-xs font-bold text-slate-900 hover:border-blue-600 hover:text-blue-700 hover:bg-blue-50 flex items-center justify-center gap-2 min-h-[44px] transition-colors"
              >
                <DoorOpen className="w-4 h-4" />
                Enter {room.shortName}
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
