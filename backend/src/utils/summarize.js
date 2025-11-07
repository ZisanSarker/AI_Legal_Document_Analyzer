import modelsManager from './model.js';

export async function summarizeText(text) {
  if (!text || text.length < 50) return "Text too short for summarization.";
  const summary = await modelsManager.summarizeText(text, 'semantic');
  return summary?.summary_text || "No summary generated.";
}
