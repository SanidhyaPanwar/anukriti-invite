require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const apiRoutes = require('./src/routes/api');
const startKeepAliveCron = require('./src/cron/keepAlive');

const app = express();

app.use(cors());
app.use(express.json());

// Healthcheck Route with Deep PIN Inspection & Testing
app.get('/api/health', (req, res) => {
  console.log(`[Health Check] Ping received at ${new Date().toLocaleTimeString()} from IP: ${req.ip}`);
  
  const rawEnvPin = process.env.EXPENSE_PIN;
  const trimmedEnvPin = rawEnvPin ? rawEnvPin.trim() : undefined;
  const expectedPin = trimmedEnvPin || "2200";

  // Optional: Test an incoming query param (e.g. /api/health?pin=2200)
  const testInputPin = req.query.pin;
  let pinTestResult = null;
  
  if (testInputPin !== undefined) {
    const cleanedInput = String(testInputPin).trim();
    pinTestResult = {
      inputProvided: testInputPin,
      inputCleaned: cleanedInput,
      matchesExpected: cleanedInput === expectedPin
    };
  }

  const envCheck = {
    cloudinaryUrl: process.env.CLOUDINARY_URL ? "Loaded ✅" : "Missing ❌",
    expensePinRaw: JSON.stringify(rawEnvPin),
    expensePinCleaned: JSON.stringify(trimmedEnvPin),
    resolvedExpectedPin: expectedPin,
    fallbackUsed: !rawEnvPin || rawEnvPin.trim() === ""
  };

  res.status(200).json({ 
    status: 'OK', 
    message: 'Anukriti Wedding API is awake',
    envCheck: envCheck,
    pinTest: pinTestResult
  });
});
// Hook up the API routes
app.use('/api', apiRoutes);

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Successfully connected to MongoDB Atlas');
    
    // Start the Cron Job
    startKeepAliveCron();
    console.log('Keep-alive cron job initialized');

    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Error connecting to MongoDB:', error);
  });