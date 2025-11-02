import { preprocessDocument } from '../../utils/preprocessLegalDoc.js';

export const preprocessText = async (req, res) => {
	try {
		const { text } = req.body;

		if (!text) {
			return res.status(400).json({ 
				success: false,
				error: 'Text is required for preprocessing.' 
			});
		}

		if (typeof text !== 'string' || text.trim().length === 0) {
			return res.status(400).json({ 
				success: false,
				error: 'Text must be a non-empty string.' 
			});
		}

		const processed = await preprocessDocument(text, { isFilePath: false });

		res.status(200).json({
			success: true,
			message: 'Preprocessing completed successfully.',
			data: {
				originalLength: text.length,
				documentTitle: processed.documentTitle,
				documentType: processed.documentType,
				metadata: processed.metadata,
				clauses: processed.clauses,
				totalClauses: processed.clauses.length
			}
		});

	} catch (error) {
		console.error('Preprocessing error:', error);
		res.status(500).json({ 
			success: false,
			error: error.message || 'Internal server error during preprocessing.' 
		});
	}
};
