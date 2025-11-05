const fs = require("fs");

// Create a FormData instance
const formData = new FormData();
formData.append("file", fs.createReadStream("/path/to/selectedFile"));
formData.append("user", JSON.stringify({ key: "YOUR_KEY" }));
formData.append("accountName", "workflow 1");
formData.append(
  "textQuery",
  `Important: Make sure all JSON keys are in lower case and use underscores instead of spaces!

Objective:
Act as a specialized forensic document examiner. Your task is to analyze the provided document(s) for any indicators of fraud, forgery, tampering, or misrepresentation. Your analysis must be comprehensive, considering visual, structural, content-based, and (if possible) metadata-level evidence.

You will categorize each identified indicator into one of three risk levels: High, Medium, or Low. For every finding, you must provide a clear explanation detailing what the indicator is, where it was found, and why it is considered suspicious.

Review the document(s) for the following patterns of deception, categorized by risk.
High-Risk Indicators: Strong Evidence of Intentional Deception

These are critical red flags that strongly suggest the document is fraudulent.

    1. Critical Internal Contradictions:

        What to look for: Data within a single document that is logically or mathematically impossible.

        Examples: Financial columns that do not sum correctly; sequential numbering that is out of order (e.g., invoice numbers, page numbers); dates that are illogical (e.g., a completion date before a start date).

    2. Cross-Document Contradictions:

        What to look for: Conflicting information between two or more related documents.

        Examples: A name, amount, or date on an invoice not matching the corresponding purchase order; an address on a utility bill not matching a rental agreement.

    3. Evidence of Digital Tampering:

        What to look for: Artifacts left by editing software or manipulation of the file itself.

        Examples: Text or numbers that are not perfectly aligned with the surrounding content; visible "white-out" boxes or layering artifacts; inconsistent compression levels in different parts of an image; document metadata (creator, modification dates) that is inconsistent with the document's purported timeline.

    4. Blatant Forgery of Authenticity Markers:

        What to look for: Obvious fakes of official marks.

        Examples: Pixelated, blurry, or disproportionate company logos or official seals; signatures that are digitally copied and pasted (identical across multiple documents) or appear shaky and unnatural.

Medium-Risk Indicators: Suspicious Anomalies Requiring Investigation

These are unusual characteristics that are often, but not always, associated with fraudulent documents.

    1. Visual and Formatting Anomalies:

        What to look for: Inconsistencies in the document's layout and typography.

        Examples:

            Font Mismatches: Use of multiple, different fonts or font sizes where one would be expected.

            Alignment & Spacing Issues: Crooked lines, uneven margins, oddly spaced characters or words (kerning).

            Color Inconsistencies: Variations in the color of text or backgrounds that should be uniform.

            Border & Line Imperfections: Borders or table lines that don't connect properly or are of different thicknesses.

    2. Content and Language Anomalies:

        What to look for: Unprofessional or unusual text content.

        Examples: Spelling mistakes or significant grammatical errors; awkward or unnatural phrasing; the use of the letter 'O' instead of the number '0' (or vice-versa); generic descriptions where specific details are expected.

    3. Suspicious Data Patterns:

        What to look for: Data that is unusual, even if not strictly contradictory.

        Examples: An overabundance of round numbers in financial documents (e.g., $500.00, $1,200.00); dates or times that are unusual for the context (e.g., a business invoice dated on a Sunday at 3:00 AM); check numbers or transaction IDs that do not follow a logical sequence.

Low-Risk Indicators: Minor Irregularities Worth Noting

These issues could be innocent errors but can contribute to a larger picture of fraud when combined with other indicators.

    1. Minor Quality Issues:

        What to look for: Poor document quality that could potentially obscure information.

        Examples: Document appears to be a copy of a copy, resulting in degraded text; unusually low resolution or blurriness in specific areas.

    2. Vague or Missing Non-Critical Information:

        What to look for: Omission of details that are typically present but not essential.

        Examples: Missing a company's phone number or zip code; lack of a specific departmental name; a signature line with no printed name underneath.

    3. Unusual but Plausible Elements:

        What to look for: Characteristics that are uncommon but not definitively incorrect.

        Examples: Use of an outdated but still valid company logo; an unconventional but professionally designed layout.

Required Output Format

Provide your findings in a structured report. For each identified indicator, you must specify:

    Risk Level: (High, Medium, or Low)

    Fraud Category: (e.g., "Visual and Formatting Anomalies")

    Specific Finding: (e.g., "Font Mismatch")

    Location & Explanation: (A precise description of where the issue is in the document and a brief justification for why it is flagged.)

Example Output:

High-Risk Indicators:

    Fraud Category: Critical Internal Contradictions

        Specific Finding: Incorrect Summation

        Location & Explanation: In Document A (Invoice), the subtotal items ($150, $200, $75) add up to $425, but the "Total" line incorrectly lists $525.

Medium-Risk Indicators:

    Fraud Category: Visual and Formatting Anomalies

        Specific Finding: Font Mismatch

        Location & Explanation: In Document B (Shipping Receipt), the "Recipient Address" block is in a Calibri font, while the rest of the document text is in Times New Roman. This suggests the address may have been edited.

Low-Risk Indicators:

    Fraud Category: Vague or Missing Non-Critical Information

        Specific Finding: Missing Contact Detail

        Location & Explanation: In Document A (Invoice), the header includes the company's address but is missing a phone number or email address, which is unusual for billing correspondence.`
);
formData.append("modelType", "smart"); // Added modelType

// Use native fetch to send the request
fetch("https://discrepancy-api.onrender.com/api/opticai", {
  // Updated for local testing
  method: "POST",
  body: formData,
})
  .then((response) => response.json())
  .then((data) => {
    console.log(data);
    // Handle response data
  })
  .catch((error) => {
    console.error(error);
  });

const FIXED_TEXT_QUERY = `Important: Make sure all JSON keys are in lower case and use underscores instead of spaces!
  
  Objective:
  Act as a specialized forensic document examiner. Your task is to analyze the provided document(s) for any indicators of fraud, forgery, tampering, or misrepresentation. Your analysis must be comprehensive, considering visual, structural, content-based, and (if possible) metadata-level evidence.
  
  You will categorize each identified indicator into one of three risk levels: High, Medium, or Low. For every finding, you must provide a clear explanation detailing what the indicator is, where it was found, and why it is considered suspicious.
  
  Review the document(s) for the following patterns of deception, categorized by risk.
  High-Risk Indicators: Strong Evidence of Intentional Deception
  
  These are critical red flags that strongly suggest the document is fraudulent.
  
      1. Critical Internal Contradictions:
  
          What to look for: Data within a single document that is logically or mathematically impossible.
  
          Examples: Financial columns that do not sum correctly; sequential numbering that is out of order (e.g., invoice numbers, page numbers); dates that are illogical (e.g., a completion date before a start date).
  
      2. Cross-Document Contradictions:
  
          What to look for: Conflicting information between two or more related documents.
  
          Examples: A name, amount, or date on an invoice not matching the corresponding purchase order; an address on a utility bill not matching a rental agreement.
  
      3. Evidence of Digital Tampering:
  
          What to look for: Artifacts left by editing software or manipulation of the file itself.
  
          Examples: Text or numbers that are not perfectly aligned with the surrounding content; visible "white-out" boxes or layering artifacts; inconsistent compression levels in different parts of an image; document metadata (creator, modification dates) that is inconsistent with the document's purported timeline.
  
      4. Blatant Forgery of Authenticity Markers:
  
          What to look for: Obvious fakes of official marks.
  
          Examples: Pixelated, blurry, or disproportionate company logos or official seals; signatures that are digitally copied and pasted (identical across multiple documents) or appear shaky and unnatural.
  
  Medium-Risk Indicators: Suspicious Anomalies Requiring Investigation
  
  These are unusual characteristics that are often, but not always, associated with fraudulent documents.
  
      1. Visual and Formatting Anomalies:
  
          What to look for: Inconsistencies in the document's layout and typography.
  
          Examples:
  
              Font Mismatches: Use of multiple, different fonts or font sizes where one would be expected.
  
              Alignment & Spacing Issues: Crooked lines, uneven margins, oddly spaced characters or words (kerning).
  
              Color Inconsistencies: Variations in the color of text or backgrounds that should be uniform.
  
              Border & Line Imperfections: Borders or table lines that don't connect properly or are of different thicknesses.
  
      2. Content and Language Anomalies:
  
          What to look for: Unprofessional or unusual text content.
  
          Examples: Spelling mistakes or significant grammatical errors; awkward or unnatural phrasing; the use of the letter 'O' instead of the number '0' (or vice-versa); generic descriptions where specific details are expected.
  
      3. Suspicious Data Patterns:
  
          What to look for: Data that is unusual, even if not strictly contradictory.
  
          Examples: An overabundance of round numbers in financial documents (e.g., $500.00, $1,200.00); dates or times that are unusual for the context (e.g., a business invoice dated on a Sunday at 3:00 AM); check numbers or transaction IDs that do not follow a logical sequence.
  
  Low-Risk Indicators: Minor Irregularities Worth Noting
  
  These issues could be innocent errors but can contribute to a larger picture of fraud when combined with other indicators.
  
      1. Minor Quality Issues:
  
          What to look for: Poor document quality that could potentially obscure information.
  
          Examples: Document appears to be a copy of a copy, resulting in degraded text; unusually low resolution or blurriness in specific areas.
  
      2. Vague or Missing Non-Critical Information:
  
          What to look for: Omission of details that are typically present but not essential.
  
          Examples: Missing a company's phone number or zip code; lack of a specific departmental name; a signature line with no printed name underneath.
  
      3. Unusual but Plausible Elements:
  
          What to look for: Characteristics that are uncommon but not definitively incorrect.
  
          Examples: Use of an outdated but still valid company logo; an unconventional but professionally designed layout.
  
  Required Output Format
  
  Provide your findings in a structured report. For each identified indicator, you must specify:
  
      Risk Level: (High, Medium, or Low)
  
      Fraud Category: (e.g., "Visual and Formatting Anomalies")
  
      Specific Finding: (e.g., "Font Mismatch")
  
      Location & Explanation: (A precise description of where the issue is in the document and a brief justification for why it is flagged.)
  
  Example Output:
  
  High-Risk Indicators:
  
      Fraud Category: Critical Internal Contradictions
  
          Specific Finding: Incorrect Summation
  
          Location & Explanation: In Document A (Invoice), the subtotal items ($150, $200, $75) add up to $425, but the "Total" line incorrectly lists $525.
  
  Medium-Risk Indicators:
  
      Fraud Category: Visual and Formatting Anomalies
  
          Specific Finding: Font Mismatch
  
          Location & Explanation: In Document B (Shipping Receipt), the "Recipient Address" block is in a Calibri font, while the rest of the document text is in Times New Roman. This suggests the address may have been edited.
  
  Low-Risk Indicators:
  
      Fraud Category: Vague or Missing Non-Critical Information
  
          Specific Finding: Missing Contact Detail
  
          Location & Explanation: In Document A (Invoice), the header includes the company's address but is missing a phone number or email address, which is unusual for billing correspondence.`;
