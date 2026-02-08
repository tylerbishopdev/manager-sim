// ── Fighter ──────────────────────────────────────────────

export type Personality = 'cocky' | 'humble' | 'shy' | 'joker';
export type InjuryStatus = 'none' | 'minor' | 'major' | 'critical';
export type WeightClass = 'flyweight' | 'bantamweight' | 'featherweight' | 'lightweight' | 'welterweight' | 'middleweight' | 'heavyweight';

export interface FighterStats {
  striking: number;     // 1-10
  grappling: number;    // 1-10
  conditioning: number; // 1-10
  durability: number;   // 1-10
}

export interface Fighter {
  id: string;
  name: string;
  nickname: string;
  weightClass: WeightClass;
  personality: Personality;

  // Visible stats
  stats: FighterStats;

  // Hidden potential (scouting reveals)
  potential: FighterStats;
  potentialRevealed: boolean;

  // State
  health: number;          // 0-100
  morale: number;          // 0-100
  fame: number;            // 0-100, affects merch/PPV
  injury: InjuryStatus;
  injuryDaysLeft: number;

  // Record
  wins: number;
  losses: number;
  knockouts: number;
  ranking: number | null;  // null = unranked, 1 = #1 contender
  titleHolder: boolean;

  // Contract
  salary: number;          // per week
  contractWeeksLeft: number;
  fightBonus: number;      // % of purse
  signedDay: number;

  // Avatar (reuse existing CustomOptions for SVG rendering)
  avatarSeed: number;      // seed for procedural appearance
}

// ── Fight ────────────────────────────────────────────────

export type FightResult = 'ko' | 'tko' | 'submission' | 'decision' | 'draw';

export interface FightRoundEvent {
  text: string;
  type: 'strike' | 'grapple' | 'knockout' | 'submission' | 'taunt' | 'recovery' | 'info';
  fighter: 'player' | 'opponent';
}

export interface FightRound {
  number: number;
  events: FightRoundEvent[];
  f1HpEnd: number;
  f2HpEnd: number;
  f1Score: number;
  f2Score: number;
}

export interface ScheduledFight {
  id: string;
  day: number;
  fighterId: string;
  opponent: Fighter;
  venue: string;
  isMainEvent: boolean;
  basePurse: number;
  ppvPoints: number;       // % of PPV revenue if main event
  ticketRevenueSplit: number; // % of gate
  prestige: number;        // 1-10, affects ranking change
}

export interface FightOutcome {
  fightId: string;
  winnerId: string;
  loserId: string;
  result: FightResult;
  rounds: FightRound[];
  finalRound: number;
  earnings: FightEarnings;
  injuryToPlayer: InjuryStatus;
  rankingChange: number;
  fameGain: number;
}

// ── Economy ──────────────────────────────────────────────

export interface FightEarnings {
  basePurse: number;
  winBonus: number;
  ppvRevenue: number;
  ticketRevenue: number;
  sponsorBonuses: number;
  medicalCosts: number;
  total: number;
}

export interface SponsorDeal {
  id: string;
  name: string;            // "MEGA PROTEIN 9000"
  weeklyPayment: number;
  fightBonus: number;      // per fight
  weeksLeft: number;
  requirement?: string;    // "win_streak_3", "title_holder", etc
  requirementMet: boolean;
}

export interface WeeklyFinances {
  week: number;
  income: {
    purses: number;
    ppv: number;
    tickets: number;
    merch: number;
    sponsors: number;
  };
  expenses: {
    salaries: number;
    gymRent: number;
    equipment: number;
    medical: number;
    scouting: number;
    travel: number;
    staff: number;
  };
}

// ── Gym / Progression ────────────────────────────────────

export interface GymState {
  level: number;            // 1-5
  reputation: number;       // 0-100
  equipment: number;        // 0-100, affects training quality
  rent: number;             // weekly cost
  maxFighters: number;      // roster cap
  staff: {
    trainer: boolean;       // +training effectiveness
    cutman: boolean;        // reduces fight injuries
    nutritionist: boolean;  // +conditioning training
    scout: boolean;         // +scouting range
  };
}

export const GYM_UPGRADES: { level: number; cost: number; rent: number; maxFighters: number; label: string }[] = [
  { level: 1, cost: 0,      rent: 500,   maxFighters: 2,  label: 'Garage Gym' },
  { level: 2, cost: 5000,   rent: 1000,  maxFighters: 4,  label: 'Strip Mall Gym' },
  { level: 3, cost: 15000,  rent: 2000,  maxFighters: 6,  label: 'Real Gym' },
  { level: 4, cost: 40000,  rent: 4000,  maxFighters: 8,  label: 'Pro Facility' },
  { level: 5, cost: 100000, rent: 8000,  maxFighters: 12, label: 'World Class HQ' },
];

// ── Events ───────────────────────────────────────────────

export type EventType = 'injury' | 'drama' | 'opportunity' | 'rival' | 'sponsor' | 'news';

export interface GameEvent {
  id: string;
  day: number;
  type: EventType;
  title: string;
  description: string;
  fighterId?: string;
  choices: EventChoice[];
  resolved: boolean;
}

export interface EventChoice {
  label: string;
  effect: string;  // serializable key like "morale+10" — resolved by event handler
}

// ── World / Map ──────────────────────────────────────────

export type MapId = 'gym' | 'downtown' | 'arena' | 'rival_gym' | 'agents_office';

export interface TileMapData {
  id: MapId;
  name: string;
  width: number;
  height: number;
  tileSize: number;
  layers: {
    ground: number[];
    objects: number[];
    collision: number[];  // 1 = blocked, 0 = walkable
  };
  spawns: { id: string; x: number; y: number; type: 'player' | 'npc' | 'door' | 'interact' }[];
  doors: { x: number; y: number; toMap: MapId; toX: number; toY: number }[];
  interactables: { x: number; y: number; id: string; label: string; action: string }[];
}

export interface WorldState {
  currentMap: MapId;
  playerX: number;
  playerY: number;
  playerDir: 'up' | 'down' | 'left' | 'right';
  npcPositions: Record<string, { x: number; y: number }>;
}

// ── Root Game State ──────────────────────────────────────

export type GameScreen = 'overworld' | 'roster' | 'fight' | 'finance' | 'scout' | 'contract' | 'dialog' | 'event' | 'prefight' | 'postfight';

export interface GameState {
  day: number;
  week: number;
  money: number;
  totalEarnings: number;
  totalSpent: number;

  fighters: Fighter[];
  schedule: ScheduledFight[];
  gym: GymState;
  sponsors: SponsorDeal[];
  events: GameEvent[];
  finances: WeeklyFinances[];

  world: WorldState;
  activeScreen: GameScreen;
  dialogQueue: DialogMessage[];

  // Career stats
  championsWon: number;
  fightHistory: FightOutcome[];
}

export interface DialogMessage {
  speaker: string;
  text: string;
  choices?: { label: string; action: string }[];
}
