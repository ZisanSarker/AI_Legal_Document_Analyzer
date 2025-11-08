import { analyzeSemantic } from './semantic.service.js';
import { extractText } from '../../utils/extract.js';

export async function semanticController(req, res) {
  try {
    let text;
    
    // Check if file was uploaded
    if (req.file) {
      const filePath = req.file.path;
      text = await extractText(filePath);
    } else if (req.body.text) {
      // Fallback to text from body
      text = req.body.text;
    } else {
      return res.status(400).json({ error: 'No file or text provided.' });
    }

    if (!text || !text.trim()) {
      return res.status(400).json({ error: 'No text could be extracted.' });
    }

    const result = await analyzeSemantic(text);

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (err) {
    console.error('Semantic analysis error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
}
