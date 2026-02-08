import { useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { getMap } from '../../data/maps';
import type { TileMapData } from '../../types/gameplay';

// ── Tile Colors (placeholder — swap for sprite atlas later) ──

const TILE_COLORS: Record<number, string> = {
  0: '#3a3a5c',   // floor
  1: '#1a1a2e',   // wall
  2: '#2d4a2d',   // training mat
  3: '#4a3a2a',   // desk
  4: '#3a3a4a',   // equipment
  5: '#6a5a2a',   // door
  6: '#4a2a2a',   // ring/octagon
  7: '#2a2a3a',   // road
  8: '#4a4a5a',   // sidewalk
  9: '#1a3a1a',   // tree/obstacle
  10: '#2a2a4a',  // seating
};

const TILE_LABELS: Record<number, string> = {
  2: '🥋', 3: '🖥️', 4: '🏋️', 5: '🚪', 6: '🥊', 9: '🌳', 10: '💺',
};

const PLAYER_SIZE = 0.7;
const MOVE_SPEED = 4; // pixels per frame

// ── Input State (module-level, shared across renders) ──

const keys: Record<string, boolean> = {};

// ── Collision check (pure function) ──

function canMove(tileX: number, tileY: number, mapData: TileMapData): boolean {
  if (tileX < 0 || tileY < 0 || tileX >= mapData.width || tileY >= mapData.height) return false;
  return mapData.layers.collision[tileY * mapData.width + tileX] === 0;
}

// ── Action handler (reads store directly) ──

function handleAction(action: string, label: string) {
  const store = useGameStore.getState();
  const gs = store.gameState;

  switch (action) {
    case 'train':
      store.pushDialog({ speaker: 'TRAINER', text: `Welcome to the ${label}. Want to train your fighter?`, choices: [
        { label: 'Train Striking', action: 'train_striking' },
        { label: 'Train Grappling', action: 'train_grappling' },
        { label: 'Never mind', action: 'close' },
      ]});
      break;
    case 'train_equip':
      store.pushDialog({ speaker: 'EQUIPMENT', text: 'Heavy bags and weights. Good for conditioning.', choices: [
        { label: 'Train Conditioning', action: 'train_conditioning' },
        { label: 'Leave', action: 'close' },
      ]});
      break;
    case 'desk':
      store.pushDialog({ speaker: 'YOUR DESK', text: 'What do you want to do?', choices: [
        { label: 'View Roster', action: 'open_roster' },
        { label: 'Check Finances', action: 'open_finance' },
        { label: 'Rest (Next Day)', action: 'advance_day' },
        { label: 'Save Game', action: 'save_game' },
        { label: 'Back', action: 'close' },
      ]});
      break;
    case 'scout':
      store.pushDialog({ speaker: 'SCOUT', text: 'Yo! I know some fighters looking for work. Wanna see who\'s available?', choices: [
        { label: 'Show me', action: 'open_scout' },
        { label: 'Not now', action: 'close' },
      ]});
      break;
    case 'fights':
      store.pushDialog({ speaker: 'PROMOTER', text: 'I got some fights lined up. Your guys ready?', choices: [
        { label: 'Show available fights', action: 'open_calendar' },
        { label: 'Maybe later', action: 'close' },
      ]});
      break;
    case 'fight':
      if (gs && gs.schedule.some(f => f.day === gs.day)) {
        store.pushDialog({ speaker: 'ANNOUNCER', text: 'There\'s a fight scheduled today! Ready to go?', choices: [
          { label: 'LET\'S GO!', action: 'start_fight' },
          { label: 'Not yet', action: 'close' },
        ]});
      } else {
        store.pushDialog({ speaker: 'ARENA', text: 'No fights scheduled today. Talk to a promoter downtown to book one.' });
      }
      break;
    default:
      store.pushDialog({ speaker: label, text: `[${action}] — Coming soon!` });
  }
}

export default function OverworldCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  // Smooth position for rendering (sub-tile)
  const smoothPos = useRef({ x: 0, y: 0 });
  const targetPos = useRef({ x: 0, y: 0 });
  const isMoving = useRef(false);
  const interactCooldown = useRef(0);
  const lastMapRef = useRef('');

  const gameState = useGameStore((s) => s.gameState);
  if (!gameState) return null;

  // ── Input ──
  useEffect(() => {
    const down = (e: KeyboardEvent) => { keys[e.key] = true; };
    const up = (e: KeyboardEvent) => { keys[e.key] = false; };
    window.addEventListener('keydown', down);
    window.addEventListener('keyup', up);
    return () => {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
    };
  }, []);

  // ── Game Loop (runs once, reads store directly each frame) ──
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d')!;

    const loop = () => {
      // Read fresh state every frame from Zustand (no stale closures)
      const store = useGameStore.getState();
      const gs = store.gameState;
      if (!gs) { animRef.current = requestAnimationFrame(loop); return; }

      const { world } = gs;
      const currentMap = getMap(world.currentMap);
      const ts = currentMap.tileSize;

      // Reset smooth position on map change
      if (lastMapRef.current !== world.currentMap) {
        smoothPos.current = { x: world.playerX * ts, y: world.playerY * ts };
        targetPos.current = { x: world.playerX * ts, y: world.playerY * ts };
        lastMapRef.current = world.currentMap;
      }

      // Canvas sizing
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      const cw = canvas.width;
      const ch = canvas.height;

      // Decrement cooldown
      if (interactCooldown.current > 0) interactCooldown.current--;

      // ── Movement ──
      if (!isMoving.current && gs.dialogQueue.length === 0 && gs.activeScreen === 'overworld') {
        let dx = 0, dy = 0;
        let dir = world.playerDir;

        if (keys['ArrowUp'] || keys['w'] || keys['W']) { dy = -1; dir = 'up'; }
        else if (keys['ArrowDown'] || keys['s'] || keys['S']) { dy = 1; dir = 'down'; }
        else if (keys['ArrowLeft'] || keys['a'] || keys['A']) { dx = -1; dir = 'left'; }
        else if (keys['ArrowRight'] || keys['d'] || keys['D']) { dx = 1; dir = 'right'; }

        if (dx !== 0 || dy !== 0) {
          const newX = world.playerX + dx;
          const newY = world.playerY + dy;
          store.setPlayerDir(dir);

          if (canMove(newX, newY, currentMap)) {
            targetPos.current = { x: newX * ts, y: newY * ts };
            isMoving.current = true;
            store.setPlayerPos(newX, newY);

            // Check door on arrival
            if (interactCooldown.current <= 0) {
              for (const door of currentMap.doors) {
                if (door.x === newX && door.y === newY) {
                  store.changeMap(door.toMap, door.toX, door.toY);
                  interactCooldown.current = 15;
                  break;
                }
              }
            }
          }
        }

        // Interact key
        if (keys['e'] || keys['E'] || keys[' '] || keys['Enter']) {
          if (interactCooldown.current <= 0) {
            const ddx = dir === 'left' ? -1 : dir === 'right' ? 1 : 0;
            const ddy = dir === 'up' ? -1 : dir === 'down' ? 1 : 0;
            const fx = world.playerX + ddx;
            const fy = world.playerY + ddy;

            let handled = false;
            for (const inter of currentMap.interactables) {
              if (inter.x === fx && inter.y === fy) {
                interactCooldown.current = 20;
                handleAction(inter.action, inter.label);
                handled = true;
                break;
              }
            }

            if (!handled) {
              for (const door of currentMap.doors) {
                if (door.x === world.playerX && door.y === world.playerY) {
                  store.changeMap(door.toMap, door.toX, door.toY);
                  interactCooldown.current = 15;
                  break;
                }
              }
            }
          }
          keys['e'] = false; keys['E'] = false;
          keys[' '] = false; keys['Enter'] = false;
        }
      }

      // Smooth interpolation
      const sp = smoothPos.current;
      const tp = targetPos.current;
      const ddx = tp.x - sp.x;
      const ddy = tp.y - sp.y;
      if (Math.abs(ddx) < 2 && Math.abs(ddy) < 2) {
        sp.x = tp.x;
        sp.y = tp.y;
        isMoving.current = false;
      } else {
        sp.x += Math.sign(ddx) * MOVE_SPEED;
        sp.y += Math.sign(ddy) * MOVE_SPEED;
      }

      // ── Camera ──
      const camX = sp.x - cw / 2 + ts / 2;
      const camY = sp.y - ch / 2 + ts / 2;

      // ── Render ──
      ctx.fillStyle = '#0a0a1a';
      ctx.fillRect(0, 0, cw, ch);

      // Tiles
      for (let y = 0; y < currentMap.height; y++) {
        for (let x = 0; x < currentMap.width; x++) {
          const tileId = currentMap.layers.ground[y * currentMap.width + x];
          const sx = x * ts - camX;
          const sy = y * ts - camY;

          // Skip offscreen
          if (sx + ts < 0 || sy + ts < 0 || sx > cw || sy > ch) continue;

          ctx.fillStyle = TILE_COLORS[tileId] || '#222';
          ctx.fillRect(sx, sy, ts, ts);

          // Grid lines
          ctx.strokeStyle = 'rgba(255,255,255,0.03)';
          ctx.strokeRect(sx, sy, ts, ts);

          // Tile labels (emoji placeholders)
          const label = TILE_LABELS[tileId];
          if (label) {
            ctx.font = `${ts * 0.5}px sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(label, sx + ts / 2, sy + ts / 2);
          }
        }
      }

      // Interactable indicators
      for (const inter of currentMap.interactables) {
        const ix = inter.x * ts - camX;
        const iy = inter.y * ts - camY;
        // Pulsing indicator
        const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(212, 160, 23, ${pulse * 0.3})`;
        ctx.fillRect(ix, iy, ts, ts);

        // Label
        ctx.font = '10px "Press Start 2P", monospace';
        ctx.fillStyle = `rgba(240, 208, 96, ${pulse})`;
        ctx.textAlign = 'center';
        ctx.fillText(inter.label, ix + ts / 2, iy - 6);
      }

      // Door indicators
      for (const door of currentMap.doors) {
        const dx = door.x * ts - camX;
        const dy = door.y * ts - camY;
        ctx.fillStyle = 'rgba(212, 160, 23, 0.15)';
        ctx.fillRect(dx, dy, ts, ts);
      }

      // Player
      const ps = ts * PLAYER_SIZE;
      const px = sp.x - camX + (ts - ps) / 2;
      const py = sp.y - camY + (ts - ps) / 2;

      // Player shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.beginPath();
      ctx.ellipse(px + ps / 2, py + ps + 2, ps / 2.5, ps / 6, 0, 0, Math.PI * 2);
      ctx.fill();

      // Player body (placeholder — swap for sprite later)
      ctx.fillStyle = '#d4a017';
      ctx.fillRect(px, py, ps, ps);

      // Direction indicator (small triangle)
      ctx.fillStyle = '#f0d060';
      ctx.beginPath();
      const triSize = 6;
      if (world.playerDir === 'up') {
        ctx.moveTo(px + ps / 2, py - triSize);
        ctx.lineTo(px + ps / 2 - triSize / 2, py);
        ctx.lineTo(px + ps / 2 + triSize / 2, py);
      } else if (world.playerDir === 'down') {
        ctx.moveTo(px + ps / 2, py + ps + triSize);
        ctx.lineTo(px + ps / 2 - triSize / 2, py + ps);
        ctx.lineTo(px + ps / 2 + triSize / 2, py + ps);
      } else if (world.playerDir === 'left') {
        ctx.moveTo(px - triSize, py + ps / 2);
        ctx.lineTo(px, py + ps / 2 - triSize / 2);
        ctx.lineTo(px, py + ps / 2 + triSize / 2);
      } else {
        ctx.moveTo(px + ps + triSize, py + ps / 2);
        ctx.lineTo(px + ps, py + ps / 2 - triSize / 2);
        ctx.lineTo(px + ps, py + ps / 2 + triSize / 2);
      }
      ctx.fill();

      // NPC spawns
      for (const spawn of currentMap.spawns) {
        if (spawn.type === 'npc') {
          const nx = spawn.x * ts - camX + ts * 0.15;
          const ny = spawn.y * ts - camY + ts * 0.15;
          ctx.fillStyle = '#5a8a5a';
          ctx.fillRect(nx, ny, ts * 0.7, ts * 0.7);
          ctx.fillStyle = '#aaffaa';
          ctx.font = '8px "Press Start 2P", monospace';
          ctx.textAlign = 'center';
          ctx.fillText('NPC', nx + ts * 0.35, ny - 4);
        }
      }

      // Map name
      ctx.font = '10px "Press Start 2P", monospace';
      ctx.fillStyle = 'rgba(212,160,23,0.6)';
      ctx.textAlign = 'left';
      ctx.fillText(currentMap.name.toUpperCase(), 16, ch - 16);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(animRef.current);
  }, []); // runs once — reads store directly each frame

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'fixed',
        top: 0, left: 0,
        width: '100vw', height: '100vh',
        imageRendering: 'pixelated',
      }}
    />
  );
}
