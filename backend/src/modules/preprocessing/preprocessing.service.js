import modelsManager from '../../utils/models.js';

class PreprocessingService {
  constructor() {
    this.maxChunkTokens = 4000;
  }

  cleanText(rawText) {
    if (!rawText || typeof rawText !== 'string') {
      throw new Error('Invalid input: rawText must be a non-empty string');
    }

    let cleaned = rawText;

    cleaned = cleaned.replace(/\r\n/g, '\n');
    cleaned = cleaned.replace(/\r/g, '\n');
    cleaned = cleaned.replace(/\n+/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ');

    cleaned = cleaned.replace(/[^\w\s\.\,\;\:\-\(\)\[\]\{\}\"\'\/\@\#\%\&\*\+\=\<\>\?\|\~\`]/g, '');

    cleaned = cleaned.normalize('NFKC');

    cleaned = cleaned.trim();

    return cleaned;
  }

  estimateTokenCount(text) {
    if (!text) return 0;
    return Math.ceil(text.length / 4);
  }

  splitIntoChunks(cleanedText) {
    if (!cleanedText || cleanedText.length === 0) {
      return [];
    }

    const chunks = [];
    
    // Split on clause headers (all caps words/phrases followed by period and space)
    // Pattern matches: "CONFIDENTIALITY. ", "PAYMENT TERMS. ", "LIABILITY AND INDEMNIFICATION. ", etc.
    const clausePattern = /([A-Z][A-Z\s\-]+\.\s+)/g;
    
    // Find all clause header positions
    const clauseHeaders = [];
    let match;
    while ((match = clausePattern.exec(cleanedText)) !== null) {
      clauseHeaders.push({
        index: match.index,
        header: match[0],
        text: match[0].trim()
      });
    }
    
    // If we found clause headers, split on them
    if (clauseHeaders.length > 0) {
      let lastIndex = 0;
      
      for (let i = 0; i < clauseHeaders.length; i++) {
        const header = clauseHeaders[i];
        const startIndex = header.index;
        
        // If there's text before this header (not the first header), add it to previous chunk
        if (startIndex > lastIndex && chunks.length > 0) {
          const prevText = cleanedText.substring(lastIndex, startIndex).trim();
          if (prevText.length > 0) {
            chunks[chunks.length - 1].text += ' ' + prevText;
          }
        }
        
        // Get the text for this clause (from header to next header or end)
        const endIndex = i < clauseHeaders.length - 1 
          ? clauseHeaders[i + 1].index 
          : cleanedText.length;
        
        const clauseText = cleanedText.substring(startIndex, endIndex).trim();
        
        // Check if chunk would be too large, split by sentences if needed
        if (this.estimateTokenCount(clauseText) > this.maxChunkTokens) {
          // Split large clause by sentences
          const sentences = clauseText.split(/(?<=[.!?])\s+/);
          let currentPart = '';
          
          for (const sentence of sentences) {
            if (this.estimateTokenCount(currentPart + sentence) > this.maxChunkTokens && currentPart.length > 0) {
              chunks.push({
                chunk_index: chunks.length,
                text: currentPart.trim()
              });
              currentPart = sentence;
            } else {
              currentPart += (currentPart ? ' ' : '') + sentence;
            }
          }
          
          if (currentPart.trim().length > 0) {
            chunks.push({
              chunk_index: chunks.length,
              text: currentPart.trim()
            });
          }
        } else {
          chunks.push({
            chunk_index: chunks.length,
            text: clauseText
          });
        }
        
        lastIndex = endIndex;
      }
    } else {
      // No clause headers found, split by sentences
      const sentences = cleanedText.split(/(?<=[.!?])\s+(?=[A-Z])/);
      let currentChunk = '';
      let chunkIndex = 0;

      for (const sentence of sentences) {
        const sentenceTokens = this.estimateTokenCount(sentence);
        const currentTokens = this.estimateTokenCount(currentChunk);

        if (currentTokens + sentenceTokens > this.maxChunkTokens && currentChunk.length > 0) {
          chunks.push({
            chunk_index: chunkIndex++,
            text: currentChunk.trim()
          });
          currentChunk = sentence;
        } else {
          currentChunk += (currentChunk ? ' ' : '') + sentence;
        }
      }

      if (currentChunk.trim().length > 0) {
        chunks.push({
          chunk_index: chunkIndex,
          text: currentChunk.trim()
        });
      }
    }

    return chunks;
  }

  async classifyClauses(chunks) {
    if (!chunks || chunks.length === 0) {
      return [];
    }

    const clauseLabels = [
      'Confidentiality',
      'Termination',
      'Payment',
      'Liability',
      'Indemnification',
      'Governing Law',
      'Force Majeure',
      'Introduction',
      'Definitions',
      'Scope',
      'Warranties',
      'Representations',
      'Covenants',
      'Conditions',
      'Dispute Resolution',
      'Intellectual Property',
      'Non-Compete',
      'Severability',
      'Entire Agreement',
      'Amendment',
      'Assignment',
      'Notice',
      'Waiver'
    ];

    const classifiedChunks = [];

    for (const chunk of chunks) {
      // First try pattern-based detection from text
      let clauseType = this.detectClauseTypeFromText(chunk.text);
      
      // If pattern detection didn't find a specific type, try API classification
      if (clauseType === 'General') {
        try {
          const response = await modelsManager.classifyText(chunk.text, 'preprocessing', clauseLabels);

          // Handle zeroShotClassification response format: { sequence, labels: [], scores: [] }
          if (response && Array.isArray(response.labels) && response.labels.length > 0) {
            clauseType = response.labels[0];
            clauseType = this.normalizeClauseType(clauseType);
          } 
          // Handle textClassification response format: { label, score } or [{ label, score }, ...]
          else if (response && response.label) {
            clauseType = this.normalizeClauseType(response.label);
          } 
          // Handle array response format
          else if (response && Array.isArray(response) && response.length > 0) {
            const topLabel = response[0];
            clauseType = topLabel.label || topLabel.labels?.[0] || 'General';
            clauseType = this.normalizeClauseType(clauseType);
          }
        } catch (error) {
          console.debug(`API classification failed for chunk ${chunk.chunk_index}, using pattern detection:`, error.message);
          // Use pattern-based detection as fallback (already set above)
        }
      }

      classifiedChunks.push({
        chunk_index: chunk.chunk_index,
        text: chunk.text,
        clause_type: clauseType
      });
    }

    return classifiedChunks;
  }

  detectClauseTypeFromText(text) {
    if (!text || typeof text !== 'string') return 'General';
    
    const upperText = text.toUpperCase();
    
    // Map clause headers to types
    const clausePatterns = {
      'CONFIDENTIALITY': 'Confidentiality',
      'TERMINATION': 'Termination',
      'PAYMENT': 'Payment',
      'PAYMENT TERMS': 'Payment',
      'LIABILITY': 'Liability',
      'INDEMNIFICATION': 'Indemnification',
      'LIABILITY AND INDEMNIFICATION': 'Liability',
      'GOVERNING LAW': 'Governing Law',
      'JURISDICTION': 'Governing Law',
      'FORCE MAJEURE': 'Force Majeure',
      'INTELLECTUAL PROPERTY': 'Intellectual Property',
      'IP': 'Intellectual Property',
      'NON-COMPETE': 'Non-Compete',
      'NON COMPETE': 'Non-Compete',
      'DISPUTE RESOLUTION': 'Dispute Resolution',
      'ARBITRATION': 'Dispute Resolution',
      'ASSIGNMENT': 'Assignment',
      'NOTICE': 'Notice',
      'SEVERABILITY': 'Severability',
      'ENTIRE AGREEMENT': 'Entire Agreement',
      'AMENDMENT': 'Amendment',
      'WAIVER': 'Waiver'
    };

    // Check if text starts with a clause header
    for (const [pattern, clauseType] of Object.entries(clausePatterns)) {
      if (upperText.startsWith(pattern + '.') || upperText.startsWith(pattern + ' ')) {
        return clauseType;
      }
    }

    // Check if text contains clause keywords
    const keywordPatterns = {
      'confidential': 'Confidentiality',
      'terminate': 'Termination',
      'payment': 'Payment',
      'payable': 'Payment',
      'invoice': 'Payment',
      'liability': 'Liability',
      'indemnify': 'Indemnification',
      'hold harmless': 'Indemnification',
      'governed by': 'Governing Law',
      'jurisdiction': 'Governing Law',
      'force majeure': 'Force Majeure',
      'intellectual property': 'Intellectual Property',
      'copyright': 'Intellectual Property',
      'patent': 'Intellectual Property',
      'trademark': 'Intellectual Property',
      'non-compete': 'Non-Compete',
      'compete': 'Non-Compete',
      'dispute': 'Dispute Resolution',
      'arbitration': 'Dispute Resolution',
      'arbitrate': 'Dispute Resolution',
      'assign': 'Assignment',
      'assignment': 'Assignment'
    };

    for (const [keyword, clauseType] of Object.entries(keywordPatterns)) {
      if (upperText.includes(keyword.toUpperCase())) {
        return clauseType;
      }
    }

    return 'General';
  }

  normalizeClauseType(label) {
    if (!label) return 'General';

    const normalized = label.toLowerCase();

    const clauseTypeMap = {
      'confidentiality': 'Confidentiality',
      'confidential': 'Confidentiality',
      'termination': 'Termination',
      'payment': 'Payment',
      'liability': 'Liability',
      'indemnification': 'Indemnification',
      'governing law': 'Governing Law',
      'jurisdiction': 'Governing Law',
      'force majeure': 'Force Majeure',
      'introduction': 'Introduction',
      'preamble': 'Introduction',
      'definitions': 'Definitions',
      'scope': 'Scope',
      'warranties': 'Warranties',
      'representation': 'Representations',
      'covenants': 'Covenants',
      'conditions': 'Conditions',
      'dispute resolution': 'Dispute Resolution',
      'arbitration': 'Dispute Resolution',
      'intellectual property': 'Intellectual Property',
      'non-compete': 'Non-Compete',
      'severability': 'Severability',
      'entire agreement': 'Entire Agreement',
      'amendment': 'Amendment',
      'assignment': 'Assignment',
      'notice': 'Notice',
      'waiver': 'Waiver'
    };

    for (const [key, value] of Object.entries(clauseTypeMap)) {
      if (normalized.includes(key)) {
        return value;
      }
    }

    return label.charAt(0).toUpperCase() + label.slice(1).toLowerCase();
  }

  async preprocessDocument(rawText) {
    try {
      if (!rawText || typeof rawText !== 'string' || rawText.trim().length === 0) {
        throw new Error('Invalid input: rawText must be a non-empty string');
      }

      const cleanedText = this.cleanText(rawText);

      if (cleanedText.length === 0) {
        throw new Error('Text cleaning resulted in empty string');
      }

      const chunks = this.splitIntoChunks(cleanedText);

      if (chunks.length === 0) {
        throw new Error('No chunks created from cleaned text');
      }

      const classifiedChunks = await this.classifyClauses(chunks);

      return classifiedChunks;
    } catch (error) {
      console.error('Error in preprocessDocument:', error);
      throw new Error(`Preprocessing failed: ${error.message}`);
    }
  }
}

export default new PreprocessingService();
