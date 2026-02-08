import { create } from 'zustand';
import type { ManagerCharacter } from '../types';
import type {
  GameState, GameScreen, Fighter, ScheduledFight, SponsorDeal,
  GameEvent, DialogMessage, WorldState, GymState, MapId, FightOutcome,
} from '../types/gameplay';
import { GYM_UPGRADES } from '../types/gameplay';
import { generateFighter } from '../services/fighterGen';

// ── Initial State Factory ────────────────────────────────

function createInitialState(manager: ManagerCharacter): GameState {
  const starterFighter = generateFighter({
    tier: 'scrub',
    forceWeightClass: 'lightweight',
  });
  starterFighter.contractWeeksLeft = 12;
  starterFighter.salary = 300;

  return {
    day: 1,
    week: 1,
    money: 5000,
    totalEarnings: 0,
    totalSpent: 0,

    fighters: [starterFighter],
    schedule: [],
    gym: {
      level: 1,
      reputation: 20,
      equipment: 30,
      rent: 500,
      maxFighters: 2,
      staff: { trainer: false, cutman: false, nutritionist: false, scout: false },
    },
    sponsors: [],
    events: [],
    finances: [],

    world: {
      currentMap: 'gym',
      playerX: 7,
      playerY: 8,
      playerDir: 'down',
      npcPositions: {},
    },
    activeScreen: 'overworld',
    dialogQueue: [],

    championsWon: 0,
    fightHistory: [],
  };
}

// ── Store Interface ──────────────────────────────────────

interface GameStore {
  // Meta
  manager: ManagerCharacter | null;
  gameState: GameState | null;
  gameStarted: boolean;

  // Init
  startGame: (manager: ManagerCharacter) => void;

  // World
  setPlayerPos: (x: number, y: number) => void;
  setPlayerDir: (dir: WorldState['playerDir']) => void;
  changeMap: (map: MapId, x: number, y: number) => void;

  // Screens
  setScreen: (screen: GameScreen) => void;

  // Dialog
  pushDialog: (msg: DialogMessage) => void;
  popDialog: () => void;

  // Economy
  addMoney: (amount: number) => void;
  spendMoney: (amount: number) => boolean; // returns false if insufficient

  // Roster
  addFighter: (fighter: Fighter) => void;
  removeFighter: (id: string) => void;
  updateFighter: (id: string, updates: Partial<Fighter>) => void;

  // Schedule
  addFight: (fight: ScheduledFight) => void;
  removeFight: (id: string) => void;

  // Day advancement
  advanceDay: () => void;

  // Fight
  recordFight: (outcome: FightOutcome) => void;

  // Gym
  upgradeGym: () => boolean;

  // Direct state update (escape hatch)
  updateGameState: (updater: (state: GameState) => Partial<GameState>) => void;
}

// ── Store ────────────────────────────────────────────────

export const useGameStore = create<GameStore>((set, get) => ({
  manager: null,
  gameState: null,
  gameStarted: false,

  startGame: (manager) => {
    set({
      manager,
      gameState: createInitialState(manager),
      gameStarted: true,
    });
  },

  setPlayerPos: (x, y) => {
    const gs = get().gameState;
    if (!gs) return;
    set({ gameState: { ...gs, world: { ...gs.world, playerX: x, playerY: y } } });
  },

  setPlayerDir: (dir) => {
    const gs = get().gameState;
    if (!gs) return;
    set({ gameState: { ...gs, world: { ...gs.world, playerDir: dir } } });
  },

  changeMap: (map, x, y) => {
    const gs = get().gameState;
    if (!gs) return;
    set({
      gameState: {
        ...gs,
        world: { ...gs.world, currentMap: map, playerX: x, playerY: y },
      },
    });
  },

  setScreen: (screen) => {
    const gs = get().gameState;
    if (!gs) return;
    set({ gameState: { ...gs, activeScreen: screen } });
  },

  pushDialog: (msg) => {
    const gs = get().gameState;
    if (!gs) return;
    set({ gameState: { ...gs, dialogQueue: [...gs.dialogQueue, msg] } });
  },

  popDialog: () => {
    const gs = get().gameState;
    if (!gs) return;
    set({ gameState: { ...gs, dialogQueue: gs.dialogQueue.slice(1) } });
  },

  addMoney: (amount) => {
    const gs = get().gameState;
    if (!gs) return;
    set({
      gameState: {
        ...gs,
        money: gs.money + amount,
        totalEarnings: gs.totalEarnings + amount,
      },
    });
  },

  spendMoney: (amount) => {
    const gs = get().gameState;
    if (!gs) return false;
    if (gs.money < amount) return false;
    set({
      gameState: {
        ...gs,
        money: gs.money - amount,
        totalSpent: gs.totalSpent + amount,
      },
    });
    return true;
  },

  addFighter: (fighter) => {
    const gs = get().gameState;
    if (!gs) return;
    set({ gameState: { ...gs, fighters: [...gs.fighters, fighter] } });
  },

  removeFighter: (id) => {
    const gs = get().gameState;
    if (!gs) return;
    set({ gameState: { ...gs, fighters: gs.fighters.filter((f) => f.id !== id) } });
  },

  updateFighter: (id, updates) => {
    const gs = get().gameState;
    if (!gs) return;
    set({
      gameState: {
        ...gs,
        fighters: gs.fighters.map((f) => (f.id === id ? { ...f, ...updates } : f)),
      },
    });
  },

  addFight: (fight) => {
    const gs = get().gameState;
    if (!gs) return;
    set({ gameState: { ...gs, schedule: [...gs.schedule, fight] } });
  },

  removeFight: (id) => {
    const gs = get().gameState;
    if (!gs) return;
    set({ gameState: { ...gs, schedule: gs.schedule.filter((f) => f.id !== id) } });
  },

  advanceDay: () => {
    const gs = get().gameState;
    if (!gs) return;
    const newDay = gs.day + 1;
    const newWeek = Math.ceil(newDay / 7);

    // Heal fighters slightly each day
    const healedFighters = gs.fighters.map((f) => ({
      ...f,
      health: Math.min(100, f.health + 2),
      injuryDaysLeft: Math.max(0, f.injuryDaysLeft - 1),
      injury: f.injuryDaysLeft <= 1 ? 'none' as const : f.injury,
    }));

    // Weekly expenses
    let money = gs.money;
    if (newDay % 7 === 0) {
      const salaries = healedFighters.reduce((sum, f) => sum + f.salary, 0);
      money -= salaries + gs.gym.rent;
    }

    set({
      gameState: {
        ...gs,
        day: newDay,
        week: newWeek,
        money,
        fighters: healedFighters,
      },
    });
  },

  recordFight: (outcome) => {
    const gs = get().gameState;
    if (!gs) return;
    set({
      gameState: {
        ...gs,
        fightHistory: [...gs.fightHistory, outcome],
        money: gs.money + outcome.earnings.total,
        totalEarnings: gs.totalEarnings + Math.max(0, outcome.earnings.total),
        schedule: gs.schedule.filter((f) => f.id !== outcome.fightId),
      },
    });
  },

  upgradeGym: () => {
    const gs = get().gameState;
    if (!gs) return false;
    const next = GYM_UPGRADES[gs.gym.level]; // level is 1-indexed, array is 0-indexed
    if (!next || gs.money < next.cost) return false;
    set({
      gameState: {
        ...gs,
        money: gs.money - next.cost,
        gym: {
          ...gs.gym,
          level: next.level,
          rent: next.rent,
          maxFighters: next.maxFighters,
        },
      },
    });
    return true;
  },

  updateGameState: (updater) => {
    const gs = get().gameState;
    if (!gs) return;
    set({ gameState: { ...gs, ...updater(gs) } });
  },
}));
