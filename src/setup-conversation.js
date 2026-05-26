/**
 * ONE-TIME SETUP.
 *
 * Creates a Conversation, attaches your Messaging Service, and adds both
 * recipients as SMS/MMS participants using your Twilio number as the
 * projected address. With 2 recipients + your number, Twilio promotes the
 * thread to group MMS automatically, so both people see a shared thread and
 * can reply to each other.
 *
 * Run once:  npm run setup-conversation
 * Then copy the printed CONVERSATION_SID into your .env.
 */
import { twilioClient } from './conversation.js';
import { config } from './config.js';

async function main() {
  if (config.recipients.length < 2) {
    throw new Error('Group MMS needs at least 2 recipients (+ your Twilio number = 3 participants).');
  }

  const convo = await twilioClient.conversations.v1.conversations.create({
    friendlyName: 'Finance Alerts',
  });
  console.log('Created conversation:', convo.sid);

  for (const phone of config.recipients) {
    await twilioClient.conversations.v1
      .conversations(convo.sid)
      .participants.create({
        'messagingBinding.address': phone,
        'messagingBinding.proxyAddress': config.twilio.number,
      });
    console.log('Added participant:', phone);
  }

  console.log('\nDone. Add this to your .env:\n');
  console.log(`CONVERSATION_SID=${convo.sid}`);
}

main().catch((err) => {
  console.error('Setup failed:', err.message);
  process.exit(1);
});
