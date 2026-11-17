import React, { useState } from 'react';
import { CheckCircle2, FlaskConical, PenTool, Trophy } from 'lucide-react';
import { INNOVATION_CHALLENGES } from '../data/challenges';
import { useLab } from '../context/LabContext';
import { containsPersonalInfo, evaluateSafety, sanitizePublicText } from '../engine/safetyEngine';
import type { ChallengeItem } from '../types/science';
import { Modal } from '../components/ui/Modal';
import { DrawingCanvas } from '../components/ui/DrawingCanvas';

export function ChallengesPage() {
  const { navigate, saveInnovation, recordSafetyCheck } = useLab();
  const [activeChallenge, setActiveChallenge] = useState<ChallengeItem | null>(null);
  const [title, setTitle] = useState('');
  const [alias, setAlias] = useState('ChallengeSolver_01');
  const [principle, setPrinciple] = useState('');
  const [notes, setNotes] = useState('');
  const [drawingUrl, setDrawingUrl] = useState('');
  const [submitAction, setSubmitAction] = useState<'draft' | 'pending_approval'>('draft');
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleOpenChallenge = (ch: ChallengeItem) => {
    setActiveChallenge(ch);
    setTitle(`${ch.title} Prototype`);
    setPrinciple(ch.scientificFocus.join(', '));
    setNotes('');
    setDrawingUrl('');
    setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeChallenge) return;
    setError(null);

    const combined = `${title} ${principle} ${notes}`;
    if (containsPersonalInfo(combined) || containsPersonalInfo(alias)) {
      setError('Remove personal contact information or school location; use an anonymous alias.');
      return;
    }

    const safety = evaluateSafety(combined);
    recordSafetyCheck(title, safety.level);
    if (safety.level === 'RED') {
      setError(`Blocked by Safety Guardian: ${safety.summary}`);
      return;
    }

    const now = new Date().toISOString();
    saveInnovation({
      id: `chal-sub-${Date.now()}`,
      title: sanitizePublicText(title.trim()),
      category: activeChallenge.theme,
      anonymousAlias: alias.trim() || 'ChallengeExplorer',
      problemSolved: `Response to challenge: ${activeChallenge.title}`,
      scientificPrinciple: sanitizePublicText(principle.trim()),
      materialsAndDesign: 'Virtual prototype sketch & conceptual design',
      virtualPrototypeNotes: sanitizePublicText(notes.trim()),
      challengeId: activeChallenge.id,
      drawingDataUrl: drawingUrl || undefined,
      status: submitAction,
      safetyLevel: safety.level,
      createdAt: now,
      updatedAt: now,
    });

    setActiveChallenge(null);
    setSuccessMsg(
      submitAction === 'pending_approval'
        ? 'Challenge prototype submitted for Teacher Approval in Global Innovation Hub!'
        : 'Challenge prototype saved privately in My Ideas.'
    );
  };

  return (
    <div className="space-y-8 pb-16">
      <div>
        <div className="text-xs font-semibold text-amber-700 flex items-center gap-1.5">
          <Trophy className="w-4 h-4" />
          10 Global Sustainability &amp; Engineering Themes
        </div>
        <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
          Innovation Challenges
        </h1>
        <p className="text-sm text-slate-600 mt-1 max-w-3xl">
          Apply scientific laws to real-world problems. Test relevant models in Virtual Lab, sketch your design, and submit a virtual prototype.
        </p>
      </div>

      {successMsg && (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800 flex items-center justify-between gap-3">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4" />
            {successMsg}
          </span>
          <button
            type="button"
            onClick={() => navigate('innovation-hub')}
            className="text-xs font-semibold underline"
          >
            View in Innovation Hub →
          </button>
        </div>
      )}

      <div className="grid md:grid-cols-2 gap-6">
        {INNOVATION_CHALLENGES.map((ch) => (
          <div
            key={ch.id}
            className="rounded-xl border border-slate-200 bg-white p-5 flex flex-col justify-between space-y-4 shadow-sm"
          >
            <div className="space-y-2">
              <div className="text-xs text-blue-700 font-medium">
                {ch.theme} · Safety: {ch.safetyLevel}
              </div>
              <h2 className="text-lg font-display font-bold text-slate-900">{ch.title}</h2>
              <p className="text-sm text-slate-600 leading-relaxed">{ch.summary}</p>
              <div className="text-xs text-slate-700">
                <strong className="text-slate-900">Scientific Focus:</strong> {ch.scientificFocus.join(' · ')}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleOpenChallenge(ch)}
                className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800 flex items-center gap-1.5"
              >
                <PenTool className="w-3.5 h-3.5" />
                Draw &amp; Submit Prototype
              </button>
              <button
                type="button"
                onClick={() => navigate('virtual-lab', { experimentId: ch.suggestedExperimentId })}
                className="px-3.5 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-medium text-slate-800 hover:border-blue-400 flex items-center gap-1.5"
              >
                <FlaskConical className="w-3.5 h-3.5 text-blue-700" />
                Test Related Lab Model
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Prototype Sketch & Submission Modal */}
      <Modal
        open={Boolean(activeChallenge)}
        onClose={() => setActiveChallenge(null)}
        title={activeChallenge ? `Prototype Builder: ${activeChallenge.title}` : 'Prototype Builder'}
        maxWidthClass="max-w-2xl"
      >
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-xs text-rose-800">
              {error}
            </div>
          )}

          <div className="grid sm:grid-cols-2 gap-3 text-sm">
            <div>
              <label className="text-xs text-slate-600 block mb-1">Prototype Title *</label>
              <input
                required
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
            <div>
              <label className="text-xs text-slate-600 block mb-1">Anonymous Alias</label>
              <input
                required
                type="text"
                value={alias}
                onChange={(e) => setAlias(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-slate-900"
              />
            </div>
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Scientific Principle Applied *</label>
            <input
              required
              type="text"
              value={principle}
              onChange={(e) => setPrinciple(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Virtual Prototype Description *</label>
            <textarea
              required
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Explain how your design works and what Virtual Lab values support it..."
              className="w-full px-3 py-2 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
            />
          </div>

          <div>
            <label className="text-xs text-slate-600 block mb-1">Sketch Your Prototype Diagram</label>
            <DrawingCanvas value={drawingUrl} onChange={setDrawingUrl} />
          </div>

          <div className="flex flex-wrap justify-end gap-2 pt-2">
            <button
              type="submit"
              onClick={() => setSubmitAction('draft')}
              className="px-4 py-2 rounded-lg border border-slate-200 bg-slate-50 text-xs font-semibold text-slate-800"
            >
              Save Privately
            </button>
            <button
              type="submit"
              onClick={() => setSubmitAction('pending_approval')}
              className="px-4 py-2 rounded-lg bg-blue-700 text-white text-xs font-semibold hover:bg-blue-800"
            >
              Submit for Teacher Approval
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
