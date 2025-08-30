require('dotenv').config();
const axios = require('axios');

const botToken = process.env.TELEGRAM_BOT_TOKEN;
const chatId = process.env.TELEGRAM_CHAT_ID;
const message = 'Test message from independent Telegram bot script!';

if (!botToken || !chatId) {
  console.error('Missing TELEGRAM_BOT_TOKEN or TELEGRAM_CHAT_ID in .env');
  process.exit(1);
}

const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

axios.post(url, {
  chat_id: chatId,
  text: message,
  parse_mode: 'HTML'
})
  .then(res => {
    console.log('Message sent:', res.data.ok);
    process.exit(0);
  })
  .catch(err => {
    console.error('Error sending message:', err.response ? err.response.data : err.message);
    process.exit(1);
  });
