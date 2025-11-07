export function highlightKeySections(text, clauses) {
  const highlightLabels = ['Confidentiality', 'Payment', 'Termination', 'Liability', 'Governing Law'];
  return clauses
    .filter(c => highlightLabels.includes(c.label) && c.score >= 0.7)
    .map(c => ({
      label: c.label,
      color: pickColor(c.label),
      confidence: c.score,
    }));
}

function pickColor(label) {
  const colors = {
    Confidentiality: '#fde047',
    Termination: '#60a5fa',
    Payment: '#86efac',
    Liability: '#f87171',
    'Governing Law': '#a78bfa',
  };
  return colors[label] || '#d1d5db';
}
