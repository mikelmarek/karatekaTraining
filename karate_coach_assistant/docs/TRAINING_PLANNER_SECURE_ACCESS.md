# Secure přístup do planneru

Tato varianta řeší planner tak, aby šel:

- otevřít lokálně na Macu,
- otevřít z telefonu ve stejné síti,
- nasadit na veřejný web s loginem.

Na rozdíl od GitHub Pages tahle varianta umí:

- přihlašovací stránku,
- kontrolu jména a hesla na serveru,
- session cookie,
- e-mailové upozornění po přihlášení.

## 1. Nastavení .env

Do [karate_coach_assistant/.env](../.env) doplň minimálně:

```env
PLANNER_PORT=4180
PLANNER_HOST=0.0.0.0
PLANNER_AUTH_USERNAME=marek
PLANNER_AUTH_PASSWORD=nejake_silne_heslo
PLANNER_SESSION_SECRET=dlouhy_nahodny_tajny_retezec

LOGIN_NOTIFY_TO=tvuj@email.cz
SMTP_HOST=smtp.gmail.com
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=tvuj@email.cz
SMTP_PASS=google_app_password
SMTP_FROM=Karate Planner <tvuj@email.cz>
```

Pokud nechceš mít heslo v .env čitelně, můžeš místo PLANNER_AUTH_PASSWORD použít PLANNER_AUTH_PASSWORD_HASH s bcrypt hashem.

## 2. Lokální spuštění

V [karate_coach_assistant/README.md](../README.md) spusť:

```bash
npm run planner:web:build
npm run planner:serve
```

Potom otevři:

- na Macu: http://localhost:4180
- na telefonu ve stejné Wi-Fi: http://IP_TVEHO_MACU:4180

## 3. Veřejný web

Pro veřejnou adresu už nestačí GitHub Pages, protože login a e-mail se musí řešit serverově.

Použitelné varianty:

- Vercel
- Render
- Railway
- VPS
- domácí Mac + reverzní proxy nebo tunnel

Nasazuje se vždy celý adresář [karate_coach_assistant](../README.md) jako Node aplikace.

Start command:

```bash
npm run planner:serve
```

Před deployem ještě jednou přegeneruj planner data:

```bash
npm run planner:web:build
```

### Varianta připravená pro GitHub + Vercel

V repozitáři je nově připravená i free-friendly Vercel varianta:

- [vercel.json](../vercel.json) pro Vercel deploy,
- [api/[...path].js](../api/%5B...path%5D.js) jako serverless API wrapper,
- [src/plannerSecureApp.js](../src/plannerSecureApp.js) jako sdílená app pro lokální server i Vercel,
- `npm run planner:web:build:vercel` pro přípravu statiky a dat do Vercel adresářů.

Pro Vercel nastav v projektu jako Root Directory:

- `karate_coach_assistant`

Environment variables na Vercelu:

- `PLANNER_AUTH_USERNAME`
- `PLANNER_AUTH_PASSWORD_HASH`
- `PLANNER_SESSION_SECRET`
- `PLANNER_SESSION_TTL_HOURS`
- `LOGIN_NOTIFY_TO`
- `SMTP_HOST`
- `SMTP_PORT`
- `SMTP_SECURE`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_FROM`

Poznámka: Vercel může být pro tento lehký planner dostupný i ve free režimu, zatímco Render ti může u web service nabídnout rovnou placený Starter tarif.

### Varianta připravená pro GitHub + Render

V repozitáři je už připraveno:

- [render.yaml](../../render.yaml) pro Render Blueprint deploy,
- [planner-secure-ci.yml](../../.github/workflows/planner-secure-ci.yml) pro GitHub Actions kontrolu secure planneru při pushi,
- [training-planner-pages.yml](../../.github/workflows/training-planner-pages.yml) pro veřejnou statickou GitHub Pages verzi.

Prakticky to znamená:

1. GitHub Pages může dál publikovat veřejnou statickou variantu planneru.
2. Render si z téhož GitHub repa vezme secure Node variantu s loginem.
3. Po každém pushi do relevantních souborů GitHub Actions ověří, že secure login flow pořád funguje.

### Jak to nasadit přes GitHub do Renderu

1. Pushni repozitář na GitHub.
2. V Renderu zvol New + Blueprint.
3. Připoj GitHub repo.
4. Render načte [render.yaml](../../render.yaml) automaticky.
5. Doplň secrets:
	- `PLANNER_AUTH_USERNAME`
	- `PLANNER_AUTH_PASSWORD_HASH` nebo `PLANNER_AUTH_PASSWORD`
	- `PLANNER_SESSION_SECRET`
	- `LOGIN_NOTIFY_TO`
	- `SMTP_HOST`
	- `SMTP_PORT`
	- `SMTP_SECURE`
	- `SMTP_USER`
	- `SMTP_PASS`
	- `SMTP_FROM`
6. Dokonči deploy.

Poznámka: Render standardně předává port v proměnné `PORT`, kterou server už nyní umí použít.

## 4. Důležitá poznámka

Současná GitHub Pages verze planneru může dál existovat jako veřejná statická varianta, ale chráněná verze s loginem musí běžet přes Node server.