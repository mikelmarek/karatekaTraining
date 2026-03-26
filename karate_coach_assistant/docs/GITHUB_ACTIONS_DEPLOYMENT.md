# GitHub Actions nasazení s externím stavem

Tato varianta umožní, aby se job spouštěl bez zapnutého Macu.

## Aktuální stav

Tahle varianta je momentálně připravená pro ruční spuštění.

- workflow je dostupný jen pro ruční spuštění,
- automatický cron běh je vypnutý,
- lokální `launchd` joby mají být vypnuté,
- GitHub Gist je zdroj pravdy pro cloud stav.

Stav se neukládá do lokálních JSON souborů v runneru, ale do GitHub Gistu.
Díky tomu si workflow mezi běhy pamatuje:

- `current_lesson`
- `lesson_history`
- `sent_reminders`
- `curriculum_exhausted`
- samostatný stav pro `beginner` i `advanced`

## Co je v repozitáři připravené

- workflow [../.github/workflows/karate-reminders.yml](../.github/workflows/karate-reminders.yml)
- backend `github-gist` v [../src/githubGistStateStore.js](../src/githubGistStateStore.js)
- přepínání backendu v [../src/statePersistence.js](../src/statePersistence.js)
- konfigurace v [../src/config.js](../src/config.js)

## Jak to funguje

Při ručním spuštění workflow proběhnou dvě kontroly:

- `začátečníci` → hledá `Karate veltrusy - začátečníci`
- `pokročilí` → hledá `Karate veltrusy - pokročilí`

Každá větev používá jiný soubor v jednom Gistu:

- `state.beginner.json`
- `state.advanced.json`

Při úplně prvním běhu se vzdálený stav založí z lokálních bootstrap souborů:

- [../runtime/state.json](../runtime/state.json)
- [../runtime/state.advanced.json](../runtime/state.advanced.json)

## 1. Vytvoř GitHub Gist

Vytvoř si jeden soukromý Gist na GitHubu.

Do Gistu vlož dva soubory:

- `state.beginner.json`
- `state.advanced.json`

Obsah může být klidně dočasně jen:

- `{}`

Lepší varianta je rovnou vložit obsah z:

- [../runtime/state.json](../runtime/state.json)
- [../runtime/state.advanced.json](../runtime/state.advanced.json)

Pak si z URL zkopíruj `gist id`.

## 2. Vytvoř GitHub token pro Gist

Potřebuješ klasický Personal Access Token s právem pro Gist.

Doporučení:

- vytvořit jemně omezený token jen pro tento projekt
- povolit scope `gist`

Ten token bude workflow používat pro čtení a zápis stavu.

## 3. Nastav GitHub Secrets v repozitáři

V repozitáři otevři:

- Settings
- Secrets and variables
- Actions

Přidej tyto secrets:

- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_CHAT_ID`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REFRESH_TOKEN`
- `GOOGLE_CALENDAR_ID` (může být i `primary`)
- `KARATE_STATE_GIST_ID`
- `KARATE_STATE_GIST_TOKEN`

## 4. Zapni workflow

Workflow je v:

- [../.github/workflows/karate-reminders.yml](../.github/workflows/karate-reminders.yml)

Spouští se:

- automaticky každých 12 hodin
- ručně přes `Run workflow`

## 5. Jak ověřit první běh

Po ručním spuštění workflow zkontroluj:

- běh workflow v záložce Actions
- obsah Gistu, jestli se aktualizoval stav
- Telegram, jestli při správném časovém okně dorazila zpráva

## Poznámky k provozu

- GitHub Actions není trvalý proces, jen periodický runner.
- Proto se používá externí stav mimo runner.
- Každý matrix job si zároveň vynutí vlastní `TRAINING_GROUP`, takže ani špatně uložený stav nezačne posílat zprávy za druhou skupinu.
- Odesílá se jen detailní plán při nejbližším běhu, pokud je trénink v následujících 24 hodinách; krátký 6h reminder je vypnutý.
- Lokální `launchd` a GitHub Actions nepoužívej současně nad stejným stavem, jinak by si mohly překážet.
- Pokud přejdeš na GitHub Actions natrvalo, je dobré Mac joby vypnout.

Po aktuálním přechodu do cloudu už mají být Mac joby vypnuté standardně.

## Doporučené rozdělení provozu

### Varianta A – čistě GitHub Actions

- vypnout oba local `launchd` joby
- nechat jen workflow
- stav držet jen v Gistu

### Varianta B – přechodové období

- workflow spouštět jen ručně
- lokální joby ponechat zapnuté
- po ověření přepnout natrvalo na GitHub Actions

## Co když chceš stav resetovat

Stačí upravit přímo soubory v Gistu:

- `state.beginner.json`
- `state.advanced.json`

Nebo do nich znovu vložit obsah z:

- [../runtime/state.json](../runtime/state.json)
- [../runtime/state.advanced.json](../runtime/state.advanced.json)
