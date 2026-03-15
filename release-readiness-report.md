# Release readiness report

Data: 2026-02-22

## Zakres audytu

- Środowisko build + runtime
- Prisma + schema/db compatibility
- Smoke test API mini-CMS
- Parity lokalnie vs live
- Dokumentacja handover

## Wynik ogólny

Status: **READY FOR CLIENT HANDOVER**

Powód: deploy produkcyjny wykonany po SSH, smoke-check live zakończony sukcesem, a parity po deployu potwierdza zgodność artefaktów frontend/admin oraz payloadu backendu.

## PASS

- Frontend build przechodzi na konfiguracji produkcyjnej (`PUBLIC_API_URL`, `PUBLIC_BASE_URL`).
- Dynamic route conflict `/contact` vs `[slug]` usunięty.
- Prisma: `generate` i `migrate status` przechodzą, schema jest spójna.
- API smoke test lokalny (200):
  - `/api/settings`
  - `/api/pages`
  - `/api/galleries`
  - `/api/testimonials`
- Backup lokalnej bazy wykonany (`backups/inlexistudio-*.db`).
- Deploy wykonany po SSH na:
  - `domains/inlexistudio.com/public_html` (frontend),
  - `domains/inlexistudio.com/cms-app` (backend payload),
  - `domains/admin.inlexistudio.com/public_html` (admin app).
- Smoke test live (200):
  - `https://inlexistudio.com/`
  - `https://inlexistudio.com/about/`
  - `https://inlexistudio.com/contact/`
  - `https://inlexistudio.com/portfolio/`
  - `https://inlexistudio.com/app/api/settings`
  - `https://admin.inlexistudio.com/`
- Post-deploy parity:
  - Frontend: `MATCH`
  - Admin: `MATCH`
  - Backend: tylko pliki runtime (`request.log`, `stderr.log`, `stdout.log`, `tmp/restart.txt`)
  - Dowód: `reports/live-parity-postdeploy-20260222-191514.txt`.

## OPEN ITEMS (nieblokujące handover)

1. **Node toolchain na tym komputerze**
   - Globalne `nvm` zostało zainstalowane pod profilem admina i nie jest używalne dla bieżącego usera.
   - Walidacja była wykonana awaryjnie na lokalnym runtime portable Node 22.
   - Nie wpływa na działanie produkcji, ale warto naprawić dla komfortu dalszego developmentu.

## Akcje po przekazaniu (zalecane)

1. Uporządkować lokalny globalny runtime Node (docelowo stabilny user-level setup).
2. Rotować hasła i sekrety po finalnym przekazaniu.
3. Zachować `scripts/compare-live.ps1` jako cykliczny audyt parity po kolejnych wdrożeniach.

## Artefakty

- `handover-checklist.md`
- `handover-sop-client.md`
- `reports/live-parity-20260220-184711.txt`
- `reports/live-parity-postdeploy-20260222-191514.txt`
- `scripts/compare-live.ps1`
