# Instrukcja Vibe Coding (Automatyczny Deploy)

Od teraz Twoja strona aktualizuje się automatycznie ("magicznie") po każdym wysłaniu zmian na GitHuba.

## Jak pracować (Vibe Coding Loop):

1. **Zrób zmiany:** Edytuj kod, dodaj zdjęcia do `public/uploads`, zmień teksty.
2. **Sprawdź:** Uruchom `npm run dev` i zobacz czy wszystko gra.
3. **Wyślij zmiany ("Wypchnij"):**
   W terminalu wpisz te 3 komendy:

   ```bash
   git add .
   git commit -m "Opis co zmieniłeś"
   git push
   ```

4. **Koniec!**
   - GitHub Actions **automatycznie**:
     - Zbuduje nową wersję strony.
     - Wyśle pliki na serwer (Frontend do `public_html`, Backend do `cms-app`).
     - Zrestartuje aplikację Node.js.
   - Cały proces trwa około **2-3 minuty**.
   - Możesz śledzić postęp w zakładce **"Actions"** na Twoim repozytorium GitHub.

## Ważne uwagi:

- **Pliki `.env` i Database:** Te pliki są **ignorowane** przez Gita (dla bezpieczeństwa). Jeśli zmienisz coś w `.env` lokalnie, musisz ręcznie edytować `.env` na serwerze przez FileZilla.
- **Zdjęcia (public/uploads):** Jeśli dodasz nowe zdjęcia lokalnie i zrobisz `git push`, one się wyślą. Ale jeśli dodasz zdjęcia przez Panel Admina _na produkcji_, to one będą tylko na serwerze (nie ściągną się same do Ciebie).
- **Zasada "Jednego Źródła":** Traktuj swój kod lokalny jako "Główny". Zawsze wprowadzaj zmiany u siebie i wypychaj je w górę.

## Gdyby coś poszło nie tak (Awaryjnie):

- Sprawdź zakładkę **Actions** na GitHubie – tam zobaczysz dlaczego deploy się nie udał (np. błąd w kodzie).
- Jeśli strona "padnie", zawsze możesz wejść przez FileZilla i cofnąć zmiany ręcznie lub poprosić AI o pomoc.
