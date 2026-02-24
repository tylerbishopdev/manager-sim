/**
 * Asset & Text Guidance for Admin Content Creation
 *
 * Defines recommended image specifications per category and
 * text length/style guidelines per content type.
 * Used by editors to display guidance banners and warnings.
 */

// ── Image Specifications ─────────────────────────────────

export interface ImageSpec {
  category: string;
  label: string;
  width: number;
  height: number;
  aspectRatio: string;
  formats: string[];
  maxFileSizeKB: number;
  usage: string;
  tips: string;
}

export const IMAGE_SPECS: ImageSpec[] = [
  {
    category: 'portrait',
    label: 'Portrait',
    width: 400,
    height: 400,
    aspectRatio: '1:1 square',
    formats: ['SVG', 'PNG'],
    maxFileSizeKB: 500,
    usage: 'Manager character select screen',
    tips: 'Use a clean background. Face should fill 70% of the frame.',
  },
  {
    category: 'sprite',
    label: 'Character Sprite',
    width: 400,
    height: 600,
    aspectRatio: 'Variable (2:3 recommended)',
    formats: ['SVG', 'PNG'],
    maxFileSizeKB: 500,
    usage: 'In-game character on office/hub scene',
    tips: 'Transparent background required. Character should be standing.',
  },
  {
    category: 'icon',
    label: 'App Icon',
    width: 64,
    height: 64,
    aspectRatio: '1:1 square',
    formats: ['SVG', 'PNG'],
    maxFileSizeKB: 50,
    usage: 'Phone app grid icons',
    tips: 'Keep design simple — it will be displayed very small.',
  },
  {
    category: 'background',
    label: 'Background',
    width: 1920,
    height: 1080,
    aspectRatio: '16:9',
    formats: ['PNG', 'JPG'],
    maxFileSizeKB: 2048,
    usage: 'Hub/office scene backgrounds',
    tips: 'Pixel art style works well. Keep lower third clear for UI elements.',
  },
  {
    category: 'venue',
    label: 'Venue Image',
    width: 800,
    height: 400,
    aspectRatio: '2:1 landscape',
    formats: ['PNG', 'JPG'],
    maxFileSizeKB: 1024,
    usage: 'Venue detail cards and fight screens',
    tips: 'Show the venue exterior or ring/cage area. Wide shots work best.',
  },
  {
    category: 'sponsor_logo',
    label: 'Sponsor Logo',
    width: 200,
    height: 100,
    aspectRatio: '2:1 landscape',
    formats: ['SVG', 'PNG'],
    maxFileSizeKB: 100,
    usage: 'Sponsor badges and contract panels',
    tips: 'Transparent background. Logo should be horizontally centered.',
  },
  {
    category: 'misc',
    label: 'Miscellaneous',
    width: 0,
    height: 0,
    aspectRatio: 'Any',
    formats: ['PNG', 'JPG', 'SVG', 'GIF'],
    maxFileSizeKB: 2048,
    usage: 'General purpose assets',
    tips: 'No specific requirements. Use whatever fits your needs.',
  },
];

export function getImageSpec(category: string): ImageSpec | undefined {
  return IMAGE_SPECS.find((s) => s.category === category);
}

export function checkImageDimensions(
  category: string,
  actualWidth: number,
  actualHeight: number,
): { ok: boolean; warning: string } {
  const spec = getImageSpec(category);
  if (!spec || spec.width === 0) return { ok: true, warning: '' };

  const widthOk = Math.abs(actualWidth - spec.width) <= spec.width * 0.25;
  const heightOk = Math.abs(actualHeight - spec.height) <= spec.height * 0.25;

  if (widthOk && heightOk) return { ok: true, warning: '' };

  return {
    ok: false,
    warning: `Recommended: ${spec.width}×${spec.height}px. Uploaded: ${actualWidth}×${actualHeight}px.`,
  };
}

export function checkFileSize(category: string, fileSizeBytes: number): { ok: boolean; warning: string } {
  const spec = getImageSpec(category);
  if (!spec) return { ok: true, warning: '' };

  const fileSizeKB = Math.round(fileSizeBytes / 1024);
  if (fileSizeKB <= spec.maxFileSizeKB) return { ok: true, warning: '' };

  return {
    ok: false,
    warning: `File is ${fileSizeKB}KB. Recommended max: ${spec.maxFileSizeKB}KB.`,
  };
}

// ── Text Specifications ──────────────────────────────────

export interface TextSpec {
  field: string;
  context: string;
  maxLength: number;
  style: string;
  placeholders: string[];
  example: string;
}

export const TEXT_SPECS: TextSpec[] = [
  {
    field: 'scenario_name',
    context: 'Scenario / Event Name',
    maxLength: 60,
    style: 'Title case, short and punchy',
    placeholders: [],
    example: 'TRAINING INJURY',
  },
  {
    field: 'scenario_text',
    context: 'Scenario Dialog Body',
    maxLength: 300,
    style: 'Narrative prose, present tense',
    placeholders: ['{playerName}', '{fighterName}'],
    example: '{fighterName} tweaked their knee during sparring. They need a few days off.',
  },
  {
    field: 'choice_label',
    context: 'Choice Button Label',
    maxLength: 40,
    style: 'Action phrase, imperative mood',
    placeholders: [],
    example: 'Rest up for 3 days',
  },
  {
    field: 'commentary',
    context: 'Fight Commentary Line',
    maxLength: 120,
    style: 'Present tense, excited announcer voice',
    placeholders: ['{attacker}', '{defender}'],
    example: '{attacker} lands a CRISP jab on {defender}!',
  },
  {
    field: 'dialog_text',
    context: 'Dialog Text Variant',
    maxLength: 200,
    style: 'Conversational, in-character',
    placeholders: ['{playerName}'],
    example: 'Hey {playerName}, we got a new sponsorship offer on the table!',
  },
  {
    field: 'venue_name',
    context: 'Venue / Sponsor Name',
    maxLength: 50,
    style: 'Proper noun / brand name',
    placeholders: [],
    example: 'The Underground Arena',
  },
  {
    field: 'venue_city',
    context: 'Venue City',
    maxLength: 40,
    style: 'City name',
    placeholders: [],
    example: 'Las Vegas, NV',
  },
  {
    field: 'speaker',
    context: 'Dialog Speaker Name',
    maxLength: 30,
    style: 'Character name or role title',
    placeholders: [],
    example: 'TRAINER',
  },
  {
    field: 'tier_name',
    context: 'Fighter Tier Name',
    maxLength: 30,
    style: 'Lowercase identifier',
    placeholders: [],
    example: 'regional',
  },
  {
    field: 'gym_name',
    context: 'Gym Level Name',
    maxLength: 40,
    style: 'Descriptive title',
    placeholders: [],
    example: 'Strip Mall Gym',
  },
  {
    field: 'gym_description',
    context: 'Gym Level Description',
    maxLength: 120,
    style: 'Brief flavor text',
    placeholders: [],
    example: 'A dingy space above a laundromat. Better than nothing.',
  },
];

export function getTextSpec(field: string): TextSpec | undefined {
  return TEXT_SPECS.find((s) => s.field === field);
}

// ── Placeholder Helpers ──────────────────────────────────

/** Available placeholders by content context */
export const PLACEHOLDERS: Record<string, { token: string; desc: string }[]> = {
  scenario: [
    { token: '{fighterName}', desc: 'Random fighter from roster' },
    { token: '{playerName}', desc: 'Player/manager name' },
  ],
  commentary: [
    { token: '{attacker}', desc: 'Attacking fighter name' },
    { token: '{defender}', desc: 'Defending fighter name' },
  ],
  dialog: [
    { token: '{playerName}', desc: 'Player/manager name' },
  ],
};

/** Effect types available for scenario choices */
export const EFFECT_TYPES = [
  { value: 'morale', label: 'Morale', desc: 'Affects fighter morale (-100 to +100)' },
  { value: 'health', label: 'Health', desc: 'Affects fighter health (-100 to +100)' },
  { value: 'fame', label: 'Fame', desc: 'Affects fighter fame (-100 to +100)' },
  { value: 'money', label: 'Money', desc: 'Adds/removes money from gym balance' },
  { value: 'reputation', label: 'Reputation', desc: 'Affects gym reputation (-100 to +100)' },
  { value: 'injury_days', label: 'Injury Days', desc: 'Sets injury recovery days' },
  { value: 'add_sponsor', label: 'Add Sponsor', desc: 'Grants a random sponsor deal' },
] as const;

/** Effect target options */
export const EFFECT_TARGETS = [
  { value: 'random_fighter', label: 'Random Fighter' },
  { value: 'all_fighters', label: 'All Fighters' },
  { value: 'player', label: 'Player / Gym' },
  { value: 'gym', label: 'Gym' },
] as const;

/** Scenario category options */
export const SCENARIO_CATEGORIES = [
  { value: 'injury', label: 'Injury', desc: 'Fighter injury events' },
  { value: 'drama', label: 'Drama', desc: 'Locker room / interpersonal conflict' },
  { value: 'opportunity', label: 'Opportunity', desc: 'Positive events and chances' },
  { value: 'rival', label: 'Rival', desc: 'Rival gym interactions' },
  { value: 'fan', label: 'Fan', desc: 'Fan interactions and PR' },
  { value: 'sponsor', label: 'Sponsor', desc: 'Sponsorship-related events' },
  { value: 'news', label: 'News', desc: 'General news and happenings' },
  { value: 'training', label: 'Training', desc: 'Training camp and session events' },
  { value: 'media', label: 'Media', desc: 'Press conferences and media events' },
  { value: 'custom', label: 'Custom', desc: 'Custom / miscellaneous events' },
] as const;

/** Commentary category labels */
export const COMMENTARY_CATEGORIES = [
  { value: 'strike_hit', label: 'Strike Hit', desc: 'Successful striking attacks' },
  { value: 'strike_miss', label: 'Strike Miss', desc: 'Missed or dodged strikes' },
  { value: 'grapple_success', label: 'Grapple Success', desc: 'Successful takedowns/clinch' },
  { value: 'grapple_fail', label: 'Grapple Fail', desc: 'Stuffed takedowns/escaped clinch' },
  { value: 'ko', label: 'Knockout', desc: 'Knockout finishes' },
  { value: 'submission', label: 'Submission', desc: 'Submission finishes' },
  { value: 'taunt', label: 'Taunt', desc: 'Showboating and trash talk' },
] as const;
