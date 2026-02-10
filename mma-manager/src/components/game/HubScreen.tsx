import { useGameStore } from '../../store/gameStore';
import { GYM_UPGRADES } from '../../types/gameplay';

/**
 * Hub Screen — replaces the canvas overworld.
 * A menu-driven management sim hub that works on mobile + desktop.
 * Player makes decisions through conversational dialog choices.
 */
export default function HubScreen() {
  const { gameState, pushDialog, advanceDay, manager } = useGameStore();
  if (!gameState || !manager) return null;

  const { day, money, fighters, schedule, gym, sponsors } = gameState;
  const week = Math.ceil(day / 7);
  const nextFight = schedule.find((f) => f.day >= day);
  const gymLabel = GYM_UPGRADES.find((u) => u.level === gym.level)?.label ?? 'Gym';
  const nextUpgrade = GYM_UPGRADES.find((u) => u.level === gym.level + 1);

  // ── Hub actions that open conversational dialogs ──

  const openDesk = () => {
    pushDialog({
      speaker: 'YOUR DESK',
      text: `Day ${day}, Week ${week}. You've got $${money.toLocaleString()} in the bank${money < 2000 ? " — running low." : "."} What's the move?`,
      choices: [
        { label: 'Review Roster', action: 'open_roster' },
        { label: 'Check Finances', action: 'open_finance' },
        { label: 'Manage Gym', action: 'open_gym' },
        { label: 'Rest (Next Day)', action: 'advance_day' },
        { label: 'Save Game', action: 'save_game' },
        { label: 'Never mind', action: 'dismiss' },
      ],
    });
  };

  const openTraining = () => {
    if (fighters.length === 0) {
      pushDialog({ speaker: 'GYM', text: "No fighters to train. Go scout some talent first." });
      return;
    }
    const f = fighters[0];
    const trainerBonus = gym.staff.trainer ? ' Your trainer gives a boost.' : '';
    pushDialog({
      speaker: 'TRAINING',
      text: `${f.name} is ready to train. HP: ${f.health}%, Morale: ${f.morale}%.${trainerBonus} What should they focus on?`,
      choices: [
        { label: `Striking (${f.stats.striking}/10)`, action: 'train_striking' },
        { label: `Grappling (${f.stats.grappling}/10)`, action: 'train_grappling' },
        { label: `Conditioning (${f.stats.conditioning}/10)`, action: 'train_conditioning' },
        fighters.length > 1 ? { label: 'Pick different fighter', action: 'pick_fighter_train' } : null,
        { label: 'Skip training', action: 'dismiss' },
      ].filter(Boolean) as { label: string; action: string }[],
    });
  };

  const openScout = () => {
    const scoutBonus = gym.staff.scout ? " Your scout has some inside leads." : "";
    pushDialog({
      speaker: 'SCOUT',
      text: `Yo boss! I know some fighters looking for work.${scoutBonus} Want me to round up some prospects?`,
      choices: [
        { label: "Let's see who's out there", action: 'open_scout' },
        { label: 'Not right now', action: 'dismiss' },
      ],
    });
  };

  const openPromoter = () => {
    if (fighters.length === 0) {
      pushDialog({ speaker: 'PROMOTER', text: "You don't have any fighters signed. I can't book air, boss." });
      return;
    }
    const connectionBonus = (manager.connections ?? 5) > 7 ? " I got some premium offers for you." : "";
    pushDialog({
      speaker: 'PROMOTER',
      text: `I've been making calls. Your gym's reputation is at ${gym.reputation}%.${connectionBonus} Ready to look at some fights?`,
      choices: [
        { label: 'Show me the fights', action: 'open_calendar' },
        { label: 'Maybe next time', action: 'dismiss' },
      ],
    });
  };

  const openArena = () => {
    const todaysFight = schedule.find((f) => f.day <= day);
    if (todaysFight) {
      const fighter = fighters.find((f) => f.id === todaysFight.fighterId);
      pushDialog({
        speaker: 'ANNOUNCER',
        text: `FIGHT NIGHT! ${fighter?.name ?? 'Your fighter'} vs ${todaysFight.opponent.name} at ${todaysFight.venue}. The crowd is READY. You ready?`,
        choices: [
          { label: "LET'S GO!", action: 'start_fight' },
          { label: 'Hold on...', action: 'dismiss' },
        ],
      });
    } else if (nextFight) {
      pushDialog({
        speaker: 'ARENA',
        text: `No fight today. Next bout is in ${nextFight.day - day} day${nextFight.day - day !== 1 ? 's' : ''} at ${nextFight.venue}. Keep training.`,
      });
    } else {
      pushDialog({
        speaker: 'ARENA',
        text: "Nothing booked. Talk to the promoter to line up a fight.",
      });
    }
  };

  const openGymManagement = () => {
    const staffList = Object.entries(gym.staff)
      .map(([role, hired]) => `${role}: ${hired ? '✓' : '✗'}`)
      .join(' | ');

    pushDialog({
      speaker: gymLabel.toUpperCase(),
      text: `Level ${gym.level} — "${gymLabel}"\nRoster: ${fighters.length}/${gym.maxFighters} | Equipment: ${gym.equipment}% | Rep: ${gym.reputation}%\nStaff: ${staffList}`,
      choices: [
        nextUpgrade ? { label: `Upgrade to "${nextUpgrade.label}" ($${nextUpgrade.cost.toLocaleString()})`, action: 'upgrade_gym' } : null,
        !gym.staff.trainer ? { label: `Hire Trainer ($800)`, action: 'hire_trainer' } : null,
        !gym.staff.cutman ? { label: `Hire Cutman ($500)`, action: 'hire_cutman' } : null,
        !gym.staff.nutritionist ? { label: `Hire Nutritionist ($600)`, action: 'hire_nutritionist' } : null,
        !gym.staff.scout ? { label: `Hire Scout ($700)`, action: 'hire_scout' } : null,
        { label: 'Back', action: 'dismiss' },
      ].filter(Boolean) as { label: string; action: string }[],
    });
  };

  const handleAdvanceDay = () => {
    advanceDay();
    const gs = useGameStore.getState().gameState;
    if (gs) {
      // Check for fight day
      const todaysFight = gs.schedule.find((f) => f.day <= gs.day);
      if (todaysFight) {
        const fname = gs.fighters.find((f) => f.id === todaysFight.fighterId)?.name ?? 'Your fighter';
        pushDialog({
          speaker: 'PROMOTER',
          text: `FIGHT DAY! ${fname} vs ${todaysFight.opponent.name}! Get to the arena!`,
          choices: [
            { label: 'HEAD TO ARENA', action: 'start_fight' },
            { label: 'I need a minute', action: 'dismiss' },
          ],
        });
      }
    }
  };

  // ── Fight day indicator ──
  const hasFightToday = schedule.some((f) => f.day <= day);

  return (
    <div className="hub-screen">
      {/* ── Header ── */}
      <div className="hub-header">
        <div className="hub-manager-name">{manager.name}</div>
        <div className="hub-day">DAY {day} — WEEK {week}</div>
        <div className={`hub-money ${money < 0 ? 'negative' : ''}`}>
          ${money.toLocaleString()}
        </div>
      </div>

      {/* ── Quick Status ── */}
      <div className="hub-status">
        <span>{fighters.length} FIGHTER{fighters.length !== 1 ? 'S' : ''}</span>
        <span>{gymLabel}</span>
        <span>REP: {gym.reputation}%</span>
        {sponsors.length > 0 && <span>{sponsors.length} SPONSOR{sponsors.length !== 1 ? 'S' : ''}</span>}
        {nextFight && (
          <span className="hub-fight-countdown">
            FIGHT IN {nextFight.day - day}D
          </span>
        )}
      </div>

      {/* ── Action Buttons Grid ── */}
      <div className="hub-actions">
        <button className="hub-btn" onClick={openDesk}>
          <span className="hub-btn-icon">📋</span>
          <span className="hub-btn-label">OFFICE</span>
          <span className="hub-btn-desc">Roster, finances, save</span>
        </button>

        <button className="hub-btn" onClick={openTraining}>
          <span className="hub-btn-icon">🥊</span>
          <span className="hub-btn-label">TRAIN</span>
          <span className="hub-btn-desc">Improve fighter stats</span>
        </button>

        <button className="hub-btn" onClick={openScout}>
          <span className="hub-btn-icon">🔍</span>
          <span className="hub-btn-label">SCOUT</span>
          <span className="hub-btn-desc">Find new talent</span>
        </button>

        <button className="hub-btn" onClick={openPromoter}>
          <span className="hub-btn-icon">📞</span>
          <span className="hub-btn-label">PROMOTER</span>
          <span className="hub-btn-desc">Book fights</span>
        </button>

        <button className={`hub-btn${hasFightToday ? ' hub-btn-alert' : ''}`} onClick={openArena}>
          <span className="hub-btn-icon">🏟️</span>
          <span className="hub-btn-label">{hasFightToday ? 'FIGHT!' : 'ARENA'}</span>
          <span className="hub-btn-desc">{hasFightToday ? 'Fight is ready!' : 'View scheduled fights'}</span>
        </button>

        <button className="hub-btn" onClick={openGymManagement}>
          <span className="hub-btn-icon">🏋️</span>
          <span className="hub-btn-label">GYM</span>
          <span className="hub-btn-desc">Upgrade & hire staff</span>
        </button>

        <button className="hub-btn hub-btn-day" onClick={handleAdvanceDay}>
          <span className="hub-btn-icon">⏩</span>
          <span className="hub-btn-label">NEXT DAY</span>
          <span className="hub-btn-desc">Advance time</span>
        </button>
      </div>
    </div>
  );
}
