const express = require("express");
const errorMiddleware = require("./middleware/error.middleware");
const ocrRoutes = require("./modules/ocr/ocr.routes");

const app = express();

app.use(express.json());

// ─── mount OCR module ───────────────────────
// Drop this one line into the existing app.js
app.use("/api/ocr", ocrRoutes);
// ────────────────────────────────────────────

// must be LAST — catches all errors
app.use(errorMiddleware);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`OCR service running on port ${PORT}`));

module.exports = app;