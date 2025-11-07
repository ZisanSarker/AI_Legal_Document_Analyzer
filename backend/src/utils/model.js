import { InferenceClient } from '@huggingface/inference';

class ModelsManager {
  constructor() {
    this.clients = new Map();
    this.models = {};
    this.initializeModels();
  }

  initializeModels() {
    const apiToken =
      process.env.HF_API_KEY ||
      process.env.HF_TOKEN ||
      process.env.HUGGINGFACE_API_TOKEN;

    if (!apiToken) {
      console.warn(
        '⚠️ Warning: HF_API_KEY / HF_TOKEN not set. Hugging Face API calls will fail.'
      );
    }

    this.client = new InferenceClient(apiToken);

    this.models.legalBert = {
      name: process.env.LEGAL_BERT_MODEL || 'nlpaueb/legal-bert-base-uncased',
      client: this.client,
      provider: 'hf-inference',
    };

    this.models.zeroShot = {
      name: process.env.ZERO_SHOT_MODEL || 'MoritzLaurer/deberta-v3-large-zeroshot-v1',
      client: this.client,
      provider: 'hf-inference',
    };

    this.models.preprocessing = this.models.legalBert;
    this.models.semantic = this.models.legalBert;
  }

  getClient() {
    return this.client;
  }

  getModel(modelType = 'semantic') {
    if (!this.models[modelType]) {
      throw new Error(
        `Model type '${modelType}' not found. Available types: ${Object.keys(
          this.models
        ).join(', ')}`
      );
    }
    return this.models[modelType];
  }

  async classifyText(text, modelType = 'semantic', candidateLabels = null) {
    try {
      const model =
        candidateLabels && candidateLabels.length
          ? this.models.zeroShot
          : this.getModel(modelType);

      if (candidateLabels && candidateLabels.length) {
        const response = await model.client.zeroShotClassification({
          model: model.name,
          inputs: text,
          parameters: { 
            candidate_labels: candidateLabels,
            multi_label: true,
          },
        });
        return response;
      } else {
        const response = await model.client.textClassification({
          model: model.name,
          inputs: text,
        });
        return response;
      }
    } catch (error) {
      throw error;
    }
  }

  async featureExtraction(text, modelType = 'semantic') {
    const model = this.getModel(modelType);
    const response = await model.client.featureExtraction({
      model: model.name,
      inputs: text,
      provider: model.provider,
    });
    return response;
  }

  async tokenClassification(text, modelType = 'semantic') {
    const model = this.getModel(modelType);
    const response = await model.client.tokenClassification({
      model: model.name,
      inputs: text,
      provider: model.provider,
    });
    return response;
  }

  async summarizeText(text, modelType = 'semantic', maxLength = 150, minLength = 30) {
    const model = this.getModel(modelType);
    const summarizationModel =
      process.env.SUMMARIZATION_MODEL || 'facebook/bart-large-cnn';

    try {
      const response = await this.client.summarization({
        model: summarizationModel,
        inputs: text,
        parameters: { max_length: maxLength, min_length: minLength },
      });

      if (response?.summary_text) return { summary_text: response.summary_text };
      if (Array.isArray(response) && response[0]?.summary_text)
        return { summary_text: response[0].summary_text };
      if (typeof response === 'string') return { summary_text: response };

      return this.generateSummaryFallback(text, maxLength);
    } catch (error) {
      console.warn('⚠️ Summarization failed, using fallback:', error.message);
      return this.generateSummaryFallback(text, maxLength);
    }
  }

  async generateSummaryFallback(text, maxLength) {
    if (!text?.trim()) {
      return { summary_text: 'No content available for summarization.', estimated_length: 0 };
    }

    const sentences = text.split(/[.!?]+/).filter((s) => s.trim().length > 0);
    const selectedSentences = sentences.slice(0, Math.min(3, sentences.length));
    const summaryText = selectedSentences.join('. ').trim() + '.';

    return {
      summary_text:
        summaryText || text.substring(0, Math.min(200, text.length)),
      estimated_length: summaryText.length || Math.min(200, text.length),
    };
  }
}

const modelsManager = new ModelsManager();

export const getEmbeddings = async (text) => {
  const result = await modelsManager.featureExtraction(text, 'semantic');
  return Array.isArray(result) ? result[0] : result;
};

export const getTokenClassification = async (text) => {
  const tokens = await modelsManager.tokenClassification(text, 'semantic');
  return Array.isArray(tokens) ? tokens : [tokens];
};

export const getZeroShotClassification = async (text, candidateLabels) => {
  return await modelsManager.classifyText(text, 'zeroShot', candidateLabels);
};

export default modelsManager;