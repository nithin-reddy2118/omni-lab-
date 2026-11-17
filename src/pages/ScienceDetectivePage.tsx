import React, { useMemo, useRef, useState } from 'react';
import { HelpCircle, Loader2, MessageSquare, RotateCcw, Send, ShieldAlert } from 'lucide-react';
import { useLab } from '../context/LabContext';
import { EXPERIMENTS, getDefaultParams, getExperimentById } from '../engine/experiments';
import type { SafetyEvaluation } from '../types/science';

interface DetectiveReply {
  observation: string;
  misconceptionCheck: string;
  everydayExample: string;
  hint: string;
  guidingQuestion: string;
  suggestedNextTrial: string;
}

function buildLocalDetectiveReply(
  question: string,
  experiment: ReturnType<typeof getExperimentById>,
  latestOutput?: { value: number; unit: string; label: string }
): DetectiveReply {
  const qLower = question.toLowerCase();
  const valNote = latestOutput
    ? `${latestOutput.label} = ${latestOutput.value} ${latestOutput.unit}`
    : `Formula: ${experiment.formula}`;

  const everyday =
    experiment.id === 'pendulum-period'
      ? 'Think of a tall playground swing vs a short swing: longer chains take more time to complete one full swing, while the rider’s weight hardly changes the period.'
      : experiment.id === 'boiling-point'
        ? 'Think of climbing a high mountain where air pushes down less on a pot of water—bubbles need lower vapour pressure to escape, so water boils cooler.'
        : experiment.id === 'voltage-current'
          ? 'Imagine water flowing through a pipe: voltage is the pump pressure pushing charge, and resistance is how narrow the pipe is.'
          : experiment.id === 'acid-ph'
            ? 'Every step of 1 on the pH scale represents a 10× jump in hydrogen ion concentration, like diluting cordial juice tenfold at each step.'
            : `Consider how ${experiment.independentVariable} acts as the driving input while ${experiment.dependentVariable} responds under fixed controlled conditions.`;

  const misconception =
    qLower.includes('mass') || qLower.includes('heavier')
      ? 'A common misconception is that heavier objects always swing faster; in an ideal simple pendulum, gravitational force and inertia scale together so mass cancels out of T = 2π√(L/g).'
      : qLower.includes('nonlinear') || qLower.includes('double') || qLower.includes('10')
        ? `Check the mathematical exponent or logarithm inside "${experiment.formula}"—not all physical laws are linear straight lines!`
        : `Notice what stays fixed: ${experiment.controlledVariables.join(', ')}. Mixing up controlled variables with independent variables often explains surprising results.`;

  return {
    observation: `Looking at ${experiment.title} (${valNote}), your question highlights how ${experiment.independentVariable} shapes ${experiment.dependentVariable}.`,
    misconceptionCheck: misconception,
    everydayExample: everyday,
    hint: `Inspect the active equation "${experiment.formula}" and test doubling or halving only ${experiment.parameters[0]?.label ?? 'the primary slider'} inside the Virtual Lab.`,
    guidingQuestion: `If you hold ${experiment.controlledVariables[0] ?? 'all other factors'} constant and change ${experiment.parameters[0]?.label ?? 'the primary input'} by 2×, what exact ratio change does ${experiment.formula} predict?`,
    suggestedNextTrial: `Open ${experiment.shortTitle} in the Virtual Lab, adjust ${experiment.parameters[0]?.label ?? 'the first slider'}, and record a comparison trial.`,
  };
}

export function ScienceDetectivePage() {
  const {
    activeExperimentId,
    setActiveExperimentId,
    trialsByExperiment,
    predictionsByExperiment,
    language,
    recordSafetyCheck,
    navigate,
  } = useLab();

  const experiment = useMemo(() => getExperimentById(activeExperimentId), [activeExperimentId]);
  const trials = trialsByExperiment[experiment.id] ?? [];
  const latestTrial = trials[trials.length - 1];
  const defaultCalc = useMemo(
    () => experiment.calculate(getDefaultParams(experiment)),
    [experiment]
  );

  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [blockedSafety, setBlockedSafety] = useState<SafetyEvaluation | null>(null);
  const [reply, setReply] = useState<DetectiveReply | null>(null);
  const [replySource, setReplySource] = useState<'ai' | 'offline-deterministic'>('ai');
  const inFlightRef = useRef(false);

  const quickPrompts = [
    'Why did my calculated output change nonlinearly when I changed the parameter?',
    'I thought a heavier pendulum bob swings faster—why is mass not in the formula?',
    'Why does pH only drop by 1 when concentration increases by 10×?',
  ];

  const runAsk = async (targetMessage = message) => {
    const clean = targetMessage.trim();
    if (!clean || inFlightRef.current) return;
    inFlightRef.current = true;
    setLoading(true);
    setError(null);
    setBlockedSafety(null);

    const experimentContext = {
      experimentId: experiment.id,
      title: experiment.title,
      formula: experiment.formula,
      latestCalculation: latestTrial
        ? {
            trialName: latestTrial.name,
            inputs: latestTrial.inputs,
            output: latestTrial.primaryOutput,
          }
        : {
            defaultInputs: getDefaultParams(experiment),
            output: {
              label: defaultCalc.primaryLabel,
              value: defaultCalc.primaryValue,
              unit: defaultCalc.primaryUnit,
            },
          },
      studentPrediction: predictionsByExperiment[experiment.id] ?? null,
    };

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 18000);

    try {
      const res = await fetch('/api/ai/detective', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: clean, experimentContext, language }),
        signal: controller.signal,
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Science Detective AI is temporarily busy. Showing instant offline deterministic guidance.');
        setReply(
          buildLocalDetectiveReply(
            clean,
            experiment,
            latestTrial ? latestTrial.primaryOutput : { label: defaultCalc.primaryLabel, value: defaultCalc.primaryValue, unit: defaultCalc.primaryUnit }
          )
        );
        setReplySource('offline-deterministic');
        return;
      }
      if (data.safety) recordSafetyCheck(clean, data.safety.level);
      if (data.blockedBySafety) {
        setBlockedSafety(data.safety);
        setReply(null);
        return;
      }
      setReply(data.tutorResponse);
      setReplySource('ai');
    } catch (err) {
      const aborted = err instanceof DOMException && err.name === 'AbortError';
      setError(
        aborted
          ? 'The AI tutor request timed out; showing instant Offline Deterministic Tutor Guidance below.'
          : 'Network error contacting AI tutor; showing instant Offline Deterministic Tutor Guidance below.'
      );
      setReply(
        buildLocalDetectiveReply(
          clean,
          experiment,
          latestTrial ? latestTrial.primaryOutput : { label: defaultCalc.primaryLabel, value: defaultCalc.primaryValue, unit: defaultCalc.primaryUnit }
        )
      );
      setReplySource('offline-deterministic');
    } finally {
      window.clearTimeout(timeoutId);
      inFlightRef.current = false;
      setLoading(false);
    }
  };

  const handleAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    await runAsk(message);
  };

  return (
    <div className="space-y-8 pb-16">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-blue-700 flex items-center gap-1.5">
            <HelpCircle className="w-4 h-4" />
            Socratic AI Tutor · Grounded in Your Actual Trial Outputs
          </div>
          <h1 className="text-2xl sm:text-3xl font-display font-bold text-slate-900 mt-1">
            Science Detective
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            Share what confused you or surprised you in an experiment. Science Detective spots misconceptions and guides you with everyday analogies.
          </p>
        </div>

        <select
          aria-label="Select experiment context"
          value={experiment.id}
          onChange={(e) => setActiveExperimentId(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white border border-slate-200 text-sm text-slate-900"
        >
          {EXPERIMENTS.map((exp) => (
            <option key={exp.id} value={exp.id}>
              #{exp.number} · {exp.shortTitle}
            </option>
          ))}
        </select>
      </div>

      {/* Grounded Context Card */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-4 text-xs shadow-sm">
        <div>
          <span className="text-slate-500">Active Lab Context:</span>{' '}
          <strong className="text-slate-900">{experiment.title}</strong> ·{' '}
          <span className="font-mono font-semibold text-blue-700">
            {latestTrial
              ? `${latestTrial.name}: ${latestTrial.primaryOutput.value} ${latestTrial.primaryOutput.unit}`
              : `Default Model: ${defaultCalc.primaryValue} ${defaultCalc.primaryUnit}`}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('virtual-lab', { experimentId: experiment.id })}
          className="text-blue-700 font-semibold hover:underline"
        >
          Open in Virtual Lab →
        </button>
      </div>

      <form onSubmit={handleAsk} className="rounded-xl border border-slate-200 bg-white p-5 space-y-4 shadow-sm">
        <label htmlFor="detective-msg" className="text-sm font-semibold text-slate-900 block">
          What did you observe, or what feels surprising?
        </label>
        <textarea
          id="detective-msg"
          rows={3}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="e.g. I expected doubling pendulum length to double the period, why did it only go up by ~1.41×?"
          className="w-full px-4 py-3 rounded-lg bg-slate-50 border border-slate-200 text-sm text-slate-900"
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            {quickPrompts.map((qp) => (
              <button
                key={qp}
                type="button"
                onClick={() => setMessage(qp)}
                className="text-xs text-blue-700 hover:underline text-left"
              >
                &ldquo;{qp}&rdquo;
              </button>
            ))}
          </div>
          <button
            type="submit"
            disabled={loading || !message.trim()}
            className="px-5 py-2.5 rounded-lg bg-blue-700 text-white text-sm font-semibold hover:bg-blue-800 disabled:opacity-40 flex items-center gap-2 shrink-0"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            Ask Science Detective
          </button>
        </div>
      </form>

      {error && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 flex flex-wrap items-center justify-between gap-3 text-sm text-rose-800">
          <span>{error}</span>
          <button
            type="button"
            onClick={() => runAsk(message)}
            className="px-3.5 py-2 rounded-lg bg-rose-700 text-white text-xs font-semibold flex items-center gap-1.5 min-h-[38px]"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            Retry
          </button>
        </div>
      )}

      {blockedSafety && (
        <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 space-y-2">
          <div className="flex items-center gap-2 text-sm font-bold text-rose-800">
            <ShieldAlert className="w-5 h-5" />
            {blockedSafety.title}
          </div>
          <p className="text-sm text-slate-900">{blockedSafety.summary}</p>
        </div>
      )}

      {reply && (
        <div className="rounded-xl border border-blue-200 bg-white p-6 space-y-4 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-2 text-sm font-semibold text-blue-700">
              <MessageSquare className="w-4 h-4" />
              Science Detective Investigation Notes
            </div>
            <span
              className={`px-2.5 py-1 rounded-md text-[11px] font-semibold border ${
                replySource === 'offline-deterministic'
                  ? 'bg-amber-50 border-amber-200 text-amber-800'
                  : 'bg-emerald-50 border-emerald-200 text-emerald-800'
              }`}
            >
              {replySource === 'offline-deterministic'
                ? 'Offline Deterministic Tutor Guidance'
                : 'AI Socratic Tutor'}
            </span>
          </div>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-1">
              <div className="text-xs font-semibold text-slate-900">Observation &amp; Data Check</div>
              <p className="text-slate-700">{reply.observation}</p>
            </div>
            <div className="rounded-lg border border-amber-200 bg-amber-50/70 p-4 space-y-1">
              <div className="text-xs font-semibold text-amber-800">Common Misconception Check</div>
              <p className="text-slate-700">{reply.misconceptionCheck}</p>
            </div>
            <div className="rounded-lg border border-emerald-200 bg-emerald-50/70 p-4 space-y-1">
              <div className="text-xs font-semibold text-emerald-800">Everyday Example</div>
              <p className="text-slate-700">{reply.everydayExample}</p>
            </div>
            <div className="rounded-lg border border-blue-200 bg-blue-50/70 p-4 space-y-1">
              <div className="text-xs font-semibold text-blue-800">Helpful Hint</div>
              <p className="text-slate-700">{reply.hint}</p>
            </div>
          </div>

          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
            <div className="text-xs font-semibold text-blue-800">Guiding Question for You</div>
            <p className="text-sm text-slate-900 font-medium">{reply.guidingQuestion}</p>
            <div className="text-xs text-blue-700">
              <strong>Try Next:</strong> {reply.suggestedNextTrial}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
