# Promo videos (HyperFrames)

Five promo concepts for the landing, 1:1, ~60 s, RU/EN from one composition (`lang` variable):

| Dir | Concept |
|---|---|
| `odometer/` | «Одометр жизни» — digit drums tick to a beautiful number |
| `holiday/` | «Праздник, о котором никто не знает» — one ordinary date lights up |
| `invitation/` | «Приглашение» — an invitation card to your 20 000th day |
| `numbers/` | «Числа говорят сами» — kinetic typography, no phone |
| `newspaper/` | «Экстренный выпуск» — a newspaper front page |

The landing picks one at random per visit (`public/shared/promo.js`).

## What is in git

Composition sources (`index.html`, `compositions/`, `assets/`, `STORYBOARD.md`, `BRIEF.md`, `frame.md`),
generators under `tools/` (or `src/` + `rebuild.sh` for `odometer`), and `music.mp3`
(generated with `toolbox/music`, Google Lyria 3 via OpenRouter; `music.mp3.json` is its sidecar).
Renders, snapshots and the site capture are not in git.

## Rebuild

Everything that launches a browser runs **inside WSL only** (this Windows host BSODs on headless Chrome).
The working projects live on the WSL disk at `~/hf/ac-<concept>`; this directory is a copy of their sources.

```bash
HF="node /mnt/c/Users/Stac/.claude/plugins/cache/hyperframes/hyperframes/0.8.150/skills/hyperframes/scripts/plugin-cli.mjs"
cd ~/hf/ac-<concept>
$HF render --quality high --workers 4 --variables '{"lang":"ru"}' --output renders/ru.mp4
$HF render --quality high --workers 4 --variables '{"lang":"en"}' --output renders/en.mp4
```

Then, from the repo: `make promo-videos` — muxes `music.mp3` onto the masters and writes the 720×720 web copies
and posters to `public/video/{ru,en}/`.

Inside sub-compositions `getVariables()` does not see the render-time `--variables`, so frames read
`window.__hfVariables` first. Re-running the assembler drops `data-composition-variables` from `index.html`;
re-add it before rendering EN (each project's notes/scripts do this).
