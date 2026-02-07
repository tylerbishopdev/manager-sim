export type Screen = 'title' | 'select' | 'create' | 'confirm';

export interface CustomOptions {
  skinTone: number;
  eyeShape: number;
  facialHair: number;
  hat: number;
  style: number;
}

export interface ManagerCharacter {
  id: string;
  name: string;
  title: string;          // short archetype label shown above portrait
  bio: string;
  preset: boolean;
  custom?: CustomOptions;
  portraitBg: string;      // background colour behind portrait placeholder
  accentColor: string;     // per-character accent for name / highlight
  portrait?: string;       // path to illustrated portrait image (optional)
  sprite?: string;         // path to small sprite image (optional)
  // Stats
  charisma: number;
  negotiation: number;
  scouting: number;
  connections: number;
}

export const SKIN_TONES = ['#f5d0a9', '#d4a574', '#c68642', '#8d5524', '#5c3310'];
export const EYE_SHAPES = ['round', 'almond', 'narrow', 'wide', 'hooded'];
export const FACIAL_HAIR = ['none', 'stubble', 'goatee', 'fullBeard', 'mustache'];
export const HATS = ['none', 'snapback', 'fedora', 'beanie', 'headband'];
export const STYLES = ['suit', 'streetwear', 'tracksuit', 'casual', 'flashy'];
