// src/server.js
import express from "express";
import dotenv from "dotenv";
import cors from "cors";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import leadRoutes from "./routes/leadRoutes.js";
 import contactDiscussionRoutes from "./routes/contactDiscussionRoutes.js";
 import communicationRoutes from "./routes/communicationRoutes.js";
 import dailyReportRoutes from "./routes/dailyReportRoutes.js";

  

import { notFound, errorHandler } from "./middlewares/errorMiddleware.js";

dotenv.config();
connectDB();

const app = express();

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("OGCS CRM API running ✅");
});

app.use("/api/auth", authRoutes);
app.use("/api/leads", leadRoutes);
app.use("/api/contact-discussions", contactDiscussionRoutes);
app.use("/api/communications", communicationRoutes);
app.use("/api/team-reports", dailyReportRoutes);

 

 
 
app.use(notFound);
app.use(errorHandler);

const PORT = process.env.PORT || 3181;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
