import { getZeroShotClassification } from './model.js';

export async function detectRisks(text = '', clauses = []) {
  const riskyTerms = ['termination', 'penalty', 'liability', 'breach', 'indemnify'];
  const found = riskyTerms.filter(w => text.toLowerCase().includes(w));

  const response = await getZeroShotClassification(text, ['Low Risk', 'Medium Risk', 'High Risk']);
  const data = Array.isArray(response) ? response[0] : response;
  const labels = data.labels || [];
  const scores = data.scores || [];

  const topLabel = labels[0] || 'Medium Risk';
  const confidence = scores[0] || 0.6;

  let riskScore =
    topLabel === 'High Risk' ? Math.round(confidence * 100) :
    topLabel === 'Medium Risk' ? Math.round(confidence * 75) :
    Math.round(confidence * 40);

  const overlap = clauses
    .map(c => c.label)
    .filter(c => ['Liability', 'Termination', 'Breach'].includes(c));

  riskScore = Math.min(riskScore + (found.length + overlap.length) * 5, 100);
  const level = riskScore >= 70 ? 'High Risk' : riskScore >= 40 ? 'Medium Risk' : 'Low Risk';

  return {
    riskScore,
    riskLevel: level,
    modelConfidence: confidence,
    riskyTerms: found,
    note:
      level === 'High Risk'
        ? `⚠️ High legal risk detected (${found.join(', ') || 'contextual'}).`
        : level === 'Medium Risk'
        ? `⚠️ Moderate risk detected (${found.join(', ') || 'contextual'}).`
        : `✅ Low risk detected (${found.join(', ') || 'none'}).`
  };
}
