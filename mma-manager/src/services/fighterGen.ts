import type { Fighter, WeightClass, Personality, FighterStats } from '../types/gameplay';
import { FIRST_NAMES, LAST_NAMES, NICKNAMES } from '../data/fighterNames';

type Tier = 'scrub' | 'local' | 'regional' | 'national' | 'elite';

interface GenOptions {
  tier?: Tier;
  forceWeightClass?: WeightClass;
}

const WEIGHT_CLASSES: WeightClass[] = [
  'flyweight', 'bantamweight', 'featherweight', 'lightweight',
  'welterweight', 'middleweight', 'heavyweight',
];

const PERSONALITIES: Personality[] = ['cocky', 'humble', 'shy', 'joker'];

const TIER_RANGES: Record<Tier, { min: number; max: number; potential: number }> = {
  scrub:    { min: 2, max: 4, potential: 6 },
  local:    { min: 3, max: 5, potential: 7 },
  regional: { min: 4, max: 7, potential: 8 },
  national: { min: 6, max: 8, potential: 9 },
  elite:    { min: 7, max: 10, potential: 10 },
};

let _idCounter = 0;

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function genStats(tier: Tier): FighterStats {
  const { min, max } = TIER_RANGES[tier];
  return {
    striking: rng(min, max),
    grappling: rng(min, max),
    conditioning: rng(min, max),
    durability: rng(min, max),
  };
}

function genPotential(stats: FighterStats, tier: Tier): FighterStats {
  const cap = TIER_RANGES[tier].potential;
  return {
    striking: Math.min(10, rng(stats.striking, cap)),
    grappling: Math.min(10, rng(stats.grappling, cap)),
    conditioning: Math.min(10, rng(stats.conditioning, cap)),
    durability: Math.min(10, rng(stats.durability, cap)),
  };
}

export function generateFighter(opts: GenOptions = {}): Fighter {
  const tier = opts.tier || pick(['local', 'regional'] as Tier[]);
  const stats = genStats(tier);
  const potential = genPotential(stats, tier);
  const wc = opts.forceWeightClass || pick(WEIGHT_CLASSES);

  const firstName = pick(FIRST_NAMES);
  const lastName = pick(LAST_NAMES);
  const nickname = pick(NICKNAMES);

  _idCounter++;

  const tierSalary: Record<Tier, [number, number]> = {
    scrub: [200, 400],
    local: [300, 600],
    regional: [500, 1000],
    national: [800, 2000],
    elite: [1500, 4000],
  };
  const [sMin, sMax] = tierSalary[tier];

  return {
    id: `fighter-${_idCounter}-${Date.now()}`,
    name: `${firstName} "${nickname}" ${lastName}`,
    nickname,
    weightClass: wc,
    personality: pick(PERSONALITIES),
    stats,
    potential,
    potentialRevealed: false,
    health: 100,
    morale: rng(40, 80),
    fame: tier === 'scrub' ? rng(1, 10) : tier === 'elite' ? rng(60, 90) : rng(10, 50),
    injury: 'none',
    injuryDaysLeft: 0,
    wins: tier === 'scrub' ? rng(0, 2) : rng(2, 15),
    losses: tier === 'scrub' ? rng(1, 5) : rng(0, 8),
    knockouts: rng(0, 4),
    ranking: null,
    titleHolder: false,
    salary: rng(sMin, sMax),
    contractWeeksLeft: 0,
    fightBonus: rng(5, 20),
    signedDay: 0,
    avatarSeed: Math.floor(Math.random() * 100000),
  };
}

/** Generate an opponent matched roughly to a fighter's skill level */
export function generateOpponent(fighter: Fighter, difficulty: number = 0): Fighter {
  const avgStat = (fighter.stats.striking + fighter.stats.grappling +
    fighter.stats.conditioning + fighter.stats.durability) / 4;

  let tier: Tier;
  if (avgStat + difficulty <= 3) tier = 'scrub';
  else if (avgStat + difficulty <= 5) tier = 'local';
  else if (avgStat + difficulty <= 7) tier = 'regional';
  else if (avgStat + difficulty <= 9) tier = 'national';
  else tier = 'elite';

  return generateFighter({ tier, forceWeightClass: fighter.weightClass });
}
