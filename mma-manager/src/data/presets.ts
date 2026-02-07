import type { ManagerCharacter } from '../types';

/**
 * ── HOW TO ADD CHARACTER ART ──
 *
 * 1. Drop portrait images into:  public/portraits/{id}.png
 *    (e.g. public/portraits/vince.png)
 *    Recommended: 480×600 or any 4:5 ratio, PNG or JPEG.
 *
 * 2. Drop sprite images into:    public/sprites/{id}.png
 *    (e.g. public/sprites/vince.png)
 *    Recommended: ~128×128, transparent PNG.
 *
 * The select screen will automatically pick them up.
 * While images are missing, a clean placeholder is shown.
 */

export const presetManagers: ManagerCharacter[] = [
  {
    id: 'vince',
    name: 'GOTH BRYAN',
    title: 'THE ENFORCER',
    bio: 'Leather and spikes. Vince ran underground fight circuits before going legit. Nobody crosses him twice.',
    preset: true,
    portraitBg: '#6a6480',
    accentColor: '#c0b8d0',
    portrait: '/portraits/vince.png',
    sprite: '/sprites/vince.png',
    charisma: 6,
    negotiation: 9,
    scouting: 5,
    connections: 8,
  },
  {
    id: 'maya',
    name: 'THE BRIAN BROTHERS',
    title: 'THE CREW',
    bio: 'Street-smart duo who move as one. Maya calls the shots, Rico backs them up. Double the hustle.',
    preset: true,
    portraitBg: '#6a6480',
    accentColor: '#f0d060',
    portrait: '/portraits/maya.png',
    sprite: '/sprites/maya.png',
    charisma: 7,
    negotiation: 6,
    scouting: 9,
    connections: 6,
  },
  {
    id: 'dre',
    name: 'LIL BRIAN',
    title: 'THE HUSTLER',
    bio: 'Gold chain, white hoodie, and a nose for talent. Dre turns nobodies into contenders.',
    preset: true,
    portraitBg: '#6a6480',
    accentColor: '#f0d060',
    portrait: '/portraits/dre.png',
    sprite: '/sprites/dre.png',
    charisma: 9,
    negotiation: 7,
    scouting: 6,
    connections: 5,
  },
  {
    id: 'yuki',
    name: 'POST-OP BRIAN',
    title: 'THE COACH',
    bio: 'Old-school coach who screams louder than the crowd. His fighters fear him more than their opponents.',
    preset: true,
    portraitBg: '#6a6480',
    accentColor: '#88ccee',
    portrait: '/portraits/yuki.png',
    sprite: '/sprites/yuki.png',
    charisma: 5,
    negotiation: 8,
    scouting: 8,
    connections: 7,
  },
  {
    id: 'elena',
    name: 'BRIANNA',
    title: 'THE HEIR',
    bio: 'Boxing dynasty royalty branching into MMA. Glamorous, ruthless, and connected at every level.',
    preset: true,
    portraitBg: '#6a6480',
    accentColor: '#e8a080',
    portrait: '/portraits/elena.png',
    sprite: '/sprites/elena.png',
    charisma: 8,
    negotiation: 7,
    scouting: 5,
    connections: 9,
  },
];

export const defaultCustom: ManagerCharacter = {
  id: 'custom',
  name: 'YOUR MANAGER',
  title: 'THE UNKNOWN',
  bio: 'Write your own story.',
  preset: false,
  portraitBg: '#333',
  accentColor: '#d4a017',
  custom: { skinTone: 0, eyeShape: 0, facialHair: 0, hat: 0, style: 0 },
  charisma: 7,
  negotiation: 7,
  scouting: 7,
  connections: 7,
};
