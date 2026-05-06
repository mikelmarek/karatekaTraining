# Karate Coach Assistant

Hotový MVP agent pro dětské tréninky.

## Aktuální provozní stav

Aktuálně je produkční provoz nastaven takto:

- hlavní běh jede přes [../.github/workflows/karate-reminders.yml](../.github/workflows/karate-reminders.yml),
- workflow se spouští automaticky 1x denně,
- stav se ukládá externě do GitHub Gistu,
- lokální `launchd` joby na Macu jsou jen záložní varianta a mají být vypnuté, pokud běží cloud.

Agent dělá toto:

- čte Google kalendář z Gmail účtu,
- hledá události obsahující zadaný výraz, výchozí je `karate`,
- vezme aktuální lekci z `runtime/state.json`,
- připraví zprávu podle pravidel a manuálu,
- pošle detailní rozpis 30 hodin před tréninkem,
- pošle krátké připomenutí 6 hodin před tréninkem,
- po skončení tréninku automaticky uzavře použitou lekci a posune `current_lesson`,
- ukládá historii použitých lekcí do `lesson_history`,
- po vyčerpání lekcí 1–40 pošle upozornění, že je potřeba připravit navazující sérii,
- hlídá, aby stejnou připomínku neposlal dvakrát.

Pro tento use case není OpenClaw nutný. Tohle řešení je jednodušší, průhlednější a rychleji nasaditelné.

## Struktura

- [config/agent_role.md](config/agent_role.md) – role asistenta
- [config/preferences.md](config/preferences.md) – metodická pravidla
- [config/message_templates.md](config/message_templates.md) – šablony zpráv
- [runtime/state.json](runtime/state.json) – aktuální stav a odeslané připomínky
- [runtime/training_log.md](runtime/training_log.md) – log po trénincích
- [docs/automation_plan.md](docs/automation_plan.md) – návrh automatizací
- [docs/GITHUB_ACTIONS_DEPLOYMENT.md](docs/GITHUB_ACTIONS_DEPLOYMENT.md) – cloud běh přes GitHub Actions + Gist
- [docs/LLM_PROMPTS_NEXT_SERIES.md](docs/LLM_PROMPTS_NEXT_SERIES.md) – připravené prompty pro navazující lekce a AI drafty
- [docs/NEXT_STEPS_AND_IDEAS.md](docs/NEXT_STEPS_AND_IDEAS.md) – backlog a nápady pro další rozvoj
- [docs/ROTACE_TAJNYCH_HODNOT.md](docs/ROTACE_TAJNYCH_HODNOT.md) – výměna uniklých tokenů a secretů
- [docs/SETUP_CREDENTIALS.md](docs/SETUP_CREDENTIALS.md) – nastavení přístupů
- [src/index.js](src/index.js) – vstupní bod aplikace
- [src/scheduler.js](src/scheduler.js) – plánování a rozhodování 24h připomenutí
- [src/calendarService.js](src/calendarService.js) – Google Calendar API
- [src/telegramService.js](src/telegramService.js) – Telegram odesílání
- [src/manualRepository.js](src/manualRepository.js) – čtení lekcí z manuálu
- [src/planner.js](src/planner.js) – generování textu zpráv

## Jak to funguje

1. Kontrola kalendáře probíhá každých 12 hodin.
2. Agent hledá relevantní tréninky v okně do 32 hodin.
3. Pokud je při běhu trénink v následujících 24 hodinách, pošle detailní plán.
4. Krátké připomenutí pár hodin před tréninkem je vypnuté.
5. Odeslané připomínky uloží do aktivního backendu stavu.
6. Po skončení události ji zapíše do `lesson_history` a automaticky připraví další lekci.

V lokálním režimu je backend stavových dat [runtime/state.json](runtime/state.json) a [runtime/state.advanced.json](runtime/state.advanced.json).
Každý oddělený běh si nově vynutí svou `training_group`, takže se nezačne omylem tvářit jako druhá skupina.
V cloud režimu přes GitHub Actions se používá GitHub Gist.

## Jak se určuje datum a číslo lekce

Je dobré rozlišit 3 různé věci:

- obsah lekce je v manuálu,
- termín tréninku je v Google Calendar,
- aktuální číslo lekce je ve stavu systému.

Prakticky to funguje takto:

1. Google Calendar určuje, kdy je reálný trénink.
2. Stav systému určuje, která lekce je právě na řadě.
3. Manuál určuje, co přesně tato lekce obsahuje.

Takže například:

- v kalendáři je středeční trénink,
- stav říká `current_lesson = 1`,
- systém tedy pošle obsah lekce 1,
- po skončení této kalendářové události se při dalším běhu stav posune na lekci 2.

Kde je co uloženo:

- termíny tréninků: Google Calendar,
- obsah lekcí začátečníků: [../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md](../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md),
- obsah lekcí pokročilých: [../content/kompletni_trenersky_manual_shorin_ryu_pokrocili_8_6_kyu_v1.md](../content/kompletni_trenersky_manual_shorin_ryu_pokrocili_8_6_kyu_v1.md),
- lokální bootstrap stav: [runtime/state.json](runtime/state.json) a [runtime/state.advanced.json](runtime/state.advanced.json),
- produkční cloud stav: GitHub Gist.

Termíny tedy nejsou zapsané natvrdo v projektu. Projekt si je bere dynamicky z kalendáře a ke každému termínu přiřadí aktuální číslo lekce podle stavu.

## Nastavení

Podrobný postup pro všechny hodnoty v `.env` je v [docs/SETUP_CREDENTIALS.md](docs/SETUP_CREDENTIALS.md).

### 1. Instalace závislostí

V adresáři [karate_coach_assistant](.) spusť:

- `npm install`

### 2. Vytvoření `.env`

Zkopíruj [ .env.example ](.env.example) do `.env` a vyplň hodnoty.

Povinné proměnné:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID`

Volitelné:

- `TRAINING_EVENT_QUERY=karate`
- `CHECK_CRON=0 */12 * * *`
- `TRAINING_GROUP=beginner`
- `REMINDER_TYPES=24h`
- `STATE_BACKEND=local`
- `LOG_FILE=./runtime/job.log`
- `TIMEZONE=Europe/Prague`

Pro GitHub Actions variantu s externím stavem je návod v [docs/GITHUB_ACTIONS_DEPLOYMENT.md](docs/GITHUB_ACTIONS_DEPLOYMENT.md).

### 3. Google Calendar přístup

Použité je OAuth2 přes `refresh token`.

Je potřeba:

1. v Google Cloud vytvořit OAuth klienta,
2. povolit Google Calendar API,
3. získat `refresh token` pro účet s kalendářem,
4. nastavit `GOOGLE_CALENDAR_ID`, obvykle `primary`.

Pro získání `refresh tokenu` jsou připravené pomocné kroky:

- `npm run get-google-auth-url`
- `npm run exchange-google-code -- "PASTE_CODE_SEM"`

Kalendář může zůstat pouze pro čtení.

### 4. Telegram

1. vytvoř bota přes BotFather,
2. získej token,
3. zjisti svoje `chat_id`,
4. vlož obě hodnoty do `.env`.

Pro zjištění `chat_id` je připravený helper:

- `npm run get-telegram-chat-id`

## Spuštění

### Secure planner s loginem

Pro chráněnou webovou verzi planneru s loginem a e-mailovým upozorněním po přihlášení použij:

- `npm run planner:web:build`
- `npm run planner:serve`

Podrobný návod je v [docs/TRAINING_PLANNER_SECURE_ACCESS.md](docs/TRAINING_PLANNER_SECURE_ACCESS.md).

Pro GitHub-ready nasazení je připravené i:

- [vercel.json](vercel.json) pro Vercel deploy z free/serverless modelu,
- [../render.yaml](../render.yaml) pro Render Blueprint deploy z GitHubu,
- [../.github/workflows/planner-secure-ci.yml](../.github/workflows/planner-secure-ci.yml) pro ověření secure login flow po pushi,
- [../.github/workflows/training-planner-pages.yml](../.github/workflows/training-planner-pages.yml) pro veřejnou GitHub Pages variantu.

### Jednorázová kontrola

- `npm run check`

Každý běh se zároveň zapisuje do [runtime/job.log](runtime/job.log).

Tohle je hlavně lokální servisní příkaz pro ruční test nebo fallback provoz.

### Trvalý běh agenta

- `npm start`

### Test Telegramu

- `npm run test-telegram`

### Test reálné tréninkové zprávy

- detailní plán jako 24h reminder: `npm run test-plan`
- test konkrétní lekce: `npm run test-plan -- 24h 3`
- test pokročilé skupiny: `npm run test-plan -- 24h 1 advanced`

### Ruční nastavení lekce

- `npm run set-lesson -- 7`
- `npm run set-lesson -- 1 advanced`

### Ruční přepnutí skupiny

- `npm run set-group -- beginner`
- `npm run set-group -- advanced`

## Automatický posun lekcí

- Výchozí start série je v [runtime/state.json](runtime/state.json) v poli `lesson_sequence_start_date`.
- Pro tento projekt je nastaven na `2026-03-11`, takže trénink od tohoto data bere jako lekci 1.
- Aktivní větev určuje pole `training_group`.
- Každá větev má vlastní průběh v `lesson_tracks.beginner` a `lesson_tracks.advanced`.
- Jakmile kalendářová událost skončí, agent při dalším běhu:
	- zapíše do `lesson_history`, kterou lekci použil,
	- nastaví `last_training_date`,
	- zvýší `current_lesson` o 1.
- Díky tomu bude například:
	- 11. 3. lekce 1,
	- 18. 3. lekce 2,
	- další týden lekce 3.

Použité lekce a jejich data najdeš přímo v [runtime/state.json](runtime/state.json).

## Co se stane po lekci 40

- po uzavření lekce 40 se nastaví `curriculum_exhausted=true`,
- agent už neposílá další běžný plán lekce,
- místo toho pošle upozornění, že došly připravené lekce 1–40,
- ve zprávě připomene, že je potřeba podívat se na `lesson_history` a připravit další sérii.

Tím se zabrání tomu, aby systém tiše opakoval poslední lekci donekonečna.

## Log běhů

- Lokální job zapisuje průběh do [runtime/job.log](runtime/job.log).
- Cloud běh je vidět v GitHub Actions a stav se propisuje do GitHub Gistu.
- Uvidíš tam například:
	- kdy proběhla kontrola,
	- pro jakou skupinu byl běh vynucen,
	- kolik událostí bylo nalezeno,
	- zda se poslal 24h detailní plán,
	- zda se uzavřel proběhlý trénink,
	- případné chyby.

První kontrola logu:

- spusť `npm run check`
- otevři [runtime/job.log](runtime/job.log)

## Jak agent vybírá obsah

- Pro `beginner` bere lekce 1 až 40 z [../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md](../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md).
- Pro `advanced` bere lekce 1 až 40 z [../content/kompletni_trenersky_manual_shorin_ryu_pokrocili_8_6_kyu_v1.md](../content/kompletni_trenersky_manual_shorin_ryu_pokrocili_8_6_kyu_v1.md).
- Záložní generování v [src/manualRepository.js](src/manualRepository.js) zůstává jen jako bezpečný fallback.
- Vždy drží `Fukyugata Ichi`, jednoduchý kihon a poměr cca 70 % hry / 30 % technika.

## Lokální macOS provoz jako fallback

Pokud bys někdy potřeboval dočasně běžet mimo GitHub Actions, můžeš použít `launchd`, `pm2` nebo jiný process manager.

Připravený je i template pro `launchd`:

- [launchd/com.marek.karatecoachassistant.plist.template](launchd/com.marek.karatecoachassistant.plist.template)
- [launchd/com.marek.karatecoachassistant.advanced.plist.template](launchd/com.marek.karatecoachassistant.advanced.plist.template)
- [scripts/run-agent.sh](scripts/run-agent.sh)

Aktivní uživatelský LaunchAgent je po nasazení zkopírovaný do:

- `~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`

Poznámka:

- při aktuálním cloud provozu mají být oba lokální `launchd` joby vypnuté,
- zapínej je jen pokud chceš dočasný fallback mimo GitHub Actions.

## Ruční spuštění a kontrola

### Když chceš job pustit ručně jednou

- `npm run check`

To provede jednu kontrolu kalendáře a případně pošle připomínku.

### Když chceš pustit dlouhodobý režim ručně bez launchd

- `npm start`

To spustí scheduler v terminálu a nechá ho běžet na pozadí daného okna terminálu.

### Když chceš poslat testovací zprávu

- `npm run test-telegram`

### Když chceš poslat testovací detailní plán

- `npm run test-plan`
- `npm run test-plan -- 24h 1 advanced`

### Když chceš změnit aktuální lekci ručně

- `npm run set-lesson -- 7`
- `npm run set-lesson -- 1 advanced`

### Když chceš přepnout aktivní skupinu

- `npm run set-group -- beginner`
- `npm run set-group -- advanced`

## launchd – užitečné příkazy

Všechny tyto příkazy spouštěj v macOS Terminálu:

- stav služby: `launchctl print gui/$(id -u)/com.marek.karatecoachassistant`
- restart služby: `launchctl kickstart -k gui/$(id -u)/com.marek.karatecoachassistant`
- vypnutí služby: `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`
- znovunačtení služby: `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`

## Kde co hledat

- hlavní návod: [README.md](README.md)
- detailní revize projektu: [docs/PROJECT_REVIEW_AND_GUIDE.md](docs/PROJECT_REVIEW_AND_GUIDE.md)
- audit připravenosti lekcí: [docs/LESSONS_1_40_READINESS.md](docs/LESSONS_1_40_READINESS.md)
- stav systému: [runtime/state.json](runtime/state.json)
- log běhů jobu: [runtime/job.log](runtime/job.log)
- hlavní manuál lekcí: [../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md](../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md)
- pokročilý manuál 8.–6. kyu: [../content/kompletni_trenersky_manual_shorin_ryu_pokrocili_8_6_kyu_v1.md](../content/kompletni_trenersky_manual_shorin_ryu_pokrocili_8_6_kyu_v1.md)

Poznámka:

- přepínání mezi začátečníky a pokročilými je už připravené,
- aktivní skupinu přepíná `training_group` a příkaz `set-group`,
- každá skupina má vlastní lekce, historii i odeslané remindery.

## Dva joby v launchd

Lokální fallback varianta:

- hlavní job [launchd/com.marek.karatecoachassistant.plist.template](launchd/com.marek.karatecoachassistant.plist.template) sleduje `Karate veltrusy - začátečníci`
- druhý job [launchd/com.marek.karatecoachassistant.advanced.plist.template](launchd/com.marek.karatecoachassistant.advanced.plist.template) sleduje `Karate veltrusy - pokročilí`

Pokročilý job má vlastní:

- stav: [runtime/state.advanced.json](runtime/state.advanced.json)
- log: [runtime/job.advanced.log](runtime/job.advanced.log)
- stdout: [runtime/agent.advanced.stdout.log](runtime/agent.advanced.stdout.log)
- stderr: [runtime/agent.advanced.stderr.log](runtime/agent.advanced.stderr.log)

Aktuální produkce ale používá GitHub Actions, ne lokální `launchd`.

## GitHub Actions bez zapnutého Macu

Pokud nechceš mít zapnutý Mac, je připravená i cloud varianta:

- workflow: [../.github/workflows/karate-reminders.yml](../.github/workflows/karate-reminders.yml)
- návod: [docs/GITHUB_ACTIONS_DEPLOYMENT.md](docs/GITHUB_ACTIONS_DEPLOYMENT.md)

V této variantě:

- scheduler neběží přes `launchd`,
- GitHub Actions spustí kontrolu každých 12 hodin,
- stav se ukládá externě do GitHub Gistu,
- začátečníci a pokročilí mají oddělené JSON soubory stavu,
- každý cloud job si vynutí vlastní `TRAINING_GROUP`.

Tohle je teď výchozí doporučený produkční režim.

Důležité:

- nepoužívej současně GitHub Actions a lokální `launchd` nad stejným stavem,
- při přechodu na cloud je lepší Mac joby vypnout.

## Co je další rozumný krok

1. doplnit automatické zapsání feedbacku z Telegramu,
2. automaticky navrhovat opakování lekce při špatném feedbacku,
3. přidat přehled posledních běhů a kontrolu zdraví workflow.
