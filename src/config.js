import "dotenv/config";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));

function parseDelimitedList(value) {
  if (!value) return [];
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadAccountsConfig() {
  try {
    const raw = readFileSync(join(__dirname, "..", "accounts.json"), "utf-8");
    return JSON.parse(raw);
  } catch {
    return { accounts: [] };
  }
}

function loadAccountsFromEnv() {
  const entries = Object.entries(process.env);
  const tokenEntries = entries.filter(
    ([key, value]) => key.startsWith("PLAID_ACCOUNT_ACCESS_TOKEN_") && value,
  );

  return tokenEntries.map(([tokenKey, tokenValue]) => {
    const suffix = tokenKey.replace("PLAID_ACCOUNT_ACCESS_TOKEN_", "");
    const accountIdsRaw =
      process.env[`PLAID_ACCOUNT_ACCESS_IDS_${suffix}`] ||
      process.env[`PLAID_ACCOUNT_ACCESS_ID_${suffix}`];
    const accountIds = parseDelimitedList(accountIdsRaw);

    if (!accountIds.length) {
      throw new Error(
        `Missing account id for ${tokenKey}. Set PLAID_ACCOUNT_ACCESS_ID_${suffix} (or PLAID_ACCOUNT_ACCESS_IDS_${suffix}).`,
      );
    }

    const label =
      process.env[`PLAID_ACCOUNT_LABEL_${suffix}`] || `Account ${suffix}`;

    return {
      label,
      access_token: tokenValue,
      account_ids: accountIds,
    };
  });
}

const accountsConfig = loadAccountsConfig();
const envAccounts = loadAccountsFromEnv();

export const config = {
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    env: process.env.PLAID_ENV || "production",
  },
  email: {
    host: process.env.EMAIL_SMTP_HOST,
    port: Number(process.env.EMAIL_SMTP_PORT || 587),
    secure: process.env.EMAIL_SMTP_SECURE === "true",
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS,
    from: process.env.EMAIL_FROM,
    to: parseDelimitedList(process.env.EMAIL_TO),
  },
  cronSchedule: process.env.CRON_SCHEDULE || "0 7 * * *",
  tz: process.env.TZ || "America/Chicago",
  enableInternalCron: process.env.ENABLE_INTERNAL_CRON !== "false",
  runToken: process.env.RUN_TOKEN,
  port: process.env.PORT || 3000,
  accounts: envAccounts.length ? envAccounts : accountsConfig.accounts,
};
