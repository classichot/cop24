# 04 · Design system

Source of truth: `design/COP24 prototype design.zip` → `design/prototype/`.

## Modernist (base system)

- Flat, architectural, set entirely in **Archivo**; **Chakra Petch** carries Thai glyphs.
- **Zero corner radius** everywhere. Strong **2px rules** between major sections; 1px rules inside.
- A **visible modular grid**: equal-width cells in a 2px frame, separated by `box-shadow: 0 0 0 1px divider`.
- Labels flush left — including inside wide buttons (`.btn-block`).
- The accent is used sparingly: primary action, small emphasis, the active nav rail.
- Interactive states come from the accent ramp; keyboard focus is a 2px accent ring; disabled is 45% opacity.
- Icons: Lucide (the prototype uses text glyphs ✓ ! ✕ ? → for status marks; we keep them).

## COP24 tokens (prototype overrides)

| Token | Value | Use |
| --- | --- | --- |
| `--color-bg` | `#f2f4f8` | page ground |
| `--color-surface` | `#e8ebf2` | cells, panels |
| `--color-text` | `#101c3a` | navy ink |
| `--color-accent` | `#f5c518` | yellow; `--on-accent` navy |
| `--color-accent-100…900` | mixes of the accent | tints (100–300), base (500), text on tints / pressed (600–900) |
| `--st-ok / -bg` | `#1f6b4c` / `#e3eee8` | pass / accepted / effective |
| `--st-warn / -bg` | `#8a5a00` / `#f5ead4` | needs review / observation |
| `--st-bad / -bg` | `#9c2b19` / `#f6e2de` | missing / failed / material |
| `--st-info / -bg` | `#4a5660` / `#e7eaeb` | conditional / planned |

Status glyphs: `✓` ok, `!` warn, `✕` bad, `?` unknown layer, `→` next/planned.

## App-level patterns (`globals.css` part 3)

| Class | Pattern from the prototype |
| --- | --- |
| `.app-header` | sticky header, brand + role / mode / language segments + user chip |
| `.sidenav`, `.nav-group`, `.nav-btn.active` | 232px rail with 3px accent bar on the active item |
| `.page`, `.kicker`, `h1.title`, `.lead` | page opening: kicker in accent-700, 34px title, muted lead |
| `.cells` / `.cell` | the modular grid (`cells-thin`, `cells-accent` variants) |
| `.stat-value*` | KPI numerals, Archivo 800 |
| `.tile` | large clickable grid tiles with accent-100 hover |
| `.panel`, `.callout`, `.callout-bar`, `.note-*` | framed panels, accent call-outs, status notes |
| `.gate` | the 4-stage release gate strip |
| `.step*` | Easy Start numbered steps |
| `.chapter-btn` | Studio chapter rail |
| `.month*` | calendar month strip |
| `.heat`, `.heat-cell` | Compliance Universe heat map |
| `.theme-esg24` etc. | app skins (accent swap) for the embedded app view |

## Rules we keep

- Do not round a corner. Do not center button labels or hero copy. Do not soften rules into hairlines.
- Do not tint imagery (none in v1; if added, wrap in `.grayscale`).
- Every colour, font, spacing and radius comes from a token.
