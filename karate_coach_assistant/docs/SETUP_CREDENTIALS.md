# Nastavení `.env` krok za krokem

Tady je přesně, co patří do `.env`, odkud to vzít a co udělat.

## 1. `TELEGRAM_BOT_TOKEN`

### Kde ho vzít
1. Otevři Telegram.
2. Najdi `@BotFather`.
3. Pošli `/newbot`.
4. Zadej jméno bota.
5. Zadej username bota, musí končit na `bot`.
6. BotFather vrátí token ve tvaru:
   `123456789:AA...`

### Co vložit do `.env`
- tuhle celou hodnotu dej do `TELEGRAM_BOT_TOKEN`

Příklad:

```dotenv
TELEGRAM_BOT_TOKEN=123456789:AAExampleRealToken
```

---

## 2. `TELEGRAM_CHAT_ID`

### Kde ho vzít
1. Nejdřív napiš svému botovi normální zprávu, třeba `ahoj`.
2. Pak v projektu spusť:
   `npm run get-telegram-chat-id`
3. Skript vypíše nalezené `CHAT_ID`.

### Co vložit do `.env`
- správnou hodnotu `CHAT_ID`

Příklad:

```dotenv
TELEGRAM_CHAT_ID=123456789
```

Poznámka:
- pro soukromý chat bývá číslo kladné,
- pro skupinu bývá často záporné.

---

## 3. `GOOGLE_CLIENT_ID`
## 4. `GOOGLE_CLIENT_SECRET`

### Kde je vzít
1. Otevři Google Cloud Console.
2. Vytvoř nový projekt, nebo použij existující.
3. Zapni `Google Calendar API`.
4. Otevři `APIs & Services` → `Credentials`.
5. Zvol `Create Credentials` → `OAuth client ID`.
6. Pokud bude potřeba, nastav `OAuth consent screen`:
   - typ klidně `External`,
   - vyplň název aplikace,
   - přidej svůj Google účet jako test user.
7. Pro typ klienta zvol `Desktop app`.
8. Po vytvoření dostaneš:
   - `Client ID`
   - `Client Secret`

### Co vložit do `.env`

```dotenv
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
```

---

## 5. `GOOGLE_REFRESH_TOKEN`

### Jak ho získat
V projektu už je hotový helper.

1. Nejdřív doplň do `.env`:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`
2. Spusť:
   `npm run get-google-auth-url`
3. Otevři vypsaný odkaz.
4. Přihlas se Google účtem, který má přístup ke kalendáři.
5. Po přesměrování zkopíruj parametr `code` z URL.
6. Spusť:
   `npm run exchange-google-code -- "PASTE_CODE_SEM"`
7. Skript vypíše hotový `GOOGLE_REFRESH_TOKEN`.

### Co vložit do `.env`

```dotenv
GOOGLE_REFRESH_TOKEN=...
```

---

## 6. `GOOGLE_CALENDAR_ID`

### Nejjednodušší varianta
Pokud máš tréninky ve svém hlavním Google kalendáři, nech:

```dotenv
GOOGLE_CALENDAR_ID=primary
```

### Pokud máš samostatný kalendář
V Google Kalendáři:
1. Otevři nastavení konkrétního kalendáře.
2. Najdi sekci `Integrate calendar`.
3. Zkopíruj `Calendar ID`.

Pak vlož například:

```dotenv
GOOGLE_CALENDAR_ID=abc123@group.calendar.google.com
```

---

## 7. Ostatní hodnoty

Tyto můžeš nechat tak, jak jsou:

```dotenv
TIMEZONE=Europe/Prague
TRAINING_EVENT_QUERY=karate
CHECK_CRON=*/15 * * * *
LOG_FILE=./runtime/job.log
MANUAL_FILE=../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md
STATE_FILE=./runtime/state.json
PREFERENCES_FILE=./config/preferences.md
AGENT_ROLE_FILE=./config/agent_role.md
```

### Co dělá `TRAINING_EVENT_QUERY`
Agent hledá jen události, kde je v názvu, popisu nebo místě tento text.

Pokud máš v kalendáři akce třeba jako:
- `Dětské karate`
- `Karate děti`
- `Karate trénink`

nech `karate`.

Pokud používáš jiný název, změň ho.

---

## Doporučený postup vyplnění

1. Získej Telegram token.
2. Doplň `TELEGRAM_BOT_TOKEN`.
3. Napiš botovi zprávu.
4. Spusť `npm run get-telegram-chat-id`.
5. Doplň `TELEGRAM_CHAT_ID`.
6. V Google Cloud vytvoř OAuth klienta.
7. Doplň `GOOGLE_CLIENT_ID` a `GOOGLE_CLIENT_SECRET`.
8. Spusť `npm run get-google-token`.
9. Doplň `GOOGLE_REFRESH_TOKEN`.
10. Nech `GOOGLE_CALENDAR_ID=primary`, pokud nepoužíváš jiný kalendář.
11. Otestuj Telegram: `npm run test-telegram`.
12. Otestuj kalendář a scheduler: `npm run check`.

---

## Když budeš chtít rychlou kontrolu
Po vyplnění `.env` spusť:

1. `npm run test-telegram`
2. `npm run check`

Pokud je v kalendáři akce přibližně za 24 hodin nebo 2 hodiny a obsahuje hledaný text, agent pošle zprávu.
