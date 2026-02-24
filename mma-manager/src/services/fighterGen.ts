import type { Fighter, WeightClass, Personality, FighterStats } from '../types/gameplay';
import { getNamePool, getFighterTiers } from './contentResolver';

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

let _idCounter = 0;

function rng(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

/** Resolve tier data from admin-defined tiers, falling back to hardcoded ranges */
function getTierData(tier: Tier): { min: number; max: number; potential: number; salaryMin: number; salaryMax: number } {
  const tiers = getFighterTiers();
  const match = tiers.find((t) => t.name === tier);
  if (match) {
    return {
      min: match.minOverall,
      max: match.maxOverall,
      potential: match.potentialCap,
      salaryMin: match.salaryRange[0],
      salaryMax: match.salaryRange[1],
    };
  }
  // Hardcoded fallback (should never happen if defaults are loaded)
  const FALLBACK: Record<Tier, { min: number; max: number; potential: number; salaryMin: number; salaryMax: number }> = {
    scrub:    { min: 2, max: 4, potential: 6, salaryMin: 200, salaryMax: 400 },
    local:    { min: 3, max: 5, potential: 7, salaryMin: 300, salaryMax: 600 },
    regional: { min: 4, max: 7, potential: 8, salaryMin: 500, salaryMax: 1000 },
    national: { min: 6, max: 8, potential: 9, salaryMin: 800, salaryMax: 2000 },
    elite:    { min: 7, max: 10, potential: 10, salaryMin: 1500, salaryMax: 4000 },
  };
  return FALLBACK[tier];
}

function genStats(tier: Tier): FighterStats {
  const { min, max } = getTierData(tier);
  return {
    striking: rng(min, max),
    grappling: rng(min, max),
    conditioning: rng(min, max),
    durability: rng(min, max),
  };
}

function genPotential(stats: FighterStats, tier: Tier): FighterStats {
  const cap = getTierData(tier).potential;
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

  // Use admin + fallback name pools via contentResolver
  const namePool = getNamePool();
  const firstName = pick(namePool.firstNames);
  const lastName = pick(namePool.lastNames);
  const nickname = pick(namePool.nicknames);

  _idCounter++;

  const { salaryMin, salaryMax } = getTierData(tier);

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
    salary: rng(salaryMin, salaryMax),
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
