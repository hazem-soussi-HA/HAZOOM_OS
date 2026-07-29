# HAZOOM BASIC — Super HAZOOM: Liberty City

> **Building = Healing** — A retro 8-bit adventure, written entirely in BASIC.

HAZOOM is the hero — a shadow builder exploring Liberty City. Collect coins,
dodge shadow agents, grab star power-ups, and survive. All running on a
virtual 8-bit console, in your browser.

## Play

```
cd website && python3 -m http.server 8081
# Open http://localhost:8081
```

## What's Inside

- **`website/index.html`** — Landing page with animated preview
- **`website/games/hazoom-basic.html`** — The BASIC console IDE + game
- **`website/js/hazoom-basic/`** — The full HAZOOM BASIC engine:
  - `tokenizer.js` — Lexer
  - `parser.js` — Recursive descent parser
  - `interpreter.js` — Executor
  - `hardware.js` — Virtual 8-bit console (160×192, 16 colors, 8 sprites)
  - `game-super-hazoom.bas` — The game itself (464 lines of BASIC)
  - `demos.js` — Example programs

## Specs

| Feature | Value |
|---------|-------|
| Resolution | 160×192 |
| Colors | 16 |
| Sprites | 8 hardware |
| RAM | 32KB |
| Sound | Square wave via Web Audio |
| Language | HAZOOM BASIC (GW-BASIC inspired) |

## License

Original work. No affiliation with any existing IP. This is the HAZOOM universe.

— Hazem, Shadow Builder 💚
