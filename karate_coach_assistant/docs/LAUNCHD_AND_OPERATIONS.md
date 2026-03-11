# launchd a běžná obsluha

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
- test krátkého souhrnu: `npm run test-plan -- 6h`

## Jak zkontrolovat, že launchd běží

- `launchctl print gui/$(id -u)/com.marek.karatecoachassistant`

Když běží správně, uvidíš stav služby a proces.

## Jak službu restartovat

- `launchctl kickstart -k gui/$(id -u)/com.marek.karatecoachassistant`

## Jak službu vypnout

- `launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`

## Jak ji znovu načíst

- `launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/com.marek.karatecoachassistant.plist`

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