/**
 * Content Resolution Layer
 *
 * Bridge between admin-created content and game systems.
 * Reads from Zustand store (single source of truth) and merges
 * with hardcoded fallback data. Admin content takes priority.
 */

import type {
  AdminContentBundle,
  ScenarioTemplate,
  VenueTemplate,
  SponsorTemplate,
  DialogTemplate,
  CommentaryCategory,
  GameSettings,
  FighterTierDefinition,
  GymLevelDefinition,
  NamePool,
} from '../types/admin';
import {
  createDefaultGameSettings,
  createDefaultFighterTiers,
  createDefaultGymLevels,
} from '../types/admin';
import {
  FIRST_NAMES,
  LAST_NAMES,
  NICKNAMES,
  VENUE_NAMES,
  SPONSOR_NAMES,
} from '../data/fighterNames';
import { useAdminStore } from '../store/adminStore';

// ── Read admin bundle from Zustand store ─────────────────

function getAdminBundle(): AdminContentBundle {
  return useAdminStore.getState().bundle;
}

// ── Hardcoded fallback event templates ───────────────────
// These are the built-in events (converted to ScenarioTemplate shape)

const FALLBACK_SCENARIOS: ScenarioTemplate[] = [
  {
    id: 'builtin-injury',
    name: 'TRAINING INJURY',
    category: 'injury',
    triggerCondition: { type: 'random' },
    probability: 15,
    minDay: 1,
    maxDay: 0,
    repeatable: true,
    cooldownDays: 5,
    speaker: 'TRAINER',
    text: '{fighterName} tweaked their knee during sparring.',
    choices: [{
      label: 'Rest up',
      effects: [
        { type: 'morale', value: -10, target: 'random_fighter' },
        { type: 'health', value: -15, target: 'random_fighter' },
        { type: 'injury_days', value: 3, target: 'random_fighter' },
      ],
    }],
    tags: ['builtin'],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'builtin-drama',
    name: 'LOCKER ROOM BEEF',
    category: 'drama',
    triggerCondition: { type: 'random' },
    probability: 10,
    minDay: 1,
    maxDay: 0,
    repeatable: true,
    cooldownDays: 7,
    speaker: 'NEWS',
    text: '{fighterName} got into an argument with another fighter. Morale is down.',
    choices: [{
      label: 'Deal with it',
      effects: [{ type: 'morale', value: -15, target: 'random_fighter' }],
    }],
    tags: ['builtin'],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'builtin-media',
    name: 'MEDIA APPEARANCE',
    category: 'opportunity',
    triggerCondition: { type: 'random' },
    probability: 10,
    minDay: 3,
    maxDay: 0,
    repeatable: true,
    cooldownDays: 10,
    speaker: 'AGENT',
    text: 'A local TV show wants to feature {fighterName}. Fame boost incoming!',
    choices: [{
      label: 'Send them!',
      effects: [
        { type: 'morale', value: 10, target: 'random_fighter' },
        { type: 'fame', value: 8, target: 'random_fighter' },
      ],
    }],
    tags: ['builtin'],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'builtin-rival',
    name: 'RIVAL GYM TRASH TALK',
    category: 'rival',
    triggerCondition: { type: 'random' },
    probability: 8,
    minDay: 5,
    maxDay: 0,
    repeatable: true,
    cooldownDays: 14,
    speaker: 'NEWS',
    text: 'A rival gym called your operation a joke on social media.',
    choices: [{
      label: 'Ignore them',
      effects: [
        { type: 'morale', value: -5, target: 'player' },
        { type: 'reputation', value: -3, target: 'gym' },
      ],
    }],
    tags: ['builtin'],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'builtin-fan',
    name: 'FAN MEET & GREET',
    category: 'fan',
    triggerCondition: { type: 'random' },
    probability: 8,
    minDay: 7,
    maxDay: 0,
    repeatable: true,
    cooldownDays: 14,
    speaker: 'AGENT',
    text: '{fighterName} did a fan meet and greet. Fans loved it!',
    choices: [{
      label: 'Great exposure!',
      effects: [
        { type: 'morale', value: 15, target: 'random_fighter' },
        { type: 'fame', value: 5, target: 'random_fighter' },
      ],
    }],
    tags: ['builtin'],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'builtin-equipment',
    name: 'EQUIPMENT BREAKDOWN',
    category: 'news',
    triggerCondition: { type: 'random' },
    probability: 6,
    minDay: 7,
    maxDay: 0,
    repeatable: true,
    cooldownDays: 21,
    speaker: 'MAINTENANCE',
    text: 'Some gym equipment broke down. Repairs needed.',
    choices: [{
      label: 'Pay for repairs ($500)',
      effects: [{ type: 'money', value: -500, target: 'player' }],
    }],
    tags: ['builtin'],
    createdAt: 0,
    updatedAt: 0,
  },
  {
    id: 'builtin-sponsor-offer',
    name: 'SPONSORSHIP OFFER',
    category: 'sponsor',
    triggerCondition: { type: 'random' },
    probability: 8,
    minDay: 10,
    maxDay: 0,
    repeatable: true,
    cooldownDays: 14,
    speaker: 'AGENT',
    text: 'A brand wants to sponsor your gym!',
    choices: [{
      label: 'Accept the deal',
      effects: [
        { type: 'morale', value: 5, target: 'player' },
        { type: 'add_sponsor', value: 'random', target: 'player' },
      ],
    }],
    tags: ['builtin'],
    createdAt: 0,
    updatedAt: 0,
  },
];

// ── Hardcoded fallback commentary ────────────────────────

const FALLBACK_COMMENTARY: Record<CommentaryCategory, string[]> = {
  strike_hit: [
    '{attacker} lands a CRISP jab!',
    '{attacker} connects with a heavy right hand!',
    '{attacker} throws a spinning back fist — IT LANDS!',
    '{attacker} lights up {defender} with a combo!',
    '{attacker} snaps {defender}\'s head back with an uppercut!',
    '{attacker} lands a body shot that echoes through the arena!',
  ],
  strike_miss: [
    '{attacker} swings wild and misses!',
    '{defender} slips the punch beautifully!',
    '{attacker} throws leather but hits nothing but air!',
    '{defender} makes {attacker} look silly with the head movement!',
  ],
  grapple_success: [
    '{attacker} scores a HUGE takedown!',
    '{attacker} drags {defender} to the mat!',
    '{attacker} gets the clinch and trips {defender}!',
    '{attacker} shoots in — double leg! They\'re on the ground!',
  ],
  grapple_fail: [
    '{attacker} shoots for a takedown — STUFFED!',
    '{defender} sprawls and stays on their feet!',
    '{attacker} can\'t get the clinch, {defender} shrugs it off!',
  ],
  ko: [
    '{attacker} DROPS {defender}! IT\'S ALL OVER!',
    'TIMBER! {defender} goes down like a sack of potatoes!',
    '{attacker} puts {defender}\'s lights OUT! What a shot!',
    'OH! {defender} is STIFF! The ref waves it off!',
  ],
  submission: [
    '{attacker} sinks in the choke! {defender} taps!',
    '{attacker} locks up the armbar — {defender} has no choice but to tap!',
    'Triangle choke by {attacker}! {defender} is going to sleep!',
  ],
  taunt: [
    '{attacker} does a little dance. The crowd loves it.',
    '{attacker} points at the camera and winks.',
    '{attacker} flexes after landing that combo.',
    '{attacker} trash-talks {defender}. Bold strategy.',
  ],
};

// ── Public Getters ───────────────────────────────────────

/** Get all available scenarios (admin + fallback builtins) */
export function getScenarioPool(): ScenarioTemplate[] {
  const bundle = getAdminBundle();
  const adminScenarios = bundle.scenarios ?? [];
  // Admin scenarios are primary; builtins fill in if pool is small
  if (adminScenarios.length > 0) {
    // Merge: admin scenarios + any builtins not overridden by ID
    const adminIds = new Set(adminScenarios.map((s) => s.id));
    const extras = FALLBACK_SCENARIOS.filter((s) => !adminIds.has(s.id));
    return [...adminScenarios, ...extras];
  }
  return FALLBACK_SCENARIOS;
}

/** Get all available venues (admin venues + hardcoded venue names as basic templates) */
export function getVenuePool(): VenueTemplate[] {
  const bundle = getAdminBundle();
  const adminVenues = bundle.venues ?? [];

  // Build basic venue templates from hardcoded names as fallback
  const fallbackVenues: VenueTemplate[] = VENUE_NAMES.map((name, i) => ({
    id: `builtin-venue-${i}`,
    name,
    city: 'Unknown City',
    capacity: 200 + i * 150,
    prestige: Math.min(1 + Math.floor(i / 2), 10),
    basePurse: 1000 + i * 500,
    ticketRevenueSplit: 10 + i * 2,
    ppvAvailable: i >= 8,
    minReputation: i * 5,
    tags: ['builtin'],
    createdAt: 0,
    updatedAt: 0,
  }));

  if (adminVenues.length > 0) {
    const adminIds = new Set(adminVenues.map((v) => v.id));
    const extras = fallbackVenues.filter((v) => !adminIds.has(v.id));
    return [...adminVenues, ...extras];
  }
  return fallbackVenues;
}

/** Get all available sponsors (admin sponsors + hardcoded) */
export function getSponsorPool(): SponsorTemplate[] {
  const bundle = getAdminBundle();
  const adminSponsors = bundle.sponsors ?? [];

  const fallbackSponsors: SponsorTemplate[] = SPONSOR_NAMES.map((name, i) => ({
    id: `builtin-sponsor-${i}`,
    name,
    tier: (Math.min(1 + Math.floor(i / 4), 3) as 1 | 2 | 3),
    weeklyPaymentRange: [100 + i * 50, 300 + i * 100] as [number, number],
    fightBonusRange: [200 + i * 100, 500 + i * 200] as [number, number],
    durationWeeksRange: [8, 16] as [number, number],
    tags: ['builtin'],
    createdAt: 0,
    updatedAt: 0,
  }));

  if (adminSponsors.length > 0) {
    const adminIds = new Set(adminSponsors.map((s) => s.id));
    const extras = fallbackSponsors.filter((s) => !adminIds.has(s.id));
    return [...adminSponsors, ...extras];
  }
  return fallbackSponsors;
}

/** Get merged name pool (admin names + hardcoded names) */
export function getNamePool(): NamePool {
  const bundle = getAdminBundle();
  const pool = bundle.namePool ?? { firstNames: [], lastNames: [], nicknames: [] };

  return {
    firstNames: pool.firstNames.length > 0
      ? [...new Set([...pool.firstNames, ...FIRST_NAMES])]
      : [...FIRST_NAMES],
    lastNames: pool.lastNames.length > 0
      ? [...new Set([...pool.lastNames, ...LAST_NAMES])]
      : [...LAST_NAMES],
    nicknames: pool.nicknames.length > 0
      ? [...new Set([...pool.nicknames, ...NICKNAMES])]
      : [...NICKNAMES],
  };
}

/** Get commentary lines by category (admin + fallback) */
export function getCommentaryPool(): Record<CommentaryCategory, string[]> {
  const bundle = getAdminBundle();
  const adminCommentary = bundle.commentary ?? [];

  // Build result from fallback, then overlay admin lines
  const result = { ...FALLBACK_COMMENTARY };

  // Group admin commentary by category
  for (const cat of Object.keys(result) as CommentaryCategory[]) {
    const adminLines = adminCommentary
      .filter((c) => c.category === cat)
      .map((c) => c.text);
    if (adminLines.length > 0) {
      result[cat] = [...adminLines, ...result[cat]];
    }
  }

  return result;
}

/** Get dialog overrides keyed by action string */
export function getDialogOverrides(): Record<string, DialogTemplate> {
  const bundle = getAdminBundle();
  const dialogs = bundle.dialogs ?? [];
  const map: Record<string, DialogTemplate> = {};
  for (const d of dialogs) {
    if (d.action) map[d.action] = d;
  }
  return map;
}

/** Get game settings (admin overrides merged with defaults) */
export function getGameSettings(): GameSettings {
  const bundle = getAdminBundle();
  const defaults = createDefaultGameSettings();
  const settings = bundle.gameSettings;
  if (!settings) return defaults;
  // Merge: use admin value if present, else default
  return { ...defaults, ...settings };
}

/** Get fighter tier definitions (admin or defaults) */
export function getFighterTiers(): FighterTierDefinition[] {
  const bundle = getAdminBundle();
  const tiers = bundle.fighterTiers;
  if (tiers && tiers.length > 0) return tiers;
  return createDefaultFighterTiers();
}

/** Get gym level definitions (admin or defaults) */
export function getGymLevels(): GymLevelDefinition[] {
  const bundle = getAdminBundle();
  const levels = bundle.gymLevels;
  if (levels && levels.length > 0) return levels;
  return createDefaultGymLevels();
}

/** Check if any admin content has been created */
export function isAdminContentActive(): boolean {
  const bundle = getAdminBundle();
  return (
    (bundle.scenarios?.length ?? 0) > 0 ||
    (bundle.venues?.length ?? 0) > 0 ||
    (bundle.sponsors?.length ?? 0) > 0 ||
    (bundle.dialogs?.length ?? 0) > 0 ||
    (bundle.commentary?.length ?? 0) > 0 ||
    (bundle.namePool?.firstNames?.length ?? 0) > 0 ||
    (bundle.namePool?.lastNames?.length ?? 0) > 0 ||
    (bundle.namePool?.nicknames?.length ?? 0) > 0 ||
    (bundle.assets?.length ?? 0) > 0
  );
}

/** Get content counts for the dashboard */
export function getContentStats(): Record<string, number> {
  const bundle = getAdminBundle();
  return {
    scenarios: bundle.scenarios?.length ?? 0,
    venues: bundle.venues?.length ?? 0,
    sponsors: bundle.sponsors?.length ?? 0,
    dialogs: bundle.dialogs?.length ?? 0,
    commentary: bundle.commentary?.length ?? 0,
    firstNames: bundle.namePool?.firstNames?.length ?? 0,
    lastNames: bundle.namePool?.lastNames?.length ?? 0,
    nicknames: bundle.namePool?.nicknames?.length ?? 0,
    assets: bundle.assets?.length ?? 0,
    fighterTiers: bundle.fighterTiers?.length ?? 0,
    gymLevels: bundle.gymLevels?.length ?? 0,
  };
}
