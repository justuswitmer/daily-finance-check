// list-accounts.mjs — run once per access token to discover account_ids
import "dotenv/config";
import { Configuration, PlaidApi, PlaidEnvironments } from "plaid";

const client = new PlaidApi(
  new Configuration({
    basePath: PlaidEnvironments[process.env.PLAID_ENV || "production"],
    baseOptions: {
      headers: {
        "PLAID-CLIENT-ID": process.env.PLAID_CLIENT_ID,
        "PLAID-SECRET": process.env.PLAID_SECRET,
      },
    },
  }),
);

const token = process.argv[2]; // pass the access token as an arg
const res = await client.accountsGet({ access_token: token });
for (const a of res.data.accounts) {
  console.log(
    `${a.account_id}  | ${a.name} (${a.subtype})  bal=${a.balances.current}`,
  );
}
