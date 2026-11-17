import { jsPDF } from 'jspdf';
import type { ExperimentCalculationResult, ExperimentDefinition, TrialRecord } from '../types/science';

export function exportTrialsCsv(experiment: ExperimentDefinition, trials: TrialRecord[]): void {
  const paramHeaders = experiment.parameters.map((p) => `${p.label} (${p.unit})`);
  const secHeaders =
    trials[0]?.secondaryOutputs.map((s) => `${s.label} (${s.unit})`) ?? [];
  const headers = [
    'Trial ID',
    'Trial Name',
    ...paramHeaders,
    `${experiment.calculate(
      Object.fromEntries(experiment.parameters.map((p) => [p.key, p.defaultValue]))
    ).primaryLabel} (${experiment.calculate(
      Object.fromEntries(experiment.parameters.map((p) => [p.key, p.defaultValue]))
    ).primaryUnit})`,
    ...secHeaders,
    'Timestamp',
    'Data Type',
    'Model Version',
  ];

  const escapeCsv = (val: string | number) => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const rows = trials.map((t) => [
    t.id,
    t.name,
    ...experiment.parameters.map((p) => t.inputs[p.key] ?? ''),
    t.primaryOutput.value,
    ...t.secondaryOutputs.map((s) => s.value),
    t.timestamp,
    t.dataType,
    t.modelVersion,
  ]);

  const csvContent = [headers.map(escapeCsv).join(','), ...rows.map((r) => r.map(escapeCsv).join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${experiment.id}-trials-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function exportExperimentPdfReport(args: {
  experiment: ExperimentDefinition;
  currentParams: Record<string, number>;
  result: ExperimentCalculationResult;
  trials: TrialRecord[];
  studentNotes: string;
}): void {
  const { experiment, currentParams, result, trials, studentNotes } = args;
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 44;
  const maxWidth = 507;
  let y = 52;

  const ensureSpace = (needed = 40) => {
    if (y + needed > 780) {
      doc.addPage();
      y = 52;
    }
  };

  const addHeading = (text: string) => {
    ensureSpace(32);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(15, 76, 129);
    doc.text(text, margin, y);
    y += 16;
  };

  const addBody = (text: string) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(35, 45, 60);
    const lines = doc.splitTextToSize(text, maxWidth);
    for (const line of lines) {
      ensureSpace(16);
      doc.text(line, margin, y);
      y += 14;
    }
    y += 6;
  };

  // Header
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(7, 17, 31);
  doc.text('OMNILAB — WHERE CURIOSITY BECOMES DISCOVERY — LAB REPORT', margin, y);
  y += 22;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(80, 95, 115);
  doc.text(`Experiment #${experiment.number}: ${experiment.title} | Subject: ${experiment.subject}`, margin, y);
  y += 14;
  doc.text(`Generated: ${new Date().toLocaleString()} | Data Type: Deterministic Virtual Simulation`, margin, y);
  y += 22;

  addHeading('1. Aim & Learning Objective');
  addBody(experiment.learningObjective);

  addHeading('2. Hypothesis');
  addBody(experiment.hypothesis);

  addHeading('3. Variables & Scientific Formula');
  addBody(
    `Independent Variable: ${experiment.independentVariable}\nDependent Variable: ${experiment.dependentVariable}\nControlled Variables: ${experiment.controlledVariables.join(', ')}\nFormula: ${experiment.formula}`
  );

  addHeading('4. Current Parameters & Calculated Outcome');
  const paramSummary = experiment.parameters
    .map((p) => `${p.label} (${p.symbol}): ${currentParams[p.key] ?? p.defaultValue} ${p.unit}`)
    .join(' | ');
  addBody(`${paramSummary}\nResult: ${result.primaryLabel} (${result.primarySymbol}) = ${result.primaryValue} ${result.primaryUnit}`);

  addHeading('5. Saved Trials Data Table');
  if (trials.length === 0) {
    addBody('No saved trials recorded yet for this session.');
  } else {
    for (const t of trials) {
      const inputsStr = experiment.parameters
        .map((p) => `${p.symbol}=${t.inputs[p.key] ?? ''}${p.unit}`)
        .join(', ');
      addBody(`• ${t.name}: [${inputsStr}] -> ${t.primaryOutput.symbol} = ${t.primaryOutput.value} ${t.primaryOutput.unit} (${new Date(t.timestamp).toLocaleTimeString()})`);
    }
  }

  addHeading('6. Graph & Scientific Analysis');
  addBody(
    `Relationship: ${experiment.graphInterpretation.relationship}\nTrend: ${experiment.graphInterpretation.trend}\nConclusion: ${experiment.graphInterpretation.conclusion}`
  );
  if (studentNotes.trim()) {
    addBody(`Student Conclusion Notes: ${studentNotes.trim()}`);
  }

  addHeading('7. Assumptions, Limitations & Safety Classification');
  addBody(
    `Assumptions: ${experiment.assumptions.join('; ')}\nLimitations: ${experiment.limitations.join('; ')}\nSafety Classification: ${experiment.safetyLevel} — ${experiment.safetyNote}`
  );

  doc.save(`${experiment.id}-lab-report-${new Date().toISOString().slice(0, 10)}.pdf`);
}
