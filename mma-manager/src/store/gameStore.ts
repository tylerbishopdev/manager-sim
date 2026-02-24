import { create } from 'zustand';
import type { ManagerCharacter } from '../types';
import type {
  GameState, GameScreen, Fighter, ScheduledFight,
  DialogMessage, WorldState, MapId, FightOutcome,
  SponsorDeal, WeeklyFinances,
} from '../types/gameplay';
import { GYM_UPGRADES } from '../types/gameplay';
import { generateFighter } from '../services/fighterGen';
import { getScenarioPool, getSponsorPool, getGameSettings } from '../services/contentResolver';
import type { ScenarioTemplate } from '../types/admin';

// ── Helpers ─────────────────────────────────────────────

function rng(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Staff cost/effects ──────────────────────────────────

const STAFF_COSTS: Record<string, number> = {
  trainer: 800,
  cutman: 500,
  nutritionist: 600,
  scout: 700,
};

const STAFF_WEEKLY: Record<string, number> = {
  trainer: 400,
  cutman: 250,
  nutritionist: 300,
  scout: 350,
};

// ── Initial State Factory ────────────────────────────────

function createInitialState(_manager: ManagerCharacter): GameState {
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
    dialogQueue: [
      {
        speaker: 'WELCOME',
        text: `Welcome to your gym! You've got $5,000, one scrappy fighter, and a dream. Time to build an empire.`,
        choices: [
          { label: "Let's get to work", action: 'dismiss' },
        ],
      },
    ],

    championsWon: 0,
    fightHistory: [],
    scenarioHistory: {},
  };
}

// ── Generate sponsor offer ───────────────────────────────

function generateSponsor(gymLevel: number): SponsorDeal {
  const pool = getSponsorPool();
  const template = pick(pool);

  // Use admin-defined ranges if available, else scale by gym level
  const tier = template.tier ?? Math.min(gymLevel, 3);
  const weekly = rng(template.weeklyPaymentRange[0], template.weeklyPaymentRange[1]);
  const fightB = rng(template.fightBonusRange[0], template.fightBonusRange[1]);
  const weeks = rng(template.durationWeeksRange[0], template.durationWeeksRange[1]);

  const reqs: (string | undefined)[] = [
    undefined, undefined, // no requirement
    'win_next_fight',
    'win_streak_2',
    gymLevel >= 3 ? 'title_holder' : undefined,
  ];

  return {
    id: 'sponsor-' + Date.now() + '-' + rng(0, 9999),
    name: template.name,
    weeklyPayment: weekly,
    fightBonus: fightB,
    weeksLeft: weeks,
    requirement: template.requirement ?? pick(reqs),
    requirementMet: true,
  };
}

// ── Compute win streak ──────────────────────────────────

function getWinStreak(history: FightOutcome[], fighterId: string): number {
  let streak = 0;
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].winnerId === fighterId) streak++;
    else break;
  }
  return streak;
}

// ── Store Interface ──────────────────────────────────────

interface GameStore {
  manager: ManagerCharacter | null;
  gameState: GameState | null;
  gameStarted: boolean;

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
  spendMoney: (amount: number) => boolean;

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
  hireStaff: (role: keyof GameState['gym']['staff']) => boolean;

  // Direct state update
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

  // ── ADVANCE DAY (beefed up) ────────────────────────────

  advanceDay: () => {
    const gs = get().gameState;
    if (!gs) return;

    const newDay = gs.day + 1;
    const newWeek = Math.ceil(newDay / 7);
    const isNewWeek = newDay % 7 === 0;
    const dialogs: DialogMessage[] = [];

    // ── 1. Heal fighters, tick injuries ──
    let fighters = gs.fighters.map((f) => ({
      ...f,
      health: Math.min(100, f.health + (gs.gym.staff.nutritionist ? 4 : 2)),
      injuryDaysLeft: Math.max(0, f.injuryDaysLeft - 1),
      injury: f.injuryDaysLeft <= 1 ? 'none' as const : f.injury,
    }));

    // ── 2. Contract expiration (weekly) ──
    if (isNewWeek) {
      fighters = fighters.map((f) => ({
        ...f,
        contractWeeksLeft: f.contractWeeksLeft - 1,
      }));

      const expired = fighters.filter((f) => f.contractWeeksLeft <= 0);
      if (expired.length > 0) {
        fighters = fighters.filter((f) => f.contractWeeksLeft > 0);
        for (const f of expired) {
          dialogs.push({
            speaker: 'FRONT DESK',
            text: `${f.name}'s contract has expired. They've left the gym.`,
          });
        }
      }
    }

    // ── 3. Weekly expenses ──
    let money = gs.money;
    let sponsors = [...gs.sponsors];
    let sponsorIncome = 0;
    let gym = { ...gs.gym };
    let scenarioHistory = { ...(gs.scenarioHistory ?? {}) };

    if (isNewWeek) {
      const salaries = fighters.reduce((sum, f) => sum + f.salary, 0);
      const staffCost = Object.entries(gs.gym.staff)
        .filter(([, hired]) => hired)
        .reduce((sum, [role]) => sum + (STAFF_WEEKLY[role] ?? 0), 0);

      const totalExpenses = salaries + gs.gym.rent + staffCost;
      money -= totalExpenses;

      // Sponsor weekly income + expiration
      sponsors = sponsors.map((s) => ({ ...s, weeksLeft: s.weeksLeft - 1 }));
      const activeSponors = sponsors.filter((s) => s.weeksLeft > 0 && s.requirementMet);
      sponsorIncome = activeSponors.reduce((sum, s) => sum + s.weeklyPayment, 0);
      money += sponsorIncome;

      const expiredSponsors = sponsors.filter((s) => s.weeksLeft <= 0);
      sponsors = sponsors.filter((s) => s.weeksLeft > 0);

      for (const s of expiredSponsors) {
        dialogs.push({
          speaker: 'FRONT DESK',
          text: `Sponsorship deal with ${s.name} has ended.`,
        });
      }

      // Check sponsor requirements
      sponsors = sponsors.map((s) => {
        if (!s.requirement) return { ...s, requirementMet: true };
        let met = true;
        if (s.requirement === 'win_next_fight') met = true; // checked after fights
        if (s.requirement === 'win_streak_2') {
          met = fighters.some((f) => getWinStreak(gs.fightHistory, f.id) >= 2);
        }
        if (s.requirement === 'title_holder') {
          met = fighters.some((f) => f.titleHolder);
        }
        return { ...s, requirementMet: met };
      });

      // Weekly finance record
      const financeRecord: WeeklyFinances = {
        week: newWeek,
        income: { purses: 0, ppv: 0, tickets: 0, merch: 0, sponsors: sponsorIncome },
        expenses: {
          salaries, gymRent: gs.gym.rent, equipment: 0,
          medical: 0, scouting: 0, travel: 0, staff: staffCost,
        },
      };

      // Bankruptcy warning
      if (money < 0) {
        dialogs.push({
          speaker: 'ACCOUNTANT',
          text: `You're $${Math.abs(money).toLocaleString()} in debt! Cut costs or find income fast.`,
        });
      }

      // ── 4. Random event (uses admin scenario pool via contentResolver) ──
      const weeklyChance = getGameSettings().eventChanceWeekly / 100;
      if (Math.random() < weeklyChance && fighters.length > 0) {
        const scenarioPool = getScenarioPool();
        // Filter eligible scenarios based on day, cooldown, repeatable
        const eligible = scenarioPool.filter((s) => {
          if (s.minDay > newDay) return false;
          if (s.maxDay > 0 && newDay > s.maxDay) return false;
          if (!s.repeatable && scenarioHistory[s.id]) return false;
          if (s.cooldownDays > 0 && scenarioHistory[s.id] && (newDay - scenarioHistory[s.id]) < s.cooldownDays) return false;
          return true;
        });

        if (eligible.length > 0) {
          const scenario = pick(eligible);
          scenarioHistory[scenario.id] = newDay;
          const targetFighter = pick(fighters);
          const scenarioText = scenario.text
            .replace(/\{fighterName\}/g, targetFighter.name)
            .replace(/\{playerName\}/g, 'Boss');

          dialogs.push({
            speaker: scenario.speaker || scenario.name,
            text: scenarioText,
            choices: scenario.choices.map((c) => ({
              label: c.label,
              action: 'dismiss', // For now, effects applied immediately
            })),
          });

          // Apply effects from the first choice automatically (simplified)
          const effects = scenario.choices[0]?.effects ?? [];
          for (const eff of effects) {
            if (eff.type === 'money') money += Number(eff.value);
            if (eff.type === 'reputation') {
              gym = { ...gym, reputation: Math.max(0, Math.min(100, gym.reputation + Number(eff.value))) };
            }
            if (eff.type === 'add_sponsor' && sponsors.length < 3) {
              const newSponsor = generateSponsor(gs.gym.level);
              sponsors.push(newSponsor);
              dialogs.push({
                speaker: 'SPONSOR',
                text: `${newSponsor.name} offered a deal: $${newSponsor.weeklyPayment}/week + $${newSponsor.fightBonus}/fight for ${newSponsor.weeksLeft} weeks!`,
              });
            }
            if ((eff.target === 'random_fighter' || eff.target === 'all_fighters') && fighters.length > 0) {
              const targetIds = eff.target === 'all_fighters'
                ? fighters.map((f) => f.id)
                : [targetFighter.id];
              fighters = fighters.map((f) => {
                if (!targetIds.includes(f.id)) return f;
                let updated = { ...f };
                if (eff.type === 'morale') updated.morale = Math.max(0, Math.min(100, f.morale + Number(eff.value)));
                if (eff.type === 'health') updated.health = Math.max(0, Math.min(100, f.health + Number(eff.value)));
                if (eff.type === 'fame') updated.fame = Math.min(100, f.fame + Number(eff.value));
                if (eff.type === 'injury_days' && Number(eff.value) > 0) {
                  updated.injuryDaysLeft = Number(eff.value);
                  updated.injury = 'minor';
                }
                return updated;
              });
            }
          }

        }
      }

      set({
        gameState: {
          ...gs,
          day: newDay,
          week: newWeek,
          money,
          fighters,
          sponsors,
          gym,
          scenarioHistory,
          finances: [...gs.finances, financeRecord],
          dialogQueue: [...gs.dialogQueue, ...dialogs],
        },
      });
      return;
    }

    // ── Non-weekly day: random event (uses admin scenario pool) ──
    const dailyChance = getGameSettings().eventChanceDaily / 100;
    if (Math.random() < dailyChance && fighters.length > 0) {
      const scenarioPool = getScenarioPool();
      const eligible = scenarioPool.filter((s) => {
        if (s.minDay > newDay) return false;
        if (s.maxDay > 0 && newDay > s.maxDay) return false;
        if (!s.repeatable && scenarioHistory[s.id]) return false;
        if (s.cooldownDays > 0 && scenarioHistory[s.id] && (newDay - scenarioHistory[s.id]) < s.cooldownDays) return false;
        return true;
      });

      if (eligible.length > 0) {
        const scenario = pick(eligible);
        scenarioHistory[scenario.id] = newDay;
        const targetFighter = pick(fighters);
        const scenarioText = scenario.text
          .replace(/\{fighterName\}/g, targetFighter.name)
          .replace(/\{playerName\}/g, 'Boss');

        dialogs.push({
          speaker: scenario.speaker || scenario.name,
          text: scenarioText,
        });

        // Apply first choice effects
        const effects = scenario.choices[0]?.effects ?? [];
        for (const eff of effects) {
          if (eff.type === 'money') money += Number(eff.value);
          if ((eff.target === 'random_fighter' || eff.target === 'all_fighters') && fighters.length > 0) {
            const targetIds = eff.target === 'all_fighters'
              ? fighters.map((f) => f.id)
              : [targetFighter.id];
            fighters = fighters.map((f) => {
              if (!targetIds.includes(f.id)) return f;
              let updated = { ...f };
              if (eff.type === 'morale') updated.morale = Math.max(0, Math.min(100, f.morale + Number(eff.value)));
              if (eff.type === 'health') updated.health = Math.max(0, Math.min(100, f.health + Number(eff.value)));
              if (eff.type === 'fame') updated.fame = Math.min(100, f.fame + Number(eff.value));
              if (eff.type === 'injury_days' && Number(eff.value) > 0) {
                updated.injuryDaysLeft = Number(eff.value);
                updated.injury = 'minor';
              }
              return updated;
            });
          }
        }
      }
    }

    // ── Fight day check ──
    const todaysFight = gs.schedule.find((f) => f.day === newDay);
    if (todaysFight) {
      const fName = fighters.find((f) => f.id === todaysFight.fighterId)?.name ?? 'Your fighter';
      dialogs.push({
        speaker: 'PROMOTER',
        text: `FIGHT DAY! ${fName} vs ${todaysFight.opponent.name} at ${todaysFight.venue}. Head to the arena!`,
        choices: [
          { label: 'GO TO ARENA', action: 'screen:fight' },
          { label: 'I KNOW', action: 'dismiss' },
        ],
      });
    }

    set({
      gameState: {
        ...gs,
        day: newDay,
        week: newWeek,
        money,
        fighters,
        sponsors,
        scenarioHistory,
        dialogQueue: [...gs.dialogQueue, ...dialogs],
      },
    });
  },

  // ── RECORD FIGHT (beefed up) ──────────────────────────

  recordFight: (outcome) => {
    const gs = get().gameState;
    if (!gs) return;

    const dialogs: DialogMessage[] = [];

    // Update fighter stats based on fight
    let fighters = gs.fighters.map((f) => {
      if (f.id !== outcome.winnerId && f.id !== outcome.loserId) return f;

      const won = f.id === outcome.winnerId;
      const fameChange = outcome.fameGain * (won ? 1 : -0.3);

      // Stat growth from fighting (small)
      const statGrowth = won ? 0.2 : 0.1;
      const newStats = {
        striking: Math.min(10, f.stats.striking + (Math.random() < 0.4 ? statGrowth : 0)),
        grappling: Math.min(10, f.stats.grappling + (Math.random() < 0.4 ? statGrowth : 0)),
        conditioning: Math.min(10, f.stats.conditioning + (Math.random() < 0.3 ? statGrowth : 0)),
        durability: Math.min(10, f.stats.durability + (Math.random() < 0.2 ? statGrowth : 0)),
      };

      // Ranking change
      let newRanking = f.ranking;
      if (won && outcome.rankingChange > 0) {
        if (newRanking === null) newRanking = 15;
        newRanking = Math.max(1, newRanking - outcome.rankingChange);
      } else if (!won && newRanking !== null) {
        newRanking = Math.min(15, newRanking + Math.ceil(outcome.rankingChange / 2));
        if (newRanking > 15) newRanking = null;
      }

      // Injury from fight
      const injuryDays = outcome.injuryToPlayer === 'minor' ? rng(3, 7)
        : outcome.injuryToPlayer === 'major' ? rng(10, 21)
        : outcome.injuryToPlayer === 'critical' ? rng(28, 56)
        : 0;

      return {
        ...f,
        wins: won ? f.wins + 1 : f.wins,
        losses: won ? f.losses : f.losses + 1,
        knockouts: (won && (outcome.result === 'ko' || outcome.result === 'tko')) ? f.knockouts + 1 : f.knockouts,
        fame: Math.max(0, Math.min(100, f.fame + fameChange)),
        morale: Math.max(0, Math.min(100, f.morale + (won ? 15 : -20))),
        health: won ? Math.max(40, f.health - rng(10, 25)) : Math.max(20, f.health - rng(20, 40)),
        ranking: newRanking,
        injury: outcome.injuryToPlayer,
        injuryDaysLeft: injuryDays,
        stats: newStats,
      };
    });

    // Ranking message
    const myFighter = fighters.find((f) => f.id === outcome.winnerId || f.id === outcome.loserId);
    if (myFighter?.ranking && myFighter.ranking <= 3) {
      dialogs.push({
        speaker: 'ANNOUNCER',
        text: `${myFighter.name} is now ranked #${myFighter.ranking}! ${myFighter.ranking === 1 ? 'TITLE SHOT INCOMING!' : 'Keep climbing!'}`,
      });
    }

    // Gym rep boost from wins
    const repBoost = outcome.winnerId ? rng(1, 3) : 0;

    set({
      gameState: {
        ...gs,
        fightHistory: [...gs.fightHistory, outcome],
        money: gs.money + outcome.earnings.total,
        totalEarnings: gs.totalEarnings + Math.max(0, outcome.earnings.total),
        schedule: gs.schedule.filter((f) => f.id !== outcome.fightId),
        fighters,
        gym: { ...gs.gym, reputation: Math.min(100, gs.gym.reputation + repBoost) },
        dialogQueue: [...gs.dialogQueue, ...dialogs],
      },
    });
  },

  // ── GYM UPGRADE (fixed index bug) ─────────────────────

  upgradeGym: () => {
    const gs = get().gameState;
    if (!gs) return false;

    // Find the next upgrade (current level + 1)
    const next = GYM_UPGRADES.find((u) => u.level === gs.gym.level + 1);
    if (!next || gs.money < next.cost) return false;

    set({
      gameState: {
        ...gs,
        money: gs.money - next.cost,
        totalSpent: gs.totalSpent + next.cost,
        gym: {
          ...gs.gym,
          level: next.level,
          rent: next.rent,
          maxFighters: next.maxFighters,
          equipment: Math.min(100, gs.gym.equipment + 20),
        },
      },
    });
    return true;
  },

  // ── HIRE STAFF (new) ──────────────────────────────────

  hireStaff: (role) => {
    const gs = get().gameState;
    if (!gs) return false;
    if (gs.gym.staff[role]) return false; // already hired

    const cost = STAFF_COSTS[role] ?? 500;
    if (gs.money < cost) return false;

    set({
      gameState: {
        ...gs,
        money: gs.money - cost,
        totalSpent: gs.totalSpent + cost,
        gym: {
          ...gs.gym,
          staff: { ...gs.gym.staff, [role]: true },
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
