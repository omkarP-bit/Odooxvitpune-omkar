const express = require("express");
const multer = require("multer");
const { processReceiptController } = require("./ocr.controller");

const router = express.Router();

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];

const upload = multer({
  storage: multer.memoryStorage(), // no disk write, buffer in memory
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB cap
  fileFilter: (req, file, cb) => {
    if (ALLOWED_TYPES.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        Object.assign(new Error("Only JPEG, PNG, WEBP, PDF allowed"), {
          code: "INVALID_FILE_TYPE",
        })
      );
    }
  },
});

// POST /api/ocr/process
// Body: multipart/form-data, field name: "receipt"
router.post(
  "/process",
  (req, res, next) => {
    upload.single("receipt")(req, res, (err) => {
      if (err) {
        return res.status(400).json({
          success: false,
          error: {
            code: err.code || "UPLOAD_ERROR",
            message: err.message,
          },
        });
      }
      next();
    });
  },
  processReceiptController
);

module.exports = router;