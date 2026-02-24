/**
 * Per-entity validation rules for the Admin Game Builder.
 * Each validator returns { valid, errors } for the given entity.
 */

import type {
  ScenarioTemplate,
  VenueTemplate,
  SponsorTemplate,
  DialogTemplate,
  CommentaryTemplate,
  FighterTierDefinition,
  GymLevelDefinition,
} from '../../types/admin';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

// ── Scenario ──────────────────────────────────────────────

export function validateScenario(s: ScenarioTemplate): ValidationResult {
  const errors: string[] = [];

  if (!s.name || s.name.trim().length === 0) errors.push('Name is required');
  if (s.name && s.name.length > 60) errors.push('Name must be 60 characters or less');
  if (!s.text || s.text.trim().length === 0) errors.push('Dialog text is required');
  if (s.text && s.text.length > 300) errors.push('Dialog text should be 300 characters or less');
  if (!s.choices || s.choices.length === 0) errors.push('At least one choice is required');

  if (s.choices) {
    s.choices.forEach((c, i) => {
      if (!c.label || c.label.trim().length === 0) errors.push(`Choice ${i + 1}: label is required`);
      if (c.label && c.label.length > 40) errors.push(`Choice ${i + 1}: label must be 40 chars or less`);
      if (!c.effects || c.effects.length === 0) errors.push(`Choice ${i + 1}: at least one effect is required`);
    });
  }

  if (s.probability !== undefined && (s.probability < 0 || s.probability > 100)) {
    errors.push('Probability must be between 0 and 100');
  }

  if (s.minDay !== undefined && s.minDay < 0) errors.push('Min day cannot be negative');
  if (s.maxDay !== undefined && s.maxDay < 0) errors.push('Max day cannot be negative');
  if (s.minDay && s.maxDay && s.maxDay > 0 && s.minDay > s.maxDay) {
    errors.push('Min day cannot be greater than max day');
  }

  if (!s.speaker || s.speaker.trim().length === 0) errors.push('Speaker is required');
  if (s.speaker && s.speaker.length > 30) errors.push('Speaker must be 30 chars or less');

  return { valid: errors.length === 0, errors };
}

// ── Venue ────────────────────────────────────────────────

export function validateVenue(v: VenueTemplate): ValidationResult {
  const errors: string[] = [];

  if (!v.name || v.name.trim().length === 0) errors.push('Name is required');
  if (v.name && v.name.length > 50) errors.push('Name must be 50 characters or less');
  if (!v.city || v.city.trim().length === 0) errors.push('City is required');
  if (v.city && v.city.length > 40) errors.push('City must be 40 characters or less');
  if (v.capacity === undefined || v.capacity <= 0) errors.push('Capacity must be greater than 0');
  if (v.prestige === undefined || v.prestige < 1 || v.prestige > 10) errors.push('Prestige must be 1-10');
  if (v.basePurse === undefined || v.basePurse < 0) errors.push('Base purse cannot be negative');
  if (v.ticketRevenueSplit === undefined || v.ticketRevenueSplit < 0 || v.ticketRevenueSplit > 100) {
    errors.push('Ticket revenue split must be 0-100%');
  }
  if (v.minReputation !== undefined && (v.minReputation < 0 || v.minReputation > 100)) {
    errors.push('Min reputation must be 0-100');
  }

  return { valid: errors.length === 0, errors };
}

// ── Sponsor ──────────────────────────────────────────────

export function validateSponsor(s: SponsorTemplate): ValidationResult {
  const errors: string[] = [];

  if (!s.name || s.name.trim().length === 0) errors.push('Name is required');
  if (s.name && s.name.length > 50) errors.push('Name must be 50 characters or less');
  if (s.tier === undefined || s.tier < 1 || s.tier > 3) errors.push('Tier must be 1, 2, or 3');

  if (s.weeklyPaymentRange) {
    if (s.weeklyPaymentRange[0] > s.weeklyPaymentRange[1]) {
      errors.push('Weekly payment min cannot exceed max');
    }
    if (s.weeklyPaymentRange[0] < 0) errors.push('Weekly payment min cannot be negative');
  }

  if (s.fightBonusRange) {
    if (s.fightBonusRange[0] > s.fightBonusRange[1]) {
      errors.push('Fight bonus min cannot exceed max');
    }
    if (s.fightBonusRange[0] < 0) errors.push('Fight bonus min cannot be negative');
  }

  if (s.durationWeeksRange) {
    if (s.durationWeeksRange[0] > s.durationWeeksRange[1]) {
      errors.push('Duration min cannot exceed max');
    }
    if (s.durationWeeksRange[0] < 1) errors.push('Duration must be at least 1 week');
  }

  return { valid: errors.length === 0, errors };
}

// ── Dialog ───────────────────────────────────────────────

export function validateDialog(d: DialogTemplate): ValidationResult {
  const errors: string[] = [];

  if (!d.action || d.action.trim().length === 0) errors.push('Action key is required');
  if (!d.speaker || d.speaker.trim().length === 0) errors.push('Speaker is required');
  if (d.speaker && d.speaker.length > 30) errors.push('Speaker must be 30 chars or less');
  if (!d.textVariants || d.textVariants.length === 0) errors.push('At least one text variant is required');

  if (d.textVariants) {
    d.textVariants.forEach((t, i) => {
      if (!t || t.trim().length === 0) errors.push(`Text variant ${i + 1}: cannot be empty`);
      if (t && t.length > 200) errors.push(`Text variant ${i + 1}: must be 200 chars or less`);
    });
  }

  return { valid: errors.length === 0, errors };
}

// ── Commentary ───────────────────────────────────────────

// Imported via assetGuidance to avoid duplicate category lists
import { COMMENTARY_CATEGORIES as COMMENTARY_CAT_OPTS } from './assetGuidance';
const COMMENTARY_CATEGORIES = COMMENTARY_CAT_OPTS.map((c) => c.value);

export function validateCommentary(c: CommentaryTemplate): ValidationResult {
  const errors: string[] = [];

  if (!c.text || c.text.trim().length === 0) errors.push('Commentary text is required');
  if (c.text && c.text.length > 120) errors.push('Commentary text should be 120 chars or less');

  if (!c.category) {
    errors.push('Category is required');
  } else if (!COMMENTARY_CATEGORIES.includes(c.category as any)) {
    errors.push(`Invalid category. Must be one of: ${COMMENTARY_CATEGORIES.join(', ')}`);
  }

  // Check for placeholders — at least one should be present
  if (c.text && !c.text.includes('{attacker}') && !c.text.includes('{defender}')) {
    errors.push('Text should contain {attacker} or {defender} placeholder');
  }

  return { valid: errors.length === 0, errors };
}

// ── Fighter Tier ─────────────────────────────────────────

export function validateFighterTier(t: FighterTierDefinition): ValidationResult {
  const errors: string[] = [];

  if (!t.name || t.name.trim().length === 0) errors.push('Name is required');
  if (t.minOverall === undefined || t.maxOverall === undefined) {
    errors.push('Stat range (min/max overall) is required');
  } else {
    if (t.minOverall < 1 || t.minOverall > 10) errors.push('Min overall must be 1-10');
    if (t.maxOverall < 1 || t.maxOverall > 10) errors.push('Max overall must be 1-10');
    if (t.minOverall > t.maxOverall) errors.push('Min overall cannot exceed max overall');
  }
  if (t.potentialCap !== undefined && (t.potentialCap < 1 || t.potentialCap > 10)) {
    errors.push('Potential cap must be 1-10');
  }

  if (t.scoutCostRange) {
    if (t.scoutCostRange[0] > t.scoutCostRange[1]) errors.push('Scout cost min cannot exceed max');
    if (t.scoutCostRange[0] < 0) errors.push('Scout cost cannot be negative');
  }

  if (t.salaryRange) {
    if (t.salaryRange[0] > t.salaryRange[1]) errors.push('Salary min cannot exceed max');
    if (t.salaryRange[0] < 0) errors.push('Salary cannot be negative');
  }

  return { valid: errors.length === 0, errors };
}

// ── Gym Level ────────────────────────────────────────────

export function validateGymLevel(g: GymLevelDefinition): ValidationResult {
  const errors: string[] = [];

  if (!g.name || g.name.trim().length === 0) errors.push('Name is required');
  if (g.level === undefined || g.level < 1) errors.push('Level must be 1 or greater');
  if (g.capacity === undefined || g.capacity < 1) errors.push('Capacity must be at least 1');
  if (g.weeklyRent === undefined || g.weeklyRent < 0) errors.push('Weekly rent cannot be negative');
  if (g.upgradeCost === undefined || g.upgradeCost < 0) errors.push('Upgrade cost cannot be negative');
  if (g.trainingBonus !== undefined && g.trainingBonus < 0) errors.push('Training bonus cannot be negative');

  return { valid: errors.length === 0, errors };
}

// ── Aggregate validation ──────────────────────────────────

export interface BundleValidation {
  totalErrors: number;
  scenarioErrors: number;
  venueErrors: number;
  sponsorErrors: number;
  dialogErrors: number;
  commentaryErrors: number;
  fighterTierErrors: number;
  gymLevelErrors: number;
}

export function validateBundle(bundle: {
  scenarios?: ScenarioTemplate[];
  venues?: VenueTemplate[];
  sponsors?: SponsorTemplate[];
  dialogs?: DialogTemplate[];
  commentary?: CommentaryTemplate[];
  fighterTiers?: FighterTierDefinition[];
  gymLevels?: GymLevelDefinition[];
}): BundleValidation {
  const scenarioErrors = (bundle.scenarios ?? []).filter((s) => !validateScenario(s).valid).length;
  const venueErrors = (bundle.venues ?? []).filter((v) => !validateVenue(v).valid).length;
  const sponsorErrors = (bundle.sponsors ?? []).filter((s) => !validateSponsor(s).valid).length;
  const dialogErrors = (bundle.dialogs ?? []).filter((d) => !validateDialog(d).valid).length;
  const commentaryErrors = (bundle.commentary ?? []).filter((c) => !validateCommentary(c).valid).length;
  const fighterTierErrors = (bundle.fighterTiers ?? []).filter((t) => !validateFighterTier(t).valid).length;
  const gymLevelErrors = (bundle.gymLevels ?? []).filter((g) => !validateGymLevel(g).valid).length;

  const totalErrors = scenarioErrors + venueErrors + sponsorErrors + dialogErrors +
    commentaryErrors + fighterTierErrors + gymLevelErrors;

  return {
    totalErrors,
    scenarioErrors,
    venueErrors,
    sponsorErrors,
    dialogErrors,
    commentaryErrors,
    fighterTierErrors,
    gymLevelErrors,
  };
}
