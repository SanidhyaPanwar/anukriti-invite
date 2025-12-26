// src/config/db.js
const mongoose = require("mongoose");

async function connectDB(mongoUri) {
  try {
    await mongoose.connect(mongoUri); 
    console.log("Connected to MongoDB");
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}

module.exports = connectDB;
