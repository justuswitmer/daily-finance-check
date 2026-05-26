# finance-alerts

Daily group-text of credit card / bank balances via Plaid + Twilio Conversations.

## What it does (V1)
Every morning, a scheduled job:
1. Pulls current balances + recent transactions for hardcoded accounts (Plaid)
2. Computes: current-month spending, rolling 30-day avg/day, total current balance
3. Posts one message into a Twilio group MMS thread so both recipients see it
   and can chat about it together.

## Setup
1. `npm install`
2. Copy `.env.example` to `.env` and fill in Plaid + Twilio values.
3. Edit `accounts.json`: add your Plaid access tokens + account_ids, and the two recipient phone numbers (E.164, +1...).
4. Create a Messaging Service in the Twilio console, attach your Twilio number, put its SID in `.env`.
5. `npm run setup-conversation` (one-time) -> copy the printed CONVERSATION_SID into `.env`.
6. Test immediately: `npm run run-job`
7. `npm start` runs the server + scheduler.

## Deploy (Fly.io)
- `fly launch` (uses the included fly.toml / Dockerfile)
- Set secrets: `fly secrets set PLAID_CLIENT_ID=... PLAID_SECRET=... TWILIO_ACCOUNT_SID=... TWILIO_AUTH_TOKEN=... TWILIO_MESSAGING_SERVICE_SID=... CONVERSATION_SID=...`
- `fly deploy`
- In Twilio, point the Conversations inbound webhook at https://<your-app>.fly.dev/webhook

## V2 (later)
The Plaid functions in `src/plaid.js` are written to double as Claude tools.
`src/webhook.js` already receives inbound texts; the marked hook is where you
hand the message to Claude with those tools and post the reply back.