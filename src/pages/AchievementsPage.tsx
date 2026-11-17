import React from 'react';
import { Award, CheckCircle2, Lock } from 'lucide-react';
import { useLab } from '../context/LabContext';

export function AchievementsPage() {
  const { achievements, knowledgePoints, navigate } = useLab();
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-700 flex items-center gap-1.5">
            <Award className="w-4 h-4" />
            Earned Strictly Through Scientific Actions
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
            Achievements
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Unlock badges by running deterministic trials, testing predictions, exploring What If scenarios, and building safe innovations.
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white px-5 py-3 text-right shadow-sm">
          <div className="text-xs text-slate-500">Verified Total</div>
          <div className="text-xl font-mono font-bold tabular-nums text-blue-700">
            {unlockedCount} / {achievements.length} · {knowledgePoints} pts
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
        {achievements.map((ach) => (
          <div
            key={ach.id}
            className={`rounded-xl border p-5 flex flex-col justify-between space-y-4 shadow-sm ${
              ach.unlocked
                ? 'border-emerald-200 bg-emerald-50/70'
                : 'border-slate-200 bg-white'
            }`}
          >
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-mono font-semibold text-blue-700">+{ach.points} pts</span>
                {ach.unlocked ? (
                  <span className="flex items-center gap-1 text-emerald-700 font-semibold">
                    <CheckCircle2 className="w-4 h-4" /> Unlocked
                  </span>
                ) : (
                  <span className="flex items-center gap-1 text-slate-500">
                    <Lock className="w-3.5 h-3.5" /> Locked
                  </span>
                )}
              </div>
              <h2 className="text-base font-semibold text-slate-900">{ach.title}</h2>
              <p className="text-sm text-slate-600">{ach.description}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 text-xs text-slate-700 flex items-center justify-between">
              <span>Criteria: {ach.criteriaText}</span>
              {!ach.unlocked && (
                <button
                  type="button"
                  onClick={() => navigate('virtual-lab')}
                  className="text-blue-700 font-semibold hover:underline shrink-0 ml-2"
                >
                  Go →
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
