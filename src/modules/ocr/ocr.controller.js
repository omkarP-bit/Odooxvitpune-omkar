const { processReceipt } = require("./ocr.service");

async function processReceiptController(req, res, next) {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: {
          code: "NO_FILE",
          message: "No receipt file attached. Send as multipart/form-data with key 'receipt'.",
        },
      });
    }

    const data = await processReceipt(req.file.buffer);

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    // surface known OCR errors cleanly
    if (err.code === "EMPTY_TEXT") {
      return res.status(422).json({
        success: false,
        error: {
          code: "EMPTY_TEXT",
          message: "Receipt image has no readable text. Try a clearer photo.",
        },
      });
    }
    next(err);
  }
}

module.exports = { processReceiptController };