// controllers/opticController.mjs
import fs from "fs";
import { unlink } from "fs/promises";
import FormData from "form-data";
import axios from "axios";

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

const REMOTE_ENDPOINT =
  process.env.DISCREPANCY_API_URL ||
  "https://discrepancy-api.onrender.com/api/opticai";
const API_KEY = process.env.DISCREPANCY_API_KEY;

function buildFormForVariant(files, variant) {
  // variant: { fileFieldName, includeAccountName, includeModelType }
  const form = new FormData();

  for (const f of files) {
    form.append(variant.fileFieldName, fs.createReadStream(f.path), {
      filename: f.originalname || f.filename || "upload",
      contentType: f.mimetype || "application/octet-stream",
    });
  }

  // always include user (as JSON string) because remote previously required it
  form.append("user", JSON.stringify({ key: API_KEY }));

  if (variant.includeAccountName) {
    // try exact text used previously (with space)
    form.append("accountName", variant.accountNameValue || "workflow 1");
  }

  if (variant.includeTextQuery) {
    form.append("textQuery", FIXED_TEXT_QUERY);
  }

  if (variant.includeModelType) {
    form.append("modelType", "smart");
  }

  return form;
}

async function sendForm(form) {
  const length = await new Promise((resolve, reject) => {
    form.getLength((err, len) => (err ? reject(err) : resolve(len)));
  });

  const headers = { ...form.getHeaders(), "Content-Length": length };

  const resp = await axios.post(REMOTE_ENDPOINT, form, {
    headers,
    maxBodyLength: Infinity,
    maxContentLength: Infinity,
    timeout: 120_000,
    validateStatus: null, // we'll handle status checking
  });

  return resp;
}

function cleanup(paths = []) {
  return Promise.all(
    paths.map(async (p) => {
      try {
        await unlink(p);
      } catch (e) {
        /* ignore */
      }
    })
  );
}

/**
 * Main handler: tries multiple payload variants until one works.
 * Expects multer.array('file') to populate req.files.
 */
export async function analyzeDocument(req, res) {
  const uploaded = Array.isArray(req.files)
    ? req.files
    : req.file
    ? [req.file]
    : [];
  if (!uploaded.length)
    return res.status(400).json({
      error: 'No files uploaded. Field name should be "file" (multiple OK).',
    });
  if (!API_KEY)
    return res
      .status(500)
      .json({ error: "Server misconfiguration: DISCREPANCY_API_KEY not set" });

  // candidate file field names and whether to include other fields
  const fileFieldNames = [
    "file",
    "files[]",
    "files",
    "document",
    "documents",
    "attachment",
    "attachments",
    "uploads",
    "upload",
  ];
  // variations to try: include/exclude accountName and modelType and textQuery (some APIs forbid unexpected fields)
  const accountNameValues = [
    "workflow 1",
    "workflow1",
    "workflow-1",
    "workflow",
  ]; // try variants
  const includeTextQueryOptions = [true]; // we keep textQuery in trials (remote expects prompt), but could try false if needed
  const includeModelTypeOptions = [true, false]; // try with and without modelType
  const includeAccountNameOptions = [true, false]; // try both

  const attempts = [];

  // build attempt list (limit growth)
  for (const fileFieldName of fileFieldNames) {
    for (const includeAccountName of includeAccountNameOptions) {
      for (const includeModelType of includeModelTypeOptions) {
        for (const includeTextQuery of includeTextQueryOptions) {
          if (includeAccountName) {
            for (const accountNameValue of accountNameValues) {
              attempts.push({
                fileFieldName,
                includeAccountName,
                includeModelType,
                includeTextQuery,
                accountNameValue,
              });
            }
          } else {
            attempts.push({
              fileFieldName,
              includeAccountName,
              includeModelType,
              includeTextQuery,
              accountNameValue: null,
            });
          }
        }
      }
    }
  }

  // Optional: limit attempts to reasonable number (here it's small enough)
  // console.log(`Will try ${attempts.length} payload variants...`);

  const tempPaths = uploaded.map((f) => f.path);
  let lastError = null;

  for (const [i, variant] of attempts.entries()) {
    // build form and try send
    const form = buildFormForVariant(uploaded, variant);

    try {
      const resp = await sendForm(form);

      // success if 2xx
      if (resp.status >= 200 && resp.status < 300) {
        // cleanup and return
        await cleanup(tempPaths);
        return res.status(resp.status).json(resp.data);
      }

      // remote returned an error - capture and continue to next variant
      lastError = {
        attempt: i + 1,
        variant,
        status: resp.status,
        data: resp.data,
      };

      // quick heuristic: if remote explicitly says missing 'user' or invalid key, stop trying
      if (resp.data && typeof resp.data === "object") {
        const low = JSON.stringify(resp.data).toLowerCase();
        if (
          low.includes("invalid api key") ||
          low.includes("missing api key") ||
          low.includes("user data is required")
        ) {
          // abort and return this immediate error
          await cleanup(tempPaths);
          return res.status(502).json({
            error: resp.data,
            note: "Aborting attempts due to auth/user key error.",
          });
        }
      }
      // otherwise continue trying
    } catch (err) {
      // network/other error sending this variant
      lastError = {
        attempt: i + 1,
        variant,
        error: err.message,
        remoteResponse: err?.response?.data,
      };
      // continue trying other variants
    }
  }

  // all attempts failed
  await cleanup(tempPaths);

  // respond with aggregated debug info (without exposing API key)
  return res.status(502).json({
    error: "All payload variants were rejected by remote API",
    attempts_tried: attempts.length,
    last_error: lastError,
    suggestion:
      "Try inspecting remote API docs or run a curl test; consider sending request to a request inspector to see what the remote expects.",
  });
}
