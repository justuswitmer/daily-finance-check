# finance-alerts

Daily credit card / bank balance alerts via Plaid and email.

## What it does

Every morning, a scheduled job:

1. Pulls current balances + recent transactions for configured Plaid accounts
2. Computes current-month spending, rolling 30-day total, and total current balance
3. Sends one email summary to the configured recipients

## Setup

1. `npm install`
2. Copy `.env.example` to `.env` and fill in Plaid + SMTP email values.
3. Configure tracked Plaid accounts using one of these options:
   - Preferred: `.env` variables using suffixes (`ONE`, `TWO`, `1`, etc.), e.g. `PLAID_ACCOUNT_ACCESS_TOKEN_ONE` + `PLAID_ACCOUNT_ACCESS_ID_ONE`.
   - Fallback: `accounts.json` for account tokens/ids.
4. Set `EMAIL_TO` to one or more recipient email addresses, comma-separated.
5. For Gmail, set SMTP settings in `.env` as follows:
   - `EMAIL_SMTP_HOST=smtp.gmail.com`
   - `EMAIL_SMTP_PORT=465`
   - `EMAIL_SMTP_SECURE=true`
   - `EMAIL_SMTP_USER=your@gmail.com`
   - `EMAIL_SMTP_PASS=your Google App Password`
   - `EMAIL_FROM=your@gmail.com`
6. Gmail requires 2-Step Verification and an App Password for SMTP.
7. Test immediately: `npm run run-job`
8. `npm start` runs the server + scheduler.

## Deploy (Fly.io)

- `fly launch` (uses the included fly.toml / Dockerfile)
- Set secrets: `fly secrets set PLAID_CLIENT_ID=... PLAID_SECRET=... EMAIL_SMTP_HOST=... EMAIL_SMTP_PORT=... EMAIL_SMTP_USER=... EMAIL_SMTP_PASS=... EMAIL_FROM=... EMAIL_TO=...`
- `fly deploy`

### External scheduler mode (recommended)

Use an external scheduler (for example, GitHub Actions) to call the protected
`POST /run` endpoint once per day.

1. Disable internal cron and set a run token:
   - `fly secrets set ENABLE_INTERNAL_CRON=false RUN_TOKEN=your-long-random-token`
2. Trigger endpoint from your scheduler:
   - `curl -X POST https://<your-app>.fly.dev/run -H "Authorization: Bearer your-long-random-token"`

This avoids duplicate sends if you ever run more than one app instance.

#### GitHub Actions scheduler

This repo includes `.github/workflows/daily-trigger.yml` to call `/run` daily.

Set these repository secrets in GitHub:

- `JOB_URL` (example: `https://<your-app>.fly.dev`)
- `RUN_TOKEN` (must match Fly `RUN_TOKEN` secret)

You can also run it immediately from GitHub Actions via **Run workflow**.

## Future

`src/plaid.js` is still written so the Plaid functions can double as Claude tools later.
