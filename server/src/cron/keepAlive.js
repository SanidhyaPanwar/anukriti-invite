const cron = require('node-cron');
const Settings = require('../models/Settings');

const startKeepAliveCron = () => {
  // Runs every 14 minutes
  cron.schedule('*/14 * * * *', async () => {
    try {
      const settings = await Settings.findOne();
      
      if (settings && settings.isKeepAliveEnabled) {
        // Node 18+ has built-in fetch. We use localhost if running locally, or Render URL if deployed.
        const targetUrl = process.env.RENDER_EXTERNAL_URL || `http://localhost:${process.env.PORT}`;
        
        const response = await fetch(`${targetUrl}/api/health`);
        console.log(`[Cron] Keep-alive ping sent. Status: ${response.status}`);
      } else {
        console.log(`[Cron] Keep-alive is disabled. Skipping ping.`);
      }
    } catch (error) {
      console.error(`[Cron] Keep-alive ping failed:`, error.message);
    }
  });
};

module.exports = startKeepAliveCron;