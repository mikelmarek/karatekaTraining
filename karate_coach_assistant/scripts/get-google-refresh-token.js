import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { google } from 'googleapis';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

dotenv.config({ path: path.join(projectRoot, '.env') });

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
const redirectUri = 'http://127.0.0.1';

if (!clientId || !clientSecret) {
  console.error('Chybí GOOGLE_CLIENT_ID nebo GOOGLE_CLIENT_SECRET v .env.');
  process.exit(1);
}

const oauth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
const scopes = ['https://www.googleapis.com/auth/calendar.readonly'];
const args = process.argv.slice(2);
const mode = args[0] || '--interactive';
const codeFromArgs = mode === '--code' ? args[1] : null;

const authUrl = oauth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent',
  scope: scopes
});

if (mode === '--url') {
  console.log('\nOtevři tento odkaz v prohlížeči:\n');
  console.log(authUrl);
  console.log('\nPo přihlášení zkopíruj hodnotu parametru code z URL a pak spusť:');
  console.log('npm run exchange-google-code -- "PASTE_CODE_SEM"\n');
  process.exit(0);
}

if (!codeFromArgs) {
  console.log('\n1) Otevři tento odkaz v prohlížeči:\n');
  console.log(authUrl);
  console.log('\n2) Přihlas se a po přesměrování zkopíruj hodnotu parametru code z URL.\n');
  console.log('3) Pak spusť:\n');
  console.log('npm run exchange-google-code -- "PASTE_CODE_SEM"\n');
  process.exit(0);
}

const { tokens } = await oauth2Client.getToken(codeFromArgs.trim());

if (!tokens.refresh_token) {
  console.error('\nRefresh token nebyl vrácen. Zkus znovu a ujisti se, že používáš prompt=consent.');
  process.exit(1);
}

console.log('\nHotovo. Přidej do .env tuto hodnotu:\n');
console.log(`GOOGLE_REFRESH_TOKEN=${tokens.refresh_token}\n`);
