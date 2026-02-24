import { create } from 'zustand';
import type {
  AdminContentBundle,
  ScenarioTemplate,
  VenueTemplate,
  SponsorTemplate,
  DialogTemplate,
  AssetEntry,
  CommentaryTemplate,
  GameSettings,
  FighterTierDefinition,
  GymLevelDefinition,
} from '../types/admin';
import {
  EMPTY_ADMIN_BUNDLE,
  createDefaultGameSettings,
  createDefaultFighterTiers,
  createDefaultGymLevels,
} from '../types/admin';

const STORAGE_KEY = 'mma-admin-content';
const MAX_UNDO = 20;

// ── Migration ────────────────────────────────────────────

function migrateBundle(raw: any): AdminContentBundle {
  const v = raw.version ?? 1;
  let bundle = { ...raw };

  if (v < 2) {
    bundle.commentary = bundle.commentary ?? [];
    bundle.gameSettings = bundle.gameSettings ?? createDefaultGameSettings();
    bundle.fighterTiers = bundle.fighterTiers ?? createDefaultFighterTiers();
    bundle.gymLevels = bundle.gymLevels ?? createDefaultGymLevels();
    bundle.version = 2;
  }

  // Ensure all expected arrays exist (defensive)
  bundle.scenarios = bundle.scenarios ?? [];
  bundle.venues = bundle.venues ?? [];
  bundle.sponsors = bundle.sponsors ?? [];
  bundle.dialogs = bundle.dialogs ?? [];
  bundle.namePool = bundle.namePool ?? { firstNames: [], lastNames: [], nicknames: [] };
  bundle.assets = bundle.assets ?? [];

  // Future migrations: if (v < 3) { ... }

  return bundle as AdminContentBundle;
}

// ── Storage ──────────────────────────────────────────────

function loadFromStorage(): AdminContentBundle {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return migrateBundle(parsed);
    }
  } catch { /* ignore corrupt data */ }
  return { ...EMPTY_ADMIN_BUNDLE };
}

function saveToStorage(bundle: AdminContentBundle) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bundle));
  } catch { /* storage full or blocked */ }
}

// ── Admin Store ─────────────────────────────────────────────

export type AdminSection =
  | 'dashboard'
  | 'scenarios'
  | 'venues'
  | 'sponsors'
  | 'dialogs'
  | 'names'
  | 'assets'
  | 'commentary'
  | 'settings'
  | 'fighter_tiers'
  | 'gym_levels';

interface AdminStore {
  bundle: AdminContentBundle;
  activeSection: AdminSection;
  editingId: string | null;
  undoStack: AdminContentBundle[];
  lastSaved: number;

  setSection: (section: AdminSection) => void;
  setEditingId: (id: string | null) => void;

  // Undo
  pushUndo: () => void;
  undo: () => void;
  canUndo: () => boolean;

  // Scenarios
  addScenario: (s: ScenarioTemplate) => void;
  updateScenario: (id: string, updates: Partial<ScenarioTemplate>) => void;
  removeScenario: (id: string) => void;

  // Venues
  addVenue: (v: VenueTemplate) => void;
  updateVenue: (id: string, updates: Partial<VenueTemplate>) => void;
  removeVenue: (id: string) => void;

  // Sponsors
  addSponsor: (s: SponsorTemplate) => void;
  updateSponsor: (id: string, updates: Partial<SponsorTemplate>) => void;
  removeSponsor: (id: string) => void;

  // Dialogs
  addDialog: (d: DialogTemplate) => void;
  updateDialog: (id: string, updates: Partial<DialogTemplate>) => void;
  removeDialog: (id: string) => void;

  // Commentary
  addCommentary: (c: CommentaryTemplate) => void;
  updateCommentary: (id: string, updates: Partial<CommentaryTemplate>) => void;
  removeCommentary: (id: string) => void;

  // Game Settings
  updateGameSettings: (updates: Partial<GameSettings>) => void;
  resetGameSettings: () => void;

  // Fighter Tiers
  addFighterTier: (t: FighterTierDefinition) => void;
  updateFighterTier: (id: string, updates: Partial<FighterTierDefinition>) => void;
  removeFighterTier: (id: string) => void;
  reorderFighterTiers: (tiers: FighterTierDefinition[]) => void;

  // Gym Levels
  addGymLevel: (g: GymLevelDefinition) => void;
  updateGymLevel: (id: string, updates: Partial<GymLevelDefinition>) => void;
  removeGymLevel: (id: string) => void;
  reorderGymLevels: (levels: GymLevelDefinition[]) => void;

  // Name pool
  addNames: (type: 'firstNames' | 'lastNames' | 'nicknames', names: string[]) => void;
  removeName: (type: 'firstNames' | 'lastNames' | 'nicknames', name: string) => void;

  // Assets
  addAsset: (a: AssetEntry) => void;
  removeAsset: (id: string) => void;
  updateAssetCategory: (id: string, category: AssetEntry['category']) => void;

  // Import/Export
  exportBundle: () => string;
  importBundle: (json: string) => boolean;
  resetBundle: () => void;

  // Storage info
  getStorageUsage: () => { used: number; limit: number; percentage: number };
}

// Helper to commit a bundle change (saves + updates state + records timestamp)
function commit(set: Function, _get: Function, updated: AdminContentBundle) {
  saveToStorage(updated);
  set({ bundle: updated, lastSaved: Date.now() });
}

export const useAdminStore = create<AdminStore>((set, get) => ({
  bundle: loadFromStorage(),
  activeSection: 'dashboard',
  editingId: null,
  undoStack: [],
  lastSaved: Date.now(),

  setSection: (section) => set({ activeSection: section, editingId: null }),
  setEditingId: (id) => set({ editingId: id }),

  // ── Undo ──

  pushUndo: () => {
    const stack = [...get().undoStack, structuredClone(get().bundle)];
    if (stack.length > MAX_UNDO) stack.shift();
    set({ undoStack: stack });
  },

  undo: () => {
    const stack = [...get().undoStack];
    if (stack.length === 0) return;
    const prev = stack.pop()!;
    saveToStorage(prev);
    set({ bundle: prev, undoStack: stack, lastSaved: Date.now() });
  },

  canUndo: () => get().undoStack.length > 0,

  // ── Scenarios ──

  addScenario: (s) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, scenarios: [...b.scenarios, s] };
    commit(set, get, updated);
    set({ editingId: s.id });
  },

  updateScenario: (id, updates) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = {
      ...b,
      scenarios: b.scenarios.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
      ),
    };
    commit(set, get, updated);
  },

  removeScenario: (id) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, scenarios: b.scenarios.filter((s) => s.id !== id) };
    commit(set, get, updated);
    set({ editingId: null });
  },

  // ── Venues ──

  addVenue: (v) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, venues: [...b.venues, v] };
    commit(set, get, updated);
    set({ editingId: v.id });
  },

  updateVenue: (id, updates) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = {
      ...b,
      venues: b.venues.map((v) =>
        v.id === id ? { ...v, ...updates, updatedAt: Date.now() } : v
      ),
    };
    commit(set, get, updated);
  },

  removeVenue: (id) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, venues: b.venues.filter((v) => v.id !== id) };
    commit(set, get, updated);
    set({ editingId: null });
  },

  // ── Sponsors ──

  addSponsor: (s) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, sponsors: [...b.sponsors, s] };
    commit(set, get, updated);
    set({ editingId: s.id });
  },

  updateSponsor: (id, updates) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = {
      ...b,
      sponsors: b.sponsors.map((s) =>
        s.id === id ? { ...s, ...updates, updatedAt: Date.now() } : s
      ),
    };
    commit(set, get, updated);
  },

  removeSponsor: (id) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, sponsors: b.sponsors.filter((s) => s.id !== id) };
    commit(set, get, updated);
    set({ editingId: null });
  },

  // ── Dialogs ──

  addDialog: (d) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, dialogs: [...b.dialogs, d] };
    commit(set, get, updated);
    set({ editingId: d.id });
  },

  updateDialog: (id, updates) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = {
      ...b,
      dialogs: b.dialogs.map((d) =>
        d.id === id ? { ...d, ...updates, updatedAt: Date.now() } : d
      ),
    };
    commit(set, get, updated);
  },

  removeDialog: (id) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, dialogs: b.dialogs.filter((d) => d.id !== id) };
    commit(set, get, updated);
    set({ editingId: null });
  },

  // ── Commentary ──

  addCommentary: (c) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, commentary: [...b.commentary, c] };
    commit(set, get, updated);
    set({ editingId: c.id });
  },

  updateCommentary: (id, updates) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = {
      ...b,
      commentary: b.commentary.map((c) =>
        c.id === id ? { ...c, ...updates, updatedAt: Date.now() } : c
      ),
    };
    commit(set, get, updated);
  },

  removeCommentary: (id) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, commentary: b.commentary.filter((c) => c.id !== id) };
    commit(set, get, updated);
    set({ editingId: null });
  },

  // ── Game Settings ──

  updateGameSettings: (updates) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, gameSettings: { ...b.gameSettings, ...updates } };
    commit(set, get, updated);
  },

  resetGameSettings: () => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, gameSettings: createDefaultGameSettings() };
    commit(set, get, updated);
  },

  // ── Fighter Tiers ──

  addFighterTier: (t) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, fighterTiers: [...b.fighterTiers, t] };
    commit(set, get, updated);
    set({ editingId: t.id });
  },

  updateFighterTier: (id, updates) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = {
      ...b,
      fighterTiers: b.fighterTiers.map((t) =>
        t.id === id ? { ...t, ...updates } : t
      ),
    };
    commit(set, get, updated);
  },

  removeFighterTier: (id) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, fighterTiers: b.fighterTiers.filter((t) => t.id !== id) };
    commit(set, get, updated);
    set({ editingId: null });
  },

  reorderFighterTiers: (tiers) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, fighterTiers: tiers };
    commit(set, get, updated);
  },

  // ── Gym Levels ──

  addGymLevel: (g) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, gymLevels: [...b.gymLevels, g] };
    commit(set, get, updated);
    set({ editingId: g.id });
  },

  updateGymLevel: (id, updates) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = {
      ...b,
      gymLevels: b.gymLevels.map((g) =>
        g.id === id ? { ...g, ...updates } : g
      ),
    };
    commit(set, get, updated);
  },

  removeGymLevel: (id) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, gymLevels: b.gymLevels.filter((g) => g.id !== id) };
    commit(set, get, updated);
    set({ editingId: null });
  },

  reorderGymLevels: (levels) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, gymLevels: levels };
    commit(set, get, updated);
  },

  // ── Names ──

  addNames: (type, names) => {
    get().pushUndo();
    const b = get().bundle;
    const pool = { ...b.namePool };
    const existing = new Set(pool[type]);
    for (const n of names) existing.add(n.trim());
    pool[type] = Array.from(existing).filter(Boolean);
    const updated = { ...b, namePool: pool };
    commit(set, get, updated);
  },

  removeName: (type, name) => {
    get().pushUndo();
    const b = get().bundle;
    const pool = { ...b.namePool };
    pool[type] = pool[type].filter((n) => n !== name);
    const updated = { ...b, namePool: pool };
    commit(set, get, updated);
  },

  // ── Assets ──

  addAsset: (a) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, assets: [...b.assets, a] };
    commit(set, get, updated);
  },

  removeAsset: (id) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = { ...b, assets: b.assets.filter((a) => a.id !== id) };
    commit(set, get, updated);
  },

  updateAssetCategory: (id, category) => {
    get().pushUndo();
    const b = get().bundle;
    const updated = {
      ...b,
      assets: b.assets.map((a) => a.id === id ? { ...a, category } : a),
    };
    commit(set, get, updated);
  },

  // ── Import/Export ──

  exportBundle: () => {
    return JSON.stringify(get().bundle, null, 2);
  },

  importBundle: (json) => {
    try {
      const parsed = JSON.parse(json);
      if (!parsed.version && !parsed.scenarios) return false;
      get().pushUndo();
      const migrated = migrateBundle(parsed);
      saveToStorage(migrated);
      set({ bundle: migrated, lastSaved: Date.now() });
      return true;
    } catch {
      return false;
    }
  },

  resetBundle: () => {
    get().pushUndo();
    const fresh = { ...EMPTY_ADMIN_BUNDLE };
    saveToStorage(fresh);
    set({ bundle: fresh, editingId: null, lastSaved: Date.now() });
  },

  // ── Storage Info ──

  getStorageUsage: () => {
    try {
      const data = localStorage.getItem(STORAGE_KEY) || '';
      const used = new Blob([data]).size;
      const limit = 5 * 1024 * 1024; // ~5MB typical localStorage limit
      return { used, limit, percentage: Math.round((used / limit) * 100) };
    } catch {
      return { used: 0, limit: 5 * 1024 * 1024, percentage: 0 };
    }
  },
}));
