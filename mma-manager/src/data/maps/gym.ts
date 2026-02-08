import type { TileMapData } from '../../types/gameplay';

// Tile legend:
// 0 = floor, 1 = wall, 2 = mat/training, 3 = desk, 4 = equipment, 5 = door, 6 = ring
// Collision: 0 = walkable, 1 = blocked

const W = 14;
const H = 12;

// Ground layer (floor types)
const ground = [
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,2,2,2,0,0,0,4,4,0,0,0,1,
  1,0,2,6,2,0,0,0,4,4,0,0,0,1,
  1,0,2,2,2,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,3,0,1,
  1,0,0,0,0,0,0,0,0,0,0,3,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,5,5,0,0,0,0,0,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,
];

const collision = [
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,1,1,0,0,0,1,
  1,0,0,0,0,0,0,0,1,1,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,1,0,1,
  1,0,0,0,0,0,0,0,0,0,0,1,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,0,0,0,0,0,0,0,0,0,0,0,0,1,
  1,1,1,1,1,1,1,1,1,1,1,1,1,1,
];

export const gymMap: TileMapData = {
  id: 'gym',
  name: 'Your Gym',
  width: W,
  height: H,
  tileSize: 48,
  layers: { ground, objects: [], collision },
  spawns: [
    { id: 'player', x: 7, y: 8, type: 'player' },
  ],
  doors: [
    { x: 6, y: 10, toMap: 'downtown', toX: 7, toY: 1 },
    { x: 7, y: 10, toMap: 'downtown', toX: 8, toY: 1 },
  ],
  interactables: [
    { x: 3, y: 3, id: 'ring', label: 'Training Ring', action: 'train' },
    { x: 8, y: 2, id: 'equipment', label: 'Equipment', action: 'train_equip' },
    { x: 11, y: 6, id: 'desk', label: 'Manager Desk', action: 'desk' },
  ],
};
