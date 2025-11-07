export async function detectAnomalies(text, clauses) {
  const textLower = text.toLowerCase();
  const isNDA = textLower.includes('non-disclosure') || textLower.includes('nda') || textLower.includes('confidential');
  
  const standardClauses = ['Payment', 'Force Majeure', 'Warranty'];
  const foundLabels = clauses.map(c => c.label);
  const missing = standardClauses.filter(sc => !foundLabels.includes(sc));

  let note = 'All standard clauses appear present.';
  if (missing.length > 0) {
    note = isNDA 
      ? `Some standard commercial clauses are missing (NDA focus detected).`
      : 'Some standard clauses are missing.';
  }

  return {
    anomalies: missing,
    status: missing.length ? 'Incomplete' : 'Complete',
    note,
  };
}
