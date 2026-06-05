/**
 * The daily job: fetch balances + transactions, compute the three numbers,
 * send the morning message by email.
 *
 * Run manually:  npm run run-job
 * Run on schedule: handled by server.js via node-cron.
 */
import { getBalances, getTransactions } from "./plaid.js";
import { buildMessage } from "./calc.js";
import { sendSummaryEmail } from "./email.js";

export async function runDailyJob() {
  const now = new Date();

  // Pull a 31-day window so both "this month" and "trailing 30 days" are covered.
  const windowStart = new Date(now);
  windowStart.setDate(windowStart.getDate() - 31);

  const [balances, transactions] = await Promise.all([
    getBalances(),
    getTransactions(windowStart, now),
  ]);

  const body = buildMessage(balances, transactions, now);
  const messageId = await sendSummaryEmail(body, now);
  console.log(`[${now.toISOString()}] Sent email ${messageId}`);
  return messageId;
}

// Allow running directly: `node src/index.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyJob().catch((err) => {
    console.error("Daily job failed:", err);
    process.exit(1);
  });
}
