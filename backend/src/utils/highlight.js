const HIGHLIGHT_LABELS = new Set([
  'Confidentiality',
  'Payment Terms',
  'Termination',
  'Liability',
  'Governing Law'
]);

const COLORS = {
  Confidentiality: '#fde047',
  Termination: '#60a5fa',
  'Payment Terms': '#86efac',
  Liability: '#f87171',
  'Governing Law': '#a78bfa',
  default: '#d1d5db'
};

export function highlightKeySections(_, clauses = []) {
  return clauses
    .filter(({ label, confidence }) => HIGHLIGHT_LABELS.has(label) && confidence >= 70)
    .map(({ label, confidence }) => ({
      label,
      color: COLORS[label] || COLORS.default,
      confidence
    }));
}
