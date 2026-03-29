const parseReceiptText = (receiptText = "") => {
    if (!receiptText || typeof receiptText !== "string") {
        return {
            parsedAmount: null,
            parsedDate: null,
            parsedMerchant: null,
            rawText: ""
        };
    }

    const amountMatch = receiptText.match(/(?:total|amount)\s*[:\-]?\s*(\d+(?:\.\d{1,2})?)/i);
    const dateMatch = receiptText.match(/(\d{4}-\d{2}-\d{2}|\d{2}[\/\-]\d{2}[\/\-]\d{4})/);
    const merchantLine = receiptText.split("\n").find((line) => line.trim().length > 2) || null;

    return {
        parsedAmount: amountMatch ? Number(amountMatch[1]) : null,
        parsedDate: dateMatch ? dateMatch[1] : null,
        parsedMerchant: merchantLine,
        rawText: receiptText
    };
};

module.exports = { parseReceiptText };
