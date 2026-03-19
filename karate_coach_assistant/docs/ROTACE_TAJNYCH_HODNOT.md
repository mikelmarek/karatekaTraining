# Rotace tajných hodnot krok za krokem

Tento návod slouží pro situaci, kdy se tajné hodnoty omylem ukázaly v terminálu, chatu nebo v lokálním souboru.

## Co je potřeba vyměnit

Pro tento projekt je vhodné vyměnit hlavně:

- `TELEGRAM_BOT_TOKEN`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `KARATE_STATE_GIST_TOKEN`

Pokud vytvoříš nový Google OAuth klient, vymění se i:

- `GOOGLE_CLIENT_ID`

## Doporučené pořadí

1. vytvořit nový GitHub Gist token
2. vytvořit nový Telegram bot token
3. vytvořit nový Google OAuth klient nebo nový client secret
4. vytvořit nový Google refresh token
5. zapsat vše do lokálního `.env`
6. zapsat vše do GitHub Actions secrets
7. udělat lokální test
8. udělat cloud test přes workflow

---

## 1. Rotace `KARATE_STATE_GIST_TOKEN`

### Kde

GitHub → Settings → Developer settings → Personal access tokens

### Postup

1. Otevři GitHub účet.
2. Jdi do `Settings`.
3. Otevři `Developer settings`.
4. Otevři `Personal access tokens`.
5. Najdi starý token používaný pro Gist, nebo vytvoř nový.
6. Vytvoř nový token se scope `gist`.
7. Zkopíruj nový token.
8. Přepiš lokální `KARATE_STATE_GIST_TOKEN` v [../.env](../.env).
9. V repozitáři otevři `Settings → Secrets and variables → Actions`.
10. Najdi secret `KARATE_STATE_GIST_TOKEN`.
11. Klikni na `Update secret`.
12. Vlož nový token.
13. Ulož změnu.

---

## 2. Rotace `TELEGRAM_BOT_TOKEN`

### Kde

Telegram → `@BotFather`

### Postup

1. Otevři Telegram.
2. Najdi `@BotFather`.
3. Vyber svého bota.
4. Použij volbu pro vygenerování nového tokenu, případně zneplatnění starého.
5. Zkopíruj nový token.
6. Přepiš `TELEGRAM_BOT_TOKEN` v [../.env](../.env).
7. Na GitHubu otevři `Settings → Secrets and variables → Actions`.
8. Najdi secret `TELEGRAM_BOT_TOKEN`.
9. Klikni na `Update secret`.
10. Vlož nový token.
11. Ulož změnu.

### Kontrola

Po změně můžeš spustit lokálně:

- `npm run test-telegram`

---

## 3. Rotace `GOOGLE_CLIENT_SECRET` a případně `GOOGLE_CLIENT_ID`

### Kde

Google Cloud Console → `APIs & Services` → `Credentials`

### Doporučení

Nejčistší varianta je vytvořit nový OAuth client typu `Desktop app`.

### Postup

1. Otevři Google Cloud Console.
2. Vyber správný projekt.
3. Otevři `APIs & Services`.
4. Otevři `Credentials`.
5. Vytvoř nový `OAuth client ID` typu `Desktop app`, nebo obnov přístup podle interních pravidel projektu.
6. Zkopíruj nový `Client ID`.
7. Zkopíruj nový `Client Secret`.
8. Přepiš `GOOGLE_CLIENT_ID` a `GOOGLE_CLIENT_SECRET` v [../.env](../.env).
9. Na GitHubu v `Actions secrets` uprav:
   - `GOOGLE_CLIENT_ID`
   - `GOOGLE_CLIENT_SECRET`

### Pozor

Po změně OAuth klienta je potřeba vytvořit i nový `GOOGLE_REFRESH_TOKEN`.

---

## 4. Rotace `GOOGLE_REFRESH_TOKEN`

### Co je potřeba předem

V [../.env](../.env) musí být správně:

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`

### Postup

1. V adresáři projektu spusť `npm run get-google-auth-url`.
2. Otevři vypsaný odkaz v prohlížeči.
3. Přihlas Google účet, který má přístup ke kalendáři.
4. Po přesměrování zkopíruj parametr `code` z URL.
5. Spusť `npm run exchange-google-code -- "SEM_CODE"`.
6. Skript vypíše novou hodnotu `GOOGLE_REFRESH_TOKEN`.
7. Přepiš `GOOGLE_REFRESH_TOKEN` v [../.env](../.env).
8. Na GitHubu v `Actions secrets` uprav secret `GOOGLE_REFRESH_TOKEN`.

### Důležité poznámky

- autorizační `code` je jednorázový
- když ho použiješ podruhé, Google vrátí `invalid_grant`
- správný refresh token nezačíná jako autorizační `code`

---

## 5. Přepsání lokálního `.env`

Po rotaci musí být v [../.env](../.env) nové hodnoty minimálně pro:

- `TELEGRAM_BOT_TOKEN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `KARATE_STATE_GIST_TOKEN`

Dávej pozor, aby v řádcích nebyly navíc:

- mezery na začátku nebo konci
- uvozovky, pokud je nechceš používat konzistentně
- staré hodnoty zkopírované omylem vedle nových

---

## 6. Přepsání GitHub Actions secrets

V repozitáři otevři:

- `Settings`
- `Secrets and variables`
- `Actions`

Zkontroluj nebo uprav:

- `TELEGRAM_BOT_TOKEN`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `KARATE_STATE_GIST_TOKEN`

Pokud používáš cloud stav přes Gist, musí být správně i:

- `KARATE_STATE_GIST_ID`

---

## 7. Lokální ověření

Po změně spusť:

1. `npm run test-telegram`
2. `npm run check`

Správný výsledek:

- Telegram test projde
- `npm run check` nespadne na `invalid_grant`

---

## 8. Cloud ověření

1. Otevři workflow [../../.github/workflows/karate-reminders.yml](../../.github/workflows/karate-reminders.yml).
2. V GitHubu otevři záložku `Actions`.
3. Vyber workflow `Karate reminders`.
4. Klikni na `Run workflow`.
5. Zkontroluj oba joby:
   - `začátečníci`
   - `pokročilí`

Správný výsledek:

- workflow doběhne zeleně
- není tam chyba `invalid_grant`
- není tam chyba přístupu do Gistu

---

## 9. Finální úklid

Po úspěšném ověření:

1. zneplatni staré tokeny
2. staré hodnoty už nikde dál nepoužívej
3. případné dočasné poznámky s tajnými hodnotami smaž
4. neposílej tajné hodnoty do chatu ani do commitu

---

## Rychlý checklist

- [ ] nový `KARATE_STATE_GIST_TOKEN`
- [ ] nový `TELEGRAM_BOT_TOKEN`
- [ ] nový `GOOGLE_CLIENT_SECRET`
- [ ] případně nový `GOOGLE_CLIENT_ID`
- [ ] nový `GOOGLE_REFRESH_TOKEN`
- [ ] upravený [../.env](../.env)
- [ ] upravené GitHub Actions secrets
- [ ] lokálně funguje `npm run check`
- [ ] cloud workflow je zelené
