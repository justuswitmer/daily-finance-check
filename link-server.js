/**
 * ONE-TIME PLAID LINK SETUP TOOL.
 *
 * Run this locally to link your banks and generate access tokens + discover
 * account_ids. It is intentionally separate from the main app (src/server.js)
 * and is NOT deployed.
 *
 * Usage:
 *   1. Make sure .env has PLAID_CLIENT_ID, PLAID_SECRET, PLAID_ENV.
 *      (PLAID_ENV=production for real banks on a Trial/Production plan,
 *       or PLAID_ENV=sandbox to practice with fake banks.)
 *   2. node setup/link-server.js
 *   3. Open http://localhost:4000 in your browser.
 *   4. Click "Link a bank", complete the flow, repeat per bank.
 *   5. The page shows the access_token + every account_id under it.
 *      Paste what you want into accounts.json, then stop this server.
 */
import "dotenv/config";
import express from "express";
import {
  Configuration,
  PlaidApi,
  PlaidEnvironments,
  Products,
  CountryCode,
} from "plaid";

const PORT = 4000;

const client = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || "sandbox"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  }),
);

const app = express();
app.use(express.json());

// 1) Create a link_token to initialize Plaid Link in the browser.
app.post("/api/create_link_token", async (_req, res) => {
  try {
    const resp = await client.linkTokenCreate({
      user: { client_user_id: "finance-alerts-setup" },
      client_name: "Finance Alerts Setup",
      products: [Products.Transactions],
      country_codes: [CountryCode.Us],
      language: "en",
    });
    res.json({ link_token: resp.data.link_token });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

// 2) Exchange the public_token for an access_token, then list accounts.
app.post("/api/exchange", async (req, res) => {
  try {
    const { public_token } = req.body;
    const exch = await client.itemPublicTokenExchange({ public_token });
    const access_token = exch.data.access_token;

    const acctsResp = await client.accountsGet({ access_token });
    const accounts = acctsResp.data.accounts.map((a) => ({
      account_id: a.account_id,
      name: a.name,
      subtype: a.subtype,
      mask: a.mask,
      current: a.balances.current,
    }));

    // Log to terminal too, so you have a copy outside the browser.
    console.log("\n=== LINKED ITEM ===");
    console.log("access_token:", access_token);
    console.table(accounts);

    res.json({ access_token, accounts });
  } catch (err) {
    console.error(err.response?.data || err.message);
    res.status(500).json({ error: err.response?.data || err.message });
  }
});

app.get("/", (_req, res) => {
  res.type("html").send(PAGE);
});

const PAGE = `<!doctype html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Finance Alerts - Plaid Link Setup</title>
  <script src="https://cdn.plaid.com/link/v2/stable/link-initialize.js"></script>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 760px; margin: 40px auto; padding: 0 16px; }
    button { font-size: 16px; padding: 10px 18px; cursor: pointer; }
    .item { border: 1px solid #ddd; border-radius: 8px; padding: 16px; margin: 16px 0; }
    code { background: #f4f4f4; padding: 2px 6px; border-radius: 4px; word-break: break-all; }
    table { border-collapse: collapse; width: 100%; margin-top: 8px; }
    th, td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; font-size: 14px; }
    .hint { color: #666; font-size: 14px; }
  </style>
</head>
<body>
  <h1>Plaid Link Setup</h1>
  <p class="hint">Click below to link a bank. After each link, the access token and its account IDs appear here. Copy what you need into <code>accounts.json</code>. Link as many banks as you want; repeat the button each time.</p>
  <button id="link">Link a bank</button>
  <div id="results"></div>

  <script>
    const results = document.getElementById('results');

    async function startLink() {
      const r = await fetch('/api/create_link_token', { method: 'POST' });
      const { link_token, error } = await r.json();
      if (error) { alert('Error creating link token: ' + JSON.stringify(error)); return; }

      const handler = Plaid.create({
        token: link_token,
        onSuccess: async (public_token) => {
          const ex = await fetch('/api/exchange', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ public_token }),
          });
          const data = await ex.json();
          if (data.error) { alert('Exchange error: ' + JSON.stringify(data.error)); return; }
          render(data);
        },
        onExit: (err) => { if (err) console.log('exit', err); },
      });
      handler.open();
    }

    function render({ access_token, accounts }) {
      const div = document.createElement('div');
      div.className = 'item';
      const rows = accounts.map(a =>
        '<tr><td><code>' + a.account_id + '</code></td><td>' + a.name +
        '</td><td>' + (a.subtype || '') + '</td><td>' + (a.mask || '') +
        '</td><td>' + (a.current ?? '') + '</td></tr>'
      ).join('');
      div.innerHTML =
        '<p><strong>access_token:</strong> <code>' + access_token + '</code></p>' +
        '<table><tr><th>account_id</th><th>name</th><th>subtype</th><th>mask</th><th>current</th></tr>' +
        rows + '</table>';
      results.prepend(div);
    }

    document.getElementById('link').addEventListener('click', startLink);
  </script>
</body>
</html>`;

app.listen(PORT, () => {
  console.log(`Plaid Link setup running: http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.PLAID_ENV || "sandbox"}`);
});
