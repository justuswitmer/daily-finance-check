/**
 * Inbound message webhook.
 *
 * V1: Twilio posts here when someone replies in the thread. We just log it
 * and acknowledge, so replies don't error out. The two humans chatting with
 * each other works regardless of this endpoint.
 *
 * V2: this is where you'll hand the inbound text to Claude with the Plaid
 * functions (getBalances/getTransactions) exposed as tools, then post the
 * answer back via postToConversation(). The wiring point is marked below.
 */
export function handleInboundMessage(req, res) {
  const { Author, Body, ConversationSid } = req.body || {};
  console.log(`[inbound] convo=${ConversationSid} from=${Author}: ${Body}`);

  // --- V2 HOOK ---
  // if (shouldAnswer(Body)) {
  //   const reply = await askClaude(Body);   // Claude + Plaid tools
  //   await postToConversation(reply);
  // }

  // Twilio expects a 200; empty 200 = no automated reply from this handler.
  res.status(200).send('');
}
