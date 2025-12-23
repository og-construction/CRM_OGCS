import express from "express";
import { login, createSalesExecutive } from "../controllers/authController.js";

import {
  getSalesExecutives,
  setUserActiveStatus,      // ✅ correct name
  deleteSalesExecutive,
} from "../controllers/salesExecutiveController.js";

import { protect, adminOnly } from "../middlewares/authMiddleware.js";
import { uploadGovDoc } from "../middlewares/uploadMiddleware.js";

const router = express.Router();

/* -------------------------
   AUTH
------------------------- */
router.post("/login", login);

/* -------------------------
   SALES EXECUTIVE (ADMIN)
------------------------- */

// fetch sales executives
router.get("/sales-executive", protect, adminOnly, getSalesExecutives);

// create sales executive
router.post(
  "/sales-executive",
  protect,
  adminOnly,
  uploadGovDoc.single("govDocFile"),
  createSalesExecutive
);

// Activate / Deactivate
router.patch(
  "/sales-executive/:id/active",
  protect,
  adminOnly,
  setUserActiveStatus     // ✅ fixed
);

// Delete
router.delete(
  "/sales-executive/:id",
  protect,
  adminOnly,
  deleteSalesExecutive
);

export default router;












// // src/routes/authRoutes.js
// import express from "express";

// import {
//   login,
//   createSalesExecutive,
//   getSalesExecutives,
// } from "../controllers/authController.js";

// import { protect, adminOnly } from "../middlewares/authMiddleware.js";

// const router = express.Router();

// // Login (admin + sales)
// router.post("/login", login);

// // Admin creates sales executive
// router.post("/sales-executive", protect, adminOnly, createSalesExecutive);
// router.get("/sales-executive", protect, adminOnly, getSalesExecutives);

// export default router;
