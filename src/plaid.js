import { Configuration, PlaidApi, PlaidEnvironments } from 'plaid';
import { config } from './config.js';

const plaidClient = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[config.plaid.env],
    baseOptions: {
      headers: {
        'PLAID-CLIENT-ID': config.plaid.clientId,
        'PLAID-SECRET': config.plaid.secret,
      },
    },
  })
);

function ymd(date) {
  return date.toISOString().slice(0, 10);
}

/**
 * Current balances for the tracked accounts.
 * Returns [{ label, accountId, name, currentBalance, currencyCode }]
 * These are *current balance*, not credit usage, per requirement.
 */
export async function getBalances() {
  const out = [];
  for (const acct of config.accounts) {
    const resp = await plaidClient.accountsBalanceGet({
      access_token: acct.access_token,
      options: { account_ids: acct.account_ids },
    });
    for (const a of resp.data.accounts) {
      out.push({
        label: acct.label,
        accountId: a.account_id,
        name: a.name,
        currentBalance: a.balances.current,
        currencyCode: a.balances.iso_currency_code || 'USD',
      });
    }
  }
  return out;
}

/**
 * Transactions across tracked accounts between start and end (Date objects).
 * Handles pagination. Returns a flat array of Plaid transaction objects,
 * each tagged with the account label.
 */
export async function getTransactions(start, end) {
  const startDate = ymd(start);
  const endDate = ymd(end);
  const all = [];

  for (const acct of config.accounts) {
    let fetched = [];
    let total = Infinity;
    while (fetched.length < total) {
      const resp = await plaidClient.transactionsGet({
        access_token: acct.access_token,
        start_date: startDate,
        end_date: endDate,
        options: {
          account_ids: acct.account_ids,
          offset: fetched.length,
        },
      });
      total = resp.data.total_transactions;
      fetched = fetched.concat(resp.data.transactions);
    }
    for (const t of fetched) all.push({ ...t, _label: acct.label });
  }
  return all;
}
