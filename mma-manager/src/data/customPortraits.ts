/**
 * Available portraits for the Create-a-Player screen.
 * Each entry is a complete character look the player can pick.
 * To add more: drop a PNG into public/portraits/custom/ and add an entry here.
 */

export interface CustomPortrait {
  id: string;
  src: string;
  label: string;
}

export const customPortraits: CustomPortrait[] = [
  // ── Base ──
  { id: 'base',     src: '/portraits/custom-base.png', label: 'DEFAULT' },

  // ── Hair variants ──
  { id: 'bald',     src: '/portraits/custom/bald.png',    label: 'BALD' },
  { id: 'bald2',    src: '/portraits/custom/bald2.png',   label: 'CLEAN SHAVE' },
  { id: 'mohawk',   src: '/portraits/custom/mohawk.png',  label: 'MOHAWK' },
  { id: 'manbun',   src: '/portraits/custom/manbun.png',  label: 'MAN BUN' },
  { id: 'dreads',   src: '/portraits/custom/dreads.png',  label: 'LONG HAIR' },
  { id: 'gray',     src: '/portraits/custom/gray.png',    label: 'GRAY VET' },
  { id: 'baby',     src: '/portraits/custom/baby.png',    label: 'BABY BRIAN' },

  // ── Facial hair ──
  { id: 'goatee',   src: '/portraits/custom/goatee.png',    label: 'GOATEE' },
  { id: 'mustache', src: '/portraits/custom/mustache.png',  label: 'STACHE' },
  { id: 'beard',    src: '/portraits/custom/beard.png',     label: 'FULL BEARD' },

  // ── Headwear ──
  { id: 'tiara',    src: '/portraits/custom/tiara.png',   label: 'TIARA' },
  { id: 'helmet',   src: '/portraits/custom/helmet.png',  label: 'HELMET' },

  // ── Outfits ──
  { id: 'suit',     src: '/portraits/custom/suit.png',      label: 'SUIT' },
  { id: 'goth',     src: '/portraits/custom/goth.png',      label: 'GOTH' },
  { id: 'flashy',   src: '/portraits/custom/flashy.png',    label: 'FLASHY' },
  { id: 'patriot',  src: '/portraits/custom/patriot.png',   label: 'PATRIOT' },
  { id: 'dress',    src: '/portraits/custom/dress.png',     label: 'DRESS' },
  { id: 'colonial', src: '/portraits/custom/colonial.png',  label: 'COLONIAL' },
  { id: 'western',  src: '/portraits/custom/western.png',   label: 'WESTERN' },
];
