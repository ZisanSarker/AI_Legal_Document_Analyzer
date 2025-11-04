import preprocessingService from './preprocessing.service.js';

/**
 * Preprocessing Controller
 * Handles HTTP requests for document preprocessing
 */

export const handlePreprocessing = async (req, res, next) => {
  try {
    // Extract text from request body
    const { text } = req.body;

    // Validate input
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid request: text field is required and must be a non-empty string',
        error: 'Missing or empty text field'
      });
    }

    // Call service to preprocess document
    const chunks = await preprocessingService.preprocessDocument(text);

    // Return successful response in the required format
    return res.status(200).json({
      success: true,
      message: 'Preprocessing completed successfully',
      data: {
        chunks: chunks
      }
    });
  } catch (error) {
    console.error('Error in handlePreprocessing:', error);

    // Handle specific error types
    if (error.message.includes('HUGGINGFACE') || error.message.includes('API')) {
      return res.status(503).json({
        success: false,
        message: 'External service unavailable',
        error: 'Hugging Face API is currently unavailable. Please check your API token and model configuration.',
        details: error.message
      });
    }

    // Generic error response
    return res.status(500).json({
      success: false,
      message: 'Internal server error during preprocessing',
      error: error.message || 'An unexpected error occurred'
    });
  }
};

