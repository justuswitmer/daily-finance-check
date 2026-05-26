/**
 * The daily job: fetch balances + transactions, compute the three numbers,
 * post the morning message into the group conversation.
 *
 * Run manually:  npm run run-job
 * Run on schedule: handled by server.js via node-cron.
 */
import { getBalances, getTransactions } from './plaid.js';
import { buildMessage } from './calc.js';
import { postToConversation } from './conversation.js';

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
  const sid = await postToConversation(body);
  console.log(`[${now.toISOString()}] Posted message ${sid}`);
  return sid;
}

// Allow running directly: `node src/index.js`
if (import.meta.url === `file://${process.argv[1]}`) {
  runDailyJob().catch((err) => {
    console.error('Daily job failed:', err);
    process.exit(1);
  });
}
