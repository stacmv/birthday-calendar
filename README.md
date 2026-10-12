# Anniversary (jubilee) calendar

Static HTML + vanilla JS app: enter a date (and optionally a time) of birth and see
the nearest round jubilees in days and hours. No framework, no bundler.

Run `make help` for the list of targets.

## Layout

- `public/` - deploy root
  - `app/` - the application (RU/EN, themes, ES modules)
  - `shared/` - theme tokens and switcher shared by the app and the landing pages
  - `index.html` - picks the landing language
- `tests/unit/` - vitest unit tests
- `Dockerfile` - serves `public/` with the PHP built-in server

## Docker

```
docker build -t anniversary-calendar .
docker run --rm -p 8080:8080 anniversary-calendar
```

Then open http://localhost:8080/.

## Themes

`system` (default, follows the OS), `light`, `dark` and `contrast` (high contrast:
black background, white text, yellow accents). Tokens live in `public/shared/themes.css`.
