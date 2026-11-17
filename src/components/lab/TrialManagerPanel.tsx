import React, { useState } from 'react';
import { Copy, Download, Edit2, Play, Plus, Trash2 } from 'lucide-react';
import type { ExperimentDefinition, TrialRecord } from '../../types/science';
import { exportTrialsCsv } from '../../utils/exportUtils';
import { Modal } from '../ui/Modal';

interface TrialManagerPanelProps {
  experiment: ExperimentDefinition;
  trials: TrialRecord[];
  currentParams: Record<string, number>;
  onAddCurrentTrial: () => void;
  onRepeatTrial: (trial: TrialRecord) => void;
  onReopenTrial: (trial: TrialRecord) => void;
  onRenameTrial: (trialId: string, newName: string) => void;
  onDeleteTrial: (trialId: string) => void;
}

export function TrialManagerPanel({
  experiment,
  trials,
  onAddCurrentTrial,
  onRepeatTrial,
  onReopenTrial,
  onRenameTrial,
  onDeleteTrial,
}: TrialManagerPanelProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameText, setRenameText] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<TrialRecord | null>(null);
  const [compareIds, setCompareIds] = useState<string[]>([]);

  const toggleCompare = (id: string) => {
    setCompareIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 3 ? [...prev, id] : prev
    );
  };

  const comparedTrials = trials.filter((t) => compareIds.includes(t.id));

  return (
    <div className="space-y-6">
      {/* Toolbar */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-wrap items-center justify-between gap-4 shadow-xs">
        <div>
          <h4 className="text-sm font-semibold text-slate-900">
            Trial Manager ({trials.length} / 10 Saved Trials)
          </h4>
          <p className="text-xs text-slate-600 mt-0.5">
            Every trial stores independent parameters, units, timestamp, and deterministic simulation output.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={trials.length >= 10}
            onClick={onAddCurrentTrial}
            className="px-3.5 py-2 rounded-lg text-xs font-semibold bg-blue-700 text-white hover:bg-blue-800 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            Add Current Trial
          </button>
          <button
            type="button"
            disabled={trials.length === 0}
            onClick={() => exportTrialsCsv(experiment, trials)}
            className="px-3.5 py-2 rounded-lg text-xs font-medium border border-slate-300 bg-slate-50 text-slate-800 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1.5 min-h-[40px]"
          >
            <Download className="w-4 h-4 text-blue-700" />
            Export CSV
          </button>
        </div>
      </div>

      {/* Empty State or Table */}
      {trials.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-300 bg-slate-50 p-10 text-center space-y-3">
          <p className="text-base font-medium text-slate-900">
            No trials yet. Run your first trial to see your results.
          </p>
          <p className="text-sm text-slate-600 max-w-md mx-auto">
            Adjust the parameters in the Experiment tab or click Add Current Trial above to record your first validated simulation run.
          </p>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs text-slate-600">
                  <th className="py-3 px-4 font-semibold">Compare</th>
                  <th className="py-3 px-4 font-semibold">Trial Name</th>
                  {experiment.parameters.map((p) => (
                    <th key={p.key} className="py-3 px-4 font-semibold">
                      {p.symbol} ({p.unit})
                    </th>
                  ))}
                  <th className="py-3 px-4 font-semibold">
                    Result ({trials[0].primaryOutput.unit})
                  </th>
                  <th className="py-3 px-4 font-semibold">Type & Model</th>
                  <th className="py-3 px-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {trials.map((trial) => (
                  <tr key={trial.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4">
                      <input
                        type="checkbox"
                        aria-label={`Select ${trial.name} for comparison`}
                        checked={compareIds.includes(trial.id)}
                        onChange={() => toggleCompare(trial.id)}
                        className="w-4 h-4 accent-blue-700 cursor-pointer"
                      />
                    </td>
                    <td className="py-3 px-4">
                      {renamingId === trial.id ? (
                        <div className="flex items-center gap-1.5">
                          <input
                            type="text"
                            value={renameText}
                            onChange={(e) => setRenameText(e.target.value)}
                            className="px-2 py-1 rounded bg-white border border-blue-600 text-xs text-slate-900 w-36"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              onRenameTrial(trial.id, renameText);
                              setRenamingId(null);
                            }}
                            className="text-xs text-emerald-700 font-semibold px-2 py-1"
                          >
                            Save
                          </button>
                        </div>
                      ) : (
                        <div>
                          <div className="font-medium text-slate-900">{trial.name}</div>
                          <div className="text-[11px] font-mono text-slate-500">
                            {new Date(trial.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      )}
                    </td>
                    {experiment.parameters.map((p) => (
                      <td key={p.key} className="py-3 px-4 font-mono tabular-nums text-slate-700">
                        {trial.inputs[p.key]}
                      </td>
                    ))}
                    <td className="py-3 px-4 font-mono tabular-nums font-semibold text-blue-700">
                      {trial.primaryOutput.value} {trial.primaryOutput.unit}
                    </td>
                    <td className="py-3 px-4 text-xs text-slate-600">
                      <div>{trial.dataType}</div>
                      <div className="font-mono text-[11px] text-slate-500">{trial.modelVersion}</div>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          title="Reopen parameters in Experiment"
                          onClick={() => onReopenTrial(trial)}
                          className="p-2 rounded-lg text-slate-500 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Play className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Repeat trial"
                          disabled={trials.length >= 10}
                          onClick={() => onRepeatTrial(trial)}
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 disabled:opacity-30"
                        >
                          <Copy className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Rename trial"
                          onClick={() => {
                            setRenamingId(trial.id);
                            setRenameText(trial.name);
                          }}
                          className="p-2 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          title="Delete trial"
                          onClick={() => setDeleteTarget(trial)}
                          className="p-2 rounded-lg text-slate-500 hover:text-rose-700 hover:bg-rose-50"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Side-by-Side Comparison */}
      {comparedTrials.length >= 2 && (
        <div className="rounded-xl border border-blue-200 bg-blue-50/40 p-5 space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-slate-900">
              Side-by-Side Trial Comparison ({comparedTrials.length} selected)
            </h4>
            <button
              type="button"
              onClick={() => setCompareIds([])}
              className="text-xs text-slate-600 hover:text-slate-900 font-medium"
            >
              Clear selection
            </button>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {comparedTrials.map((t) => (
              <div key={t.id} className="rounded-lg border border-slate-200 bg-white p-4 space-y-2 shadow-xs">
                <div className="text-sm font-semibold text-slate-900">{t.name}</div>
                <div className="text-xl font-mono font-bold tabular-nums text-blue-700">
                  {t.primaryOutput.value} {t.primaryOutput.unit}
                </div>
                <div className="text-xs text-slate-600 space-y-1 pt-1 border-t border-slate-100">
                  {experiment.parameters.map((p) => (
                    <div key={p.key} className="flex justify-between font-mono tabular-nums">
                      <span>{p.symbol}:</span>
                      <span>
                        {t.inputs[p.key]} {p.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      <Modal
        open={Boolean(deleteTarget)}
        onClose={() => setDeleteTarget(null)}
        title="Confirm Delete Trial"
      >
        <div className="space-y-4">
          <p className="text-sm text-slate-600">
            Are you sure you want to permanently remove <strong className="text-slate-900">{deleteTarget?.name}</strong> from your saved trials?
          </p>
          <div className="flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setDeleteTarget(null)}
              className="px-4 py-2 rounded-lg text-sm border border-slate-300 text-slate-700 hover:bg-slate-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => {
                if (deleteTarget) onDeleteTrial(deleteTarget.id);
                setDeleteTarget(null);
              }}
              className="px-4 py-2 rounded-lg text-sm font-semibold bg-rose-700 text-white hover:bg-rose-800"
            >
              Delete Trial
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
