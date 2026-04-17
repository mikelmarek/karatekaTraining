# Karate Training Planner Web

Statická HTML web aplikace nad Markdown podklady ze složky `plan`.

## Co umí

- zobrazit roční plán po měsících a týdnech,
- ukázat detail lekce a její základní náplň,
- přidávat trenérské poznámky,
- schovávat body, které se nehodí,
- přidávat vlastní body do plánu,
- tahat cvičení ze šuplíku do vybraného týdne,
- exportovat a importovat změny jako JSON.

## Odkud bere data

Generátor čte tyto Markdown soubory:

- `plan/mesicni_treninkovy_plan_deti_karate_6_12.md`
- `plan/karate_deti_rocni_plan_a_nastroje/rocni_plan_deti_karate_6_12.md`
- `plan/karate_deti_rocni_plan_a_nastroje/suplik_cviceni_deti_karate.md`
- `plan/mesicni_sablona_treninkoveho_planu_deti_karate.md`
- `plan/karate_deti_rocni_plan_a_nastroje/pomucky_pro_detske_treninky.md`

## Jak přegenerovat data

Z kořene repozitáře:

```bash
cd karate_coach_assistant
npm run planner:web:build
```

Tím se přegeneruje `tools/training_planner_web/data/planner-data.json`.

## Jak aplikaci otevřít

Doporučená varianta je otevřít ji přes jednoduchý lokální server:

```bash
python3 -m http.server 4173 --directory tools/training_planner_web
```

Pak otevři `http://localhost:4173`.

## Jak fungují poznámky a sdílení

- lokální změny se ukládají do `localStorage` v prohlížeči,
- tlačítko `Export změn` stáhne lokální JSON,
- tlačítko `Stáhnout sdílený JSON` stáhne sloučený stav vhodný pro commit do repozitáře.

Pokud chceš sdílet stav s kolegou přes GitHub:

1. stáhni sdílený JSON,
2. přepiš jím soubor `tools/training_planner_web/data/shared-state.json`,
3. commitni a pushni změny,
4. kolega po pullu uvidí sdílené poznámky i úpravy.

## Aktuální omezení MVP

- aplikace zatím neumí zapisovat přímo do Markdown souborů,
- sdílené změny se neukládají automaticky na GitHub bez commitu,
- je to statická appka, ne víceuživatelský realtime editor.

To je záměrně jednoduché první řešení, které jde hned hostovat na GitHub Pages.

## Publikace na GitHub Pages

Repo je připravený na automatický deploy přes GitHub Actions workflow:

- [.github/workflows/training-planner-pages.yml](.github/workflows/training-planner-pages.yml)

Co dělá:

- po pushi do větve `main` přegeneruje planner data,
- vezme obsah složky `tools/training_planner_web`,
- publikuje ho na GitHub Pages.

Po prvním pushi ještě v GitHubu zkontroluj:

1. `Settings -> Pages`
2. že je zdroj nastavený na `GitHub Actions`

Výsledná adresa bude typicky:

- `https://mikelmarek.github.io/karatekaTraining/`

Protože aplikace používá relativní cesty k `index.html`, `app.js` i `data/planner-data.json`, nemusí se kvůli Pages doplňovat žádný speciální base path.