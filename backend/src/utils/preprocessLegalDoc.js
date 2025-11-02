import fs from 'fs';
import path from 'path';

export async function preprocessDocument(input, options = {}) {
  const { isFilePath = false, maxTokensPerClause = 500 } = options;
  
  let rawText = input;
  if (isFilePath) {
    rawText = fs.readFileSync(input, 'utf8');
  }
  
  const cleanedText = cleanText(rawText);
  const documentTitle = extractTitle(cleanedText);
  const documentType = classifyDocumentType(cleanedText, documentTitle);
  const metadata = extractMetadata(cleanedText);
  const clauses = extractClauses(cleanedText, maxTokensPerClause);
  const definitions = extractDefinitions(cleanedText);
  
  return {
    documentTitle,
    documentType,
    metadata: {
      ...metadata,
      definitions,
      statistics: {
        totalCharacters: cleanedText.length,
        totalClauses: clauses.length,
        estimatedPages: Math.ceil(cleanedText.length / 3000),
        definedTermsCount: definitions.length
      }
    },
    clauses
  };
}

function cleanText(text) {
  if (!text || typeof text !== 'string') return '';
  
  let cleaned = text;
  
  cleaned = cleaned.replace(/[\u200C\u200D\uFEFF]/g, '');
  cleaned = cleaned.replace(/[\u00A0\u2000-\u200B\u2028\u2029]/g, ' ');
  cleaned = cleaned.replace(/[\u200E\u200F\u202A-\u202E\u2060-\u206F]/g, '');
  
  cleaned = cleaned.replace(/[\u2010-\u2015\u2212]/g, '-');
  cleaned = cleaned.replace(/[\u2018\u2019]/g, "'");
  cleaned = cleaned.replace(/[\u201C\u201D]/g, '"');
  cleaned = cleaned.replace(/[\u2026]/g, '...');
  cleaned = cleaned.replace(/[\u00B7\u2022\u2023\u2043\u2219]/g, '-');
  
  cleaned = cleaned.replace(/§/g, 'Section ');
  cleaned = cleaned.replace(/¶/g, 'Para. ');
  cleaned = cleaned.replace(/©/g, '(c)');
  cleaned = cleaned.replace(/®/g, '(R)');
  cleaned = cleaned.replace(/™/g, '(TM)');
  
  cleaned = cleaned.replace(/\bPage\s+\d+\s+(?:of|\/)\s+\d+\b/gi, '');
  cleaned = cleaned.replace(/\[\s*Page\s+\d+\s*\]/gi, '');
  cleaned = cleaned.replace(/^\s*Page\s+\d+\s*$/gmi, '');
  cleaned = cleaned.replace(/^[-–—]\s*\d+\s*[-–—]\s*$/gm, '');
  cleaned = cleaned.replace(/^[-_]{3,}\s*$/gm, '');
  
  cleaned = cleaned.replace(/^CONFIDENTIAL[\s\S]*?$/gmi, '');
  cleaned = cleaned.replace(/^DRAFT[\s\S]*?$/gmi, '');
  cleaned = cleaned.replace(/^PROPRIETARY[\s\S]*?$/gmi, '');
  cleaned = cleaned.replace(/^\s*[-_]\s*\d+\s*[-_]\s*$/gm, '');
  
  cleaned = cleaned.replace(/\b(v\.|vs\.|versus)\s+([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)/gi, 'v. $2');
  
  cleaned = cleaned.replace(/(\d+)\s*[\u00B0\u00BA]\s*F/gi, '$1 degrees F');
  cleaned = cleaned.replace(/(\d+)\s*[\u00B0\u00BA]/g, '$1 degrees');
  
  cleaned = cleaned.replace(/\b\d{1,2}:\d{2}\s*(?:AM|PM|am|pm)\b/gi, (match) => match.toLowerCase());
  
  cleaned = cleaned.replace(/\b([A-Z]{2,})\s+v\.\s+([A-Z][a-z]+)/g, '$1 v. $2');
  cleaned = cleaned.replace(/\b(\d{3,4})\s+U\.S\.\s+(\d+)\b/g, '$1 U.S. $2');
  cleaned = cleaned.replace(/\b(\d{3,4})\s+F\.\s*(2d|3d|Supp\.)\s+(\d+)\b/gi, '$1 F.$2 $3');
  cleaned = cleaned.replace(/\b(\d{1,3})\s+S\.Ct\.\s+(\d+)\b/gi, '$1 S. Ct. $2');
  
  cleaned = cleaned.replace(/\b(\d{1,2})\s+(January|February|March|April|May|June|July|August|September|October|November|December)\s+(\d{4})\b/gi, '$1 $2 $3');
  
  cleaned = cleaned.replace(/\$\s+(\d+(?:,\d{3})*(?:\.\d{2})?)/g, '$$$1');
  cleaned = cleaned.replace(/(\d+)\s*USD/g, '$$$1');
  cleaned = cleaned.replace(/(\d+)\s*EUR/g, '€$1');
  cleaned = cleaned.replace(/(\d+)\s*GBP/g, '£$1');
  
  cleaned = cleaned.replace(/\b(\d+(?:,\d{3})*)\s*(thousand|million|billion|trillion)\b/gi, '$1 $2');
  cleaned = cleaned.replace(/\b(\d+)\s*%\s*(interest|rate|fee|discount|commission)/gi, '$1% $2');
  
  cleaned = cleaned.replace(/\(cid:\d+\)/g, '');
  cleaned = cleaned.replace(/\[.*?PDF.*?\]/gi, '');
  cleaned = cleaned.replace(/\[.*?Image.*?\]/gi, '');
  
  cleaned = cleaned.replace(/[^\x20-\x7E\u00A0-\uFFFF\s]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code >= 0xFF00 && code <= 0xFFEF) {
      return String.fromCharCode(code - 0xFEE0);
    }
    if (code === 0x3000) return ' ';
    return '';
  });
  
  cleaned = cleaned.replace(/\t+/g, ' ');
  cleaned = cleaned.replace(/\r\n/g, '\n');
  cleaned = cleaned.replace(/\r/g, '\n');
  cleaned = cleaned.replace(/\f/g, '\n');
  cleaned = cleaned.replace(/\v/g, ' ');
  
  cleaned = cleaned.replace(/[ \u00A0]+/g, ' ');
  cleaned = cleaned.replace(/\n[ \t]+/g, '\n');
  cleaned = cleaned.replace(/[ \t]+\n/g, '\n');
  
  cleaned = cleaned.replace(/\n{4,}/g, '\n\n\n');
  cleaned = cleaned.replace(/([.!?])\s*\n\s*([A-Z"'([])/g, '$1 $2');
  cleaned = cleaned.replace(/([.!?])\s*\n\s*([a-z])/g, '$1 $2');
  
  cleaned = cleaned.replace(/\b([A-Z]{2,})\s+([A-Z][a-z]+)/g, (match, p1, p2) => {
    if (p1.length <= 5 && /^(LLC|INC|LTD|CORP|CO|LP|LLP|PC|PLLC|GMBH|AG|SA|SAS|SARL|BV|NV|SPA|PTY|PTE|AB)$/i.test(p1)) {
      return match;
    }
    return p1 + ' ' + p2;
  });
  
  cleaned = cleaned.replace(/(\d)\s*-\s*(\d)/g, '$1-$2');
  cleaned = cleaned.replace(/([A-Za-z])\s*-\s*([A-Za-z])/g, '$1 - $2');
  
  cleaned = cleaned.replace(/\b([A-Z][a-z]+)\s+([A-Z]\.\s*[A-Z]\.)/g, '$1 $2');
  cleaned = cleaned.replace(/\b([A-Z]\.)\s+([A-Z][a-z]+)/g, '$1 $2');
  
  cleaned = cleaned.replace(/[""]/g, '"');
  cleaned = cleaned.replace(/['']/g, "'");
  cleaned = cleaned.replace(/[«»]/g, '"');
  cleaned = cleaned.replace(/['']/g, "'");
  
  cleaned = cleaned.replace(/\*{3,}/g, '[***]');
  cleaned = cleaned.replace(/\[REDACTED\]/gi, '[***]');
  cleaned = cleaned.replace(/\[.*?REDACT.*?\]/gi, '[***]');
  cleaned = cleaned.replace(/\[.*?CONFIDENTIAL.*?\]/gi, '[***]');
  
  cleaned = cleaned.replace(/\.{4,}/g, '...');
  
  cleaned = cleaned.replace(/([.!?])\s*([.!?])/g, '$1');
  cleaned = cleaned.replace(/([,;:])\s*([,;:])/g, '$1');
  
  cleaned = cleaned.replace(/\([\s\n]*\)/g, '');
  cleaned = cleaned.replace(/\[[\s\n]*\]/g, '');
  cleaned = cleaned.replace(/\{[\s\n]*\}/g, '');
  
  cleaned = cleaned.replace(/(\w)\s*\(\s*([^)]+?)\s*\)\s*([A-Za-z])/g, '$1 ($2) $3');
  
  cleaned = cleaned.split('\n').map(line => {
    line = line.trim();
    if (line.match(/^[-•▪●◦]\s*$/)) return '';
    if (line.match(/^[_\-\s]*$/)) return '';
    return line;
  }).filter(line => line.length > 0 || line === '\n').join('\n');
  
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  cleaned = cleaned.replace(/([.!?])\s*\n\s*([A-Z"'([])/g, '$1 $2');
  
  cleaned = cleaned.replace(/^\s+|\s+$/gm, '');
  cleaned = cleaned.replace(/^[\s\n]+|[\s\n]+$/g, '');
  
  cleaned = cleaned.replace(/(\w)\s+([.,;:!?])/g, '$1$2');
  cleaned = cleaned.replace(/([.,;:!?])\s+([.,;:!?])/g, '$1');
  cleaned = cleaned.replace(/([.,;:!?])\s*([A-Za-z])/g, '$1 $2');
  
  cleaned = cleaned.replace(/\b(\d+)\s*-\s*(\d+)\s*-\s*(\d+)\b/g, '$1-$2-$3');
  cleaned = cleaned.replace(/\b(\d{1,2})\s*\/\s*(\d{1,2})\s*\/\s*(\d{4})\b/g, '$1/$2/$3');
  
  cleaned = cleaned.replace(/([A-Za-z])\s+([A-Z]\.\s*)([A-Za-z])/g, '$1 $2$3');
  
  if (cleaned.length === 0) return '';
  
  return cleaned;
}

function extractTitle(text) {
  const lines = text.split('\n').filter(line => line.trim());
  
  if (lines.length === 0) return 'Untitled Document';
  

  for (let i = 0; i < Math.min(10, lines.length); i++) {
    const line = lines[i].trim();
    

    if (line.length > 120) continue;
    

    if (/^(this|the|between|dated|whereas|hereby|witnesseth|recitals|background)/i.test(line)) continue;
    

    if (line === line.toUpperCase() && line.length > 3 && line.length < 120) {

      if (!/^(article|section|clause|exhibit|schedule|annex)\s+/i.test(line)) {
        return line;
      }
    }
    

    if (line.length < 100 && /\b(agreement|contract|deed|memorandum|articles|charter|bylaws|terms|policy|lease|license|indenture|amendment|addendum|waiver)\b/i.test(line)) {
      return line;
    }
    

    if (/^(amendment|addendum|exhibit|schedule)\s+(no\.|number|#)?\s*\d+/i.test(line)) {
      return line;
    }
  }
  

  const firstLine = lines.find(l => l.length > 10 && l.length < 120);
  return firstLine || lines[0] || 'Untitled Document';
}

function classifyDocumentType(text, title) {
  const lowerText = text.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  const types = [
    { pattern: /\b(service|master|purchase|sale|supply|distribution)\s+agreement\b/i, type: 'Service Agreement' },
    { pattern: /\b(employment|offer\s+letter|employment\s+contract)\b/i, type: 'Employment Agreement' },
    { pattern: /\b(non-disclosure|nda|confidentiality)\s+(agreement)?\b/i, type: 'Non-Disclosure Agreement (NDA)' },
    { pattern: /\b(lease|rental)\s+agreement\b/i, type: 'Lease Agreement' },
    { pattern: /\b(license|licensing)\s+agreement\b/i, type: 'License Agreement' },
    { pattern: /\b(loan|credit|financing)\s+agreement\b/i, type: 'Loan Agreement' },
    { pattern: /\b(partnership|joint\s+venture)\b/i, type: 'Partnership Agreement' },
    { pattern: /\b(shareholder|stock\s+purchase)\s+agreement\b/i, type: 'Shareholder Agreement' },
    { pattern: /\b(merger|acquisition|purchase)\s+agreement\b/i, type: 'M&A Agreement' },
    { pattern: /\b(terms\s+(of|and)\s+(service|use)|terms\s+&\s+conditions)\b/i, type: 'Terms of Service' },
    { pattern: /\b(privacy\s+policy|data\s+protection)\b/i, type: 'Privacy Policy' },
    { pattern: /\b(power\s+of\s+attorney|poa)\b/i, type: 'Power of Attorney' },
    { pattern: /\b(will|testament|trust)\b/i, type: 'Estate Document' },
    { pattern: /\b(deed|title|conveyance)\b/i, type: 'Property Deed' },
    { pattern: /\b(promissory\s+note|note\s+agreement)\b/i, type: 'Promissory Note' },
    { pattern: /\b(settlement|release)\s+agreement\b/i, type: 'Settlement Agreement' },
    { pattern: /\b(consulting|contractor|freelance)\s+agreement\b/i, type: 'Consulting Agreement' },
    { pattern: /\b(amendment|modification|addendum)\b/i, type: 'Amendment' },
    { pattern: /\b(articles\s+of\s+incorporation|certificate\s+of\s+incorporation)\b/i, type: 'Articles of Incorporation' },
    { pattern: /\b(bylaws|by-laws)\b/i, type: 'Bylaws' },
    { pattern: /\b(memorandum\s+of\s+understanding|mou)\b/i, type: 'Memorandum of Understanding (MOU)' },
    { pattern: /\b(letter\s+of\s+intent|loi)\b/i, type: 'Letter of Intent (LOI)' },
    { pattern: /\b(warrant|warrant\s+agreement)\b/i, type: 'Warrant Agreement' },
    { pattern: /\b(indemnity|indemnification)\s+agreement\b/i, type: 'Indemnity Agreement' }
  ];
  

  for (const { pattern, type } of types) {
    if (pattern.test(lowerTitle)) {
      return type;
    }
  }
  

  const docStart = lowerText.substring(0, 500);
  for (const { pattern, type } of types) {
    if (pattern.test(docStart)) {
      return type;
    }
  }
  
  return 'General Legal Document';
}

function extractMetadata(text) {
  return {
    parties: extractParties(text),
    dates: extractDates(text),
    jurisdiction: extractJurisdiction(text),
    amounts: extractAmounts(text),
    term: extractTerm(text),
    governingLaw: extractGoverningLaw(text)
  };
}

function extractParties(text) {
  const parties = [];
  const seenParties = new Set();
  

  const betweenPatterns = [

    /\bbetween\s+(.+?)\s+and\s+(.+?)\s+(?:on|dated|effective|as\s+of)\s+[^.]+\./is,

    /\bbetween\s+(.+?)\s+and\s+(.+?)(?:\.|\s*,\s*(?:dated|effective|executed|entered))/is,

    /\bby\s+and\s+between\s+(.+?)\s+and\s+(.+?)\s+(?:on|dated|effective|as\s+of)\s+[^.]+\./is,
    /\bby\s+and\s+between\s+(.+?)\s+and\s+(.+?)(?:\.|\s*,\s*(?:dated|effective|executed|entered))/is,

    /\bparties[:\s]+(.+?)\s+and\s+(.+?)(?:\n\n|\.(?:\s+[A-Z])|$)/is
  ];
  
  let betweenMatch = null;
  for (const pattern of betweenPatterns) {
    betweenMatch = text.match(pattern);
    if (betweenMatch) break;
  }
  
  if (betweenMatch) {
    let party1Text = betweenMatch[1].trim();
    let party2Text = betweenMatch[2].trim();
    
    const extractPartyNames = (partyText) => {
      const names = [];
      

      let cleaned = partyText

        .replace(/\s*,?\s*(?:dated|on|effective|as\s+of)\s+.*$/is, '')

        .replace(/\s*,\s*(?:located\s+at|with\s+(?:its\s+)?(?:principal\s+)?(?:place\s+of\s+)?business\s+at|having\s+its).*$/is, '')

        .replace(/\s*,?\s*hereinafter\s+referred\s+to\s+as.*$/is, '')
        .trim();
      

      const aliasPattern = /^(.+?)\.?\s*\(\s*["']?([^)"']+?)["']?\s*\)$/;
      const aliasMatch = cleaned.match(aliasPattern);
      
      if (aliasMatch) {
        const formalName = aliasMatch[1].trim().replace(/[,;:]$/, '');
        const alias = aliasMatch[2].trim();
        
        if (formalName.length > 1 && formalName.length < 200) {
          names.push({ name: formalName, type: 'formal' });
        }
        if (alias.length > 0 && alias.length < 50) {
          names.push({ name: alias, type: 'alias' });
        }
      } else {

        const finalName = cleaned.replace(/[,;:]$/, '').trim();
        if (finalName.length > 1 && finalName.length < 200) {
          names.push({ name: finalName, type: 'formal' });
        }
      }
      
      return names;
    };
    
    const party1Names = extractPartyNames(party1Text);
    const party2Names = extractPartyNames(party2Text);
    
    [...party1Names, ...party2Names].forEach(({ name, type }) => {
      const normalized = name.trim();
      if (!seenParties.has(normalized)) {
        parties.push({ name: normalized, role: 'party', type });
        seenParties.add(normalized);
      }
    });
  }
  

  if (parties.length >= 2) {
    return parties.map(p => p.name);
  }
  

  const entityPatterns = [

    /\b([A-Z][A-Za-z0-9\s&.,''-]+?\s+(?:Inc|LLC|Ltd|Corp|L\.L\.C\.|Corporation|Company|Limited|Incorporated|LP|LLP|LLLP|PC|PLLC|PLC))\.?\b/g,

    /\b([A-Z][A-Za-z0-9\s&.,''-]+?\s+(?:GmbH|AG|SA|SAS|SARL|BV|NV|SpA|Pty|Pte|AB))\.?\b/g,

    /\b((?:The\s+)?(?:United\s+States|State|City|County|Commonwealth|Province|Government)\s+of\s+[A-Z][A-Za-z\s]+)/g,

    /\b((?:Mr|Mrs|Ms|Dr|Prof)\.?\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)/g
  ];
  
  for (const pattern of entityPatterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const entity = match[1].trim().replace(/\.$/, '');
      const normalized = entity.trim();
      
      if (normalized.length > 3 && normalized.length < 200 && !seenParties.has(normalized)) {
        parties.push(normalized);
        seenParties.add(normalized);
        if (parties.length >= 10) break;
      }
    }
    if (parties.length >= 10) break;
  }
  
  return parties.length > 0 ? parties : null;
}

function extractDates(text) {
  const dates = {
    effectiveDate: null,
    executionDate: null,
    expirationDate: null,
    allDates: []
  };
  
  const monthMap = {
    january: '01', jan: '01', february: '02', feb: '02', march: '03', mar: '03',
    april: '04', apr: '04', may: '05', june: '06', jun: '06', july: '07', jul: '07',
    august: '08', aug: '08', september: '09', sept: '09', sep: '09',
    october: '10', oct: '10', november: '11', nov: '11', december: '12', dec: '12'
  };
  
  const datePatterns = [

    { regex: /(\d{1,2})(?:st|nd|rd|th)?\s+(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\.?\s+(\d{4})/gi, format: 'dmy' },

    { regex: /(January|February|March|April|May|June|July|August|September|October|November|December|Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sept?|Oct|Nov|Dec)\.?\s+(\d{1,2})(?:st|nd|rd|th)?,?\s+(\d{4})/gi, format: 'mdy' },

    { regex: /(\d{4})-(\d{2})-(\d{2})/g, format: 'iso' },

    { regex: /(\d{1,2})\/(\d{1,2})\/(\d{4})/g, format: 'slash' },

    { regex: /(\d{1,2})\.(\d{1,2})\.(\d{4})/g, format: 'dot' }
  ];
  
  const normalizeDate = (match, format) => {
    try {
      let year, month, day;
      
      if (format === 'dmy') {
        day = match[1].padStart(2, '0');
        month = monthMap[match[2].toLowerCase()];
        year = match[3];
      } else if (format === 'mdy') {
        month = monthMap[match[1].toLowerCase()];
        day = match[2].padStart(2, '0');
        year = match[3];
      } else if (format === 'iso') {
        year = match[1];
        month = match[2];
        day = match[3];
      } else if (format === 'slash' || format === 'dot') {
        const part1 = parseInt(match[1]);
        const part2 = parseInt(match[2]);
        year = match[3];
        

        if (part1 > 12) {
          day = match[1].padStart(2, '0');
          month = match[2].padStart(2, '0');
        } else if (part2 > 12) {

          month = match[1].padStart(2, '0');
          day = match[2].padStart(2, '0');
        } else {

          month = match[1].padStart(2, '0');
          day = match[2].padStart(2, '0');
        }
      }
      

      const monthNum = parseInt(month);
      const dayNum = parseInt(day);
      if (monthNum < 1 || monthNum > 12 || dayNum < 1 || dayNum > 31) {
        return null;
      }
      
      return `${year}-${month}-${day}`;
    } catch (e) {
      return null;
    }
  };
  

  const allFoundDates = [];
  for (const { regex, format } of datePatterns) {
    let match;
    const regexCopy = new RegExp(regex.source, regex.flags);
    while ((match = regexCopy.exec(text)) !== null) {
      const normalized = normalizeDate(match, format);
      if (normalized) {
        allFoundDates.push({
          date: normalized,
          context: text.substring(Math.max(0, match.index - 30), Math.min(text.length, match.index + match[0].length + 30))
        });
      }
    }
  }
  
  dates.allDates = [...new Set(allFoundDates.map(d => d.date))];
  

  const effectivePatterns = [
    /(?:effective|commencing|starting|beginning)\s+(?:date|on|as\s+of)?\s*:?\s*([^.\n]{0,50})/i,
    /(?:dated|executed|entered\s+into)\s+(?:as\s+of|on)?\s*:?\s*([^.\n]{0,50})/i,
    /(?:on\s+this|this)\s+([^.\n]{0,50})/i
  ];
  
  for (const pattern of effectivePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateContext = match[1] || match[0];

      for (const { regex, format } of datePatterns) {
        const regexCopy = new RegExp(regex.source, regex.flags);
        const dateMatch = regexCopy.exec(dateContext);
        if (dateMatch) {
          const normalized = normalizeDate(dateMatch, format);
          if (normalized) {
            if (!dates.effectiveDate) dates.effectiveDate = normalized;
            break;
          }
        }
      }
      if (dates.effectiveDate) break;
    }
  }
  

  const executionPattern = /(?:executed|signed|dated)\s+(?:as\s+of|on)?\s*:?\s*([^.\n]{0,50})/i;
  const execMatch = text.match(executionPattern);
  if (execMatch) {
    const dateContext = execMatch[1] || execMatch[0];
    for (const { regex, format } of datePatterns) {
      const regexCopy = new RegExp(regex.source, regex.flags);
      const dateMatch = regexCopy.exec(dateContext);
      if (dateMatch) {
        const normalized = normalizeDate(dateMatch, format);
        if (normalized) {
          dates.executionDate = normalized;
          break;
        }
      }
    }
  }
  

  const expirationPattern = /(?:expir(?:e|ing|ation)|terminat(?:e|ing|ion)|end(?:ing)?)\s+(?:date|on)?\s*:?\s*([^.\n]{0,50})/i;
  const expMatch = text.match(expirationPattern);
  if (expMatch) {
    const dateContext = expMatch[1] || expMatch[0];
    for (const { regex, format } of datePatterns) {
      const regexCopy = new RegExp(regex.source, regex.flags);
      const dateMatch = regexCopy.exec(dateContext);
      if (dateMatch) {
        const normalized = normalizeDate(dateMatch, format);
        if (normalized) {
          dates.expirationDate = normalized;
          break;
        }
      }
    }
  }
  

  if (!dates.effectiveDate && dates.allDates.length > 0) {
    dates.effectiveDate = dates.allDates[0];
  }
  
  return dates;
}

function extractJurisdiction(text) {
  const jurisdictions = [];
  
  const patterns = [

    /\bgoverned\s+by\s+(?:the\s+)?laws?\s+of\s+([^.,;]+?)(?:\.|,|;|\s+without)/gi,

    /\bjurisdiction\s+of\s+(?:the\s+)?(?:courts?\s+(?:of|in|located\s+in)\s+)?([^.,;]+?)(?:\.|,|;)/gi,

    /\bvenue\s+(?:shall\s+be|is|lies)\s+(?:in\s+)?([^.,;]+?)(?:\.|,|;)/gi,

    /\bsubject\s+to\s+(?:the\s+)?laws?\s+of\s+([^.,;]+?)(?:\.|,|;)/gi,

    /\bin\s+accordance\s+with\s+(?:the\s+)?laws?\s+of\s+([^.,;]+?)(?:\.|,|;)/gi,

    /\bconstrued\s+(?:in\s+accordance\s+with|under)\s+(?:the\s+)?laws?\s+of\s+([^.,;]+?)(?:\.|,|;)/gi
  ];
  
  for (const pattern of patterns) {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      const jurisdiction = match[1].trim();
      if (jurisdiction.length > 2 && jurisdiction.length < 100) {
        jurisdictions.push(jurisdiction);
      }
    }
  }
  

  const arbitrationPattern = /\barbitration\s+(?:in|under|pursuant\s+to)?\s*([^.,;]+?)(?:\.|,|;|\s+rules)/gi;
  let arbMatch;
  while ((arbMatch = arbitrationPattern.exec(text)) !== null) {
    const arbLocation = arbMatch[1].trim();
    if (arbLocation.length > 2 && arbLocation.length < 100) {
      jurisdictions.push(`Arbitration: ${arbLocation}`);
    }
  }
  
  return jurisdictions.length > 0 ? [...new Set(jurisdictions)] : null;
}

function extractGoverningLaw(text) {

  const patterns = [
    /\bgoverned\s+by\s+(?:and\s+construed\s+in\s+accordance\s+with\s+)?(?:the\s+)?laws?\s+of\s+([^.,;]+?)(?:\.|,|;|\s+without)/i,
    /\bthis\s+agreement\s+shall\s+be\s+governed\s+by\s+([^.,;]+?)(?:\.|,|;)/i
  ];
  
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }
  
  return null;
}

function extractAmounts(text) {
  const amounts = [];
  const seenAmounts = new Set();
  

  const symbolPattern = /(?:USD|EUR|GBP|INR|CAD|AUD|JPY|CNY|CHF|SEK|NOK|DKK|NZD|SGD|HKD|\$|€|£|₹|¥|₣|kr)\s*[\d,]+(?:\.\d{1,2})?(?:\s*(?:million|billion|thousand|k|M|B))?/gi;
  let match;
  
  while ((match = symbolPattern.exec(text)) !== null) {
    const amount = match[0].trim();
    const normalized = amount.replace(/\s+/g, ' ');
    if (!seenAmounts.has(normalized)) {
      amounts.push(normalized);
      seenAmounts.add(normalized);
    }
  }
  

  const writtenPattern = /(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion)(?:\s+(?:and\s+)?(?:one|two|three|four|five|six|seven|eight|nine|ten|eleven|twelve|thirteen|fourteen|fifteen|sixteen|seventeen|eighteen|nineteen|twenty|thirty|forty|fifty|sixty|seventy|eighty|ninety|hundred|thousand|million|billion))*\s+(?:dollars?|euros?|pounds?|rupees?|yen|yuan)/gi;
  
  let writtenMatch;
  while ((writtenMatch = writtenPattern.exec(text)) !== null) {
    const amount = writtenMatch[0].trim();
    if (!seenAmounts.has(amount)) {
      amounts.push(amount);
      seenAmounts.add(amount);
    }
  }
  

  const rangePattern = /(?:USD|EUR|GBP|INR|\$|€|£|₹)\s*[\d,]+(?:\.\d{1,2})?\s*(?:-|to)\s*(?:USD|EUR|GBP|INR|\$|€|£|₹)?\s*[\d,]+(?:\.\d{1,2})?/gi;
  let rangeMatch;
  
  while ((rangeMatch = rangePattern.exec(text)) !== null) {
    const amount = rangeMatch[0].trim();
    const normalized = amount.replace(/\s+/g, ' ');
    if (!seenAmounts.has(normalized)) {
      amounts.push(normalized);
      seenAmounts.add(normalized);
    }
  }
  

  const perUnitPattern = /(?:USD|EUR|GBP|INR|\$|€|£|₹)\s*[\d,]+(?:\.\d{1,2})?\s*(?:\/|per)\s*(?:hour|day|week|month|year|unit|item|piece|share)/gi;
  let perUnitMatch;
  
  while ((perUnitMatch = perUnitPattern.exec(text)) !== null) {
    const amount = perUnitMatch[0].trim();
    const normalized = amount.replace(/\s+/g, ' ');
    if (!seenAmounts.has(normalized)) {
      amounts.push(normalized);
      seenAmounts.add(normalized);
    }
  }
  
  return amounts.length > 0 ? amounts : null;
}

function extractTerm(text) {
  const termInfo = {
    duration: null,
    renewalClause: null,
    terminationNotice: null
  };
  

  const durationPatterns = [
    /\bterm\s+of\s+(?:this\s+agreement\s+(?:shall\s+be|is)\s+)?(\d+)\s+(year|month|day)s?/i,
    /\b(?:period|duration)\s+of\s+(\d+)\s+(year|month|day)s?/i,
    /\bfor\s+a\s+(?:period|term)\s+of\s+(\d+)\s+(year|month|day)s?/i,
    /\b(?:shall|will)\s+(?:remain\s+in\s+)?(?:force|effect)\s+for\s+(?:a\s+period\s+of\s+)?(\d+)\s+(year|month|day)s?/i
  ];
  
  for (const pattern of durationPatterns) {
    const match = text.match(pattern);
    if (match) {
      termInfo.duration = `${match[1]} ${match[2]}${parseInt(match[1]) > 1 ? 's' : ''}`;
      break;
    }
  }
  

  const renewalPattern = /\b((?:auto(?:matic|matically)?|shall|will)\s+(?:be\s+)?renew(?:ed|al|able|s)?(?:\s+(?:auto(?:matic|matically)|for|unless))?[^.]{0,100})/i;
  const renewalMatch = text.match(renewalPattern);
  if (renewalMatch) {
    termInfo.renewalClause = renewalMatch[1].trim();
  }
  

  const noticePattern = /\btermination\s+(?:notice|period)\s+of\s+(\d+)\s+(day|month|year)s?/i;
  const noticeMatch = text.match(noticePattern);
  if (noticeMatch) {
    termInfo.terminationNotice = `${noticeMatch[1]} ${noticeMatch[2]}${parseInt(noticeMatch[1]) > 1 ? 's' : ''}`;
  }
  

  const altNoticePattern = /\b(\d+)\s+(day|month|year)s?'?\s+(?:prior\s+)?(?:written\s+)?notice/i;
  const altNoticeMatch = text.match(altNoticePattern);
  if (!termInfo.terminationNotice && altNoticeMatch) {
    termInfo.terminationNotice = `${altNoticeMatch[1]} ${altNoticeMatch[2]}${parseInt(altNoticeMatch[1]) > 1 ? 's' : ''}`;
  }
  
  return (termInfo.duration || termInfo.renewalClause || termInfo.terminationNotice) ? termInfo : null;
}

function extractDefinitions(text) {
  const definitions = [];
  const seenTerms = new Set();
  

  const parentheticalPattern = /["']([A-Z][A-Za-z\s]{1,50})["']\s+\((?:the\s+)?["']?([A-Z][A-Za-z\s]{1,30})["']?\)/g;
  let match;
  
  while ((match = parentheticalPattern.exec(text)) !== null) {
    const fullTerm = match[1].trim();
    const shortTerm = match[2].trim();
    
    if (!seenTerms.has(shortTerm)) {
      definitions.push({ term: shortTerm, definition: fullTerm, type: 'parenthetical' });
      seenTerms.add(shortTerm);
    }
  }
  

  const definitionsSection = text.match(/\b(?:definitions?|defined\s+terms?)\b[:\n]+((?:.*\n){1,200})/i);
  if (definitionsSection) {
    const sectionText = definitionsSection[1];
    

    const defPattern = /["']?([A-Z][A-Za-z\s]{2,40})["']?\s+(?:means?|shall\s+mean|refers?\s+to|is\s+defined\s+as)\s+([^.\n]{10,200})/gi;
    let defMatch;
    
    while ((defMatch = defPattern.exec(sectionText)) !== null) {
      const term = defMatch[1].trim();
      const definition = defMatch[2].trim();
      
      if (!seenTerms.has(term)) {
        definitions.push({ term, definition, type: 'explicit' });
        seenTerms.add(term);
      }
    }
  }
  

  const inlinePattern = /\(["']([A-Z][A-Za-z\s]{1,30})["']\)/g;
  let inlineMatch;
  
  while ((inlineMatch = inlinePattern.exec(text)) !== null) {
    const term = inlineMatch[1].trim();
    
    if (!seenTerms.has(term) && term.length > 1 && term.length < 30) {
      definitions.push({ term, definition: null, type: 'referenced' });
      seenTerms.add(term);
    }
  }
  
  return definitions.length > 0 ? definitions : [];
}

function extractClauses(text, maxTokensPerClause) {
  const lines = text.split('\n');
  const clauses = [];
  let currentClause = null;
  let currentText = [];
  let parentSection = null;
  let isInSpecialSection = false;
  let specialSectionType = null;
  
  const sectionPatterns = [

    { regex: /^(\d+(?:\.\d+){1,4})\s+(.+)$/, type: 'numbered' },

    { regex: /^(\d+)\.?\s+([A-Z][A-Za-z\s&,'-]+)$/, type: 'section' },

    { regex: /^(Article|Section|Clause|Para(?:graph)?)\s+(\d+(?:\.\d+)*)\s*[:.]?\s*(.*)$/i, type: 'named' },

    { regex: /^[\(\[]([a-z]{1,3}|[ivxlcdm]{1,5}|[A-Z]{1,3}|[IVXLCDM]{1,5})[\)\]]\s+(.+)$/i, type: 'list' },

    { regex: /^(WHEREAS|RECITALS?|WITNESSETH|BACKGROUND|PREAMBLE|NOW,?\s+THEREFORE)[\s:]/i, type: 'preamble' },
    { regex: /^(DEFINITIONS?|DEFINED\s+TERMS?)[\s:]/i, type: 'definitions' },
    { regex: /^(EXHIBIT|SCHEDULE|ANNEX|APPENDIX|ATTACHMENT)\s+([A-Z0-9]+)/i, type: 'exhibit' },
    { regex: /^(SIGNATURE|IN\s+WITNESS\s+WHEREOF|EXECUTED|SIGNED)/i, type: 'signature' }
  ];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    

    if (line.match(/^(page\s+\d+|[-_]{3,}|end of document|confidential)/i)) {
      continue;
    }
    
    let foundSection = false;
    
    for (const patternObj of sectionPatterns) {
      const match = line.match(patternObj.regex);
      
      if (match) {

        if (currentClause && currentText.length > 0) {
          const combinedText = currentText.join(' ').trim();
          const sentences = segmentIntoSentences(combinedText);
          const chunkedSentences = chunkSentences(sentences, maxTokensPerClause);
          
          if (chunkedSentences.length > 0) {
            clauses.push({
              clauseID: `clause-${clauses.length + 1}`,
              section: currentClause,
              sectionType: specialSectionType || 'standard',
              parentSection,
              sentences: chunkedSentences
            });
          }
        }
        
        let sectionTitle = '';
        let initialContent = '';
        
        if (patternObj.type === 'numbered') {
          const number = match[1];
          const title = match[2].trim();
          sectionTitle = title ? `${number} ${title}` : number;
          

          const depth = number.split('.').length;
          if (depth === 1) {
            parentSection = sectionTitle;
          }
          specialSectionType = null;
        } else if (patternObj.type === 'section') {
          const titleText = match[2] ? match[2].trim() : '';
          sectionTitle = `${match[1]}. ${titleText}`.trim();
          parentSection = sectionTitle;
          specialSectionType = null;
        } else if (patternObj.type === 'named') {
          const titleText = match[3] ? match[3].trim() : '';
          sectionTitle = titleText 
            ? `${match[1]} ${match[2]}: ${titleText}` 
            : `${match[1]} ${match[2]}`;
          initialContent = titleText;
          specialSectionType = null;
        } else if (patternObj.type === 'list') {
          sectionTitle = `(${match[1]}) ${match[2].substring(0, 30)}${match[2].length > 30 ? '...' : ''}`;
          initialContent = match[2].trim();

        } else if (patternObj.type === 'preamble') {
          sectionTitle = match[1];
          specialSectionType = 'preamble';
          isInSpecialSection = true;
        } else if (patternObj.type === 'definitions') {
          sectionTitle = match[1];
          specialSectionType = 'definitions';
          isInSpecialSection = true;
        } else if (patternObj.type === 'exhibit') {
          sectionTitle = `${match[1]} ${match[2]}`;
          specialSectionType = 'exhibit';
          isInSpecialSection = true;
        } else if (patternObj.type === 'signature') {
          sectionTitle = match[1];
          specialSectionType = 'signature';
          isInSpecialSection = true;
        }
        
        currentClause = sectionTitle;
        currentText = initialContent ? [initialContent] : [];
        foundSection = true;
        break;
      }
    }
    
    if (!foundSection) {

      if (!currentClause && /^(whereas|recitals?|witnesseth)/i.test(line)) {
        currentClause = 'RECITALS';
        specialSectionType = 'preamble';
        isInSpecialSection = true;
        currentText = [line];
      } else if (currentClause) {
        currentText.push(line);
      } else {

        if (!currentClause && i < 20) {
          if (!currentClause) {
            currentClause = 'PREAMBLE';
            specialSectionType = 'preamble';
            isInSpecialSection = true;
          }
          currentText.push(line);
        }
      }
    }
  }
  

  if (currentClause && currentText.length > 0) {
    const combinedText = currentText.join(' ').trim();
    const sentences = segmentIntoSentences(combinedText);
    const chunkedSentences = chunkSentences(sentences, maxTokensPerClause);
    
    if (chunkedSentences.length > 0) {
      clauses.push({
        clauseID: `clause-${clauses.length + 1}`,
        section: currentClause,
        sectionType: specialSectionType || 'standard',
        parentSection,
        sentences: chunkedSentences
      });
    }
  }
  
  return clauses;
}

function segmentIntoSentences(text) {
  if (!text || text.trim().length === 0) return [];
  
  const abbreviations = [

    'Dr', 'Mr', 'Mrs', 'Ms', 'Prof', 'Rev', 'Hon', 'Sr', 'Jr', 'Esq',

    'Ltd', 'Inc', 'Corp', 'Co', 'LLC', 'LLP', 'LP', 'PLC', 'SA', 'GmbH', 'AG',

    'U.S', 'U.K', 'E.U', 'U.N', 'St', 'Ave', 'Blvd', 'Dept', 'Div',

    'etc', 'vs', 'v', 'i.e', 'e.g', 'et al', 'cf', 'viz', 'ibid', 'op cit',

    'approx', 'est', 'No', 'vol', 'pp', 'para', 'sec', 'art', 'ch',

    'Jan', 'Feb', 'Mar', 'Apr', 'Jun', 'Jul', 'Aug', 'Sept', 'Sep', 'Oct', 'Nov', 'Dec'
  ];
  
  let protectedText = text;
  const placeholders = {};
  let placeholderIndex = 0;
  

  abbreviations.forEach(abbr => {
    const pattern = new RegExp(`\\b${abbr.replace('.', '\\.')}\.`, 'gi');
    protectedText = protectedText.replace(pattern, (match) => {
      const placeholder = `__ABBR_${placeholderIndex}__`;
      placeholders[placeholder] = match;
      placeholderIndex++;
      return placeholder;
    });
  });
  

  protectedText = protectedText.replace(/(\d+)\.(\d+)/g, (match, p1, p2) => {
    const placeholder = `__NUM_${placeholderIndex}__`;
    placeholders[placeholder] = match;
    placeholderIndex++;
    return placeholder;
  });
  

  protectedText = protectedText.replace(/\b(Section|Article|Clause|Para(?:graph)?)\s+(\d+(?:\.\d+)*)\./gi, (match) => {
    const placeholder = `__SEC_${placeholderIndex}__`;
    placeholders[placeholder] = match;
    placeholderIndex++;
    return placeholder;
  });
  

  protectedText = protectedText.replace(/\.\.\./g, (match) => {
    const placeholder = `__ELLIP_${placeholderIndex}__`;
    placeholders[placeholder] = match;
    placeholderIndex++;
    return placeholder;
  });
  


  const sentencePattern = /([.!?]+)\s+(?=[A-Z"'([])|([.!?]+)$/g;
  const sentences = [];
  let lastIndex = 0;
  let match;
  
  while ((match = sentencePattern.exec(protectedText)) !== null) {
    const endIndex = match.index + match[0].length;
    const sentence = protectedText.substring(lastIndex, endIndex).trim();
    if (sentence && sentence.length > 1) {
      sentences.push(sentence);
    }
    lastIndex = endIndex;
  }
  

  if (lastIndex < protectedText.length) {
    const sentence = protectedText.substring(lastIndex).trim();
    if (sentence && sentence.length > 1) {
      sentences.push(sentence);
    }
  }
  

  if (sentences.length === 0 && protectedText.trim().length > 0) {
    sentences.push(protectedText.trim());
  }
  

  return sentences.map(sentence => {
    let restored = sentence;
    Object.entries(placeholders).forEach(([placeholder, original]) => {
      restored = restored.replace(new RegExp(placeholder, 'g'), original);
    });
    return restored;
  });
}

function chunkSentences(sentences, maxTokens) {
  if (!maxTokens) return sentences;
  
  const maxChars = maxTokens * 4;
  const chunks = [];
  let currentChunk = '';
  
  for (const sentence of sentences) {
    if ((currentChunk + ' ' + sentence).length > maxChars && currentChunk) {
      chunks.push(currentChunk.trim());
      currentChunk = sentence;
    } else {
      currentChunk += (currentChunk ? ' ' : '') + sentence;
    }
  }
  
  if (currentChunk) {
    chunks.push(currentChunk.trim());
  }
  
  return chunks.length > 0 ? chunks : sentences;
}

function estimateTokens(text) {
  return Math.ceil(text.length / 4);
}

export default preprocessDocument;
