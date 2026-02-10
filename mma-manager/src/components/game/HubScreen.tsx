import { useGameStore } from '../../store/gameStore';
import { GYM_UPGRADES } from '../../types/gameplay';

/**
 * Hub Screen — Redesigned to match the reference UI.
 * Two-panel layout: office background (left) + phone menu (right).
 * The phone is the primary interaction surface.
 */
export default function HubScreen() {
  const { gameState, pushDialog, advanceDay, manager } = useGameStore();
  if (!gameState || !manager) return null;

  const { day, money, fighters, schedule, gym, sponsors } = gameState;
  const week = Math.ceil(day / 7);
  const nextFight = schedule.find((f) => f.day >= day);
  const gymLabel = GYM_UPGRADES.find((u) => u.level === gym.level)?.label ?? 'Gym';
  const nextUpgrade = GYM_UPGRADES.find((u) => u.level === gym.level + 1);
  const hasFightToday = schedule.some((f) => f.day <= day);

  // ── HUD data ──
  const topFighter = fighters[0];
  const moralePercent = topFighter ? topFighter.morale : 0;
  const moneyPercent = Math.min(100, (money / 50000) * 100);
  const reputationPercent = gym.reputation; // "Family" bar → gym reputation

  // ── In-game clock display ──
  const gameHour = 8 + Math.floor((day % 3) * 4); // cosmetic time-of-day
  const displayTime = `${gameHour > 12 ? gameHour - 12 : gameHour}:${String((day * 7) % 60).padStart(2, '0')} ${gameHour >= 12 ? 'PM' : 'AM'}`;

  // ── Hub actions (open conversational dialogs) ──

  const openFights = () => {
    const todaysFight = schedule.find((f) => f.day <= day);
    if (todaysFight) {
      const fighter = fighters.find((f) => f.id === todaysFight.fighterId);
      pushDialog({
        speaker: 'ANNOUNCER',
        text: `FIGHT NIGHT! ${fighter?.name ?? 'Your fighter'} vs ${todaysFight.opponent.name} at ${todaysFight.venue}. The crowd is READY.`,
        choices: [
          { label: "LET'S GO!", action: 'start_fight' },
          { label: 'Hold on...', action: 'dismiss' },
        ],
      });
    } else if (nextFight) {
      pushDialog({
        speaker: 'ARENA',
        text: `No fight today. Next bout in ${nextFight.day - day} day${nextFight.day - day !== 1 ? 's' : ''} at ${nextFight.venue}. Keep training.`,
      });
    } else {
      pushDialog({
        speaker: 'ARENA',
        text: "Nothing booked. Talk to the promoter to line up a fight.",
      });
    }
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

  const openOffice = () => {
    pushDialog({
      speaker: 'YOUR DESK',
      text: `Day ${day}, Week ${week}. You've got $${money.toLocaleString()} in the bank${money < 2000 ? " — running low." : "."} What's the move?`,
      choices: [
        { label: 'Review Roster', action: 'open_roster' },
        { label: 'Check Finances', action: 'open_finance' },
        { label: 'Rest (Next Day)', action: 'advance_day' },
        { label: 'Save Game', action: 'save_game' },
        { label: 'Never mind', action: 'dismiss' },
      ],
    });
  };

  const openGym = () => {
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

  const openVisits = () => {
    // Advance day with a flavor twist — "going out" to find opportunities
    pushDialog({
      speaker: 'STREETS',
      text: `You hit the streets looking for opportunities. Word is spreading about your gym.${sponsors.length > 0 ? ` Your ${sponsors.length} sponsor${sponsors.length > 1 ? 's' : ''} keep${sponsors.length === 1 ? 's' : ''} you afloat.` : ' No sponsors yet.'}`,
      choices: [
        { label: 'Advance to next day', action: 'advance_day' },
        { label: 'Head back', action: 'dismiss' },
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

  const openContracts = () => {
    if (fighters.length === 0) {
      pushDialog({ speaker: 'CONTRACTS', text: "No fighters under contract. Scout some talent first." });
      return;
    }
    const contractInfo = fighters.map(f =>
      `${f.name}: ${f.contractWeeksLeft}wk left, $${f.salary}/wk`
    ).join('\n');
    pushDialog({
      speaker: 'CONTRACTS',
      text: `Active contracts:\n${contractInfo}`,
      choices: [
        { label: 'View full roster', action: 'open_roster' },
        { label: 'Back', action: 'dismiss' },
      ],
    });
  };

  const openSettings = () => {
    pushDialog({
      speaker: 'SETTINGS',
      text: `Day ${day} — Week ${week}\n${gymLabel} | ${fighters.length} fighter${fighters.length !== 1 ? 's' : ''}`,
      choices: [
        { label: 'Save Game', action: 'save_game' },
        { label: 'Back', action: 'dismiss' },
      ],
    });
  };

  // ── Phone menu button definitions ──
  const phoneButtons = [
    { label: 'FIGHTS', icon: '🥊', action: openFights, alert: hasFightToday },
    { label: 'SCOUT', icon: '🔍', action: openScout, alert: false },
    { label: 'TRAIN', icon: '🏋️', action: openTraining, alert: false },
    { label: 'OFFICE', icon: '🏠', action: openOffice, alert: false },
    { label: 'GYM', icon: 'GYM', action: openGym, alert: false, isText: true },
    { label: 'VISITS', icon: '🚶', action: openVisits, alert: false },
    { label: 'PROMOTOR', icon: '🤝', action: openPromoter, alert: false },
    { label: 'CONTRACTS', icon: '📋', action: openContracts, alert: false },
    { label: 'SETTINGS', icon: '⚙️', action: openSettings, alert: false },
  ];

  return (
    <div className="hub-root">
      {/* ── LEFT: Office backdrop + HUD overlay ── */}
      <div className="hub-office">
        {/* Combo SVG: desk + character pre-composited (no blend hacks needed) */}
        {manager.preset && manager.id ? (
          <img
            src={`/bg/combo-${manager.id}.svg`}
            alt=""
            className="hub-combo-bg"
            onError={(e) => {
              // Fallback to old office.png if combo doesn't exist
              (e.target as HTMLImageElement).src = '/bg/office.png';
              (e.target as HTMLImageElement).className = 'hub-office-bg';
            }}
          />
        ) : (
          <img src="/bg/office.png" alt="" className="hub-office-bg" />
        )}

        {/* ── HUD overlay (top-left) ── */}
        <div className="hub-hud">
          <div className="hub-hud-row">
            <span className="hub-hud-label">Money</span>
            <div className="hub-hud-bar">
              <div
                className="hub-hud-fill hub-hud-fill--money"
                style={{ width: `${moneyPercent}%` }}
              />
            </div>
            <span className="hub-hud-value">${money.toLocaleString()}</span>
          </div>
          <div className="hub-hud-row">
            <span className="hub-hud-label">Fighter<br />Morale</span>
            <div className="hub-hud-bar">
              <div
                className="hub-hud-fill hub-hud-fill--morale"
                style={{ width: `${moralePercent}%` }}
              />
            </div>
            {topFighter && <span className="hub-hud-value">{moralePercent}%</span>}
          </div>
          <div className="hub-hud-row">
            <span className="hub-hud-label">Rep</span>
            <div className="hub-hud-bar">
              <div
                className="hub-hud-fill hub-hud-fill--rep"
                style={{ width: `${reputationPercent}%` }}
              />
            </div>
            {reputationPercent < 30 && <span className="hub-hud-alert">!</span>}
          </div>
        </div>

        {/* Day / Week badge */}
        <div className="hub-day-badge">
          DAY {day} &middot; WEEK {week}
        </div>
      </div>

      {/* ── RIGHT: Phone interface ── */}
      <div className="hub-phone-area">
        <div className="hub-phone">
          {/* Phone bezel top */}
          <div className="phone-notch" />

          <div className="phone-screen">
            {/* Status bar */}
            <div className="phone-statusbar">
              <span className="phone-carrier">📶 MMA-Fi</span>
              <span className="phone-time">{displayTime}</span>
            </div>

            {/* Menu header */}
            <div className="phone-menu-title">MENU</div>

            {/* 3x3 button grid */}
            <div className="phone-grid">
              {phoneButtons.map((btn) => (
                <button
                  key={btn.label}
                  className={`phone-btn${btn.alert ? ' phone-btn--alert' : ''}`}
                  onClick={btn.action}
                >
                  <span className={`phone-btn-icon${btn.isText ? ' phone-btn-icon--text' : ''}`}>
                    {btn.icon}
                  </span>
                  <span className="phone-btn-label">{btn.label}</span>
                  {btn.alert && <span className="phone-btn-badge">!</span>}
                </button>
              ))}
            </div>

            {/* Bottom nav */}
            <div className="phone-nav">
              <div className="phone-dots">
                <span className="phone-dot phone-dot--active" />
                <span className="phone-dot" />
                <span className="phone-dot" />
              </div>
              <div className="phone-home-btn" onClick={() => {
                advanceDay();
                const gs = useGameStore.getState().gameState;
                if (gs) {
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
              }}>
                <span className="phone-home-icon">▶</span>
                <span className="phone-home-label">NEXT DAY</span>
              </div>
            </div>
          </div>
        </div>

        {/* Fight countdown outside phone */}
        {nextFight && (
          <div className="hub-fight-countdown">
            NEXT FIGHT IN {nextFight.day - day}D
          </div>
        )}
      </div>
    </div>
  );
}
