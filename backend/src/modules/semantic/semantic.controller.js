import semanticService from './semantic.service.js';

export const handleSemanticAnalysis = async (req, res, next) => {
  try {
    const { chunks } = req.body;

    if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: chunks field is required and must be a non-empty array',
        error: 'Missing or empty chunks array'
      });
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      if (!chunk.text || typeof chunk.text !== 'string') {
        return res.status(400).json({
          success: false,
          message: `Invalid chunk at index ${i}: text field is required and must be a string`,
          error: `Invalid chunk structure at index ${i}`
        });
      }
    }

    const result = await semanticService.analyzeDocument(chunks);

    return res.status(200).json({
      success: true,
      message: 'Semantic analysis completed successfully',
      data: result
    });
  } catch (error) {
    console.error('Error in handleSemanticAnalysis:', error);

    return res.status(500).json({
      success: false,
      message: 'Internal server error during semantic analysis',
      error: error.message || 'An unexpected error occurred'
    });
  }
};

