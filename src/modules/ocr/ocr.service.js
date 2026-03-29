const Tesseract = require("tesseract.js");
const sharp = require("sharp");
const path = require("path");
const fs = require("fs");
const { v4: uuidv4 } = require("uuid");

// ─────────────────────────────────────────────
// EXPENSE TYPE KEYWORD MAP
// ─────────────────────────────────────────────
const EXPENSE_TYPES = {
  meals: ["restaurant", "food", "cafe", "zomato", "swiggy", "hotel", "lunch", "dinner", "breakfast", "dhaba", "barbeque", "kitchen", "bistro", "eatery"],
  travel: ["cab", "uber", "ola", "rapido", "taxi", "auto", "bus", "train", "flight", "petrol", "fuel", "irctc", "indigo", "air india"],
  accommodation: ["lodge", "inn", "stay", "lodging", "oyo", "airbnb", "resort", "suites"],
  office: ["stationery", "printer", "cartridge", "supplies", "amazon", "flipkart", "reliance digital"],
  medical: ["pharmacy", "hospital", "clinic", "medicine", "medplus", "apollo", "diagnostic"],
  utilities: ["electricity", "internet", "broadband", "recharge", "jio", "airtel"],
};

// ─────────────────────────────────────────────
// STEP 1 — PREPROCESS IMAGE
// grayscale + normalize + sharpen before OCR
// ─────────────────────────────────────────────
async function preprocessImage(buffer) {
  const tempPath = path.join("/tmp", `ocr_${uuidv4()}.png`);
  await sharp(buffer)
    .grayscale()
    .normalize()
    .sharpen()
    .resize({ width: 2000, withoutEnlargement: true })
    .png()
    .toFile(tempPath);
  return tempPath;
}

// ─────────────────────────────────────────────
// STEP 2 — RUN TESSERACT OCR
// returns raw text + confidence score
// ─────────────────────────────────────────────
async function runOCR(imagePath) {
  const { data } = await Tesseract.recognize(imagePath, "eng", {
    logger: () => {}, // silence verbose logs
  });
  return {
    text: data.text || "",
    confidence: data.confidence || 0,
  };
}

// ─────────────────────────────────────────────
// STEP 3 — FIELD EXTRACTORS
// ─────────────────────────────────────────────

function extractAmount(text) {
  // Priority: labelled total first, then any currency-prefixed amount
  const patterns = [
    /(?:total|grand total|bill amount|amount due|net amount|payable)[:\s]*(?:rs\.?|inr|₹|\$|usd)?\s*([\d,]+(?:\.\d{1,2})?)/i,
    /(?:rs\.?|₹|inr)\s*([\d,]+(?:\.\d{1,2})?)/i,
    /\$\s*([\d,]+(?:\.\d{1,2})?)/i,
    /([\d,]+\.\d{2})\s*(?:rs|inr|₹)?/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const val = parseFloat(match[1].replace(/,/g, ""));
      if (!isNaN(val) && val > 0) return val;
    }
  }
  return null;
}

function extractCurrency(text) {
  if (/₹|rs\.?\s|\binr\b/i.test(text)) return "INR";
  if (/\$|\busd\b/i.test(text)) return "USD";
  if (/€|\beur\b/i.test(text)) return "EUR";
  if (/£|\bgbp\b/i.test(text)) return "GBP";
  return "INR"; // default to INR for India context
}

function extractDate(text) {
  const patterns = [
    // DD/MM/YYYY or DD-MM-YYYY
    /\b(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})\b/,
    // YYYY-MM-DD
    /\b(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})\b/,
    // 15 June 2025
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})\b/i,
    // June 15, 2025
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i,
  ];
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) return match[0].trim();
  }
  return null;
}

function extractVendorName(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 2 && l.length < 80);

  for (const line of lines.slice(0, 6)) {
    // Skip phone numbers, pure digits, addresses
    if (/^\d+$/.test(line)) continue;
    if (/^\+?\d[\d\s\-]{7,}$/.test(line)) continue;
    if (/\b(gst|gstin|tax invoice|receipt|bill|invoice)\b/i.test(line)) continue;
    return line;
  }
  return null;
}

function extractExpenseLines(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  const lineItems = [];

  // Pattern: any text followed by a numeric price at end
  const itemPattern = /^(.+?)\s{2,}([\d,]+(?:\.\d{1,2})?)$/;
  // Alternate: item   x   qty   price
  const itemQtyPattern = /^(.+?)\s+x\s*(\d+)\s+([\d,]+(?:\.\d{1,2})?)$/i;

  for (const line of lines) {
    const qtyMatch = line.match(itemQtyPattern);
    if (qtyMatch) {
      const qty = parseInt(qtyMatch[2]);
      const unit_price = parseFloat(qtyMatch[3].replace(/,/g, ""));
      if (!isNaN(unit_price) && unit_price > 0) {
        lineItems.push({
          description: qtyMatch[1].trim(),
          quantity: qty,
          unit_price,
          total: parseFloat((qty * unit_price).toFixed(2)),
        });
        continue;
      }
    }

    const match = line.match(itemPattern);
    if (match) {
      const amount = parseFloat(match[2].replace(/,/g, ""));
      if (!isNaN(amount) && amount > 0 && amount < 500000) {
        lineItems.push({
          description: match[1].trim(),
          quantity: 1,
          unit_price: amount,
          total: amount,
        });
      }
    }
  }
  return lineItems.slice(0, 25); // cap line items
}

function categorizeExpense(vendorName, text) {
  const haystack = `${vendorName || ""} ${text}`.toLowerCase();
  for (const [type, keywords] of Object.entries(EXPENSE_TYPES)) {
    if (keywords.some((kw) => haystack.includes(kw))) return type;
  }
  return "other";
}

function buildDescription(vendorName, expenseType, date) {
  const type = expenseType
    ? expenseType.charAt(0).toUpperCase() + expenseType.slice(1)
    : "Expense";
  if (vendorName && date) return `${type} at ${vendorName} on ${date}`;
  if (vendorName) return `${type} at ${vendorName}`;
  return `${type} receipt`;
}

// ─────────────────────────────────────────────
// MAIN EXPORT — processReceipt()
// Accepts file buffer, returns structured data
// ─────────────────────────────────────────────
async function processReceipt(fileBuffer) {
  let tempPath = null;

  try {
    tempPath = await preprocessImage(fileBuffer);
    const { text, confidence } = await runOCR(tempPath);

    if (!text || text.trim().length < 5) {
      throw Object.assign(new Error("No readable text found in receipt"), {
        code: "EMPTY_TEXT",
      });
    }

    const amount = extractAmount(text);
    const currency = extractCurrency(text);
    const date = extractDate(text);
    const vendor_name = extractVendorName(text);
    const expense_lines = extractExpenseLines(text);
    const expense_type = categorizeExpense(vendor_name, text);
    const description = buildDescription(vendor_name, expense_type, date);

    const fields_missing = [];
    if (!amount) fields_missing.push("amount");
    if (!date) fields_missing.push("date");
    if (!vendor_name) fields_missing.push("vendor_name");

    return {
      // ── core expense fields (matches schema) ──
      amount,
      currency,
      date,
      vendor_name,
      description,
      expense_type,
      expense_lines,
      // ── OCR metadata ──
      raw_confidence: parseFloat(confidence.toFixed(2)),
      fields_missing,
      recommendation:
        confidence > 70 && fields_missing.length === 0
          ? "auto_fill"
          : "manual_review",
    };
  } finally {
    // always clean up temp file
    if (tempPath && fs.existsSync(tempPath)) fs.unlinkSync(tempPath);
  }
}

module.exports = { processReceipt };