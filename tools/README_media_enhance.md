# Media Enhance Tool

Lokální best-effort nástroj pro zlepšení nechtěně rozmazaných fotek a videí.

Co umí:

- doostřit běžné rozmazání
- mírně zlepšit kompresní bloky a měkký obraz
- zpracovat celý snímek nebo jen vybraný obdélník přes `--roi`

Co neumí:

- spolehlivě obnovit chybějící detaily, které ve zdroji nejsou
- „odkrýt“ záměrně anonymizované nebo zakryté části

## Instalované balíčky

- `numpy`
- `opencv-python-headless`

## Spuštění

Z kořene projektu:

```bash
/Users/marekmikel/Desktop/PROJEKTY/KarateCoachAssistant/.venv/bin/python tools/media_enhance.py cesta/k/souboru.mp4
```

## Příklady

Celé video:

```bash
/Users/marekmikel/Desktop/PROJEKTY/KarateCoachAssistant/.venv/bin/python tools/media_enhance.py input.mp4 -o output.mp4
```

Jen část obrazu, kde je problém:

```bash
/Users/marekmikel/Desktop/PROJEKTY/KarateCoachAssistant/.venv/bin/python tools/media_enhance.py input.mp4 -o output.mp4 --roi 420,180,360,260
```

Silnější deblur, ale s větším rizikem artefaktů:

```bash
/Users/marekmikel/Desktop/PROJEKTY/KarateCoachAssistant/.venv/bin/python tools/media_enhance.py input.jpg --iterations 18 --deblur-blend 0.6 --amount 1.4
```

Mírnější a bezpečnější nastavení:

```bash
/Users/marekmikel/Desktop/PROJEKTY/KarateCoachAssistant/.venv/bin/python tools/media_enhance.py input.jpg --iterations 6 --deblur-blend 0.3 --amount 0.8
```

## Doporučený postup

1. Začni na kopii souboru nebo s výstupem přes `-o`.
2. U videa nejdřív zkus `--roi`, pokud je problém jen v části obrazu.
3. Když vznikají artefakty, sniž `--iterations`, `--deblur-blend` nebo `--amount`.
4. Když je obraz stále moc měkký, zvyš postupně `--amount` nebo `--iterations`.