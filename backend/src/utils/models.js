import { InferenceClient } from '@huggingface/inference';

class ModelsManager {
  constructor() {
    this.clients = new Map();
    this.models = {};
    this.initializeModels();
  }

  initializeModels() {
    const apiToken = process.env.HF_TOKEN || process.env.HUGGINGFACE_API_TOKEN;
    
    if (!apiToken) {
      console.warn('Warning: HF_TOKEN or HUGGINGFACE_API_TOKEN not set. Hugging Face API calls will fail.');
    }

    this.client = new InferenceClient(apiToken);
    
    this.models.legalBert = {
      name: process.env.LEGAL_BERT_MODEL || 'nlpaueb/legal-bert-base-uncased',
      client: this.client,
      provider: 'hf-inference'
    };

    // Use legal-bert-base-uncased for both preprocessing and semantic analysis
    this.models.preprocessing = this.models.legalBert;
    this.models.semantic = this.models.legalBert;
  }

  getClient() {
    return this.client;
  }

  getModel(modelType = 'preprocessing') {
    if (!this.models[modelType]) {
      throw new Error(`Model type '${modelType}' not found. Available types: ${Object.keys(this.models).join(', ')}`);
    }
    return this.models[modelType];
  }

  async classifyText(text, modelType = 'preprocessing', candidateLabels = null) {
    try {
      const model = this.getModel(modelType);
      
      if (candidateLabels && Array.isArray(candidateLabels) && candidateLabels.length > 0) {
        const response = await model.client.zeroShotClassification({
          model: model.name,
          inputs: text,
          parameters: {
            candidate_labels: candidateLabels
          },
          provider: model.provider
        });
        return response;
      } else {
        const response = await model.client.textClassification({
          model: model.name,
          inputs: text,
          provider: model.provider
        });
        return response;
      }
    } catch (error) {
      console.error(`Error in model classification for ${modelType}:`, error.message);
      throw error;
    }
  }

  async fillMask(text, modelType = 'preprocessing') {
    try {
      const model = this.getModel(modelType);
      
      const response = await model.client.fillMask({
        model: model.name,
        inputs: text,
        provider: model.provider
      });
      
      return response;
    } catch (error) {
      console.error(`Error in fillMask for ${modelType}:`, error.message);
      throw error;
    }
  }

  async featureExtraction(text, modelType = 'semantic') {
    try {
      const model = this.getModel(modelType);
      
      const response = await model.client.featureExtraction({
        model: model.name,
        inputs: text,
        provider: model.provider
      });
      
      return response;
    } catch (error) {
      console.error(`Error in featureExtraction for ${modelType}:`, error.message);
      throw error;
    }
  }

  async tokenClassification(text, modelType = 'semantic') {
    try {
      const model = this.getModel(modelType);
      
      const response = await model.client.tokenClassification({
        model: model.name,
        inputs: text,
        provider: model.provider
      });
      
      return response;
    } catch (error) {
      console.error(`Error in tokenClassification for ${modelType}:`, error.message);
      throw error;
    }
  }

  async summarizeText(text, modelType = 'semantic', maxLength = 150, minLength = 30) {
    try {
      const model = this.getModel(modelType);
      
      // Use summarization model, fallback to a general legal summarization model
      const summarizationModel = process.env.SUMMARIZATION_MODEL || 'facebook/bart-large-cnn';
      
      try {
        const response = await this.client.summarization({
          model: summarizationModel,
          inputs: text,
          parameters: {
            max_length: maxLength,
            min_length: minLength
          }
        });
        
        // Handle HuggingFace API response format
        // Response can be: {summary_text: string} or just string
        if (response && typeof response === 'object') {
          if (response.summary_text) {
            return { summary_text: response.summary_text };
          } else if (response[0] && response[0].summary_text) {
            return { summary_text: response[0].summary_text };
          } else if (typeof response === 'string') {
            return { summary_text: response };
          }
        } else if (typeof response === 'string') {
          return { summary_text: response };
        }
        
        // If format is unexpected, use fallback
        return this.generateSummaryFallback(text, maxLength);
      } catch (error) {
        // Fallback: use text generation for summarization if summarization model fails
        console.warn(`Summarization model failed, using fallback: ${error.message}`);
        return this.generateSummaryFallback(text, maxLength);
      }
    } catch (error) {
      console.error(`Error in summarizeText for ${modelType}:`, error.message);
      // Return fallback instead of throwing
      return this.generateSummaryFallback(text, maxLength);
    }
  }

  async generateSummaryFallback(text, maxLength) {
    // Simple extractive summarization fallback
    if (!text || typeof text !== 'string' || text.trim().length === 0) {
      return {
        summary_text: 'No content available for summarization.',
        estimated_length: 0
      };
    }
    
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    if (sentences.length === 0) {
      return {
        summary_text: text.substring(0, Math.min(maxLength * 3, text.length)),
        estimated_length: Math.min(maxLength * 3, text.length)
      };
    }
    
    const words = text.split(/\s+/);
    const targetWordCount = Math.min(maxLength * 3, Math.max(words.length * 0.3, 50)); // Rough estimate
    const targetSentenceCount = Math.max(1, Math.min(5, Math.ceil(sentences.length * 0.2)));
    
    const selectedSentences = sentences.slice(0, Math.min(targetSentenceCount, sentences.length));
    const summaryText = selectedSentences.join('. ').trim() + (selectedSentences.length > 0 ? '.' : '');
    
    return {
      summary_text: summaryText || text.substring(0, Math.min(200, text.length)),
      estimated_length: summaryText.length || Math.min(200, text.length)
    };
  }
}

export default new ModelsManager();

