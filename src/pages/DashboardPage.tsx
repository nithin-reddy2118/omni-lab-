import React from 'react';
import { ArrowRight, Award, BookOpen, FlaskConical, Flame, Lightbulb, Sparkles } from 'lucide-react';
import { useLab } from '../context/LabContext';
import { EXPERIMENTS } from '../engine/experiments';
import { WORLD_DISCOVERIES } from '../data/discoveries';

export function DashboardPage() {
  const {
    navigate,
    trialsByExperiment,
    knowledgePoints,
    streakDays,
    savedReports,
    savedDiscoveryIds,
    myInnovations,
    customExperiments,
    setCreatorSelectedCustomId,
    demoMode,
    setDemoMode,
  } = useLab();

  const realCompletedExps = Object.entries(trialsByExperiment)
    .filter(([, arr]) => arr.length > 0)
    .map(([id]) => id);
  const realTrialCount = Object.values(trialsByExperiment).flat().length;

  const displayedCompleted = demoMode ? 4 : realCompletedExps.length;
  const displayedPoints = demoMode ? 155 : knowledgePoints;
  const displayedStreak = demoMode ? 3 : streakDays;
  const progressPercent = Math.round((displayedCompleted / EXPERIMENTS.length) * 100);

  const recentSavedDiscoveries = WORLD_DISCOVERIES.filter((d) =>
    savedDiscoveryIds.includes(d.id)
  );

  const nextRecommended =
    EXPERIMENTS.find((e) => !realCompletedExps.includes(e.id)) ?? EXPERIMENTS[0];

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900">
            Student Dashboard
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            {demoMode
              ? 'Previewing clearly labelled Example Student Data. Switch back to view your genuine progress.'
              : 'Welcome to your personal laboratory workspace. All metrics reflect your actual saved activity.'}
          </p>
        </div>

        <button
          type="button"
          onClick={() => setDemoMode(!demoMode)}
          className={`px-4 py-2 rounded-lg text-xs font-semibold border transition-colors ${
            demoMode
              ? 'bg-amber-50 border-amber-300 text-amber-800'
              : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
          }`}
        >
          {demoMode ? 'Showing: Example Demo Mode (Click to Exit)' : 'Preview Example Demo Data'}
        </button>
      </div>

      {demoMode && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-xs text-amber-900">
          <strong>Example Demonstration Mode:</strong> The numbers below are illustrative example figures for previewing the dashboard layout and do not represent real completed student records.
        </div>
      )}

      {/* Key Metrics */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Experiments Explored</span>
            <FlaskConical className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-2">
            {displayedCompleted} / {EXPERIMENTS.length}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {demoMode ? 'Example demonstration count' : `${realTrialCount} total saved trials`}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Knowledge Points</span>
            <Award className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-2">
            {displayedPoints} pts
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {demoMode ? 'Example points' : 'Earned from unlocked achievements'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Learning Streak</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-2">
            {displayedStreak > 0 ? `${displayedStreak} day${displayedStreak > 1 ? 's' : ''}` : 'Not started'}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {displayedStreak > 0 ? 'Active daily inquiry streak' : 'Run a trial or save a report to begin'}
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600">
            <span>Lab Mastery Progress</span>
            <BookOpen className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-2">
            {progressPercent}%
          </div>
          <div className="w-full h-2 rounded-full bg-slate-100 mt-2 overflow-hidden">
            <div
              className="h-full bg-emerald-600 transition-all"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Recommended Next Activity */}
      <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="space-y-1.5">
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5" />
            Recommended Next Activity
          </div>
          <h2 className="text-lg font-display font-bold text-slate-900">
            Experiment #{nextRecommended.number}: {nextRecommended.title}
          </h2>
          <p className="text-sm text-slate-600 max-w-2xl">
            {nextRecommended.learningObjective}
          </p>
        </div>
        <button
          type="button"
          onClick={() => navigate('virtual-lab', { experimentId: nextRecommended.id })}
          className="px-5 py-3 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 flex items-center gap-2 shrink-0 shadow-sm"
        >
          Open Experiment <ArrowRight className="w-4 h-4" />
        </button>
      </div>

      {/* Recent Experiments & Saved Items */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">Recent &amp; Saved Experiments</h3>
          {realCompletedExps.length === 0 && customExperiments.length === 0 && !demoMode ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-2">
              <p className="text-sm font-medium text-slate-900">No recorded experiments yet.</p>
              <p className="text-xs text-slate-600">
                Run a trial in the Virtual Lab or design a custom experiment in Experiment Creator.
              </p>
              <button
                type="button"
                onClick={() => navigate('virtual-lab')}
                className="mt-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-blue-700 hover:border-blue-400"
              >
                Go to Virtual Lab
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {(demoMode ? ['boiling-point', 'pendulum-period', 'reaction-rate'] : realCompletedExps).map(
                (expId) => {
                  const exp = EXPERIMENTS.find((e) => e.id === expId);
                  if (!exp) return null;
                  const count = trialsByExperiment[expId]?.length ?? 0;
                  return (
                    <div
                      key={exp.id}
                      className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between gap-3"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-900">{exp.title}</div>
                        <div className="text-xs text-slate-600">
                          {demoMode ? 'Example trial history' : `${count} saved trial${count === 1 ? '' : 's'}`}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => navigate('virtual-lab', { experimentId: exp.id })}
                        className="text-xs font-semibold text-blue-700 hover:underline"
                      >
                        Reopen →
                      </button>
                    </div>
                  );
                }
              )}
              {customExperiments.map((ce) => (
                <div
                  key={ce.id}
                  className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex items-center justify-between gap-3"
                >
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{ce.title}</div>
                    <div className="text-xs text-slate-600">Custom Experiment · {ce.subject}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setCreatorSelectedCustomId(ce.id);
                      navigate('creator');
                    }}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Open →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
          <h3 className="text-base font-semibold text-slate-900">My Innovations &amp; Saved Reports</h3>
          {myInnovations.length === 0 && savedReports.length === 0 && recentSavedDiscoveries.length === 0 ? (
            <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-2">
              <p className="text-sm font-medium text-slate-900">No saved innovations, reports, or bookmarked discoveries yet.</p>
              <p className="text-xs text-slate-600">
                Start creating an invention in Global Innovation Hub or export a report from Virtual Lab.
              </p>
              <button
                type="button"
                onClick={() => navigate('innovation-hub')}
                className="mt-2 px-4 py-2 rounded-lg bg-white border border-slate-200 text-xs font-semibold text-blue-700 hover:border-blue-400 inline-flex items-center gap-1.5"
              >
                <Lightbulb className="w-3.5 h-3.5" /> Start Innovation Idea
              </button>
            </div>
          ) : (
            <div className="space-y-2.5">
              {myInnovations.slice(0, 3).map((inn) => (
                <div key={inn.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{inn.title}</div>
                    <div className="text-xs text-slate-600">Innovation · {inn.status.replace('_', ' ')}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('innovation-hub')}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Manage →
                  </button>
                </div>
              ))}
              {savedReports.slice(0, 3).map((rep) => (
                <div key={rep.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3.5 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-semibold text-slate-900">{rep.experimentTitle}</div>
                    <div className="text-xs text-slate-600">Saved Report · {rep.latestResultSummary}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('my-learning')}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    View →
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
