# VoxelFear

A browser-based voxel zombie-survival game in the 7 Days to Die mold. Mine, build,
craft, fight zombies, and survive the blood moon every 7th night.

Pure JavaScript. Three.js + React are vendored locally — no CDN, strict CSP, no
runtime npm dependencies.

## Run

The repository is a static site. Serve the working tree and open it in a browser:

```sh
python3 -m http.server 8000
# then visit http://localhost:8000
```

`file://` will not work — ES modules require an HTTP origin.

## Develop

```sh
npm install            # installs Babel + ESLint (dev-only)
npm run build:ui       # compiles ui/*.jsx → ui/*.js (only needed after UI changes)
npm test               # node:test suite (48 tests, ~250ms)
npm run lint           # ESLint on game and tests
```

## Controls

| Key      | Action                                          |
|----------|-------------------------------------------------|
| W A S D  | Move                                            |
| Space    | Jump                                            |
| Shift    | Sprint (drains stamina)                         |
| Mouse    | Look                                            |
| LMB hold | Mine the targeted block / swing melee at zombie |
| RMB      | Place block from the selected hotbar slot       |
| E        | Open nearby loot crate / drink from water voxel |
| 1 – 8    | Select hotbar slot                              |
| I        | Toggle inventory (click to move stacks)         |
| Esc      | Pause / close overlay                           |

In the inventory: click a stack to pick it up, click another slot to place it;
shift-click to split; right-click to drop; double-click food/drink to consume.

## Survival loop

- **Health, stamina, hunger, thirst** — all drain over time. Eat, drink, rest, heal.
- **Mining and crafting** — break blocks with bare hands (slow) or a tool (fast).
  Pickaxes excel at stone, axes at wood. Craft sticks, pickaxes, axes, swords,
  clubs, bandages, cloth and water jars from the inventory's crafting panel.
- **Zombies** — Walkers (slow), Runners (fast at night), Brutes (riot-armored
  tanks) and Screamers (summon walker reinforcements). Each drops loot.
- **Blood moon** — every 7th night the horde escalates: faster pulses, 4–8
  zombies per wave, capped at 30 active.
- **Loot crates** — cabinets, toolboxes and ammo crates spawn through the world.
  Press E to open them.
- **Progression** — XP from kills, mining and crafting. Each level boosts max
  HP, mining speed and melee damage.
- **Persistence** — autosave every 30s to `localStorage`. Pick "LOAD SAVED
  WORLD" from the main menu to resume.

## Architecture

The game runs as a vanilla ES-module Three.js client; React renders the
overlay UI on top of the Three.js canvas. The two halves communicate through
a single global, `window.GameBridge` (`js/gamebridge.js`):

```
                ┌───────────────────────────┐
                │ React UI (ui/*.jsx)       │
                │ — reads GameBridge.state  │
                │ — emits commands          │
                └──────────────┬────────────┘
                               │ state @ 10 Hz, events on demand
                ┌──────────────▼────────────┐
                │ window.GameBridge         │
                │   state, setState, on,    │
                │   off, emit               │
                └──────────────┬────────────┘
                               │
                ┌──────────────▼────────────┐
                │ Game core (js/*.js)       │
                │ — authoritative state     │
                │ — Three.js + WebGL render │
                └───────────────────────────┘
```

Inventory, crafting, player progression, the day cycle and the world all live
on the game side. React is a pure view, plus a small set of commands
(`inv:move`, `craft`, `consume`, `loot:take`, `setAutoSave`, …) sent through
`GameBridge.emit`.

### Module map

| File                | Purpose                                                        | Pure? |
|---------------------|----------------------------------------------------------------|-------|
| `js/main.js`        | Render loop, input, atmosphere, autosave timer                 | no    |
| `js/world.js`       | Voxel chunks, face-culled meshing, edit log                    | no    |
| `js/worldgen.js`    | Chunk-seed RNG, terrain height formula                         | **yes** |
| `js/entities.js`    | Player, zombie spawn/AI, melee, mob radar                      | no    |
| `js/zombies.js`     | Procedural meshes for walker / runner / brute / screamer       | no    |
| `js/daynight.js`    | Day/night cycle, blood-moon scheduling, atmosphere lerp        | **yes** |
| `js/items.js`       | Item & block registry, drop tables, UI metadata                | **yes** |
| `js/inventory.js`   | Inventory data model — add / remove / move / split / serialize | **yes** |
| `js/crafting.js`    | Recipe list + `canCraft` / `doCraft`                           | **yes** |
| `js/loot.js`        | Loot tables, weighted rolls                                    | **yes** |
| `js/crates.js`      | Crate meshes, chunk-based spawning, find-near                  | no    |
| `js/playerstate.js` | XP curve, perks, vitals state                                  | **yes** |
| `js/audio.js`       | Web Audio API procedural SFX, no audio files                   | no    |
| `js/save.js`        | localStorage serializer, autosave                              | no    |
| `js/commands.js`    | React → game command router                                    | no    |
| `js/gamebridge.js`  | Global state/event bus between game and UI                     | no    |

The "Pure?" column marks Three.js / DOM-free modules — those are unit-tested
under `tests/` via Node's built-in `node:test`. The remaining modules require
a browser; their gameplay behaviour is exercised by playing the build.

## CSP and dependencies

`index.html` declares a strict CSP — `default-src 'none'; script-src 'self'`.
No external fetches, no inline scripts, no eval. Three.js r184 and React 18
production builds are vendored under `js/vendor/`. Babel and ESLint are
dev-only (CI), and the test suite uses Node's built-in test runner.

## CI

`.github/workflows/ci.yml` runs on every push and PR:

1. `npm ci`
2. `npm run lint`
3. `npm test`
4. `npm run build:ui`
5. Verify `ui/*.js` matches `ui/*.jsx` so compiled output never drifts.
