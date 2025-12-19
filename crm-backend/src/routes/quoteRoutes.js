// src/routes/quoteRoutes.js
const express = require("express");
const router = express.Router();

const quoteController = require("../controllers/quoteController");
const { protect, adminOnly } = require("../middlewares/authMiddleware");

// --------------------------------------------------
// Sales Executive Routes
// --------------------------------------------------

// Create quotation / invoice
router.post("/", protect, quoteController.createQuote);

// Get own quotations / invoices
router.get("/my", protect, quoteController.getMyQuotes);

// --------------------------------------------------
// Admin Routes
// --------------------------------------------------

// Get all quotations for approval
router.get("/", protect, adminOnly, quoteController.getAllQuotes);

// Approve / Reject
router.patch(
  "/:id/status",
  protect,
  adminOnly,
  quoteController.updateQuoteStatus
);

module.exports = router;
