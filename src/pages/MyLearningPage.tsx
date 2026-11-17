import React, { useState } from 'react';
import {
  Award,
  Bookmark,
  BookmarkCheck,
  BookOpen,
  Check,
  Copy,
  Cpu,
  Edit3,
  ExternalLink,
  FileText,
  Film,
  Flame,
  FlaskConical,
  Lightbulb,
  Trash2,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { EXPERIMENTS } from '../engine/experiments';
import { WORLD_DISCOVERIES } from '../data/discoveries';
import { Modal } from '../components/ui/Modal';

export function MyLearningPage() {
  const {
    trialsByExperiment,
    savedReports,
    savedLabDesigns,
    renameLabDesign,
    duplicateLabDesign,
    deleteLabDesign,
    setWorkbenchHandoff,
    savedDiscoveryIds,
    savedVideos,
    toggleSaveVideo,
    myInnovations,
    smartLessonHistory,
    smartQuizAttempts,
    toggleSaveSmartLesson,
    deleteSmartLesson,
    setReopenSmartLessonId,
    streakDays,
    achievements,
    knowledgePoints,
    navigate,
    t,
  } = useLab();

  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);

  const allTrials = Object.values(trialsByExperiment).flat();
  const completedExpIds = Object.entries(trialsByExperiment)
    .filter(([, arr]) => arr.length > 0)
    .map(([id]) => id);
  const savedDiscoveries = WORLD_DISCOVERIES.filter((d) => savedDiscoveryIds.includes(d.id));
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const deleteTarget = savedLabDesigns.find((d) => d.id === deleteTargetId) ?? null;

  return (
    <div className="space-y-8 pb-16">
      <div>
        <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
          <BookOpen className="w-4 h-4" />
          Personal Learning Record · Offline-Ready Local Storage
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
          My Learning
        </h1>
        <p className="text-sm text-slate-600 mt-1">
          Review your saved Virtual Lab workbench designs, experiment trials, lab reports, bookmarked discoveries, and innovation drafts.
        </p>
      </div>

      {/* Summary Strip */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-600 flex items-center justify-between">
            <span>Completed Concepts</span>
            <FlaskConical className="w-4 h-4 text-blue-700" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-1">
            {completedExpIds.length} / {EXPERIMENTS.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-600 flex items-center justify-between">
            <span>Total Recorded Trials</span>
            <FileText className="w-4 h-4 text-teal-600" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-1">
            {allTrials.length}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-600 flex items-center justify-between">
            <span>Learning Streak</span>
            <Flame className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-1">
            {streakDays > 0 ? `${streakDays} day${streakDays > 1 ? 's' : ''}` : 'Not started'}
          </div>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs text-slate-600 flex items-center justify-between">
            <span>Achievements &amp; Points</span>
            <Award className="w-4 h-4 text-emerald-700" />
          </div>
          <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-1">
            {unlockedCount}/{achievements.length} ({knowledgePoints} pts)
          </div>
        </div>
      </div>

      {/* Saved Virtual Lab Designs */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-blue-700" />
            Saved Virtual Lab Designs ({savedLabDesigns.length})
          </h2>
          <button
            type="button"
            onClick={() => navigate('virtual-lab')}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Build in Lab Room →
          </button>
        </div>

        {savedLabDesigns.length === 0 ? (
          <p className="text-sm text-slate-600">
            No workbench designs saved yet. Assemble instruments on the Virtual Lab workbench and click &ldquo;Save Lab Design&rdquo; to reopen, rename, or duplicate setups anytime.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {savedLabDesigns.map((design) => (
              <div
                key={design.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] text-blue-700 font-semibold uppercase tracking-wide">
                      {design.department} lab · {design.workbenchItems.length} instruments ·{' '}
                      {design.chemicalItems && design.chemicalItems.length > 0
                        ? `${design.chemicalItems.length} substances · `
                        : ''}
                      {design.connections.length} links
                    </div>
                    {renamingId === design.id ? (
                      <div className="flex items-center gap-1.5 mt-1">
                        <input
                          type="text"
                          value={renameText}
                          onChange={(e) => setRenameText(e.target.value)}
                          className="flex-1 px-2.5 py-1 rounded bg-white border border-blue-400 text-xs text-slate-900"
                        />
                        <button
                          type="button"
                          onClick={() => {
                            renameLabDesign(design.id, renameText);
                            setRenamingId(null);
                          }}
                          className="p-1.5 rounded bg-emerald-700 text-white"
                          aria-label="Confirm rename"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                        {design.title}
                      </div>
                    )}
                    <div className="text-[11px] text-slate-500 mt-0.5">
                      Updated {new Date(design.updatedAt).toLocaleString()}
                    </div>
                  </div>
                </div>

                {design.notes && (
                  <p className="text-xs text-slate-600 line-clamp-2">{design.notes}</p>
                )}

                <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-200 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setWorkbenchHandoff({
                        savedDesignId: design.id,
                        enterRoomDirectly: true,
                      });
                      navigate('virtual-lab', { experimentId: design.experimentId });
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold"
                  >
                    Reopen in Lab Room
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRenamingId(design.id);
                      setRenameText(design.title);
                    }}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 inline-flex items-center gap-1"
                  >
                    <Edit3 className="w-3 h-3" />
                    Rename
                  </button>
                  <button
                    type="button"
                    onClick={() => duplicateLabDesign(design.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-slate-200 bg-white text-slate-800 inline-flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" />
                    Duplicate
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleteTargetId(design.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" />
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTargetId(null)}
        title="Delete Saved Lab Design?"
      >
        {deleteTarget && (
          <div className="space-y-4 text-sm">
            <p className="text-slate-600">
              Are you sure you want to permanently remove{' '}
              <strong className="text-slate-900">&ldquo;{deleteTarget.title}&rdquo;</strong>?
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeleteTargetId(null)}
                className="px-4 py-2 rounded-lg border border-slate-200 text-xs text-slate-600"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  deleteLabDesign(deleteTarget.id);
                  setDeleteTargetId(null);
                }}
                className="px-4 py-2 rounded-lg bg-rose-700 text-white text-xs font-bold"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Trial History */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Experiment &amp; Trial History</h2>
        {allTrials.length === 0 ? (
          <div className="rounded-lg border border-dashed border-slate-300 bg-slate-50 p-6 text-center space-y-2">
            <p className="text-sm text-slate-800">{t.emptyStates.noTrials}</p>
            <button
              type="button"
              onClick={() => navigate('virtual-lab')}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold"
            >
              Launch Virtual Lab
            </button>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 text-sm">
            {allTrials
              .slice()
              .reverse()
              .map((tr) => {
                const exp = EXPERIMENTS.find((e) => e.id === tr.experimentId);
                return (
                  <div key={tr.id} className="py-3 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <div className="font-medium text-slate-900">
                        {exp?.shortTitle ?? tr.experimentId} · {tr.name}
                      </div>
                      <div className="text-xs text-slate-600 font-mono tabular-nums">
                        Result: {tr.primaryOutput.symbol} = {tr.primaryOutput.value} {tr.primaryOutput.unit} ·{' '}
                        {new Date(tr.timestamp).toLocaleString()}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => navigate('virtual-lab', { experimentId: tr.experimentId })}
                      className="text-xs font-semibold text-blue-700 hover:underline"
                    >
                      Reopen Experiment →
                    </button>
                  </div>
                );
              })}
          </div>
        )}
      </section>

      {/* Saved Reports */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <h2 className="text-base font-semibold text-slate-900">Saved Lab Reports ({savedReports.length})</h2>
        {savedReports.length === 0 ? (
          <p className="text-sm text-slate-600">{t.emptyStates.noReports}</p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {savedReports.map((rep) => (
              <div key={rep.id} className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1.5">
                <div className="text-xs text-blue-700 font-medium">
                  {new Date(rep.createdAt).toLocaleDateString()} · {rep.trialsCount} trials
                </div>
                <div className="text-sm font-semibold text-slate-900">{rep.experimentTitle}</div>
                <div className="text-xs font-mono text-slate-800">{rep.latestResultSummary}</div>
                <p className="text-xs text-slate-600">{rep.analysisNotes}</p>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Saved Discoveries & Innovation Drafts */}
      <div className="grid lg:grid-cols-2 gap-6">
        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900">
            Saved Discoveries ({savedDiscoveries.length})
          </h2>
          {savedDiscoveries.length === 0 ? (
            <p className="text-sm text-slate-600">
              No saved discoveries yet. Bookmark discoveries in World Discoveries to keep them for offline study.
            </p>
          ) : (
            <div className="space-y-2">
              {savedDiscoveries.map((d) => (
                <div key={d.id} className="rounded-lg bg-slate-50 p-3 border border-slate-200">
                  <div className="text-xs text-blue-700 font-medium">{d.category} · {d.institution}</div>
                  <div className="text-sm font-medium text-slate-900">{d.title}</div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Lightbulb className="w-4 h-4 text-teal-600" />
            Innovation Drafts &amp; Submissions ({myInnovations.length})
          </h2>
          {myInnovations.length === 0 ? (
            <p className="text-sm text-slate-600">{t.emptyStates.noInnovations}</p>
          ) : (
            <div className="space-y-2">
              {myInnovations.map((inn) => (
                <div key={inn.id} className="rounded-lg bg-slate-50 p-3 border border-slate-200 flex justify-between items-center">
                  <div>
                    <div className="text-sm font-medium text-slate-900">{inn.title}</div>
                    <div className="text-xs text-slate-600">{inn.status.replace('_', ' ')}</div>
                  </div>
                  <button
                    type="button"
                    onClick={() => navigate('innovation-hub')}
                    className="text-xs font-semibold text-blue-700 hover:underline"
                  >
                    Open →
                  </button>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* Saved Science Videos */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Film className="w-4 h-4 text-blue-700" />
            Saved Science Videos ({savedVideos.length})
          </h2>
          <button
            type="button"
            onClick={() => navigate('explorer')}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Find More in Science Explorer →
          </button>
        </div>
        {savedVideos.length === 0 ? (
          <p className="text-sm text-slate-600">
            No saved videos yet. Save educational demonstrations in the Universal Science Explorer to keep quick links here.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {savedVideos.map((vid) => (
              <div
                key={vid.id}
                className="rounded-lg bg-slate-50 p-3 border border-slate-200 flex items-start gap-3"
              >
                <img
                  src={vid.thumbnailUrl}
                  alt={vid.title}
                  className="w-24 h-16 object-cover rounded shrink-0 bg-slate-900"
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="text-[11px] text-blue-700 font-medium">
                    {vid.provider} · {vid.creator}
                  </div>
                  <div className="text-sm font-medium text-slate-900 truncate">{vid.title}</div>
                  <div className="flex flex-wrap items-center gap-3 pt-1">
                    <a
                      href={vid.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-blue-700 hover:underline inline-flex items-center gap-1"
                    >
                      Open Video <ExternalLink className="w-3 h-3" />
                    </a>
                    <button
                      type="button"
                      onClick={() => toggleSaveVideo(vid)}
                      className="text-xs text-slate-500 hover:text-rose-600 inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Saved Smart Video Lessons & Quiz Attempts */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
            <Film className="w-4 h-4 text-emerald-700" />
            Smart Video Lessons &amp; Mastery Quizzes ({smartLessonHistory.length})
          </h2>
          <button
            type="button"
            onClick={() => navigate('smart-learning')}
            className="text-xs font-semibold text-blue-700 hover:underline"
          >
            Open Smart Video Studio →
          </button>
        </div>

        {smartLessonHistory.length === 0 ? (
          <p className="text-sm text-slate-600">
            No Smart Video Lessons generated yet. Open Smart Video Studio to watch animated Canvas lessons, take 5-question quizzes, or render MP4 videos.
          </p>
        ) : (
          <div className="grid md:grid-cols-2 gap-4">
            {smartLessonHistory.map((item) => (
              <div
                key={item.id}
                className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <div className="text-[11px] font-semibold uppercase text-blue-700">
                      {item.lesson.subject} · {item.lesson.language.toUpperCase()}
                      {item.bestQuizScore !== undefined ? ` · Best Quiz: ${item.bestQuizScore}/5` : ''}
                      {item.renderedMp4Url ? ' · MP4 Ready' : ''}
                    </div>
                    <div className="text-sm font-bold text-slate-900 truncate mt-0.5">
                      {item.lesson.topicTitle}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Viewed {new Date(item.lastViewedAt).toLocaleString()}
                    </div>
                  </div>
                  <button
                    type="button"
                    aria-label={item.saved ? 'Remove bookmark' : 'Bookmark lesson'}
                    onClick={() => toggleSaveSmartLesson(item.id)}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-emerald-700"
                  >
                    {item.saved ? (
                      <BookmarkCheck className="w-4 h-4 text-emerald-700" />
                    ) : (
                      <Bookmark className="w-4 h-4" />
                    )}
                  </button>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setReopenSmartLessonId(item.id);
                      navigate('smart-learning');
                    }}
                    className="px-3 py-1.5 rounded-lg bg-blue-700 text-white font-semibold"
                  >
                    Reopen Lesson &amp; Video
                  </button>
                  {item.renderedMp4Url && (
                    <a
                      href={`${item.renderedMp4Url}?download=1`}
                      download
                      className="px-2.5 py-1.5 rounded-lg border border-emerald-300 bg-emerald-50 text-emerald-800 font-semibold"
                    >
                      Download MP4
                    </a>
                  )}
                  <button
                    type="button"
                    onClick={() => deleteSmartLesson(item.id)}
                    className="px-2.5 py-1.5 rounded-lg border border-rose-200 bg-rose-50 text-rose-700 inline-flex items-center gap-1"
                  >
                    <Trash2 className="w-3 h-3" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {smartQuizAttempts.length > 0 && (
          <div className="pt-3 border-t border-slate-200 space-y-2">
            <div className="text-xs font-semibold text-slate-900">
              Recent Quiz Attempts ({smartQuizAttempts.length})
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-2 text-xs">
              {smartQuizAttempts.slice(0, 6).map((qa) => (
                <div key={qa.id} className="rounded-lg bg-slate-50 border border-slate-200 p-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <div className="font-semibold text-slate-900 truncate">{qa.topicTitle}</div>
                    <div className="text-[11px] text-slate-500">{qa.subject}</div>
                  </div>
                  <span className="font-mono font-bold text-emerald-700 shrink-0">
                    {qa.score}/{qa.total}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
