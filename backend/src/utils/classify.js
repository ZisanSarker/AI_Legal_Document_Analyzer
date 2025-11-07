import { getZeroShotClassification } from './model.js';

export async function classifyClauses(text) {
  if (!text || text.trim().length === 0) return [];

  const candidateLabels = [
    'Confidentiality',
    'Liability',
    'Governing Law',
    'Termination',
    'Payment',
    'Risk',
    'Force Majeure',
    'Warranty',
    'Service Period',
    'Intellectual Property'
  ];

  const response = await getZeroShotClassification(text, candidateLabels);

  let results = [];

  // 🧠 Handle multiple possible response shapes
  if (Array.isArray(response)) {
    // Case 1: [{ labels: [...], scores: [...] }]
    if (response[0]?.labels && response[0]?.scores) {
      results = response[0].labels.map((label, i) => ({
        label,
        score: response[0].scores[i] || 0,
      }));
    }
    // Case 2: [{ label: "Liability", score: 0.9 }, ...]
    else if (response[0]?.label) {
      results = response.map(item => ({
        label: item.label,
        score: item.score,
      }));
    }
  } else if (response?.labels && response?.scores) {
    // Case 3: { labels: [...], scores: [...] }
    results = response.labels.map((label, i) => ({
      label,
      score: response.scores[i] || 0,
    }));
  } else if (response?.label && response?.score) {
    // Case 4: { label: "Liability", score: 0.9 }
    results = [{ label: response.label, score: response.score }];
  }

  return results
    .filter(r => r.score >= 0.4)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);
}
