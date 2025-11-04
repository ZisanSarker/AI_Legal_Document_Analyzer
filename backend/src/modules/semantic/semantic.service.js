import modelsManager from '../../utils/models.js';

class SemanticService {
  constructor() {
    this.riskThresholds = {
      low: 0.3,
      moderate: 0.6,
      high: 0.8
    };
    this.requiredClauses = [
      'Confidentiality',
      'Termination',
      'Payment',
      'Liability',
      'Governing Law',
      'Force Majeure'
    ];
  }


  extractEntitiesFromText(text) {
    if (!text || typeof text !== 'string') return [];
    
    const entities = [];
    const lowerText = text.toLowerCase();
    
    // Extract financial amounts (percentages, currency, numbers)
    const amountPatterns = [
      { pattern: /(\d+(?:\.\d+)?)\s*%/g, type: 'PERCENTAGE', score: 0.9 },
      { pattern: /\$\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/g, type: 'CURRENCY', score: 0.9 },
      { pattern: /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*(?:dollars?|usd|eur|gbp)/gi, type: 'CURRENCY', score: 0.8 }
    ];
    
    amountPatterns.forEach(({ pattern, type, score }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          word: match[0],
          entity: type,
          score: score
        });
      }
    });
    
    // Extract time periods (days, weeks, months, years)
    const timePatterns = [
      { pattern: /(\d+)\s*(?:days?|day)/gi, type: 'TIME_PERIOD', score: 0.85 },
      { pattern: /(\d+)\s*(?:weeks?|week)/gi, type: 'TIME_PERIOD', score: 0.85 },
      { pattern: /(\d+)\s*(?:months?|month)/gi, type: 'TIME_PERIOD', score: 0.85 },
      { pattern: /(\d+)\s*(?:years?|year)/gi, type: 'TIME_PERIOD', score: 0.85 }
    ];
    
    timePatterns.forEach(({ pattern, type, score }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          word: match[0],
          entity: type,
          score: score
        });
      }
    });
    
    // Extract legal entities (parties, organizations)
    const entityPatterns = [
      { pattern: /(?:service provider|client|customer|vendor|supplier|party|parties|company|corporation|llc|inc)/gi, type: 'PARTY', score: 0.8 },
      { pattern: /(?:agreement|contract|agreement|document)/gi, type: 'DOCUMENT', score: 0.7 },
      { pattern: /(?:state|jurisdiction|country|location)\s+of\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/g, type: 'JURISDICTION', score: 0.9 }
    ];
    
    entityPatterns.forEach(({ pattern, type, score }) => {
      let match;
      while ((match = pattern.exec(text)) !== null) {
        entities.push({
          word: match[0],
          entity: type,
          score: score
        });
      }
    });
    
    // Extract penalty/fine terms
    const penaltyTerms = ['penalty', 'fine', 'late fee', 'interest', 'damages', 'breach'];
    penaltyTerms.forEach(term => {
      if (lowerText.includes(term)) {
        const regex = new RegExp(`([^.]*${term}[^.]*)`, 'gi');
        let match;
        while ((match = regex.exec(text)) !== null) {
          entities.push({
            word: match[1].trim(),
            entity: 'PENALTY_CLAUSE',
            score: 0.95
          });
        }
      }
    });
    
    // Remove duplicates and return
    const uniqueEntities = [];
    const seen = new Set();
    entities.forEach(entity => {
      const key = `${entity.word}-${entity.entity}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueEntities.push(entity);
      }
    });
    
    return uniqueEntities;
  }

  computeRiskScore(chunk, entities, clauseType) {
    if (!chunk || !chunk.text) {
      return 0.0;
    }

    let riskScore = 0.0;
    const text = chunk.text || '';
    const lowerText = text.toLowerCase();
    
    // Base risk scores by clause type
    const riskIndicators = {
      'Liability': 0.8,
      'Indemnification': 0.75,
      'Termination': 0.6,
      'Dispute Resolution': 0.55,
      'Payment': 0.5,
      'Non-Compete': 0.45,
      'Confidentiality': 0.4,
      'Intellectual Property': 0.35,
      'Governing Law': 0.3,
      'Waiver': 0.25,
      'Force Majeure': 0.2,
      'Severability': 0.15,
      'Entire Agreement': 0.1,
      'Amendment': 0.1,
      'Assignment': 0.1,
      'Notice': 0.1,
      'Introduction': 0.05,
      'Definitions': 0.05,
      'Scope': 0.05,
      'Warranties': 0.05,
      'Representations': 0.05,
      'Covenants': 0.05,
      'Conditions': 0.05,
      'General': 0.0
    };

    if (clauseType && typeof clauseType === 'string' && riskIndicators[clauseType] !== undefined) {
      riskScore = riskIndicators[clauseType];
    }

    // Analyze entities for risk factors
    if (entities && Array.isArray(entities) && entities.length > 0) {
      entities.forEach(entity => {
        const entityType = entity.entity || '';
        const entityWord = (entity.word || '').toLowerCase();
        
        // Penalty clauses significantly increase risk
        if (entityType === 'PENALTY_CLAUSE') {
          riskScore = Math.min(1.0, riskScore + 0.2);
        }
        
        // High percentages increase risk
        if (entityType === 'PERCENTAGE') {
          const match = entityWord.match(/(\d+(?:\.\d+)?)/);
          if (match) {
            const percent = parseFloat(match[1]);
            if (percent >= 5) {
              riskScore = Math.min(1.0, riskScore + 0.15);
            } else if (percent >= 1) {
              riskScore = Math.min(1.0, riskScore + 0.1);
            }
          }
        }
        
        // Short time periods increase risk (especially for termination/notice)
        if (entityType === 'TIME_PERIOD') {
          const match = entityWord.match(/(\d+)/);
          if (match) {
            const days = parseInt(match[1]);
            if (days <= 7) {
              riskScore = Math.min(1.0, riskScore + 0.2);
            } else if (days <= 30) {
              riskScore = Math.min(1.0, riskScore + 0.1);
            }
          }
        }
        
        // Currency amounts - large amounts increase risk
        if (entityType === 'CURRENCY') {
          const match = entityWord.match(/(\d+(?:,\d{3})*(?:\.\d{2})?)/);
          if (match) {
            const amount = parseFloat(match[1].replace(/,/g, ''));
            if (amount >= 100000) {
              riskScore = Math.min(1.0, riskScore + 0.15);
            } else if (amount >= 10000) {
              riskScore = Math.min(1.0, riskScore + 0.1);
            }
          }
        }
      });
    }

    // Detect high-risk terms and patterns
    const highRiskTerms = {
      'liability': 0.15,
      'damages': 0.15,
      'indemnify': 0.15,
      'penalty': 0.12,
      'fine': 0.12,
      'breach': 0.1,
      'terminate': 0.1,
      'violation': 0.1,
      'unauthorized': 0.1,
      'prohibited': 0.08,
      'restrict': 0.08,
      'exclusive': 0.08
    };
    
    Object.entries(highRiskTerms).forEach(([term, risk]) => {
      if (lowerText.includes(term)) {
        riskScore = Math.min(1.0, riskScore + risk);
      }
    });

    // Detect penalty patterns (e.g., "1% monthly penalty", "late fee")
    const penaltyPatterns = [
      /\d+(?:\.\d+)?\s*%\s*(?:monthly|daily|weekly|annual|penalty|fee|interest)/gi,
      /late\s+(?:fee|payment|charge)/gi,
      /penalty\s+(?:of|rate|fee)/gi
    ];
    
    penaltyPatterns.forEach(pattern => {
      if (pattern.test(text)) {
        riskScore = Math.min(1.0, riskScore + 0.15);
      }
    });

    // Detect short notice periods (higher risk)
    const noticePattern = /(\d+)\s*(?:days?|day)\s*(?:written\s+)?notice/gi;
    const noticeMatch = noticePattern.exec(text);
    if (noticeMatch) {
      const days = parseInt(noticeMatch[1]);
      if (days < 30) {
        riskScore = Math.min(1.0, riskScore + 0.1);
      }
    }

    // Detect arbitration clauses (neutral, but important)
    if (lowerText.includes('arbitration') || lowerText.includes('arbitrate')) {
      // Arbitration itself doesn't increase risk, but dispute resolution clauses do
      if (clauseType === 'Dispute Resolution') {
        riskScore = Math.min(1.0, riskScore + 0.05);
      }
    }

    // Ensure risk score is between 0 and 1
    riskScore = Math.max(0.0, Math.min(1.0, riskScore));
    return Math.round(riskScore * 100) / 100;
  }

  getSimpleRiskLevel(riskScore) {
    if (riskScore >= this.riskThresholds.high) {
      return 'High';
    } else if (riskScore >= this.riskThresholds.moderate) {
      return 'Moderate';
    } else {
      return 'Low';
    }
  }

  detectAdditionalClauses(text) {
    if (!text || typeof text !== 'string') return [];
    
    const detectedClauses = [];
    const lowerText = text.toLowerCase();
    
    // Detect multiple clause types in a single chunk
    const clausePatterns = {
      'Governing Law': /(?:governed|jurisdiction|laws?)\s+(?:of|by)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/i,
      'Dispute Resolution': /(?:arbitration|arbitrate|dispute|resolve|litigation)/i,
      'Termination': /(?:terminate|termination|end|cancel)/i,
      'Payment': /(?:payment|pay|invoice|fee|charge|cost)/i,
      'Confidentiality': /(?:confidential|confidentiality|non-disclosure|privacy)/i,
      'Liability': /(?:liability|liable|damages|responsible)/i,
      'Indemnification': /(?:indemnify|indemnification|hold harmless)/i,
      'Force Majeure': /(?:force majeure|act of god|unforeseeable)/i,
      'Notice': /(?:notice|notify|notification)/i,
      'Assignment': /(?:assign|assignment|transfer)/i
    };
    
    Object.entries(clausePatterns).forEach(([clause, pattern]) => {
      if (pattern.test(text)) {
        detectedClauses.push(clause);
      }
    });
    
    return detectedClauses;
  }

  async extractSemanticFeatures(chunk) {
    let clauseType = chunk.clause_type || 'General';
    const text = chunk.text || '';
    
    // Extract entities using pattern-based extraction
    const entities = this.extractEntitiesFromText(text);
    
    // Detect clause type if not already set
    if (clauseType === 'General') {
    const additionalClauses = this.detectAdditionalClauses(text);
      if (additionalClauses.length > 0) {
      clauseType = additionalClauses[0];
      }
    }
    
    // Calculate risk score based on clause type and entities
    const riskScore = this.computeRiskScore(chunk, entities, clauseType);
    
    return {
      clause_type: clauseType,
      risk_score: riskScore
    };
  }

  computeDocumentSummary(analysisResults) {
    if (!analysisResults || analysisResults.length === 0) {
      return {
        overall_risk_score: 0.0,
        missing_clauses: []
      };
    }

    const riskScores = analysisResults
      .map(result => result.semantic_features?.risk_score)
      .filter(score => typeof score === 'number' && !isNaN(score));
    
    if (riskScores.length === 0) {
      return {
        overall_risk_score: 0.0,
        missing_clauses: []
      };
    }

    const overallRiskScore = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;

    const detectedClauses = new Set(
      analysisResults
        .map(result => result.semantic_features?.clause_type)
        .filter(clause => clause && typeof clause === 'string' && clause !== 'General')
    );

    const missingClauses = this.requiredClauses.filter(
      clause => !detectedClauses.has(clause)
    );

    return {
      overall_risk_score: Math.max(0.0, Math.min(1.0, Math.round(overallRiskScore * 100) / 100)),
      missing_clauses: missingClauses || []
    };
  }

  async generateClauseSummary(text) {
    try {
      if (!text || typeof text !== 'string' || text.trim().length === 0) {
        return 'No content available for summarization.';
      }

      // Estimate summary length based on clause length
      const textLength = text.length;
      const maxLength = Math.min(100, Math.max(30, Math.floor(textLength / 10)));
      const minLength = Math.min(20, Math.max(10, Math.floor(maxLength / 3)));

      try {
        const summaryResult = await modelsManager.summarizeText(text, 'semantic', maxLength, minLength);
        
        let summaryText = '';
        if (summaryResult && summaryResult.summary_text) {
          summaryText = summaryResult.summary_text;
        } else if (summaryResult && typeof summaryResult === 'string') {
          summaryText = summaryResult;
        } else {
          // Fallback to extractive summary
          const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const summarySentenceCount = Math.max(1, Math.min(3, Math.ceil(sentences.length * 0.3)));
          summaryText = sentences.slice(0, summarySentenceCount).join('. ').trim() + (sentences.length > 0 ? '.' : '');
        }

        // Ensure summary text is not empty
        if (!summaryText || summaryText.trim().length === 0) {
          summaryText = text.substring(0, Math.min(150, text.length));
        }

        return summaryText.trim();
      } catch (error) {
        console.debug('Error in clause summarization, using fallback:', error.message);
        // Fallback extractive summarization
        const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const summarySentenceCount = Math.max(1, Math.min(3, Math.ceil(sentences.length * 0.3)));
        const summaryText = sentences.slice(0, summarySentenceCount).join('. ').trim() + (sentences.length > 0 ? '.' : '');
        
        return summaryText || text.substring(0, Math.min(150, text.length));
      }
    } catch (error) {
      console.debug('Error generating clause summary:', error.message);
      // Return a simple extractive summary
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      return sentences.length > 0 
        ? sentences[0].trim() + (sentences.length > 1 ? '...' : '')
        : text.substring(0, Math.min(150, text.length));
    }
  }

  async generateDocumentSummarization(chunks) {
    try {
      if (!chunks || chunks.length === 0) {
        return { summary_text: 'No content available for summarization.' };
      }

      const fullText = chunks.map(chunk => chunk.text || chunk.original_text || '').join(' ').trim();
      
      if (fullText.length === 0) {
        return { summary_text: 'No content available for summarization.' };
      }

      const textLength = fullText.length;
      const maxLength = Math.min(200, Math.max(50, Math.floor(textLength / 20)));
      const minLength = Math.min(30, Math.max(10, Math.floor(maxLength / 3)));

      try {
        const summaryResult = await modelsManager.summarizeText(fullText, 'semantic', maxLength, minLength);
        
        let summaryText = '';
        if (summaryResult && summaryResult.summary_text) {
          summaryText = summaryResult.summary_text;
        } else if (summaryResult && typeof summaryResult === 'string') {
          summaryText = summaryResult;
        } else {
          const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
          const summarySentenceCount = Math.max(1, Math.min(5, Math.ceil(sentences.length * 0.2)));
          summaryText = sentences.slice(0, summarySentenceCount).join('. ').trim() + (sentences.length > 0 ? '.' : '');
        }

        if (!summaryText || summaryText.trim().length === 0) {
          summaryText = fullText.substring(0, Math.min(200, fullText.length));
        }

        return { summary_text: summaryText };
      } catch (error) {
        console.error('Error in summarization, using fallback:', error.message);
        const sentences = fullText.split(/[.!?]+/).filter(s => s.trim().length > 0);
        const summarySentenceCount = Math.max(1, Math.min(5, Math.ceil(sentences.length * 0.2)));
        const summaryText = sentences.slice(0, summarySentenceCount).join('. ').trim() + (sentences.length > 0 ? '.' : '');
        
        return { summary_text: summaryText || fullText.substring(0, Math.min(200, fullText.length)) };
      }
    } catch (error) {
      console.error('Error generating document summarization:', error.message);
      return { summary_text: 'Error generating summary.' };
    }
  }

  detectAnomalies(analysisResults) {
    try {
      if (!analysisResults || analysisResults.length === 0) {
        return { anomalies: [] };
      }

      const anomalies = [];
      const riskScores = analysisResults
        .map(r => r.semantic_features?.risk_score || 0)
        .filter(score => typeof score === 'number' && !isNaN(score));
      
      if (riskScores.length === 0) {
        return { anomalies: [] };
      }

      const avgRisk = riskScores.reduce((sum, score) => sum + score, 0) / riskScores.length;
      
      // Calculate standard deviation safely
      let stdDev = 0.0;
      if (riskScores.length > 1) {
        const variance = riskScores.reduce((sum, score) => sum + Math.pow(score - avgRisk, 2), 0) / riskScores.length;
        stdDev = Math.sqrt(variance);
      }

      // Detect high-risk anomalies (risk score > 2 standard deviations above mean)
      // If stdDev is 0 or very small, use a fixed threshold (avgRisk + 0.3)
      const highRiskThreshold = stdDev > 0.01 
        ? avgRisk + (2 * stdDev) 
        : avgRisk + 0.3;
      
      const highRiskAnomalies = analysisResults.filter(result => {
        const riskScore = result.semantic_features?.risk_score || 0;
        return typeof riskScore === 'number' && !isNaN(riskScore) && riskScore > highRiskThreshold;
      });

      highRiskAnomalies.forEach(result => {
        anomalies.push({
          type: 'high_risk_clause',
          chunk_index: result.chunk_index,
          clause_type: result.semantic_features?.clause_type || 'Unknown',
          risk_score: Math.round((result.semantic_features?.risk_score || 0) * 100) / 100,
          reason: `Risk score significantly above average (threshold: ${Math.round(highRiskThreshold * 100) / 100})`
        });
      });

      // Detect unusual clause types (clauses that appear rarely)
      const clauseCounts = {};
      analysisResults.forEach(result => {
        const clauseType = result.semantic_features?.clause_type || 'General';
        clauseCounts[clauseType] = (clauseCounts[clauseType] || 0) + 1;
      });

      const totalChunks = analysisResults.length;
      const unusualThreshold = 0.05; // 5% of chunks
      
      Object.entries(clauseCounts).forEach(([clauseType, count]) => {
        if (clauseType !== 'General' && count / totalChunks < unusualThreshold && count === 1) {
          const rareClause = analysisResults.find(
            r => (r.semantic_features?.clause_type || 'General') === clauseType
          );
          if (rareClause) {
            anomalies.push({
              type: 'rare_clause_type',
              chunk_index: rareClause.chunk_index,
              clause_type: clauseType,
              frequency: `${count}/${totalChunks}`,
              reason: `Unusual clause type appearing only once in document`
            });
          }
        }
      });

      // Detect compliance anomalies (high risk clauses)
      const highRiskCompliantChunks = analysisResults.filter(result => {
        const riskScore = result.semantic_features?.risk_score || 0;
        return typeof riskScore === 'number' && !isNaN(riskScore) && riskScore >= this.riskThresholds.high;
      });

      highRiskCompliantChunks.forEach(result => {
        if (!anomalies.find(a => a.chunk_index === result.chunk_index && a.type === 'high_risk_clause')) {
          anomalies.push({
            type: 'compliance_anomaly',
            chunk_index: result.chunk_index,
            clause_type: result.semantic_features?.clause_type || 'Unknown',
            reason: 'Non-compliant clause detected'
          });
        }
      });

      // Detect missing required clauses as anomalies
      const detectedClauses = new Set(
        analysisResults
          .map(r => r.semantic_features?.clause_type)
          .filter(c => c && c !== 'General')
      );

      const missingClauses = this.requiredClauses.filter(
        clause => !detectedClauses.has(clause)
      );

      if (missingClauses.length > 0) {
        anomalies.push({
          type: 'missing_required_clause',
          missing_clauses: missingClauses,
          reason: 'Required clauses not found in document'
        });
      }

      // Detect short notice periods (anomaly)
      analysisResults.forEach(result => {
        const text = result.original_text || '';
        const noticeMatch = /(\d+)\s*(?:days?|day)\s*(?:written\s+)?notice/gi.exec(text);
        if (noticeMatch) {
          const days = parseInt(noticeMatch[1]);
          if (days < 30) {
            anomalies.push({
              type: 'short_notice_period',
              chunk_index: result.chunk_index,
              clause_type: result.semantic_features?.clause_type || 'Unknown',
              notice_period: `${days} days`,
              reason: `Notice period of ${days} days is unusually short (recommended: 30+ days)`
            });
          }
        }
      });

      // Detect high penalty rates (anomaly)
      analysisResults.forEach(result => {
        const text = result.original_text || '';
        // Look for percentage patterns in text (e.g., "150%", "5%", etc.)
        const percentagePattern = /(\d+(?:\.\d+)?)\s*%/g;
        let match;
        while ((match = percentagePattern.exec(text)) !== null) {
          const percent = parseFloat(match[1]);
          if (percent >= 5) {
            // Check if this percentage is already detected as an anomaly for this chunk
            const existingAnomaly = anomalies.find(
              a => a.chunk_index === result.chunk_index && 
                   a.type === 'high_penalty_rate' && 
                   a.penalty_rate === `${percent}%`
            );
            if (!existingAnomaly) {
              anomalies.push({
                type: 'high_penalty_rate',
                chunk_index: result.chunk_index,
                clause_type: result.semantic_features?.clause_type || 'Unknown',
                penalty_rate: `${percent}%`,
                reason: `Penalty rate of ${percent}% is unusually high`
              });
            }
          }
        }
      });

      return { anomalies };
    } catch (error) {
      console.error('Error detecting anomalies:', error.message);
      return { anomalies: [] };
    }
  }

  formatAnalysisOutput(analysis, anomalyDetection, documentSummary) {
    try {
      // Create a map of anomalies by chunk_index
      const anomaliesByChunk = {};
      const documentLevelAnomalies = [];
      
      if (anomalyDetection && Array.isArray(anomalyDetection.anomalies)) {
        anomalyDetection.anomalies.forEach(anomaly => {
          if (anomaly.chunk_index !== undefined && anomaly.chunk_index !== null) {
            const chunkIndex = anomaly.chunk_index;
            if (!anomaliesByChunk[chunkIndex]) {
              anomaliesByChunk[chunkIndex] = [];
            }
            // Format anomaly description
            let anomalyDescription = anomaly.reason || '';
            if (anomaly.type === 'high_risk_clause') {
              anomalyDescription = `High risk clause (risk score: ${anomaly.risk_score})`;
            } else if (anomaly.type === 'short_notice_period') {
              anomalyDescription = `Short notice period: ${anomaly.notice_period}`;
            } else if (anomaly.type === 'high_penalty_rate') {
              anomalyDescription = `High penalty rate: ${anomaly.penalty_rate}`;
            } else if (anomaly.type === 'rare_clause_type') {
              anomalyDescription = `Rare clause type (frequency: ${anomaly.frequency})`;
            } else if (anomaly.type === 'compliance_anomaly') {
              anomalyDescription = anomaly.reason || 'Non-compliant clause detected';
            }
            anomaliesByChunk[chunkIndex].push(anomalyDescription);
          } else {
            // Document-level anomalies (e.g., missing required clauses)
            if (anomaly.type === 'missing_required_clause') {
              documentLevelAnomalies.push(`Missing required clauses: ${anomaly.missing_clauses.join(', ')}`);
            } else {
              documentLevelAnomalies.push(anomaly.reason || 'Document-level anomaly detected');
            }
          }
        });
      }

      // Format clauses array
      const clauses = analysis.map(result => {
        const semanticFeatures = result.semantic_features || {};
        const clauseText = result.original_text || '';
        const clauseType = semanticFeatures.clause_type || 'General';
        const riskScore = typeof semanticFeatures.risk_score === 'number' && !isNaN(semanticFeatures.risk_score)
          ? semanticFeatures.risk_score
          : 0.0;
        const riskLevel = this.getSimpleRiskLevel(riskScore);
        
        // Get anomalies for this clause
        const clauseAnomalies = anomaliesByChunk[result.chunk_index] || [];

      return {
          type: clauseType,
          text: clauseText,
          summary: result.clause_summary || 'Summary not available',
          risk: riskLevel,
          anomalies: clauseAnomalies
        };
      });

      // Build document summary text
      let documentSummaryText = documentSummary.summary_text || '';
      
      // Add risk information
      const overallRisk = documentSummary.overall_risk_score || 0.0;
      const overallRiskLevel = this.getSimpleRiskLevel(overallRisk);
      
      // Build comprehensive document summary
      const summaryParts = [];
      
      if (documentSummaryText) {
        summaryParts.push(documentSummaryText);
      }
      
      // Add key clauses identified
      const clauseTypes = clauses.map(c => c.type).filter(t => t !== 'General');
      const uniqueClauseTypes = [...new Set(clauseTypes)];
      if (uniqueClauseTypes.length > 0) {
        summaryParts.push(`Key clauses identified: ${uniqueClauseTypes.slice(0, 5).join(', ')}${uniqueClauseTypes.length > 5 ? '...' : ''}.`);
      }
      
      // Add risk information
      summaryParts.push(`Overall risk level: ${overallRiskLevel}.`);
      
      // Add high-risk clauses count
      const highRiskClauses = clauses.filter(c => c.risk === 'High');
      if (highRiskClauses.length > 0) {
        summaryParts.push(`${highRiskClauses.length} high-risk clause${highRiskClauses.length > 1 ? 's' : ''} detected.`);
      }
      
      // Add missing clauses information
      if (documentSummary.missing_clauses && documentSummary.missing_clauses.length > 0) {
        summaryParts.push(`Missing required clauses: ${documentSummary.missing_clauses.join(', ')}.`);
      }
      
      // Add document-level anomalies
      if (documentLevelAnomalies.length > 0) {
        summaryParts.push(`Potential issues: ${documentLevelAnomalies.join('; ')}.`);
      }

      return {
        clauses: clauses,
        document_summary: summaryParts.join(' ').trim() || 'Document analysis completed.'
      };
    } catch (error) {
      console.error('Error formatting analysis output:', error.message);
      // Return minimal valid structure
      return {
        clauses: analysis.map(result => ({
          type: result.semantic_features?.clause_type || 'General',
          text: result.original_text || '',
          summary: result.clause_summary || 'Summary not available',
          risk: this.getSimpleRiskLevel(result.semantic_features?.risk_score || 0.0),
          anomalies: []
        })),
        document_summary: documentSummary?.summary_text || 'Document analysis completed.'
      };
    }
  }

  async analyzeDocument(chunks) {
    try {
      if (!chunks || !Array.isArray(chunks) || chunks.length === 0) {
        throw new Error('Invalid input: chunks must be a non-empty array');
      }

      const analysis = [];

      // Process each chunk and extract semantic features
      for (const chunk of chunks) {
        if (!chunk || !chunk.text) {
          console.warn(`Skipping invalid chunk at index ${chunk?.chunk_index || 'unknown'}`);
          continue;
        }

        // Extract semantic features from chunk
        const semanticFeatures = await this.extractSemanticFeatures(chunk);
        
        // Ensure chunk_index is valid - use chunk.chunk_index if available, otherwise use array index
        const chunkIndex = typeof chunk.chunk_index === 'number' && chunk.chunk_index >= 0 
          ? chunk.chunk_index 
          : analysis.length;
        
        // Generate clause summary
        let clauseSummary = '';
        try {
          clauseSummary = await this.generateClauseSummary(chunk.text || '');
        } catch (error) {
          console.debug(`Error generating clause summary for chunk ${chunkIndex}, using fallback:`, error.message);
          // Fallback: use first sentence or first 150 chars
          const sentences = (chunk.text || '').split(/[.!?]+/).filter(s => s.trim().length > 0);
          clauseSummary = sentences.length > 0 
            ? sentences[0].trim() + (sentences.length > 1 ? '...' : '')
            : (chunk.text || '').substring(0, Math.min(150, (chunk.text || '').length));
        }
        
        // Ensure semantic features are valid
        if (!semanticFeatures || typeof semanticFeatures !== 'object') {
          console.warn(`Invalid semantic features for chunk ${chunkIndex}, calculating from clause type`);
          const clauseType = chunk.clause_type || 'General';
          const riskScore = this.computeRiskScore(chunk, [], clauseType);
          
          analysis.push({
            chunk_index: chunkIndex,
            original_text: chunk.text || '',
            clause_summary: clauseSummary,
            semantic_features: {
              clause_type: clauseType,
              risk_score: riskScore
            }
          });
        } else {
          analysis.push({
            chunk_index: chunkIndex,
            original_text: chunk.text || '',
            clause_summary: clauseSummary,
            semantic_features: {
              clause_type: semanticFeatures.clause_type || chunk.clause_type || 'General',
              risk_score: typeof semanticFeatures.risk_score === 'number' && !isNaN(semanticFeatures.risk_score)
                ? Math.max(0.0, Math.min(1.0, Math.round(semanticFeatures.risk_score * 100) / 100))
                : 0.0
            }
          });
        }
      }

      if (analysis.length === 0) {
        throw new Error('No valid chunks found for analysis');
      }

      // Generate document summary (risk-based)
      let summary;
      try {
        summary = this.computeDocumentSummary(analysis);
      } catch (error) {
        console.error('Error computing document summary:', error.message);
        summary = {
          overall_risk_score: 0.0,
          missing_clauses: []
        };
      }

      // Generate text summarization
      let summarization;
      try {
        summarization = await this.generateDocumentSummarization(chunks);
      } catch (error) {
        console.error('Error generating summarization:', error.message);
        summarization = { summary_text: 'Error generating summary.' };
      }

      // Detect anomalies
      let anomalyDetection;
      try {
        anomalyDetection = this.detectAnomalies(analysis);
      } catch (error) {
        console.error('Error detecting anomalies:', error.message);
        anomalyDetection = { anomalies: [] };
      }

      // Prepare summary for formatting
      const safeSummary = {
        overall_risk_score: typeof summary?.overall_risk_score === 'number' 
          ? Math.max(0.0, Math.min(1.0, Math.round(summary.overall_risk_score * 100) / 100))
          : 0.0,
        missing_clauses: Array.isArray(summary?.missing_clauses) ? summary.missing_clauses : [],
        summary_text: typeof summarization?.summary_text === 'string' ? summarization.summary_text : ''
      };

      const safeAnomalyDetection = {
        anomalies: Array.isArray(anomalyDetection?.anomalies) ? anomalyDetection.anomalies : []
      };

      return this.formatAnalysisOutput(analysis, safeAnomalyDetection, safeSummary);
    } catch (error) {
      console.error('Error in analyzeDocument:', error);
      throw new Error(`Semantic analysis failed: ${error.message}`);
    }
  }
}

export default new SemanticService();

