# launchd a běžná obsluha

## Aktuální poznámka

Lokální `launchd` provoz už není hlavní produkční režim.

Aktuálně je doporučený provoz přes GitHub Actions:

- workflow [../.github/workflows/karate-reminders.yml](../.github/workflows/karate-reminders.yml)
- návod [GITHUB_ACTIONS_DEPLOYMENT.md](GITHUB_ACTIONS_DEPLOYMENT.md)

Tento dokument slouží hlavně pro fallback nebo lokální servisní provoz.

## Kde je launchd soubor

### Template v projektu

- [../launchd/com.marek.karatecoachassistant.plist.template](../launchd/com.marek.karatecoachassistant.plist.template)

### Aktivní kopie v macOS

- `~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`

To je soubor, který macOS skutečně načítá.

## Jak job pustit ručně

Z adresáře projektu:

- jedna kontrola: `npm run check`
- dlouhodobý běh v terminálu: `npm start`
- test Telegramu: `npm run test-telegram`
- test detailního plánu: `npm run test-plan`

## Jak zkontrolovat, že launchd běží

- `launchctl print gui/$(id -u)/com.marek.karatecoachassistant`

Když běží správně, uvidíš stav služby a proces.

Pokud je cloud varianta aktivní, je správně, když tyto joby neběží.

## Jak službu restartovat

- `launchctl kickstart -k gui/$(id -u)/com.marek.karatecoachassistant`

## Jak službu vypnout

- `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`

Pokročilý job vypneš:

- `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.marek.karatecoachassistant.advanced.plist`

## Jak ji znovu načíst

- `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`

Pokročilý job znovu načteš:

- `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.marek.karatecoachassistant.advanced.plist`

## Jak číst provozní logy

- interní job log: [../runtime/job.log](../runtime/job.log)
- stdout služby: [../runtime/agent.stdout.log](../runtime/agent.stdout.log)
- stderr služby: [../runtime/agent.stderr.log](../runtime/agent.stderr.log)

## Kde upravovat chování systému

- plánování běhů: [../src/scheduler.js](../src/scheduler.js)
- formát zpráv: [../src/planner.js](../src/planner.js)
- výběr a načítání lekcí: [../src/manualRepository.js](../src/manualRepository.js)
- stav systému: [../runtime/state.json](../runtime/state.json)
- hlavní obsah lekcí: [../../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md](../../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md)