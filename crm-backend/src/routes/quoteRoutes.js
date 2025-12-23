// src/routes/quoteRoutes.js
import express from "express";
import {
  createQuote,
  getMyQuotes,
  getAllQuotes,
  updateQuoteStatus,
  getQuoteById,
} from "../controllers/quoteController.js";

import { protect, adminOnly } from "../middlewares/authMiddleware.js";

const router = express.Router();

/* ----------------------------
   Sales Executive Routes
---------------------------- */
router.post("/", protect, createQuote);
router.get("/my", protect, getMyQuotes); // ✅ MUST come before "/:id"

/* ----------------------------
   Admin Routes
---------------------------- */
router.get("/", protect, adminOnly, getAllQuotes); // supports ?status=pending
router.patch("/:id/status", protect, adminOnly, updateQuoteStatus);
router.get("/:id", protect, adminOnly, getQuoteById); // ✅ keep only once

export default router;

















// // src/routes/quoteRoutes.js
// import express from "express";
// import {
//   createQuote,
//   getMyQuotes,
//   getAllQuotes,
//   updateQuoteStatus,
// } from "../controllers/quoteController.js";
// import { protect, adminOnly } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// // Sales Executive
// router.post("/", protect, createQuote);
// router.get("/my", protect, getMyQuotes);

// // Admin
// router.get("/", protect, adminOnly, getAllQuotes);
// router.patch("/:id/status", protect, adminOnly, updateQuoteStatus);

// export default router;