# Seminarium 9 — Playwright E2E + CI/CD (demo)

Mini-aplikacja **React + Express** z kompletnym zestawem testów E2E w **Playwright**
oraz pipeline'em **GitHub Actions**. Projekt demonstruje:

- testy E2E **multi-browser** (Chromium, Firefox, WebKit, Mobile)
- **Page Object Model**
- **API testing** (bez UI)
- **visual regression**
- **GitHub Actions**: build → testy → deploy

## Struktura

```
playwright-cicd-demo/
├── server/                 # API Express (in-memory)
│   └── src/index.ts
├── client/                 # Frontend React + Vite
│   └── src/
│       ├── pages/          # LoginPage, ProductsPage
│       ├── api.ts
│       └── App.tsx
├── tests/                  # Testy Playwright
│   ├── pages/              # Page Object Model
│   ├── login.spec.ts       # E2E + POM
│   ├── products.spec.ts    # E2E + POM
│   ├── api.spec.ts         # API testing
│   └── visual.spec.ts      # visual regression
└── playwright.config.ts    # konfiguracja (multi-browser, webServer)

# Workflow CI leży w ROOCIE repo (Actions czyta tylko stamtąd):
.github/workflows/playwright-demo.yml
```

## Uruchomienie

```bash
# 1. Instalacja zależności (workspaces: instaluje client + server + playwright)
npm install

# 2. Instalacja przeglądarek Playwright
npx playwright install

# 3a. Uruchomienie aplikacji ręcznie (opcjonalne)
npm run dev
#   frontend: http://localhost:3000   |   API: http://localhost:3001
#   Logowanie: user@example.com / tajne123

# 3b. Uruchomienie testów (Playwright sam startuje serwery!)
npm test                 # wszystkie przeglądarki
npm run test:chromium    # tylko Chromium
npm run test:ui          # tryb interaktywny (świetny do demo!)
npm run report           # otwórz raport HTML
```

## Konfiguracja przez .env

Sekrety i config trzymamy poza kodem. `playwright.config.ts` wczytuje `.env`
przez `dotenv`, a testy czytają `process.env`.

```bash
cp .env.example .env     # uzupełnij swoje wartości (.env jest w .gitignore)

# te same testy na innym środowisku - jedną zmienną:
BASE_URL=https://staging.example.com npm test
```

## Narzędzia deweloperskie

```bash
# Codegen - klikasz po stronie, Playwright SAM pisze kod testu
npm run codegen          # (najpierw odpal `npm run dev`)

# Trace Viewer - film z timeline'em, DOM-snapshoty, network (obserwowalność!)
npx playwright test --trace on        # wygeneruj trace
npm run trace -- test-results/<...>/trace.zip

# Jakość kodu (te same komendy odpala CI w jobie `quality`)
npm run lint             # ESLint
npm run format:check     # Prettier
npm run typecheck        # tsc --noEmit (client + server + testy)
```

## Visual regression — generowanie baseline

```bash
npm run test:update      # generuje baseline screenshoty (Chromium)
```

> **Ważne:** baseline'y zrzutów ekranu są **zależne od systemu operacyjnego**
> (inne renderowanie fontów na macOS / Windows / Linux). Baseline wygenerowany
> lokalnie może różnić się od tego na CI (Linux). Dlatego w workflow job `visual`
> ma `continue-on-error: true` — nie blokuje pipeline'u. W realnym projekcie
> generuje się baseline w Dockerze albo bezpośrednio na CI.

## Mapowanie na tematy seminarium

| Temat                               | Gdzie w kodzie                                          |
| ----------------------------------- | ------------------------------------------------------- |
| Multi-browser                       | `playwright.config.ts` → `projects`                     |
| Page Object Model                   | `tests/pages/*.ts`                                      |
| Visual regression                   | `tests/visual.spec.ts`                                  |
| API testing                         | `tests/api.spec.ts`                                     |
| Auto-waiting / web-first assertions | wszystkie `expect(...)`                                 |
| API mocking (`page.route`)          | `tests/mocking.spec.ts`                                 |
| Konfiguracja przez `.env`           | `playwright.config.ts` + `tests/login.spec.ts`          |
| Quality gate (lint/format/typy)     | `eslint.config.mjs`, `.prettierrc`, job `quality`       |
| CI/CD (build → test → deploy)       | `.github/workflows/playwright-demo.yml` (w roocie repo) |
