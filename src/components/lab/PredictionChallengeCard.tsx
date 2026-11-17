import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, HelpCircle } from 'lucide-react';
import type {
  ExperimentCalculationResult,
  ExperimentDefinition,
  PredictionSubmission,
} from '../../types/science';

interface PredictionChallengeCardProps {
  experiment: ExperimentDefinition;
  savedPrediction?: PredictionSubmission;
  hasRunAfterPrediction: boolean;
  result: ExperimentCalculationResult;
  onSubmitPrediction: (pred: PredictionSubmission) => void;
  onEncourageAnotherTrial: () => void;
}

export function PredictionChallengeCard({
  experiment,
  savedPrediction,
  hasRunAfterPrediction,
  result,
  onSubmitPrediction,
  onEncourageAnotherTrial,
}: PredictionChallengeCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [mode, setMode] = useState<'multiple-choice' | 'numerical' | 'written'>('multiple-choice');
  const [selectedOptionId, setSelectedOptionId] = useState(
    savedPrediction?.selectedOptionId ?? experiment.predictionOptions[0]?.id ?? ''
  );
  const [numericalValue, setNumericalValue] = useState(
    savedPrediction?.numericalValue !== undefined ? String(savedPrediction.numericalValue) : ''
  );
  const [writtenText, setWrittenText] = useState(savedPrediction?.writtenText ?? '');
  const [confidence, setConfidence] = useState<'Low' | 'Medium' | 'High'>(
    savedPrediction?.confidence ?? 'Medium'
  );

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitPrediction({
      experimentId: experiment.id,
      mode,
      selectedOptionId: mode === 'multiple-choice' ? selectedOptionId : undefined,
      numericalValue: mode === 'numerical' && numericalValue !== '' ? Number(numericalValue) : undefined,
      writtenText: mode === 'written' ? writtenText.trim() : undefined,
      confidence,
      submittedAt: new Date().toISOString(),
    });
  };

  const evaluateOutcome = () => {
    if (!savedPrediction) return null;
    if (savedPrediction.mode === 'numerical' && savedPrediction.numericalValue !== undefined) {
      const diff = Math.abs(savedPrediction.numericalValue - result.primaryValue);
      const tol = Math.max(0.5, Math.abs(result.primaryValue) * 0.1);
      return {
        close: diff <= tol,
        text: `Your numerical prediction was ${savedPrediction.numericalValue} ${result.primaryUnit}; calculated outcome is ${result.primaryValue} ${result.primaryUnit} (difference: ${diff.toFixed(2)} ${result.primaryUnit}).`,
      };
    }
    if (savedPrediction.mode === 'multiple-choice') {
      const opt = experiment.predictionOptions.find((o) => o.id === savedPrediction.selectedOptionId);
      const close =
        opt?.valueHint !== undefined &&
        Math.abs(opt.valueHint - result.primaryValue) <= Math.max(1.5, Math.abs(result.primaryValue) * 0.15);
      return {
        close,
        text: `You predicted "${opt?.label ?? 'Option'}". With current parameters, the model calculates ${result.primaryValue} ${result.primaryUnit}.`,
      };
    }
    return {
      close: true,
      text: `Your written hypothesis: "${savedPrediction.writtenText || 'Recorded'}". Model output: ${result.primaryValue} ${result.primaryUnit}.`,
    };
  };

  const comparison = hasRunAfterPrediction ? evaluateOutcome() : null;

  return (
    <div className="rounded-xl border border-blue-200 bg-white overflow-hidden shadow-xs">
      <button
        type="button"
        aria-expanded={expanded}
        onClick={() => setExpanded((v) => !v)}
        className="w-full px-5 py-3.5 flex items-center justify-between gap-4 text-left hover:bg-slate-50"
      >
        <div className="flex items-center gap-3">
          <HelpCircle className="w-4 h-4 text-blue-700 shrink-0" />
          <div>
            <div className="text-sm font-semibold text-slate-900">
              Prediction Challenge {savedPrediction ? '· Prediction Recorded' : '· Test Your Intuition First'}
            </div>
            <div className="text-xs text-slate-600">{experiment.predictionPrompt}</div>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-blue-700 shrink-0 transition-transform ${expanded ? 'rotate-180' : ''}`}
        />
      </button>

      {expanded && (
        <div className="px-5 pb-5 pt-3 border-t border-slate-200 space-y-4">
          <div className="flex flex-wrap gap-2">
            {(
              [
                { id: 'multiple-choice', label: 'Multiple Choice' },
                { id: 'numerical', label: 'Numerical Estimate' },
                { id: 'written', label: 'Written Prediction' },
              ] as const
            ).map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setMode(m.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium border ${
                  mode === m.id
                    ? 'bg-blue-50 border-blue-600 text-blue-800 font-semibold'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                {m.label}
              </button>
            ))}
          </div>

          <form onSubmit={handleSave} className="space-y-4">
            {mode === 'multiple-choice' && (
              <div className="grid sm:grid-cols-3 gap-2">
                {experiment.predictionOptions.map((opt) => (
                  <label
                    key={opt.id}
                    className={`flex items-center gap-2.5 p-3 rounded-lg border cursor-pointer text-xs ${
                      selectedOptionId === opt.id
                        ? 'border-blue-600 bg-blue-50 text-blue-950 font-semibold'
                        : 'border-slate-200 bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="prediction-mc"
                      checked={selectedOptionId === opt.id}
                      onChange={() => setSelectedOptionId(opt.id)}
                      className="accent-blue-700"
                    />
                    <span>{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            {mode === 'numerical' && (
              <div className="flex items-center gap-3">
                <input
                  type="number"
                  step="any"
                  required
                  value={numericalValue}
                  onChange={(e) => setNumericalValue(e.target.value)}
                  placeholder={`Enter estimate in ${result.primaryUnit}`}
                  className="px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm font-mono text-slate-900 w-56"
                />
                <span className="text-xs font-mono text-slate-600">{result.primaryUnit}</span>
              </div>
            )}

            {mode === 'written' && (
              <textarea
                rows={2}
                required
                value={writtenText}
                onChange={(e) => setWrittenText(e.target.value)}
                placeholder="Write what you expect to happen and why..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-slate-300 text-sm text-slate-900"
              />
            )}

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-xs text-slate-600">
                <span>Confidence:</span>
                {(['Low', 'Medium', 'High'] as const).map((lvl) => (
                  <button
                    key={lvl}
                    type="button"
                    onClick={() => setConfidence(lvl)}
                    className={`px-2.5 py-1 rounded border ${
                      confidence === lvl
                        ? 'border-blue-600 bg-blue-50 text-blue-800 font-semibold'
                        : 'border-slate-200 bg-white text-slate-700'
                    }`}
                  >
                    {lvl}
                  </button>
                ))}
              </div>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800"
              >
                Lock In Prediction
              </button>
            </div>
          </form>

          {comparison && (
            <div
              className={`rounded-lg border p-4 space-y-2 ${
                comparison.close
                  ? 'border-emerald-200 bg-emerald-50'
                  : 'border-amber-200 bg-amber-50'
              }`}
            >
              <div className="flex items-center gap-2 text-xs font-semibold text-slate-900">
                <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                <span>Prediction vs Calculated Outcome (Confidence: {savedPrediction?.confidence})</span>
              </div>
              <p className="text-xs text-slate-700">{comparison.text}</p>
              <p className="text-xs text-slate-900">
                <strong>Hint & Principle:</strong> {experiment.predictionExpectedHint}
              </p>
              <button
                type="button"
                onClick={onEncourageAnotherTrial}
                className="text-xs font-semibold text-blue-700 hover:underline"
              >
                Try changing a parameter and running another trial →
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
