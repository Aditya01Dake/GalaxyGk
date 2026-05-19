import axios from 'axios';

// To actually send messages to Telegram, you need a Bot Token and Chat ID.
// 1. Create a bot using @BotFather on Telegram and get the BOT_TOKEN.
// 2. Add the bot as an administrator to your channel.
// 3. Get the CHAT_ID of your channel (e.g., @yourchannelname or a numeric ID).
// Set these in your .env file:
// VITE_TELEGRAM_BOT_TOKEN="your_bot_token"
// VITE_TELEGRAM_CHAT_ID="your_chat_id"

export const sendResultToTelegram = async (name: string, contact: string, score: number, totalQuestions: number) => {
  const env = import.meta.env as Record<string, string>;
  const botToken = env.VITE_TELEGRAM_BOT_TOKEN;
  const chatId = env.VITE_TELEGRAM_CHAT_ID;

  const message = `
🏆 *नवीन निकाल - Welcome GK Knowledge Hub* 🏆

👤 *नाव:* ${name}
📧 *संपर्क:* ${contact}
🎯 *स्कोर:* ${score} गुण
📝 *एकूण प्रश्न:* ${totalQuestions}

🎉 अभिनंदन!
  `;

  if (!botToken || !chatId) {
    console.warn("Telegram Bot Token or Chat ID is missing. Result not sent to Telegram.");
    console.log("Message that would have been sent:\n", message);
    return false;
  }

  try {
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
    await axios.post(url, {
      chat_id: chatId,
      text: message,
      parse_mode: 'Markdown',
    });
    return true;
  } catch (error) {
    console.error("Error sending message to Telegram:", error);
    return false;
  }
};
