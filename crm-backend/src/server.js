// src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
import contactDiscussionRoutes from "./routes/contactDiscussionRoutes.js";
import communicationRoutes from "./routes/communicationRoutes.js";
import dailyReportRoutes from "./routes/dailyReportRoutes.js";
import quoteRoutes from "./routes/quoteRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import locationRoutes from "./routes/locationRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

  

import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();

/* ---------- ESM __dirname fix ---------- */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(cors()); 
app.use(express.json());

// serve uploaded files
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

app.get("/", (req, res) => {
  res.send("OGCS CRM API running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/contact-discussions", contactDiscussionRoutes);
app.use("/api/communications", communicationRoutes);
app.use("/api/team-reports", dailyReportRoutes);
app.use("/api/quotes", quoteRoutes);
app.use("/api/locations", locationRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/daily-reports", dailyReportRoutes);

//Admin
app.use("/api/admin", adminRoutes);
 

 
 
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3181;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
