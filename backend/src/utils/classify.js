import { getZeroShotClassification } from './model.js';

export async function classifyClauses(text = '') {
  if (!text?.trim()) return [];

  const candidateLabels = [
    'Confidentiality',
    'Payment Terms',
    'Liability',
    'Termination',
    'Governing Law',
    'Dispute Resolution',
    'Force Majeure',
    'Warranty',
    'Indemnity',
    'Intellectual Property',
    'Compliance',
    'Risk Allocation',
    'Breach of Contract',
    'Limitation of Liability',
    'Non-Compete',
    'Data Protection',
    'Assignment',
    'Scope of Work',
    'Service Level Agreement',
    'Renewal and Extension'
  ];

  const response = await getZeroShotClassification(text, candidateLabels);

  const normalized = (() => {
    if (Array.isArray(response)) {
      if (response[0]?.label) return response;
      if (response[0]?.labels && response[0]?.scores)
        return response[0].labels.map((label, i) => ({
          label,
          score: response[0].scores[i] || 0
        }));
    } else if (response?.labels && response?.scores) {
      return response.labels.map((label, i) => ({
        label,
        score: response.scores[i] || 0
      }));
    } else if (response?.label && response?.score) {
      return [response];
    }
    return [];
  })();

  return normalized
    .filter(({ score }) => score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 7)
    .map(({ label, score }) => ({
      label,
      confidence: +(score * 100).toFixed(1)
    }));
}
