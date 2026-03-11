# Implementační poznámky

## Doporučená minimalistická architektura

### Vstupy
- kalendář: read-only
- manuál: Markdown soubory ve workspace
- stav: `runtime/state.json`
- zpětná vazba: `runtime/training_log.md`

### Výstupy
- Telegram zpráva 30 hodin před tréninkem
- Telegram připomenutí 6 hodin před tréninkem
- Telegram dotaz po tréninku

## Rozhodovací logika

1. Najdi nejbližší termín tréninku.
2. Vezmi `current_lesson`.
3. Vyhledej odpovídající obsah v manuálu.
4. Přizpůsob plán podle posledních poznámek.
5. Vytvoř standardizovaný výstup.
6. Po feedbacku aktualizuj stav.

## Doporučené MVP omezení

- bez e-mailu
- bez zápisu do kalendáře
- bez více agentů
- bez autonomního posouvání osnovy bez potvrzení
- bez práce s citlivými osobními daty

## Co může přijít později

- hlasové zprávy
- druhý výstup pro rodiče
- PDF pro druhého trenéra
- export týdenního plánu
- vyhodnocování opakovaných problémů v lekcích
