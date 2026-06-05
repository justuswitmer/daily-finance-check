import express from "express";
import cron from "node-cron";
import { config } from "./config.js";
import { runDailyJob } from "./index.js";

const app = express();
app.use(express.json());

function isAuthorizedRunRequest(req) {
  if (!config.runToken) {
    return { ok: false, status: 503, error: "RUN_TOKEN is not configured" };
  }

  const auth = req.get("authorization") || "";
  const expected = `Bearer ${config.runToken}`;
  if (auth !== expected) {
    return { ok: false, status: 401, error: "unauthorized" };
  }

  return { ok: true };
}

// Health check (Fly.io likes this)
app.get("/", (_req, res) => res.send("finance-alerts ok"));

// Protected trigger endpoint for external schedulers (GitHub Actions, etc.)
app.post("/run", async (req, res) => {
  const auth = isAuthorizedRunRequest(req);
  if (!auth.ok) {
    return res.status(auth.status).json({ ok: false, error: auth.error });
  }

  try {
    const sid = await runDailyJob();
    res.json({ ok: true, sid });
  } catch (err) {
    res.status(500).json({ ok: false, error: err.message });
  }
});

// Schedule the daily job unless explicitly disabled.
if (config.enableInternalCron) {
  if (cron.validate(config.cronSchedule)) {
    cron.schedule(
      config.cronSchedule,
      () => {
        runDailyJob().catch((err) => console.error("Scheduled job failed:", err));
      },
      { timezone: config.tz },
    );
    console.log(`Scheduled daily job: "${config.cronSchedule}" (${config.tz})`);
  } else {
    console.error(`Invalid CRON_SCHEDULE: ${config.cronSchedule}`);
  }
} else {
  console.log("Internal cron disabled (ENABLE_INTERNAL_CRON=false)");
}

app.listen(config.port, () => {
  console.log(`Listening on :${config.port}`);
});
