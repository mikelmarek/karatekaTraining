import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const botToken = process.env.TELEGRAM_BOT_TOKEN;

if (!botToken || botToken.includes('your_bot_token')) {
  console.error('Nejdřív doplň TELEGRAM_BOT_TOKEN do .env.');
  process.exit(1);
}

console.log('\nNejdřív pošli botovi na Telegramu libovolnou zprávu, třeba: ahoj\n');

const response = await fetch(`https://api.telegram.org/bot${botToken}/getUpdates`);

if (!response.ok) {
  const errorText = await response.text();
  console.error(`Telegram API chyba: ${response.status} ${errorText}`);
  process.exit(1);
}

const data = await response.json();
const updates = data.result || [];

if (!updates.length) {
  console.log('Nebyla nalezena žádná zpráva. Napiš botovi zprávu a spusť skript znovu.');
  process.exit(0);
}

const candidates = [];
for (const update of updates) {
  const message = update.message || update.edited_message || update.channel_post;
  if (!message?.chat?.id) {
    continue;
  }
  candidates.push({
    chatId: String(message.chat.id),
    type: message.chat.type,
    title: message.chat.title || message.chat.username || [message.chat.first_name, message.chat.last_name].filter(Boolean).join(' '),
    text: message.text || ''
  });
}

if (!candidates.length) {
  console.log('V updatech nebyl nalezen použitelný chat.');
  process.exit(0);
}

console.log('Nalezené chaty:\n');
for (const item of candidates) {
  console.log(`CHAT_ID=${item.chatId} | typ=${item.type} | název=${item.title || '-'} | poslední text=${item.text || '-'}`);
}

console.log('\nPoužij správnou hodnotu jako TELEGRAM_CHAT_ID v .env.\n');
