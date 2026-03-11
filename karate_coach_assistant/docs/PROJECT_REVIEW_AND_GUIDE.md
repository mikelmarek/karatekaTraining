# Revize projektu a návod k používání

Tento dokument shrnuje, co je v projektu hotové, jak to teď funguje a jak systém dál rozšiřovat.

## 1. Co projekt aktuálně umí

- čte Google kalendář,
- hledá tréninky podle textu `karate`,
- 30 hodin před tréninkem pošle detailní plán,
- 6 hodin před tréninkem pošle krátké připomenutí,
- po skončení tréninku zapíše, která lekce proběhla,
- automaticky posune další lekci,
- ukládá historii použitých lekcí,
- zapisuje běhy jobu do logu,
- po vyčerpání lekcí 1–40 pošle upozornění místo opakování poslední lekce.

Aktuální produkční nasazení:

- GitHub Actions workflow [../.github/workflows/karate-reminders.yml](../.github/workflows/karate-reminders.yml),
- externí stav přes GitHub Gist,
- oddělené běhy pro `beginner` a `advanced`,
- lokální `launchd` jen jako fallback.

## 2. Přehled důležitých souborů

### Konfigurace a stav

- [../runtime/state.json](../runtime/state.json) – aktuální stav systému
- [../.env.example](../.env.example) – vzor nastavení proměnných
- [../runtime/job.log](../runtime/job.log) – provozní log běhů

### Dokumentace a pravidla

- [../README.md](../README.md) – základní návod
- [SETUP_CREDENTIALS.md](SETUP_CREDENTIALS.md) – získání Telegram a Google přístupů
- [../config/agent_role.md](../config/agent_role.md) – role asistenta
- [../config/preferences.md](../config/preferences.md) – metodická pravidla
- [../runtime/training_log.md](../runtime/training_log.md) – ruční poznámky po trénincích

### Kód agenta

- [../src/index.js](../src/index.js) – vstupní bod a CLI příkazy
- [../src/config.js](../src/config.js) – načtení `.env`
- [../src/scheduler.js](../src/scheduler.js) – hlavní job logika
- [../src/calendarService.js](../src/calendarService.js) – Google Calendar čtení
- [../src/telegramService.js](../src/telegramService.js) – odeslání do Telegramu
- [../src/manualRepository.js](../src/manualRepository.js) – načtení a generování lekcí
- [../src/planner.js](../src/planner.js) – převod lekce do čitelné zprávy
- [../src/stateStore.js](../src/stateStore.js) – čtení a ukládání stavu
- [../src/logger.js](../src/logger.js) – provozní logování

### Zdrojové tréninkové podklady

- [../../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md](../../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md) – hlavní manuál
- [../../content/popis_treninku.md](../../content/popis_treninku.md) – stručný metodický podklad
- [../../content/karate_deti_treninky.md](../../content/karate_deti_treninky.md) – stručnější rozpisy

## 3. Jak to teď funguje krok za krokem

### Krok 1 – scheduler se spustí

Agent běží podle `CHECK_CRON`.
Výchozí hodnota je každých 15 minut.

### Krok 2 – načte se stav

Ze [../runtime/state.json](../runtime/state.json) se načte:

- aktuální lekce,
- historie proběhlých lekcí,
- datum startu série,
- informace, zda už došla osnova 1–40.

### Krok 3 – načte se kalendář

Ze zadaného Google kalendáře se načtou události v časovém okně.

### Krok 4 – uzavřou se proběhlé tréninky

Pokud nějaká kalendářová událost už skončila a ještě nebyla zapsaná:

- uloží se do `lesson_history`,
- zapíše se použitá lekce,
- posune se `current_lesson`,
- nebo se označí `curriculum_exhausted`, pokud skončila lekce 40.

### Krok 5 – zkontrolují se budoucí tréninky

Pokud je událost přibližně:

- za 30 hodin,
- nebo za 6 hodin,

agent pošle odpovídající zprávu do Telegramu.

### Krok 6 – vše se zapíše do logu

Každý job se zapíše do [../runtime/job.log](../runtime/job.log).

## 4. Jak to používat v běžném provozu

### Jednorázová kontrola

- `npm run check`

### Ověření Telegramu

- `npm run test-telegram`

### Test detailního plánu

- `npm run test-plan`

### Test krátkého připomenutí

- `npm run test-plan -- 6h`

### Ruční změna lekce

- `npm run set-lesson -- 7`

### Trvalý běh

- `npm start`

### GitHub Actions

Produkční cloud běh je v:

- [../.github/workflows/karate-reminders.yml](../.github/workflows/karate-reminders.yml)

Detailní návod je v:

- [GITHUB_ACTIONS_DEPLOYMENT.md](GITHUB_ACTIONS_DEPLOYMENT.md)

### launchd na macOS

Template v projektu:

- [../launchd/com.marek.karatecoachassistant.plist.template](../launchd/com.marek.karatecoachassistant.plist.template)

Aktivní uživatelská kopie po nasazení:

- `~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`

Praktické příkazy:

- stav: `launchctl print gui/$(id -u)/com.marek.karatecoachassistant`
- restart: `launchctl kickstart -k gui/$(id -u)/com.marek.karatecoachassistant`
- vypnutí: `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`
- znovunačtení: `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`

Poznámka:

- pokud běží GitHub Actions produkce, mají být lokální Mac joby vypnuté.

## 5. Jak číst stav systému

V [../runtime/state.json](../runtime/state.json) sleduj hlavně:

- `current_lesson` – co je právě na řadě,
- `last_training_date` – poslední uzavřený trénink,
- `lesson_history` – co už proběhlo,
- `curriculum_exhausted` – zda došla série 1–40.

## 6. Jak rozšiřovat obsah tréninků

### Varianta A – upravovat první detailní lekce

Pokud chceš zlepšovat lekce 1–10, upravuj:

- [../../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md](../../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md)

To je hlavní zdroj pravdy pro detailní lekce.

### Varianta B – zlepšit generované lekce 11–40

Pokud chceš lépe řídit pokročilejší části, upravuj:

- [../src/manualRepository.js](../src/manualRepository.js)

Tam je:

- logika bloků,
- techniky,
- hry,
- automaticky skládaný plán.

### Varianta C – změnit styl výstupu v Telegramu

Upravuj:

- [../src/planner.js](../src/planner.js)

Tam se rozhoduje:

- jak vypadá detailní plán,
- jak vypadá krátké připomenutí,
- jak vypadá upozornění po vyčerpání osnovy.

## 7. Jak připravit další sérii po lekci 40

Jakmile systém oznámí vyčerpání lekcí, doporučený postup je:

1. otevřít [../runtime/state.json](../runtime/state.json),
2. projít `lesson_history`,
3. vyhodnotit, co děti prošly a co potřebují upevnit,
4. připravit nový blok lekcí 41+ nebo novou navazující sérii,
5. doplnit obsah do manuálu nebo do logiky v [../src/manualRepository.js](../src/manualRepository.js),
6. znovu nastavit `curriculum_exhausted=false`,
7. nastavit nové `current_lesson`.

## 8. Doporučené další rozšíření

Nejrozumnější navazující kroky jsou:

1. automatický sběr feedbacku z Telegramu po tréninku,
2. automatické ukládání odpovědí do [../runtime/training_log.md](../runtime/training_log.md),
3. lepší generování navazujících bloků po lekci 40,
4. přehled běhů a monitoring GitHub Actions,
5. dashboard nebo přehled posledních běhů.

## 9. Audit připravenosti lekcí 1–40

Samostatné zhodnocení připravenosti osnovy je v:

- [LESSONS_1_40_READINESS.md](LESSONS_1_40_READINESS.md)

Krátké shrnutí:

- lekce 1–40 jsou teď detailně rozepsané,
- agent je umí číst přímo z hlavního manuálu,
- po lekci 40 se systém bezpečně zastaví a vyžádá navazující osnovu.