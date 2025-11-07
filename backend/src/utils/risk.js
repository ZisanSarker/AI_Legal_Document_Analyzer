import { getZeroShotClassification } from './model.js';

export async function detectRisks(text = '', clauses = []) {
  if (!text?.trim()) {
    return {
      riskScore: 0,
      riskLevel: 'Low Risk',
      riskyTerms: [],
      note: 'No valid text provided.'
    };
  }

  const riskyTerms = ['termination', 'penalty', 'liability', 'breach', 'indemnify'];
  const found = riskyTerms.filter(term => text.toLowerCase().includes(term));

  const response = await getZeroShotClassification(text, ['Low Risk', 'Medium Risk', 'High Risk']);
  const result = Array.isArray(response) ? response[0] : response;
  const label = result?.label || result?.labels?.[0] || 'Medium Risk';
  const score = result?.score || result?.scores?.[0] || 0.6;

  let base =
    label === 'High Risk' ? score * 100 :
    label === 'Medium Risk' ? score * 75 :
    score * 40;

  const overlapSet = new Set(['Liability', 'Termination', 'Breach']);
  const overlapCount = clauses.filter(c => overlapSet.has(c.label)).length;

  const riskScore = Math.min(Math.round(base + (found.length + overlapCount) * 5), 100);
  const riskLevel = riskScore >= 70 ? 'High Risk' : riskScore >= 40 ? 'Medium Risk' : 'Low Risk';

  return {
    riskScore,
    riskLevel,
    riskyTerms: found,
    note:
      riskLevel === 'High Risk'
        ? `⚠️ High legal risk detected (${found.join(', ') || 'contextual'}).`
        : riskLevel === 'Medium Risk'
        ? `⚠️ Moderate legal risk detected (${found.join(', ') || 'contextual'}).`
        : `✅ Low legal risk detected (${found.join(', ') || 'none'}).`
  };
}
