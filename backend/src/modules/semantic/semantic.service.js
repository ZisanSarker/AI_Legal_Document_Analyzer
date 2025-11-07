import { preprocessText } from '../../utils/preprocess.js';
import { classifyClauses } from '../../utils/classify.js';
import { summarizeText } from '../../utils/summarize.js';
import { highlightKeySections } from '../../utils/highlight.js';
import { detectRisks } from '../../utils/risk.js';
import { detectAnomalies } from '../../utils/anomalies.js';

/**
 * Main Semantic Analysis Pipeline
 */
export async function analyzeSemantic(rawText) {
  const cleanText = preprocessText(rawText);

  const [clauses, summary] = await Promise.all([
    classifyClauses(cleanText),
    summarizeText(cleanText),
  ]);

  const highlights = highlightKeySections(cleanText, clauses);
  const risks = await detectRisks(cleanText, clauses);
  const anomalies = await detectAnomalies(cleanText, clauses);

  return { summary, clauses, highlights, risks, anomalies };
}
