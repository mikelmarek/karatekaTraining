import app from './plannerSecureApp.js';

const host = process.env.PLANNER_HOST || '0.0.0.0';
const port = Number(process.env.PLANNER_PORT || process.env.PORT || 4180);

app.listen(port, host, () => {
  console.log(`Secure planner běží na http://${host}:${port}`);
  console.log('Pro telefon na stejné Wi-Fi použij IP adresu tohoto Macu a stejný port.');
});