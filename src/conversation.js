import twilio from "twilio";
import { config } from "./config.js";

let twilioClient;

export function getTwilioClient() {
  if (twilioClient) {
    return twilioClient;
  }

  if (!config.twilio.accountSid) {
    throw new Error(
      "TWILIO_ACCOUNT_SID is required when using Twilio API keys.",
    );
  }
  if (!config.twilio.apiKeySid) {
    throw new Error("TWILIO_API_KEY_SID is required.");
  }
  if (!config.twilio.apiKeySecret) {
    throw new Error("TWILIO_API_KEY_SECRET is required.");
  }

  twilioClient = twilio(config.twilio.apiKeySid, config.twilio.apiKeySecret, {
    accountSid: config.twilio.accountSid,
  });

  return twilioClient;
}

/**
 * Post a message into the existing group conversation.
 * Twilio fans it out to all participants as a group MMS thread.
 */
export async function postToConversation(body) {
  if (!config.conversationSid) {
    throw new Error(
      "CONVERSATION_SID is not set. Run `npm run setup-conversation` first.",
    );
  }
  const msg = await getTwilioClient()
    .conversations.v1.conversations(config.conversationSid)
    .messages.create({ body });
  return msg.sid;
}
