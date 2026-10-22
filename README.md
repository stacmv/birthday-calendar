# Jubilee calendar (anniversary-calendar)

Static HTML + vanilla JS PWA. Enter a date (and optionally a time) of birth and see the
nearest jubilees in days and hours: round numbers (3 nearest multiples of 100 and of 1000),
optional "beautiful" numbers (repdigits, digit sequences, palindromes, repeating pairs, two
significant digits + zeros), export to `.ics` / Google Calendar, installable, works offline.
RU and EN. No framework, no bundler (ES modules).

`make help` lists all targets.

## Layout

- `public/` - deploy root
  - `index.html` - picks the landing language (visible links as a fallback)
  - `ru/`, `en/` - landing pages (no manifest or service worker of their own)
  - `app/` - the PWA (`start_url`/scope `./` = `/app/`): `js/` modules, `sw.js`, `manifest.webmanifest`, `offline.html`, `icons/`
  - `shared/` - theme tokens/switcher (`themes.css`, `theme.js`, `theme-init.js`) and `landing.css`
  - `shots/{ru,en}/` - landing screenshots (generated)
  - `.htaccess` - Apache config for Jino (MIME types, cache headers)
- `tests/unit/` - vitest unit tests (pure logic: calc, format, beautiful numbers, ics/Google builders, storage, build stamp)
- `e2e/` - Playwright tests (own `package.json`; installed and run **in WSL only**)
- `scripts/` - `build.mjs` (sw.js stamp), `icons.mjs`, `screenshots.mjs`, `static-server.mjs`

## Behaviour notes

- The saved birth date lives in `localStorage` (`ac.birth`). `?d=YYYY-MM-DD&t=HH:MM` in the URL takes
  precedence, **overwrites** the saved value and is then removed from the address bar (so "Forget" is not undone by a reload).
- The permalink on the calendar page is built from the page location (works in a sub-directory).
- Themes: `system` (default, follows the OS), `light`, `dark`, `contrast` (high contrast: black/white/yellow).
  Persisted in `localStorage` (`ac.theme`), shared by the landing and the app.
- Known differences from the old PHP version: hours are elapsed hours (not hour boundaries crossed) and the
  year is the calendar year (the PHP `YYYY` ICU pattern was a week-year).

## Service worker version

`make build` rewrites the block between the `BUILD` markers in `public/app/sw.js`: the shell file list and a
`VERSION` = sha256 content hash of those files (sw.js itself excluded, so the build is idempotent). The cache name
changes exactly when a shipped file changes. Run `make build` before committing app changes
(a unit test fails if `sw.js` is stale); `make deploy*` run it automatically.

## Development

```
make install      # npm ci on the host (vitest, eslint, sharp)
make serve        # http://localhost:8080  (landing: /, app: /app/)
make test         # unit tests
make lint
make test-e2e     # Playwright inside WSL
```

### Browsers: WSL only

Running headless Chromium/Edge on this Windows host can blue-screen it. Everything that
launches a browser (`make test-e2e`, `make landing-screenshots`) runs inside WSL (Ubuntu) through
`wsl -d Ubuntu -e bash -lc ...`; the Playwright package is installed from WSL into `e2e/node_modules`
(`npm ci --no-bin-links`). `scripts/screenshots.mjs` refuses to run on Windows.

### Landing screenshots

`make landing-screenshots` recaptures `public/shots/` only when `public/app` or the shared theme files changed
(hash in `scripts/.shots.hash`); `FORCE=1` recaptures anyway. Commit the PNGs and the hash file.

## Promo videos

The landing shows one of five ~60 s promo videos at random (`public/shared/promo.js`), in the page's language,
muted autoplay (no autoplay under `prefers-reduced-motion`). Sources live in `videos/` (HyperFrames compositions,
see `videos/README.md`); masters are rendered inside WSL. `make promo-videos` muxes the music and writes the
720×720 web copies and posters to `public/video/{ru,en}/`.

## Deploy (Jino shared hosting, FTP)

The FTP config lives outside the repo, next to the other projects' configs:
`D:/dev/anniversary-calendar.deployment.prod.ini` (template: `deployment.prod.ini.example`;
`local = anniversary-calendar/public`, so only `public/` is uploaded).
`deployment.phar` (dg/ftp-deployment) sits in the project root, gitignored.

1. `make deploy-check` - dry run: what would be uploaded or deleted.
2. `make deploy-prod` - build and upload.

PWA installation needs HTTPS on the production domain.
