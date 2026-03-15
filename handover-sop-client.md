# SOP klienta (In Lexi Studio)

## 1) Dostępy

- Panel CMS: `https://admin.inlexistudio.com`
- Strona live: `https://inlexistudio.com`
- Logowanie kontami CMS zgodnie z ustaleniami operacyjnymi.

## 2) Codzienna edycja treści

1. Zaloguj się do panelu CMS.
2. Edytuj treści stron (`Pages`) oraz sekcje homepage.
3. Wgrywaj obrazy przez panel (media/upload).
4. Zapisz zmiany i odśwież stronę live.

## 3) Galerie i referencje

1. Dodawaj/edytuj elementy galerii (`Galleries`, `Gallery Items`).
2. Ustawiaj sortowanie i cover image.
3. Testimonials przypinaj zgodnie z treścią galerii.

## 4) Ustawienia globalne strony

W `Settings` zarządzaj:

- `site_name`, `meta_title`, `meta_description`
- kontakt (`email`, `phone`)
- social media
- branding (`logo_path`, favicon)
- opcjonalnie skrypty analytics (Umami)

## 5) Aktualizacja kodu (zespół techniczny)

1. Zmiany kodu trafiają do gałęzi `main`.
2. Deploy uruchamia się przez GitHub Actions (`Deploy to Production`).
3. Po deployu wykonaj smoke-check:
   - strona główna
   - podstrony usług
   - `/contact`
   - panel admin logowanie

## 6) Co sprawdzać po publikacji

- Czy strona ładuje się bez błędów wizualnych.
- Czy treść z CMS jest widoczna na frontendzie.
- Czy formularze i kluczowe endpointy API działają.

## 7) Procedura awaryjna

1. Sprawdź logi workflow na GitHub Actions.
2. Sprawdź logi backendu na serwerze (`request.log`, `stderr.log`, `stdout.log`).
3. Jeśli trzeba, wykonaj rollback do poprzedniego stabilnego commita i ponów deploy.

## 8) Bezpieczeństwo operacyjne

- Nie przechowuj sekretów i haseł w repozytorium.
- Dane dostępowe trzymaj w menedżerze haseł.
- Rotuj hasła po przekazaniu projektu klientowi.
