# Plán automatizací

## Automatizace 1 – týdenní plán před tréninkem

### Spouštěč
- 30 hodin před plánovaným tréninkem

### Vstupy
- kalendář pouze pro čtení
- `runtime/state.json`
- hlavní manuál
- `runtime/training_log.md`
- `config/preferences.md`

### Akce
1. Najít nejbližší dětský trénink.
2. Ověřit, že ještě nebyl poslán plán na tento termín.
3. Připravit rozpis podle `current_lesson`.
4. Zohlednit poslední poznámky.
5. Poslat detailní zprávu do Telegramu.
6. Uložit datum odeslání do `runtime/state.json`.

## Automatizace 2 – krátké připomenutí v den tréninku

### Spouštěč
- 6 hodin před tréninkem

### Výstup
Krátká zpráva do Telegramu:
- číslo lekce
- hlavní cíl
- pomůcky
- 3 nejdůležitější body
- záložní hra

## Automatizace 3 – sběr feedbacku po tréninku

### Spouštěč
- večer po tréninku

### Zpráva
„Jak dopadl dnešní trénink? Pošli 1–3 stručné poznámky.“

### Akce po odpovědi
1. Zapsat poznámky do `runtime/training_log.md`.
2. Shrnutí uložit do `runtime/state.json`.
3. Označit případné úpravy do `pending_adjustments`.

## Automatizace 4 – příprava další lekce

### Podmínka
- existuje vyhodnocení předchozí lekce

### Akce
- ponechat nebo upravit obtížnost
- případně upozornit, že je vhodné zopakovat předchozí obsah
- nenavyšovat obtížnost automaticky, pokud feedback ukazuje přetížení skupiny
