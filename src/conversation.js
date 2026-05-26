import twilio from 'twilio';
import { config } from './config.js';

export const twilioClient = twilio(
  config.twilio.accountSid,
  config.twilio.authToken
);

/**
 * Post a message into the existing group conversation.
 * Twilio fans it out to all participants as a group MMS thread.
 */
export async function postToConversation(body) {
  if (!config.conversationSid) {
    throw new Error(
      'CONVERSATION_SID is not set. Run `npm run setup-conversation` first.'
    );
  }
  const msg = await twilioClient.conversations.v1
    .conversations(config.conversationSid)
    .messages.create({ body });
  return msg.sid;
}
