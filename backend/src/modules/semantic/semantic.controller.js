import { analyzeSemantic } from './semantic.service.js';

export async function semanticController(req, res) {
  try {
    const { text } = req.body;
    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'No text provided.' });
    }

    const result = await analyzeSemantic(text);

    res.status(200).json({
      success: true,
      message: 'Full semantic analysis complete.',
      data: result,
    });
  } catch (err) {
    console.error('Semantic analysis error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
