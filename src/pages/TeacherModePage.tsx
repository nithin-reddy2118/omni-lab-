import React, { useState } from 'react';
import {
  CheckCircle2,
  ClipboardList,
  FileText,
  GraduationCap,
  Lock,
  Plus,
  ShieldAlert,
  Users,
} from 'lucide-react';
import { useLab } from '../context/LabContext';
import { EXPERIMENTS } from '../engine/experiments';
import { getSafetyBadgeMeta } from '../engine/safetyEngine';

type TeacherTab =
  | 'dashboard'
  | 'assignments'
  | 'reports'
  | 'safety'
  | 'approvals'
  | 'progress';

export function TeacherModePage() {
  const {
    role,
    setRole,
    myInnovations,
    reviewInnovation,
    savedReports,
    recentSafetyLogs,
    teacherAssignments,
    addTeacherAssignment,
    trialsByExperiment,
    navigate,
  } = useLab();

  const [activeTab, setActiveTab] = useState<TeacherTab>('dashboard');
  const [passcode, setPasscode] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const [assignTitle, setAssignTitle] = useState('');
  const [assignExpId, setAssignExpId] = useState(EXPERIMENTS[0].id);
  const [assignDueDate, setAssignDueDate] = useState('2026-12-10');
  const [assignGroup, setAssignGroup] = useState('Grade 9–10 Science');
  const [assignInstructions, setAssignInstructions] = useState('');

  const [feedbackMap, setFeedbackMap] = useState<Record<string, string>>({});

  const pendingApprovals = myInnovations.filter((i) => i.status === 'pending_approval');
  const allTrials = Object.values(trialsByExperiment).flat();
  const completedExps = Object.values(trialsByExperiment).filter((a) => a.length > 0).length;

  const handleUnlockTeacher = (e: React.FormEvent) => {
    e.preventDefault();
    if (passcode.trim().toUpperCase() === 'TEACHER2026') {
      setRole('teacher');
      setAuthError(null);
      setPasscode('');
    } else {
      setAuthError('Invalid educator demo passcode. Enter TEACHER2026 to test local Teacher Mode.');
    }
  };

  if (role !== 'teacher') {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-5 shadow-sm">
          <div className="flex items-center gap-3">
            <Lock className="w-6 h-6 text-amber-600" />
            <div>
              <h1 className="text-xl font-display font-bold text-slate-900">
                Teacher Mode — Role-Based Access
              </h1>
              <p className="text-xs text-slate-600">
                Students do not automatically hold teacher approval or moderation permissions.
              </p>
            </div>
          </div>

          <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-relaxed">
            <strong>Backend Permission Status:</strong> Cloud authentication and multi-user server role enforcement are not configured in this local-storage workspace. Teacher Mode below enforces client-side role separation for local demonstration and classroom preview.
          </div>

          <form onSubmit={handleUnlockTeacher} className="space-y-3">
            <label htmlFor="teacher-code" className="text-xs font-semibold text-slate-900 block">
              Enter Educator Passcode (Demo Passcode: <code className="font-mono text-blue-700">TEACHER2026</code>)
            </label>
            <input
              id="teacher-code"
              type="password"
              value={passcode}
              onChange={(e) => setPasscode(e.target.value)}
              placeholder="Enter TEACHER2026"
              className="w-full px-4 py-2.5 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
            />
            {authError && <p className="text-xs text-rose-700">{authError}</p>}
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
            >
              Switch to Teacher Role
            </button>
          </form>
        </div>
      </div>
    );
  }

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignTitle.trim()) return;
    addTeacherAssignment({
      id: `assign-${Date.now()}`,
      title: assignTitle.trim(),
      experimentId: assignExpId,
      dueDate: assignDueDate,
      assignedGroup: assignGroup.trim() || 'Science Cohort',
      instructions: assignInstructions.trim() || 'Run trials and export a PDF lab report.',
      createdAt: new Date().toISOString(),
    });
    setAssignTitle('');
    setAssignInstructions('');
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <GraduationCap className="w-4 h-4" />
            Educator Console · Local Role-Based Access
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
            Teacher Mode
          </h1>
          <p className="text-xs text-amber-800 mt-1">
            Note: Operating in local browser role mode (remote multi-device teacher/student database permissions require a connected backend).
          </p>
        </div>
        <button
          type="button"
          onClick={() => setRole('student')}
          className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-xs font-semibold text-slate-800 hover:border-blue-400"
        >
          Return to Student Role
        </button>
      </div>

      {/* Tabs */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-3">
        {(
          [
            { id: 'dashboard', label: 'Teacher Dashboard' },
            { id: 'assignments', label: `Assignments (${teacherAssignments.length})` },
            { id: 'reports', label: `Report Review (${savedReports.length})` },
            { id: 'safety', label: `Safety Review (${recentSafetyLogs.length})` },
            { id: 'approvals', label: `Innovation Approval (${pendingApprovals.length})` },
            { id: 'progress', label: 'Student Progress' },
          ] as { id: TeacherTab; label: string }[]
        ).map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            className={`px-3.5 py-2 rounded-lg text-xs font-medium transition-colors ${
              activeTab === tab.id
                ? 'bg-blue-700 text-white font-semibold'
                : 'bg-white text-slate-600 border border-slate-200 hover:text-slate-900'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'dashboard' && (
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Active Assignments</span>
              <ClipboardList className="w-4 h-4 text-blue-700" />
            </div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-2">
              {teacherAssignments.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Pending Showcase Approvals</span>
              <CheckCircle2 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-2">
              {pendingApprovals.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Student Reports Saved</span>
              <FileText className="w-4 h-4 text-emerald-700" />
            </div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-2">
              {savedReports.length}
            </div>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div className="text-xs text-slate-600 flex items-center justify-between">
              <span>Safety Checks Logged</span>
              <ShieldAlert className="w-4 h-4 text-rose-700" />
            </div>
            <div className="text-2xl font-mono font-bold tabular-nums text-slate-900 mt-2">
              {recentSafetyLogs.length}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'assignments' && (
        <div className="grid lg:grid-cols-12 gap-6">
          <form onSubmit={handleCreateAssignment} className="lg:col-span-5 rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
            <h2 className="text-base font-semibold text-slate-900 flex items-center gap-2">
              <Plus className="w-4 h-4 text-blue-700" />
              Assign Virtual Experiment
            </h2>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Assignment Title *</label>
              <input
                required
                type="text"
                value={assignTitle}
                onChange={(e) => setAssignTitle(e.target.value)}
                placeholder="e.g. Inverse-Square Optical Investigation"
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Experiment Module</label>
              <select
                value={assignExpId}
                onChange={(e) => setAssignExpId(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
              >
                {EXPERIMENTS.map((e) => (
                  <option key={e.id} value={e.id}>
                    #{e.number} · {e.title}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-600 block mb-1">Class / Cohort</label>
                <input
                  type="text"
                  value={assignGroup}
                  onChange={(e) => setAssignGroup(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
                />
              </div>
              <div>
                <label className="text-xs text-slate-600 block mb-1">Due Date</label>
                <input
                  type="date"
                  value={assignDueDate}
                  onChange={(e) => setAssignDueDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Instructions</label>
              <textarea
                rows={3}
                value={assignInstructions}
                onChange={(e) => setAssignInstructions(e.target.value)}
                placeholder="Specify trial counts, graph checks, and report requirements..."
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
              />
            </div>
            <button
              type="submit"
              className="w-full py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800"
            >
              Publish Assignment
            </button>
          </form>

          <div className="lg:col-span-7 space-y-3">
            {teacherAssignments.map((a) => (
              <div key={a.id} className="rounded-xl border border-slate-200 bg-white p-4 space-y-2 shadow-sm">
                <div className="flex items-center justify-between text-xs text-blue-700 font-medium">
                  <span>{a.assignedGroup}</span>
                  <span>Due: {a.dueDate}</span>
                </div>
                <div className="text-base font-semibold text-slate-900">{a.title}</div>
                <p className="text-xs text-slate-600">{a.instructions}</p>
                <button
                  type="button"
                  onClick={() => navigate('virtual-lab', { experimentId: a.experimentId })}
                  className="text-xs font-semibold text-blue-700 hover:underline"
                >
                  Inspect Linked Experiment →
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {activeTab === 'reports' && (
        <div className="space-y-3">
          {savedReports.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              No student lab reports submitted in this workspace yet.
            </div>
          ) : (
            savedReports.map((rep) => (
              <div key={rep.id} className="rounded-xl border border-slate-200 bg-white p-5 space-y-2 shadow-sm">
                <div className="flex justify-between text-xs text-slate-500">
                  <span>{rep.experimentTitle}</span>
                  <span>{new Date(rep.createdAt).toLocaleString()}</span>
                </div>
                <div className="text-sm font-mono font-semibold text-blue-700">{rep.latestResultSummary}</div>
                <p className="text-xs text-slate-700">{rep.analysisNotes}</p>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'safety' && (
        <div className="space-y-3">
          {recentSafetyLogs.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              No safety events logged yet.
            </div>
          ) : (
            recentSafetyLogs.map((log) => {
              const meta = getSafetyBadgeMeta(log.level);
              return (
                <div key={log.id} className="rounded-xl border border-slate-200 bg-white p-4 flex items-center justify-between gap-3 shadow-sm">
                  <div>
                    <div className="text-sm text-slate-900">{log.input}</div>
                    <div className="text-xs text-slate-500">{new Date(log.timestamp).toLocaleString()}</div>
                  </div>
                  <span className={`text-xs font-mono font-semibold ${meta.colorClass}`}>{meta.label}</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {activeTab === 'approvals' && (
        <div className="space-y-4">
          {pendingApprovals.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-300 bg-white p-8 text-center text-sm text-slate-600">
              No student innovations waiting in the approval queue right now.
            </div>
          ) : (
            pendingApprovals.map((item) => (
              <div key={item.id} className="rounded-xl border border-amber-200 bg-white p-5 space-y-4 shadow-sm">
                <div className="flex flex-wrap justify-between gap-2 text-xs text-slate-500">
                  <span>{item.category} · Anonymous Alias: {item.anonymousAlias}</span>
                  <span>Safety: {item.safetyLevel}</span>
                </div>
                <h3 className="text-lg font-semibold text-slate-900">{item.title}</h3>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900">Problem:</strong> {item.problemSolved}
                </p>
                <p className="text-xs text-slate-600">
                  <strong className="text-slate-900">Scientific Principle:</strong> {item.scientificPrinciple}
                </p>
                {item.drawingDataUrl && (
                  <img
                    src={item.drawingDataUrl}
                    alt="Student prototype sketch"
                    className="max-h-48 rounded-lg border border-slate-200"
                  />
                )}
                <input
                  type="text"
                  value={feedbackMap[item.id] ?? ''}
                  onChange={(e) => setFeedbackMap((prev) => ({ ...prev, [item.id]: e.target.value }))}
                  placeholder="Optional teacher review comment..."
                  className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-900"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => reviewInnovation(item.id, 'approved', feedbackMap[item.id] ?? '')}
                    className="px-4 py-2 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800"
                  >
                    Approve for Public Showcase
                  </button>
                  <button
                    type="button"
                    onClick={() => reviewInnovation(item.id, 'needs_revision', feedbackMap[item.id] ?? '')}
                    className="px-4 py-2 rounded-lg bg-amber-500 text-white text-xs font-semibold hover:bg-amber-600"
                  >
                    Request Revision (Keep Private)
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === 'progress' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex items-center gap-2 text-base font-semibold text-slate-900">
            <Users className="w-5 h-5 text-blue-700" />
            Active Workspace Progress Summary
          </div>
          <p className="text-sm text-slate-600">
            Experiments with recorded trials: <strong className="text-slate-900 font-mono">{completedExps} / {EXPERIMENTS.length}</strong> · Total saved trials: <strong className="text-slate-900 font-mono">{allTrials.length}</strong>
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-3">
            {EXPERIMENTS.map((exp) => {
              const count = trialsByExperiment[exp.id]?.length ?? 0;
              return (
                <div key={exp.id} className="rounded-lg border border-slate-200 bg-slate-50 p-3">
                  <div className="text-xs text-slate-600 truncate">{exp.shortTitle}</div>
                  <div className="text-lg font-mono font-bold tabular-nums text-slate-900 mt-1">
                    {count} trials
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
