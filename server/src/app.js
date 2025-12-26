// src/app.js
require("dotenv").config();
const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const routes = require("./routes");

const app = express();

// Middleware
app.use(express.json());

app.use(
  cors({
    origin: "*",  // Allow all origins for testing
    credentials: true
  })
);


// DB connection
const mongoUri = process.env.MONGODB_URI;
connectDB(mongoUri);

// Health check
app.get("/", (req, res) => {
  res.json({ status: "ok", message: "Wedding invite API is running" });
});

// Routes
app.use(routes);

// Start server
const port = process.env.PORT || 5000;

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
