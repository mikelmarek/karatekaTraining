# LLM prompty pro navazující série lekcí

Tento dokument je připravený pro chvíli, kdy budeš chtít použít AI ne pro ostrý runtime job, ale jako pomocníka pro návrh dalších lekcí.

Doporučený princip:

- produkční job zůstává deterministicý a čte hotové Markdown manuály,
- AI se použije jen pro přípravu nebo rozšíření osnov,
- výstup AI se vždy ručně zkontroluje a teprve potom uloží do hlavního manuálu.

To je bezpečnější než generovat trénink živě při každém běhu workflow.

---

## 1. Kdy tento prompt použít

Použij ho zejména když:

- dojdou lekce 1–40,
- chceš připravit navazující blok 41+,
- chceš přepracovat slabší část osnovy,
- chceš udělat novou sérii pro jinou úroveň,
- chceš z AI dostat draft, který pak ručně upravíš.

---

## 2. Co dát AI jako kontext

Před použitím promptu je dobré přiložit nebo vložit obsah těchto souborů:

- [../../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md](../../content/kompletni_trenersky_manual_shorin_ryu_deti_v2.md)
- [../../content/kompletni_trenersky_manual_shorin_ryu_pokrocili_8_6_kyu_v1.md](../../content/kompletni_trenersky_manual_shorin_ryu_pokrocili_8_6_kyu_v1.md)
- [../config/preferences.md](../config/preferences.md)
- [../config/agent_role.md](../config/agent_role.md)
- případně výběr z [../runtime/training_log.md](../runtime/training_log.md)
- případně poslední lekce z historie nebo shrnutí, co už skupina zvládla

Čím přesnější kontext dáš, tím použitelnější bude výstup.

---

## 3. Prompt – navazující série pro začátečníky

Použij tento prompt, když budeš chtít vytvořit lekce 41+ pro dětské začátečníky.

---

Jsi metodický asistent pro dětské Okinawa Shorin-ryu karate.

Chci navázat na existující manuál dětských lekcí 1–40.
Tvým úkolem je navrhnout další blok detailních lekcí 41–50 tak, aby:

- navazoval na dosavadní styl a strukturu manuálu,
- byl vhodný pro děti přibližně 5–10 let,
- zachoval ducha Okinawa Shorin-ryu,
- byl praktický pro reálné dojo,
- držel poměr přibližně 70 % pohyb a hry / 30 % technika,
- neobsahoval nebezpečný nebo příliš tvrdý kontakt,
- zachoval srozumitelnost a stručnost pro trenéra.

Důležité zásady:

- pokud není výslovně řečeno jinak, drž hlavní kata jako Fukyugata Ichi,
- technickou obtížnost zvyšuj jen mírně,
- preferuj disciplínu, rytmus, práci v prostoru, embusen, jistotu postoje a jednoduché reakce,
- pokud zařadíš bunkai princip, musí být velmi jednoduchý, bezpečný a dětsky uchopitelný,
- neopakuj jen mechanicky lekce 1–40, ale logicky na ně navazuj,
- zohledni, že po 40 lekcích už děti mají základní orientaci v rituálu dojo, jednoduchém kihonu a kata.

Pro každou lekci vytvoř přesně tuto strukturu:

## Lekce X – název

### Cíl
Krátký odstavec s hlavním cílem.

### Průběh
Zahájení (3 min)
- body

Zahřátí (10 min)
- body

Kihon (15 min)
- body

Kata (10 min)
- body

Hra / partner (15 min)
- body

Závěr (7 min)
- body

Další požadavky:

- napiš všech 10 lekcí 41–50,
- každá lekce musí být konkrétní, ne obecná,
- každá lekce musí mít jasný metodický posun,
- hry a partnerová cvičení musí být bezpečné a realisticky použitelné,
- text piš česky,
- bez dlouhé teorie,
- styl výstupu musí odpovídat existujícímu manuálu.

Na konci přidej ještě krátkou sekci:

## Proč tento blok dává smysl

kde v 5–10 bodech vysvětlíš metodickou logiku navržené série.

---

## 4. Prompt – navazující série pro pokročilé

Použij tento prompt, když budeš chtít vytvořit další blok za současný pokročilý manuál.

---

Jsi metodický asistent pro Okinawa Shorin-ryu karate.

Chci navázat na existující pokročilý manuál pro úroveň přibližně 8.–6. kyu.
Tvým úkolem je navrhnout další blok detailních lekcí 41–50 tak, aby:

- navazoval na existující pokročilý manuál,
- zachoval technickou logiku stylu,
- byl vhodný pro cvičence, kteří už mají základy Fukyugata Ichi, Fukyugata Ni a Naihanchi Shodan,
- rozvíjel jistotu, přesnost, rytmus, embusen, základní bunkai principy a jednoduchou kontrolovanou práci ve dvojici,
- nešel zbytečně do příliš tvrdého nebo nebezpečného kontaktu,
- byl realistický pro dojo praxi.

Důležité zásady:

- respektuj ducha Okinawa Shorin-ryu,
- nepřeskakuj nekontrolovaně do příliš pokročilého obsahu,
- pokud navrhuješ další kata, vysvětli proč je to metodicky vhodné,
- pokud rozvíjíš bunkai, kage kumite nebo dojo kumite, drž to přehledné a systematické,
- každá lekce musí mít jasný hlavní cíl,
- logika musí být použitelná jako reálný trenérský plán.

Pro každou lekci vytvoř přesně tuto strukturu:

## Lekce X – název

### Cíl
Krátký odstavec s hlavním cílem.

### Průběh
Zahájení (3 min)
- body

Zahřátí (10 min)
- body

Kihon (15 min)
- body

Kata (10 min)
- body

Hra / partner (15 min)
- body

Závěr (7 min)
- body

Další požadavky:

- napiš všech 10 lekcí 41–50,
- piš česky,
- drž návaznost na dosavadní obsah,
- dbej na technickou čistotu a realistickou návaznost na kyu progres,
- nevytvářej jen obecné fráze, ale konkrétní použitelný plán.

Na konci přidej sekci:

## Metodická logika bloku

kde shrneš, co přesně tato série rozvíjí a proč je vhodná jako další krok.

---

## 5. Prompt – přepracování jedné slabší lekce

Tento prompt je užitečný, když nebudeš chtít generovat nový celý blok, ale jen vylepšit jednu konkrétní lekci.

---

Jsi trenérský metodik Okinawa Shorin-ryu karate.

Dám ti jednu existující lekci a potřebuji ji přepracovat tak, aby byla:

- praktičtější pro reálné dojo,
- lépe časově vyvážená,
- bezpečná,
- přehledná pro trenéra,
- metodicky silnější.

Zachovej:

- cílovou skupinu,
- hlavní technický cíl,
- duch Okinawa Shorin-ryu,
- strukturu 60min lekce.

Uprav:

- příliš slabé nebo moc obecné části,
- příliš dlouhé bloky,
- nejasnou návaznost,
- příliš monotónní pasáže.

Vrať výstup ve stejné struktuře jako původní lekce.
Na konci přidej krátký seznam:

## Co jsem zlepšil

- 5–10 bodů.

---

## 6. Prompt – zapojení feedbacku z dojo

Tohle je nejlepší prompt pro situaci, kdy už budeš mít reálné poznámky po tréninku.

---

Jsi trenérský asistent pro Okinawa Shorin-ryu karate.

Dám ti:

- poslední lekci,
- krátký feedback po tréninku,
- aktuální úroveň skupiny.

Tvým úkolem je rozhodnout:

1. zda je vhodné jít na další lekci,
2. zda je lepší předchozí obsah ještě jednou upevnit,
3. jak konkrétně upravit následující lekci.

Chci výstup ve 3 blocích:

## Vyhodnocení
Krátce zhodnoť, co feedback znamená.

## Doporučení
Napiš, zda:
- pokračovat dál,
- zopakovat část,
- nebo upravit náročnost.

## Upravený návrh další lekce
Napiš konkrétní návrh další 60min lekce ve stejné struktuře jako manuál.

Pravidla:

- buď praktický,
- drž se metodiky dojo,
- nepiš zbytečně dlouze,
- preferuj bezpečnost a návaznost,
- piš česky.

---

## 7. Doporučený pracovní postup

Nejrozumnější workflow do budoucna:

1. vytáhnout poslední relevantní lekce a feedback,
2. použít jeden z promptů výše,
3. dostat draft od AI,
4. ručně ho upravit,
5. uložit finální verzi do hlavního Markdown manuálu,
6. teprve potom nechat produkční job používat nový obsah.

---

## 8. Co nedoporučuji

Pro aktuální fázi projektu nedoporučuji:

- generovat živý trénink přes LLM při každém GitHub Actions jobu,
- posílat výstup AI rovnou bez ruční kontroly,
- míchat AI návrhy a produkční osnovy bez jasného schválení,
- nechávat AI samostatně určovat metodickou obtížnost bez lidské kontroly.

Důvod:

- hlavní síla projektu je v tom, že produkční provoz je stabilní a předvídatelný,
- AI má být pomocník pro návrh dalšího obsahu, ne nekontrolovaný autor ostrého tréninku.
