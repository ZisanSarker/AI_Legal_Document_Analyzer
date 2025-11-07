import modelsManager from './model.js';

export async function summarizeText(text) {
  if (!text?.trim() || text.length < 50) return "Text too short for summarization.";
  
  const { summary_text } = await modelsManager.summarizeText(text);
  return summary_text || "No summary generated.";
}
