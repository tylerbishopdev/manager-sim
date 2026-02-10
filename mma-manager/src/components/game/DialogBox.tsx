import { useEffect, useCallback } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function DialogBox() {
  const { gameState, popDialog, setScreen, pushDialog, spendMoney, updateFighter, upgradeGym, hireStaff } = useGameStore();

  const msg = gameState && gameState.dialogQueue.length > 0 ? gameState.dialogQueue[0] : null;

  const handleChoice = useCallback((action: string) => {
    popDialog();

    // ── Screen navigation ──
    if (action.startsWith('screen:')) {
      const target = action.replace('screen:', '');
      setScreen(target as any);
      return;
    }

    switch (action) {
      case 'dismiss':
      case 'close':
        break;

      // ── Screen opens ──
      case 'open_roster':
        setScreen('roster');
        break;
      case 'open_finance':
        setScreen('finance');
        break;
      case 'open_scout':
        setScreen('scout');
        break;
      case 'open_calendar':
        setScreen('contract');
        break;
      case 'start_fight':
        setScreen('prefight');
        break;
      case 'open_gym': {
        // Re-trigger gym management from hub
        // (This is handled by HubScreen.openGymManagement but we need a fallback)
        const store = useGameStore.getState();
        const gs = store.gameState;
        if (gs) {
          store.pushDialog({
            speaker: 'GYM',
            text: `Level ${gs.gym.level} gym. Equipment: ${gs.gym.equipment}%. What do you want to do?`,
            choices: [
              { label: 'Back', action: 'dismiss' },
            ],
          });
        }
        break;
      }

      // ── Day advancement ──
      case 'advance_day': {
        const store = useGameStore.getState();
        store.advanceDay();
        const gs = store.gameState;
        if (gs) {
          const todaysFight = gs.schedule.find((f) => f.day <= gs.day);
          if (todaysFight) {
            const fname = gs.fighters.find((f) => f.id === todaysFight.fighterId)?.name ?? 'Your fighter';
            store.pushDialog({
              speaker: '📢 FIGHT DAY',
              text: `${fname} vs ${todaysFight.opponent.name}! Head to the arena!`,
              choices: [
                { label: "LET'S GO!", action: 'start_fight' },
                { label: 'Not yet', action: 'dismiss' },
              ],
            });
          } else {
            store.pushDialog({
              speaker: 'MORNING',
              text: `Day ${gs.day} begins. You have $${gs.money.toLocaleString()}.${gs.money < 1000 ? " Funds are getting low..." : ""}`,
            });
          }
        }
        break;
      }

      // ── Save/Load ──
      case 'save_game':
        if (gameState) {
          try {
            localStorage.setItem('mma_save', JSON.stringify({
              manager: useGameStore.getState().manager,
              gameState,
            }));
            pushDialog({ speaker: 'SYSTEM', text: 'Game saved!' });
          } catch {
            pushDialog({ speaker: 'SYSTEM', text: 'Save failed!' });
          }
        }
        break;

      // ── Training ──
      case 'train_striking':
      case 'train_grappling':
      case 'train_conditioning': {
        const stat = action.replace('train_', '') as 'striking' | 'grappling' | 'conditioning';
        const store = useGameStore.getState();
        const gs = store.gameState;
        if (!gs || gs.fighters.length === 0) break;

        const cost = 200;
        if (gs.money < cost) {
          store.pushDialog({ speaker: 'TRAINER', text: `You need $${cost} for a training session. You're short, boss.` });
          break;
        }

        const fighter = gs.fighters[0]; // TODO: allow picking fighter
        const hasTrainer = gs.gym.staff.trainer;
        const successChance = hasTrainer ? 0.85 : 0.65;
        const success = Math.random() < successChance;

        spendMoney(cost);

        if (success && fighter.stats[stat] < fighter.potential[stat]) {
          const gain = hasTrainer ? 0.5 : 0.3;
          updateFighter(fighter.id, {
            stats: { ...fighter.stats, [stat]: Math.min(10, +(fighter.stats[stat] + gain).toFixed(1)) },
            morale: Math.min(100, fighter.morale + 5),
          });
          const newVal = Math.min(10, +(fighter.stats[stat] + gain).toFixed(1));
          store.pushDialog({
            speaker: 'TRAINER',
            text: `Great session! ${fighter.name}'s ${stat} improved to ${newVal}. ($${cost})${hasTrainer ? " Your trainer pushed them hard." : ""}`,
            choices: [
              { label: 'Train again', action: action },
              { label: 'Done', action: 'dismiss' },
            ],
          });
        } else if (fighter.stats[stat] >= fighter.potential[stat]) {
          store.pushDialog({
            speaker: 'TRAINER',
            text: `${fighter.name} has hit their ceiling in ${stat}. They need fight experience to break through. ($${cost})`,
          });
        } else {
          updateFighter(fighter.id, { morale: Math.max(0, fighter.morale - 3) });
          store.pushDialog({
            speaker: 'TRAINER',
            text: `Tough session. No improvement today. ${fighter.name} is frustrated. ($${cost})`,
            choices: [
              { label: 'Try again', action: action },
              { label: "That's enough", action: 'dismiss' },
            ],
          });
        }
        break;
      }

      // ── Gym upgrade ──
      case 'upgrade_gym': {
        const success = upgradeGym();
        const store = useGameStore.getState();
        if (success) {
          const gs = store.gameState;
          const label = gs ? (GYM_UPGRADES_MAP[gs.gym.level] ?? 'Upgraded') : 'Upgraded';
          store.pushDialog({
            speaker: 'CONTRACTOR',
            text: `Gym upgraded to "${label}"! More roster slots, better equipment. Time to grow.`,
          });
        } else {
          store.pushDialog({
            speaker: 'CONTRACTOR',
            text: "Can't upgrade right now. Either you're maxed out or you can't afford it.",
          });
        }
        break;
      }

      // ── Staff hiring ──
      case 'hire_trainer':
      case 'hire_cutman':
      case 'hire_nutritionist':
      case 'hire_scout': {
        const role = action.replace('hire_', '') as 'trainer' | 'cutman' | 'nutritionist' | 'scout';
        const success = hireStaff(role);
        const store = useGameStore.getState();
        if (success) {
          const msgs: Record<string, string> = {
            trainer: "New trainer on board! Training sessions will be more effective.",
            cutman: "Cutman hired! Your fighters will recover faster from fight injuries.",
            nutritionist: "Nutritionist hired! Fighters heal faster between days.",
            scout: "Scout hired! You'll see better talent in the scouting pool.",
          };
          store.pushDialog({ speaker: 'NEW HIRE', text: msgs[role] ?? 'Staff member hired!' });
        } else {
          store.pushDialog({ speaker: 'FRONT DESK', text: "Can't hire right now. Already hired or insufficient funds." });
        }
        break;
      }

      default:
        if (action !== '') {
          console.warn('Unhandled dialog action:', action);
        }
    }
  }, [gameState, popDialog, setScreen, pushDialog, spendMoney, updateFighter, upgradeGym, hireStaff]);

  // Auto-dismiss simple messages with Enter/Space/tap
  useEffect(() => {
    if (!msg || (msg.choices && msg.choices.length > 0)) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
        popDialog();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [msg, popDialog]);

  if (!msg) return null;

  return (
    <div
      className="dialog-overlay"
      onClick={(!msg.choices || msg.choices.length === 0) ? () => popDialog() : undefined}
    >
      <div className="dialog-box" onClick={(e) => e.stopPropagation()}>
        {/* Speaker */}
        {msg.speaker && (
          <div className="dialog-speaker">{msg.speaker}</div>
        )}

        {/* Text */}
        <div className="dialog-text">{msg.text}</div>

        {/* Choices */}
        {msg.choices && msg.choices.length > 0 && (
          <div className="dialog-choices">
            {msg.choices.map((choice, i) => (
              <button
                key={i}
                className="dialog-choice"
                onClick={() => handleChoice(choice.action)}
              >
                ▸ {choice.label}
              </button>
            ))}
          </div>
        )}

        {/* Dismiss hint */}
        {(!msg.choices || msg.choices.length === 0) && (
          <div className="dialog-dismiss">TAP OR PRESS ENTER</div>
        )}
      </div>
    </div>
  );
}

// Quick lookup for gym level labels
import { GYM_UPGRADES } from '../../types/gameplay';
const GYM_UPGRADES_MAP: Record<number, string> = Object.fromEntries(
  GYM_UPGRADES.map((u) => [u.level, u.label])
);
