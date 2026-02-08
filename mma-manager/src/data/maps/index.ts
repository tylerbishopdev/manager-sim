import type { TileMapData, MapId } from '../../types/gameplay';
import { gymMap } from './gym';
import { downtownMap } from './downtown';
import { arenaMap } from './arena';

// Simple placeholder maps for locations not yet built
const placeholder = (id: MapId, name: string): TileMapData => ({
  id,
  name,
  width: 10,
  height: 10,
  tileSize: 48,
  layers: {
    ground: Array(100).fill(0).map((_, i) => {
      const x = i % 10, y = Math.floor(i / 10);
      if (x === 0 || x === 9 || y === 0 || y === 9) return 1;
      return 0;
    }),
    objects: [],
    collision: Array(100).fill(0).map((_, i) => {
      const x = i % 10, y = Math.floor(i / 10);
      if (x === 0 || x === 9 || y === 0 || y === 9) return 1;
      return 0;
    }),
  },
  spawns: [{ id: 'player', x: 5, y: 5, type: 'player' }],
  doors: [{ x: 5, y: 9, toMap: 'downtown', toX: 10, toY: 7 }],
  interactables: [],
});

export const MAPS: Record<MapId, TileMapData> = {
  gym: gymMap,
  downtown: downtownMap,
  arena: arenaMap,
  rival_gym: placeholder('rival_gym', 'Rival Gym'),
  agents_office: placeholder('agents_office', "Agent's Office"),
};

export function getMap(id: MapId): TileMapData {
  return MAPS[id];
}
