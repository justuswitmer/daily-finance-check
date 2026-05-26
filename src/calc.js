/**
 * Plaid convention: for credit/depository, a positive `amount` is money
 * leaving the account (a spend), negative is a credit/refund/payment.
 * We sum positive amounts as "spending".
 */
function isSpend(t) {
  return t.amount > 0;
}

function sumSpend(transactions) {
  return transactions
    .filter(isSpend)
    .reduce((acc, t) => acc + t.amount, 0);
}

/**
 * Current-month spend total: transactions dated on/after the 1st of this month.
 */
export function currentMonthTotal(transactions, now = new Date()) {
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const inMonth = transactions.filter(
    (t) => new Date(t.date) >= firstOfMonth
  );
  return sumSpend(inMonth);
}

/**
 * Rolling 30-day average daily spend.
 * Total spend over the trailing 30 days divided by 30.
 */
export function thirtyDayAverage(transactions, now = new Date()) {
  const cutoff = new Date(now);
  cutoff.setDate(cutoff.getDate() - 30);
  const window = transactions.filter((t) => new Date(t.date) >= cutoff);
  return sumSpend(window) / 30;
}

/**
 * Total current balance across all tracked accounts.
 */
export function totalBalance(balances) {
  return balances.reduce((acc, b) => acc + (b.currentBalance || 0), 0);
}

/**
 * Turn Plaid's UPPER_SNAKE category into readable Title Case.
 * e.g. "FOOD_AND_DRINK" -> "Food And Drink"
 */
function prettyCategory(key) {
  return key
    .toLowerCase()
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');
}

/**
 * Current-month spending grouped by Plaid's personal_finance_category.primary.
 * Falls back to the legacy `category` array, then to "Uncategorized".
 * Returns [{ category, amount }] sorted high to low.
 */
export function categoryBreakdown(transactions, now = new Date()) {
  const firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  const totals = new Map();

  for (const t of transactions) {
    if (!isSpend(t)) continue;
    if (new Date(t.date) < firstOfMonth) continue;

    let key;
    if (t.personal_finance_category?.primary) {
      key = prettyCategory(t.personal_finance_category.primary);
    } else if (Array.isArray(t.category) && t.category.length) {
      key = t.category[0];
    } else {
      key = 'Uncategorized';
    }

    totals.set(key, (totals.get(key) || 0) + t.amount);
  }

  return [...totals.entries()]
    .map(([category, amount]) => ({ category, amount }))
    .sort((a, b) => b.amount - a.amount);
}

const usd = (n) =>
  n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });

/**
 * Build the morning message body.
 */
export function buildMessage(balances, transactions, now = new Date()) {
  const month = currentMonthTotal(transactions, now);
  const avg = thirtyDayAverage(transactions, now);
  const total = totalBalance(balances);
  const byCategory = categoryBreakdown(transactions, now);

  const monthName = now.toLocaleString('en-US', { month: 'long' });

  const perAccount = balances
    .map((b) => `  ${b.label}: ${usd(b.currentBalance || 0)}`)
    .join('\n');

  const perCategory = byCategory.length
    ? byCategory.map((c) => `  ${c.category}: ${usd(c.amount)}`).join('\n')
    : '  (no spending yet this month)';

  return [
    `Good morning. Here's where things stand:`,
    ``,
    `${monthName} spending so far: ${usd(month)}`,
    `30-day avg/day: ${usd(avg)}`,
    `Total current balance: ${usd(total)}`,
    ``,
    `${monthName} by category:`,
    perCategory,
    ``,
    `By account:`,
    perAccount,
  ].join('\n');
}
