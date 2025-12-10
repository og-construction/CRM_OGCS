const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
require("dotenv").config();

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// 👇 Add this
const authRoutes = require("./routes/authRoutes");
app.use("/api/auth", authRoutes);

// ... other routes

const PORT = process.env.PORT || 3181;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
