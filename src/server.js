import express from 'express';
import cron from 'node-cron';
import { config } from './config.js';
import { runDailyJob } from './index.js';
import { handleInboundMessage } from './webhook.js';

const app = express();
app.use(express.urlencoded({ extended: false })); // Twilio posts form-encoded
app.use(express.json());

// Health check (Fly.io likes this)
app.get('/', (_req, res) => res.send('finance-alerts ok'));

// Inbound messages from Twilio Conversations (V2 entry point)
app.post('/webhook', handleInboundMessage);

// Manual trigger for testing without waiting for the cron
app.post('/run', async (_req, res) => {
  try {
    const sid = await runDailyJob();
    res.json({ ok: true, sid });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Schedule the daily job
if (cron.validate(config.cronSchedule)) {
  cron.schedule(config.cronSchedule, () => {
    runDailyJob().catch((err) => console.error('Scheduled job failed:', err));
  }, { timezone: config.tz });
  console.log(`Scheduled daily job: "${config.cronSchedule}" (${config.tz})`);
} else {
  console.error(`Invalid CRON_SCHEDULE: ${config.cronSchedule}`);
}

app.listen(config.port, () => {
  console.log(`Listening on :${config.port}`);
});
