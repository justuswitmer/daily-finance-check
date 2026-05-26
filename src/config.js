import 'dotenv/config';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const accountsConfig = JSON.parse(
  readFileSync(join(__dirname, '..', 'accounts.json'), 'utf-8')
);

export const config = {
  plaid: {
    clientId: process.env.PLAID_CLIENT_ID,
    secret: process.env.PLAID_SECRET,
    env: process.env.PLAID_ENV || 'production',
  },
  twilio: {
    accountSid: process.env.TWILIO_ACCOUNT_SID,
    authToken: process.env.TWILIO_AUTH_TOKEN,
    number: process.env.TWILIO_NUMBER,
    messagingServiceSid: process.env.TWILIO_MESSAGING_SERVICE_SID,
  },
  conversationSid: process.env.CONVERSATION_SID,
  cronSchedule: process.env.CRON_SCHEDULE || '0 7 * * *',
  tz: process.env.TZ || 'America/Chicago',
  port: process.env.PORT || 3000,
  accounts: accountsConfig.accounts,
  recipients: accountsConfig.recipients,
};
