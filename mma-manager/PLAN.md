# MMA Manager — Gameplay Implementation Plan

## Design Decisions
- **Game flow**: Top-down overworld (SNES Zelda / early Fallout style). Walk around, interact with locations/NPCs.
- **Fight display**: Visual sim — two fighters on screen with basic animations, round-by-round summary scrolling in lower third.
- **Economy**: Deep — PPV, ticket sales, merch, medical bills, sponsor deals, contracts, gym costs.

---

## Architecture Overview

### State Management
- **Zustand** for global game state (lightweight, no boilerplate, works great with React)
- Single `useGameStore` with slices: manager, roster, economy, calendar, world

### Overworld Engine
- **Canvas-based tile renderer** (HTML5 Canvas in a React component)
- 16×16 tile grid, camera follows player
- Collision map for walls/obstacles
- NPC sprites with interaction zones (press E/Space to talk)
- Location triggers (walk to door → enter building)
- All tile/sprite assets are loaded from a simple sprite atlas PNG — easy to swap your art in later
- Placeholder assets: colored rectangles with labels until you provide PNGs

### Maps / Locations
1. **Your Gym** (home base) — train fighters, check roster, office desk for contracts
2. **Downtown Strip** — scout fighters at local fights, find sponsors
3. **Arena** — where scheduled fights happen
4. **Rival Gym** — scope out competition
5. **Agent's Office** — negotiate big deals, PPV contracts

Each map is a JSON tilemap — swap art by changing the sprite atlas.

### Fight Engine
- Pre-fight: tale-of-the-tape screen (stats comparison)
- Fight view: two fighter sprites (left vs right), health bars, round indicator
- Each round: 3-5 exchanges calculated, displayed as quick animations (sprite shifts + flash) with text in lower third
- Knockout/submission/decision logic
- Post-fight: result screen with earnings breakdown, injury report, ranking change

### Deep Economy Model
**Income:**
- Fight purse (base + win bonus)
- PPV points (% of buys if main event)
- Ticket gate revenue (your cut based on negotiation)
- Merchandise sales (scales with fighter fame)
- Sponsor payments (per-fight + monthly retainers)

**Expenses:**
- Fighter salaries (monthly contracts)
- Gym rent + equipment maintenance
- Training camp costs (per fight prep)
- Medical bills (post-fight, scales with damage taken)
- Scouting fees
- Travel costs (away fights)
- Staff salaries (cutman, trainer — hire as upgrades)

**Contracts:**
- Fighter contracts: duration, salary, fight bonus %, PPV points
- Sponsor contracts: requirements (win streak, title), payment terms
- Venue deals: revenue split negotiation

---

## Build Phases

### Phase 1: Foundation (this session)
**Goal**: Overworld engine + game state + one playable location

Files to create:
```
src/
├── store/
│   └── gameStore.ts          — Zustand store with all game state
├── engine/
│   ├── TileMap.ts            — Tile map data structure + loader
│   ├── Camera.ts             — Camera following player
│   ├── Sprite.ts             — Sprite rendering (player, NPCs)
│   ├── Collision.ts          — Collision detection
│   └── Input.ts              — Keyboard input handler
├── services/
│   ├── fightSim.ts           — Fight simulation logic
│   ├── economy.ts            — Income/expense calculations
│   ├── fighterGen.ts         — Procedural fighter generator
│   └── eventGen.ts           — Random event generator
├── data/
│   ├── presets.ts             — (existing)
│   ├── maps/
│   │   ├── gym.ts            — Gym tilemap
│   │   ├── downtown.ts       — Downtown tilemap
│   │   └── arena.ts          — Arena tilemap
│   ├── fighterNames.ts       — Name pools for generation
│   └── events.ts             — Event templates
├── components/
│   ├── (existing screens)
│   ├── OverworldCanvas.tsx    — Main canvas renderer
│   ├── GameHUD.tsx            — Overlay: money, day, notifications
│   ├── DialogBox.tsx          — NPC dialog / event popups
│   ├── FightScreen.tsx        — Visual fight simulation
│   ├── RosterPanel.tsx        — Fighter list (pause menu)
│   ├── FinancePanel.tsx       — Economy overview
│   ├── ContractPanel.tsx      — Contract negotiation UI
│   └── ScoutPanel.tsx         — Scouting / recruitment UI
```

### Phase 1 deliverables:
1. Zustand game store with full type definitions
2. Canvas-based overworld with player movement (WASD/arrows)
3. Gym map with interactable spots (training area, office desk, door to exit)
4. GameHUD overlay (money, day counter, fighter count)
5. Dialog box system for NPC/location interactions
6. Day advancement system (sleep at gym to advance day)
7. One starter fighter assigned after character creation

### Phase 2: Core Loop
1. Fight simulation engine (stat-based + RNG)
2. FightScreen with visual display + lower-third commentary
3. Calendar system — fights scheduled X days out
4. Arena map — walk in on fight day
5. Basic economy — purse income, salary expenses
6. Post-fight results (earnings, injuries, ranking)
7. Training system — use gym equipment to boost fighter stats

### Phase 3: Recruitment & Economy
1. Downtown map with scouting location
2. Fighter generator (procedural names, stats, personalities)
3. Scout panel — reveal stats based on manager scouting skill
4. Contract negotiation UI
5. Full economy: PPV, tickets, merch, medical, sponsors
6. Finance panel with income/expense breakdown
7. Sponsor deal system

### Phase 4: Depth & Polish
1. Rival manager NPCs (walk around, trash talk)
2. Random events system (injuries, drama, opportunities)
3. Title/ranking progression
4. Gym upgrade system (equipment, staff hires)
5. Multiple weight classes
6. Save/load (localStorage → IndexedDB)
7. Sound effects + music hooks (easy to add audio files later)

---

## Asset Swap System

Every visual element loads through a central asset registry:
```typescript
// src/assets/registry.ts
const ASSETS = {
  tiles: {
    floor: '/assets/tiles/floor.png',      // fallback: colored rect
    wall: '/assets/tiles/wall.png',
    door: '/assets/tiles/door.png',
    // ...
  },
  sprites: {
    player: '/assets/sprites/player.png',  // fallback: SVG character
    npc_trainer: '/assets/sprites/trainer.png',
    // ...
  },
  fighters: {
    // Generated fighters use SVG; preset ones can use PNGs
  },
  ui: {
    healthBar: '/assets/ui/healthbar.png',
    // ...
  }
};
```

If a PNG doesn't exist, the renderer falls back to colored placeholder rectangles with text labels. Drop in your PNGs and they appear automatically.

---

## Manager Stat Effects (Gameplay Integration)

| Stat | Overworld Effect | Fight Effect | Economy Effect |
|------|-----------------|--------------|----------------|
| Charisma | NPCs give better dialog options | Fighter morale boost pre-fight | +% merch sales, sponsor interest |
| Negotiation | Unlock contract options | — | Better purse splits, lower costs |
| Scouting | See fighter potential in scout screen | See opponent weakness pre-fight | Find undervalued fighters |
| Connections | More NPCs appear, more fight offers | Better matchmaking | PPV access earlier, sponsor unlocks |

---

## Silly / Tongue-in-Cheek Elements

- Fighter names: "Brick Sandwich", "Pain Williams", "The Absolute Unit"
- NPC dialog: over-the-top, meme-worthy ("Your fighter ate 47 punches and called it cardio")
- Random events: "Fighter found doing yoga with rival's coach. Morale confused."
- Fight commentary: "He's not hurt, he's just... rethinking his life choices"
- Sponsor names: "MEGA PROTEIN 9000", "Uncle Rick's Fight Cream"
- All copy is in separate data files — easy to rewrite/localize
