# MMA Manager Sim - Start Screen & Character Select Plan

## Tech Stack
- **Next.js 15** (App Router) - easy Vercel/Cloudflare deployment
- **TypeScript** - type safety
- **HTML5 Canvas** (via React components) - for the pixel-art character creator layering system
- **Tailwind CSS** - for UI layout/styling around the game
- **No heavy game engine** - keep it lightweight, we'll build game systems as needed

## Architecture

```
manager-sim/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Title screen
│   │   ├── select/page.tsx       # Character select screen
│   │   ├── create/page.tsx       # Character creator screen
│   │   └── layout.tsx            # Root layout with pixel font
│   ├── components/
│   │   ├── TitleScreen.tsx       # "MMA MANAGER" title + "PRESS START"
│   │   ├── CharacterSelect.tsx   # 5 presets + 1 "create" slot
│   │   ├── CharacterCard.tsx     # Individual character portrait card
│   │   ├── CharacterCreator.tsx  # Layered customization UI
│   │   └── PixelButton.tsx       # Retro styled button component
│   ├── data/
│   │   └── managers.ts           # Preset manager definitions
│   ├── types/
│   │   └── manager.ts            # TypeScript types
│   └── hooks/
│       └── useGamepad.ts         # Keyboard/gamepad input hook
├── public/
│   └── sprites/
│       ├── portraits/            # 5 preset character portraits (placeholder)
│       ├── creator/              # Layered parts for character creator
│       │   ├── base/             # Base body (skin tones)
│       │   ├── eyes/             # Eye shape variations
│       │   ├── facial-hair/      # Beard/mustache options
│       │   ├── hats/             # Hat options
│       │   └── clothing/         # Style/clothing options
│       └── ui/                   # UI frame elements
```

## Screens to Build

### 1. Title Screen
- Retro pixel-art styled "MMA MANAGER SIM" title
- Animated "PRESS START" text (blinking)
- Dark background with subtle animation
- Keyboard: Enter/Space to proceed

### 2. Character Select Screen (like your reference image)
- 6 slots in a grid (5 presets + 1 "CREATE YOUR OWN")
- Each slot shows: portrait, name, small sprite, selection border
- Arrow keys to navigate, A/Enter to choose, B/Esc to go back
- Selected character gets a highlighted border + stats preview

### 3. Character Creator Screen
- Large preview of character (canvas-based layer compositing)
- Categories on the side: Skin Tone, Eye Shape, Facial Hair, Hat, Clothing
- Each category has selectable options that layer onto the base image
- Arrow keys to navigate categories/options
- Confirm button to finalize

## 5 Preset Managers
1. **Coach "Iron" Mike** - Old school tough guy, cigar, suit (like your image)
2. **The Strategist** - Analytics-driven woman with headset (like your image)
3. **Veteran Vic** - Angry bald guy in tracksuit (like your image)
4. **"Money" Marcus** - Flashy promoter type, gold chains, sunglasses
5. **Sensei Tanaka** - Traditional martial arts master, gi/robe

## Character Creator Options
- **Skin Tone**: 6 options (light to dark)
- **Eye Shape**: 4 options (round, narrow, hooded, wide)
- **Facial Hair**: 5 options (none, stubble, full beard, mustache, goatee)
- **Hat**: 5 options (none, baseball cap, beanie, fedora, bandana)
- **Clothing**: 5 options (suit, tracksuit, casual tee, hoodie, polo)

## Placeholder Art Strategy
- Generate simple pixel-art style placeholders using CSS/Canvas
- Color-block style characters (think early NES/SNES)
- Each "layer" for the creator is a semi-transparent PNG that composites
- User can replace all art later with their own sprites

## Deployment
- `next.config.js` configured for static export OR edge runtime
- Works on both Vercel (default) and Cloudflare Pages
