// ── Admin Types: Game Builder ──────────────────────────────

/** A scenario event template that can trigger during gameplay */
export interface ScenarioTemplate {
  id: string;
  name: string;
  category: ScenarioCategory;
  triggerCondition: ScenarioTrigger;
  probability: number;         // 0-100 chance per day
  minDay: number;              // earliest day this can fire
  maxDay: number;              // latest day (0 = no limit)
  repeatable: boolean;
  cooldownDays: number;        // min days between repeats

  // Content
  speaker: string;
  text: string;
  imageUrl?: string;           // optional scene image
  choices: ScenarioChoice[];

  // Metadata
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type ScenarioCategory =
  | 'injury'
  | 'drama'
  | 'opportunity'
  | 'rival'
  | 'sponsor'
  | 'news'
  | 'training'
  | 'media'
  | 'fan'
  | 'custom';

export interface ScenarioTrigger {
  type: 'random' | 'fighter_count' | 'money_above' | 'money_below'
    | 'reputation_above' | 'reputation_below' | 'day_of_week'
    | 'gym_level' | 'win_streak' | 'loss_streak' | 'always';
  value?: number;
}

export interface ScenarioChoice {
  label: string;
  effects: ScenarioEffect[];
}

export interface ScenarioEffect {
  type: 'money' | 'morale' | 'health' | 'fame' | 'reputation'
    | 'injury_days' | 'add_sponsor' | 'screen' | 'dismiss';
  value: number | string;
  target: 'player' | 'random_fighter' | 'all_fighters' | 'gym';
}

/** A venue where fights can be held */
export interface VenueTemplate {
  id: string;
  name: string;
  city: string;
  capacity: number;
  prestige: number;            // 1-10
  basePurse: number;
  ticketRevenueSplit: number;  // 0-100%
  ppvAvailable: boolean;
  imageUrl?: string;
  minReputation: number;       // gym rep needed to book
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** A sponsor template for procedural sponsor generation */
export interface SponsorTemplate {
  id: string;
  name: string;
  tier: 1 | 2 | 3;            // sponsor quality tier
  weeklyPaymentRange: [number, number];
  fightBonusRange: [number, number];
  durationWeeksRange: [number, number];
  requirement?: string;
  logoUrl?: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** A dialog template for specific game actions */
export interface DialogTemplate {
  id: string;
  action: string;              // e.g. 'open_gym', 'open_fights', 'advance_day'
  speaker: string;
  textVariants: string[];      // random selection pool
  choices?: { label: string; action: string }[];
  condition?: ScenarioTrigger;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** Fighter name pool additions */
export interface NamePool {
  firstNames: string[];
  lastNames: string[];
  nicknames: string[];
}

/** Custom asset entry (uploaded graphic) */
export interface AssetEntry {
  id: string;
  name: string;
  category: 'portrait' | 'sprite' | 'icon' | 'background' | 'venue' | 'sponsor_logo' | 'misc';
  dataUrl: string;             // base64 data URL for preview/storage
  filePath?: string;           // if saved to public/
  width?: number;
  height?: number;
  createdAt: number;
}

// ── New Admin Types (Phase 2) ──────────────────────────────

export type CommentaryCategory =
  | 'strike_hit' | 'strike_miss'
  | 'grapple_success' | 'grapple_fail'
  | 'ko' | 'submission' | 'taunt';

/** A commentary line template used in fight simulation */
export interface CommentaryTemplate {
  id: string;
  category: CommentaryCategory;
  text: string;                // supports {attacker} and {defender} placeholders
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

/** Tunable game settings that affect core gameplay values */
export interface GameSettings {
  startingMoney: number;       // default: 5000
  startingMorale: number;      // default: 70
  startingReputation: number;  // default: 20
  trainingCost: number;        // default: 200
  trainingSuccessBase: number; // default: 65 (%)
  trainingSuccessMax: number;  // default: 85 (%)
  statGainMin: number;         // default: 0.3
  statGainMax: number;         // default: 0.5
  injuryChance: number;        // default: 15 (%)
  maxRosterSize: number;       // default: 12
  eventChanceWeekly: number;   // default: 35 (%)
  eventChanceDaily: number;    // default: 10 (%)
}

/** Fighter tier definition for procedural generation */
export interface FighterTierDefinition {
  id: string;
  name: string;                // e.g. 'scrub', 'local', 'regional', 'national', 'elite'
  minOverall: number;          // min stat value
  maxOverall: number;          // max stat value
  potentialCap: number;        // max potential stat
  scoutCostRange: [number, number];
  fightPurseRange: [number, number];
  salaryRange: [number, number];
  color: string;               // hex for UI badges
}

/** Gym level definition for progression system */
export interface GymLevelDefinition {
  id: string;
  level: number;               // 1-5+
  name: string;                // e.g. 'Garage Gym', 'Pro Facility'
  upgradeCost: number;         // 0 for level 1
  capacity: number;            // fighter slots
  weeklyRent: number;
  trainingBonus: number;       // added to training success %
  description: string;
}

/** Root admin content bundle — everything the admin manages */
export interface AdminContentBundle {
  version: number;
  scenarios: ScenarioTemplate[];
  venues: VenueTemplate[];
  sponsors: SponsorTemplate[];
  dialogs: DialogTemplate[];
  namePool: NamePool;
  assets: AssetEntry[];
  commentary: CommentaryTemplate[];
  gameSettings: GameSettings;
  fighterTiers: FighterTierDefinition[];
  gymLevels: GymLevelDefinition[];
}

// ── Default Values ────────────────────────────────────────

export function createDefaultGameSettings(): GameSettings {
  return {
    startingMoney: 5000,
    startingMorale: 70,
    startingReputation: 20,
    trainingCost: 200,
    trainingSuccessBase: 65,
    trainingSuccessMax: 85,
    statGainMin: 0.3,
    statGainMax: 0.5,
    injuryChance: 15,
    maxRosterSize: 12,
    eventChanceWeekly: 35,
    eventChanceDaily: 10,
  };
}

export function createDefaultFighterTiers(): FighterTierDefinition[] {
  return [
    { id: 'tier-scrub', name: 'scrub', minOverall: 2, maxOverall: 4, potentialCap: 6, scoutCostRange: [100, 300], fightPurseRange: [500, 1500], salaryRange: [200, 400], color: '#6b7280' },
    { id: 'tier-local', name: 'local', minOverall: 3, maxOverall: 5, potentialCap: 7, scoutCostRange: [300, 600], fightPurseRange: [1000, 3000], salaryRange: [300, 600], color: '#22c55e' },
    { id: 'tier-regional', name: 'regional', minOverall: 4, maxOverall: 7, potentialCap: 8, scoutCostRange: [500, 1200], fightPurseRange: [2000, 6000], salaryRange: [500, 1000], color: '#3b82f6' },
    { id: 'tier-national', name: 'national', minOverall: 6, maxOverall: 8, potentialCap: 9, scoutCostRange: [1000, 3000], fightPurseRange: [5000, 15000], salaryRange: [800, 2000], color: '#a855f7' },
    { id: 'tier-elite', name: 'elite', minOverall: 7, maxOverall: 10, potentialCap: 10, scoutCostRange: [3000, 8000], fightPurseRange: [10000, 50000], salaryRange: [1500, 4000], color: '#f59e0b' },
  ];
}

export function createDefaultGymLevels(): GymLevelDefinition[] {
  return [
    { id: 'gym-1', level: 1, name: 'Garage Gym', upgradeCost: 0, capacity: 2, weeklyRent: 500, trainingBonus: 0, description: 'A humble start. Room for 2 fighters.' },
    { id: 'gym-2', level: 2, name: 'Strip Mall Gym', upgradeCost: 5000, capacity: 4, weeklyRent: 1000, trainingBonus: 5, description: 'Moving up. Basic equipment, room for 4.' },
    { id: 'gym-3', level: 3, name: 'Real Gym', upgradeCost: 15000, capacity: 6, weeklyRent: 2000, trainingBonus: 10, description: 'A legitimate operation. Pro equipment, 6 fighters.' },
    { id: 'gym-4', level: 4, name: 'Pro Facility', upgradeCost: 40000, capacity: 8, weeklyRent: 4000, trainingBonus: 15, description: 'Top-tier facility. 8 fighters, full cage.' },
    { id: 'gym-5', level: 5, name: 'World Class HQ', upgradeCost: 100000, capacity: 12, weeklyRent: 8000, trainingBonus: 20, description: 'The ultimate gym. 12 fighters, world-class everything.' },
  ];
}

export const EMPTY_ADMIN_BUNDLE: AdminContentBundle = {
  version: 2,
  scenarios: [],
  venues: [],
  sponsors: [],
  dialogs: [],
  namePool: { firstNames: [], lastNames: [], nicknames: [] },
  assets: [],
  commentary: [],
  gameSettings: createDefaultGameSettings(),
  fighterTiers: createDefaultFighterTiers(),
  gymLevels: createDefaultGymLevels(),
};

// ── Helpers for creating blank items ──

export function createBlankScenario(): ScenarioTemplate {
  return {
    id: `scenario-${Date.now()}`,
    name: '',
    category: 'custom',
    triggerCondition: { type: 'random' },
    probability: 10,
    minDay: 1,
    maxDay: 0,
    repeatable: true,
    cooldownDays: 7,
    speaker: '',
    text: '',
    choices: [{ label: 'OK', effects: [{ type: 'dismiss', value: 0, target: 'player' }] }],
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createBlankVenue(): VenueTemplate {
  return {
    id: `venue-${Date.now()}`,
    name: '',
    city: '',
    capacity: 500,
    prestige: 3,
    basePurse: 2000,
    ticketRevenueSplit: 15,
    ppvAvailable: false,
    minReputation: 10,
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createBlankSponsor(): SponsorTemplate {
  return {
    id: `sponsor-${Date.now()}`,
    name: '',
    tier: 1,
    weeklyPaymentRange: [100, 300],
    fightBonusRange: [200, 500],
    durationWeeksRange: [8, 16],
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createBlankDialog(): DialogTemplate {
  return {
    id: `dialog-${Date.now()}`,
    action: '',
    speaker: '',
    textVariants: [''],
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createBlankCommentary(): CommentaryTemplate {
  return {
    id: `commentary-${Date.now()}`,
    category: 'strike_hit',
    text: '',
    tags: [],
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function createBlankFighterTier(): FighterTierDefinition {
  return {
    id: `tier-${Date.now()}`,
    name: '',
    minOverall: 3,
    maxOverall: 6,
    potentialCap: 8,
    scoutCostRange: [500, 1000],
    fightPurseRange: [1000, 5000],
    salaryRange: [300, 800],
    color: '#6b7280',
  };
}

export function createBlankGymLevel(): GymLevelDefinition {
  return {
    id: `gym-${Date.now()}`,
    level: 1,
    name: '',
    upgradeCost: 0,
    capacity: 2,
    weeklyRent: 500,
    trainingBonus: 0,
    description: '',
  };
}
