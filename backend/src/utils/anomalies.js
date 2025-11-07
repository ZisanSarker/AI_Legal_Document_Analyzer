export async function detectAnomalies(text = '', clauses = []) {
  if (!text?.trim()) {
    return { anomalies: [], completeness: 0, note: 'No valid text provided.' };
  }

  const isNDA = /\b(non[-\s]?disclosure|nda|confidential)\b/i.test(text);
  const STANDARD_CLAUSES = isNDA
    ? ['Confidentiality', 'Governing Law', 'Liability', 'Term']
    : [
        'Payment Terms',
        'Force Majeure',
        'Warranty',
        'Liability',
        'Termination',
        'Confidentiality',
        'Governing Law',
        'Intellectual Property',
        'Dispute Resolution',
        'Compliance'
      ];

  const found = new Map(clauses.map(c => [c.label, c.confidence || 0]));
  const missing = STANDARD_CLAUSES.filter(label => (found.get(label) || 0) < 40);
  const completeness = +(100 - (missing.length / STANDARD_CLAUSES.length) * 100).toFixed(1);

  const note =
    missing.length === 0
      ? 'All standard clauses appear present.'
      : isNDA
      ? `Some standard commercial clauses are missing: ${missing.join(', ')}.`
      : `Some standard clauses are missing: ${missing.join(', ')}.`;

  return { anomalies: missing, completeness, note };
}
