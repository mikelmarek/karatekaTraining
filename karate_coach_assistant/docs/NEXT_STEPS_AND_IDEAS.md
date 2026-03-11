# Next steps a nápady do budoucna

Tento dokument shrnuje rozumné další kroky pro projekt ve 3 rovinách:

- technický provoz a automatizace,
- tréninkový obsah a metodika,
- využití historických a liniových materiálů.

Smysl dokumentu není všechno udělat hned, ale mít přehledný backlog pro další rozvoj.

---

## 1. Krátký stav projektu dnes

Aktuálně už funguje:

- generování a odesílání tréninků do Telegramu,
- oddělený režim `beginner` a `advanced`,
- automatické posouvání lekcí po proběhlém tréninku,
- cloud provoz přes GitHub Actions,
- externí stav přes GitHub Gist,
- dvě osnovy 1–40:
  - děti / začátečníci,
  - pokročilí 8.–6. kyu.

To znamená, že další práce už není jen „aby to fungovalo“, ale hlavně „aby to bylo dlouhodobě silnější, přesnější a metodicky bohatší“.

---

## 2. Technické next steps

### 2.1 Monitoring a provozní jistota

Rozumné další kroky:

- [ ] přidat jednoduchý „health check“ dokument nebo status soubor,
- [ ] přidat upozornění při pádu workflow nebo chybě GitHub Actions,
- [ ] přidat zálohu Gist stavu, aby šel snadno obnovit,
- [ ] přidat ruční servisní příkaz na výpis aktuálního stavu skupiny,
- [ ] přidat rychlý přehled: poslední odeslaný plán, poslední uzavřený trénink, aktuální lekce.

Praktický přínos:

- rychle poznáš, že se něco rozbilo,
- snadno ověříš, že systém opravdu posouvá lekce správně,
- nebudeš muset ručně hledat v Gistu nebo v Actions logu.

### 2.2 Lepší práce se stavem

- [ ] přidat validaci stavu před zápisem,
- [ ] přidat export / import stavu jedním příkazem,
- [ ] přidat servisní příkaz na reset reminderů bez resetu historie,
- [ ] zvážit později přechod z Gistu na robustnější úložiště, pokud projekt poroste.

Možné budoucí varianty úložiště:

- Supabase,
- Firebase,
- jednoduchá databáze na malém serveru,
- S3-compatible storage + JSON snapshoty.

### 2.3 Testy a bezpečnost změn

- [ ] přidat základní testy pro `stateStore`,
- [ ] přidat testy pro výběr správné lekce podle skupiny,
- [ ] přidat testy na nepřeposlání stejného reminderu,
- [ ] přidat testy na posun po skončení kalendářové události,
- [ ] přidat test na čtení a zápis do Gistu.

### 2.4 Lepší obsluha a admin práce

- [ ] příkaz na zobrazení aktuální lekce obou skupin,
- [ ] příkaz na zobrazení posledních 5 proběhlých tréninků,
- [ ] příkaz na ruční uzavření konkrétního tréninku,
- [ ] příkaz na ruční opakování stejné lekce bez posunu,
- [ ] příkaz na vygenerování přehledu měsíce pro trenéra.

---

## 3. Tréninkový a metodický backlog

### 3.1 Co už je dobře pokryté

- děti 1–40,
- pokročilí 1–40,
- základní práce s kata a jednoduchou návazností,
- oddělení začátečníků a pokročilých.

### 3.2 Co ještě není detailní nebo úplně systematické

Tohle jsou dobré kandidáty na další metodickou práci:

- [ ] navazující série po lekci 40 pro začátečníky,
- [ ] navazující série po lekci 40 pro pokročilé,
- [ ] jemnější vazba lekcí na konkrétní zkouškové požadavky dojo,
- [ ] přesnější rozdělení „co je minimum / co je nadstavba“ pro každé kyu,
- [ ] detailní varianty pro různě velké skupiny,
- [ ] detailní varianty pro unavené / živé / nesoustředěné děti,
- [ ] knihovna krátkých her podle cíle lekce,
- [ ] knihovna zahřátí podle věku a velikosti skupiny,
- [ ] knihovna závěrů a rituálů dojo.

### 3.3 Konkrétní tréninkové směry k rozpracování

#### Začátečníci

- [ ] detailnější příprava na přechod z 9. kyu směrem k 8. kyu,
- [ ] více variant na upevnění embusenu a rytmu kata,
- [ ] lepší sada mini-bunkai principů pro děti,
- [ ] přehled „nejčastější chyby ve Fukyugata Ichi“ a jak je opravovat.

#### Pokročilí

- [ ] detailní pokračování po 6. kyu,
- [ ] navazující systém pro další kata po Fukyugata Ni / Naihanchi Shodan,
- [ ] přesnější plán bunkai progresu,
- [ ] detailnější rozpad kage kumite / dojo kumite,
- [ ] jasný most mezi dětským pojetím a techničtějším pojetím pro starší cvičence.

### 3.4 Co by stálo za doplnění přímo do manuálů

- [ ] u každé lekce přidat „nejčastější chybu“,
- [ ] u každé lekce přidat „na co si dát pozor bezpečnostně“,
- [ ] u každé lekce přidat „signál, že je skupina připravená jít dál“,
- [ ] u každé lekce přidat „kdy je lepší lekci zopakovat“,
- [ ] u bloků přidat přehled hlavních metodických cílů pro trenéra.

---

## 4. Práce s feedbackem po tréninku

Tohle je jeden z nejhodnotnějších dalších kroků.

### Doplnit automatizaci

- [ ] po tréninku poslat trenérovi krátký dotaz na feedback,
- [ ] odpověď uložit do [../runtime/training_log.md](../runtime/training_log.md) nebo nového strukturovaného úložiště,
- [ ] propisovat shrnutí do stavu,
- [ ] podle feedbacku doporučit opakování lekce nebo úpravu další lekce.

### Co sledovat v feedbacku

- co děti bavilo,
- co bylo příliš těžké,
- co bylo příliš dlouhé,
- co se rozpadalo organizačně,
- kdo potřebuje víc opakování,
- jestli je skupina připravená jít dál.

### Dlouhodobý přínos

- systém přestane být jen „odesílač osnovy“,
- začne být opravdu trenérský pomocník,
- lekce budou víc odpovídat reálné skupině.

---

## 5. Historie karate a linie – co s tím dál

V projektu už jsou cenné materiály:

- [../../content/Historie karate a Shorin-ryu.md](../../content/Historie%20karate%20a%20Shorin-ryu.md)
- [../../content/historie_shorin_ryu_a_karate.md](../../content/historie_shorin_ryu_a_karate.md)
- [../../content/genealogie_shorin_ryu.md](../../content/genealogie_shorin_ryu.md)
- [../../content/zr-okinawa-shorin-ryu-karate-cfokkwof-1%20(1).pdf](../../content/zr-okinawa-shorin-ryu-karate-cfokkwof-1%20(1).pdf)

Tyto podklady zatím nejsou plně zapojené do provozu agenta. To je do budoucna velká příležitost.

### 5.1 Rozumné využití v praxi dojo

- [ ] vytvořit krátké „minipříběhy do dojo“ pro děti,
- [ ] vytvořit krátký text „co je Shorin-ryu“ pro rodiče,
- [ ] vytvořit úvodní materiál pro nové členy dojo,
- [ ] vytvořit interní přehled linie pro trenéry,
- [ ] vytvořit krátké slavnostní / motivační texty pro zkoušky nebo semináře.

### 5.2 Co může dělat agent později

- [ ] umět vygenerovat krátké historické okénko 1× za měsíc,
- [ ] umět odpovědět na otázku „kdo byl Matsumura / Itosu / Chibana“,
- [ ] umět vysvětlit původ kata jako Naihanchi nebo Pinan,
- [ ] umět ukázat linii stylu od čínských kořenů až k dojo,
- [ ] umět připravit krátký text na web nebo sociální sítě dojo.

### 5.3 Konkrétní produktové nápady

- [ ] „Dojo encyklopedie“ v Markdown souborech,
- [ ] samostatný režim agenta: `history` / `lineage`,
- [ ] PDF nebo tisknutelný handout „Historie stylu v 1 stránce“,
- [ ] nástěnný přehled linie dojo,
- [ ] článek „Jaká je naše linie a proč na ní záleží“.

---

## 6. Obsah, který stojí za sjednocení nebo audit

V adresáři `content` je několik materiálů s částečným překryvem.

To je užitečné, ale časem by bylo dobré udělat pořádek:

- [ ] určit jeden hlavní „zdroj pravdy“ pro historii,
- [ ] určit jeden hlavní „zdroj pravdy“ pro genealogii,
- [ ] rozhodnout, co je interní pracovní materiál a co je finální dokument,
- [ ] sjednotit názvy souborů,
- [ ] udělat krátký obsahový audit, co je duplicitní a co jedinečné.

Možný výstup:

- `history_master.md`
- `lineage_master.md`
- `dojo_intro_for_parents.md`
- `mini_stories_for_kids.md`

---

## 7. Produktové nápady pro další verze

### Verze „trenérský panel"

- [ ] přehled aktuální lekce obou skupin,
- [ ] poslední odeslané zprávy,
- [ ] poslední proběhlé tréninky,
- [ ] ruční posun / návrat lekce,
- [ ] zobrazení historie a feedbacku.

### Verze „dojo knowledge base"

- [ ] historie stylu,
- [ ] linie stylu,
- [ ] význam kata,
- [ ] vysvětlení zkouškového řádu,
- [ ] materiály pro rodiče a nové členy.

### Verze „smart coach assistant"

- [ ] doporučení zopakovat lekci při slabém feedbacku,
- [ ] návrh náhradní lekce při malé účasti,
- [ ] návrh zkráceného plánu při pozdním příchodu,
- [ ] návrh varianty pro seminář / zkouškový trénink,
- [ ] návrh měsíčního metodického cíle.

---

## 8. Doporučené priority

Pokud má být postup realistický, doporučené pořadí je:

### Priorita A – největší praktický přínos

1. automatizovaný feedback po tréninku,
2. přehled stavu a jednoduchý monitoring,
3. navazující série po lekci 40,
4. lepší admin příkazy na správu stavu.

### Priorita B – metodické posílení

1. detailnější mapování na zkoušky,
2. knihovna her, zahřátí a variant,
3. rozšíření pokročilého programu dál než do 6. kyu.

### Priorita C – kulturní a dojo obsah

1. sjednocení historie a genealogie,
2. krátké materiály pro rodiče a nové členy,
3. historické a liniové mini-výstupy z agenta.

---

## 9. Nejjednodušší další konkrétní úkoly

Pokud by se mělo pokračovat hned, dává smysl vybrat jeden z těchto malých, ale užitečných kroků:

- [ ] přidat `status` CLI příkaz,
- [ ] přidat automatický feedback po tréninku,
- [ ] napsat osnovu lekcí 41–50 pro začátečníky,
- [ ] napsat osnovu lekcí 41–50 pro pokročilé,
- [ ] vytvořit krátký dokument „Historie stylu pro rodiče a nováčky“,
- [ ] vytvořit sjednocený dokument „Linie dojo“.

---

## 10. Shrnutí

Projekt je už teď prakticky použitelný.

Další velká hodnota nevznikne jen přidáním další automatizace, ale hlavně tím, že se propojí:

- provozní spolehlivost,
- reálný feedback z dojo,
- dlouhodobý metodický rozvoj,
- kulturní a historická identita stylu.

Právě kombinace těchto 4 vrstev z toho může udělat opravdu silného trenérského asistenta pro dojo, ne jen technický reminder bot.