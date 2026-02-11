import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { GYM_UPGRADES } from '../../types/gameplay';

export default function HubScreen() {
  const { gameState, pushDialog, advanceDay, manager } = useGameStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  if (!gameState || !manager) return null;

  const { day, money, fighters, schedule, gym, sponsors } = gameState;
  const week = Math.ceil(day / 7);
  const nextFight = schedule.find((f) => f.day >= day);
  const gymLabel = GYM_UPGRADES.find((u) => u.level === gym.level)?.label ?? 'Gym';
  const nextUpgrade = GYM_UPGRADES.find((u) => u.level === gym.level + 1);
  const hasFightToday = schedule.some((f) => f.day <= day);

  const topFighter = fighters[0];
  const moralePercent = topFighter ? topFighter.morale : 0;
  const moneyPercent = Math.min(100, (money / 50000) * 100);
  const reputationPercent = gym.reputation;

  // ── Actions (all close mobile overlay) ──

  const act = (fn: () => void) => () => { setMobileMenuOpen(false); fn(); };

  const openFights = act(() => {
    const todaysFight = schedule.find((f) => f.day <= day);
    if (todaysFight) {
      const fighter = fighters.find((f) => f.id === todaysFight.fighterId);
      pushDialog({ speaker: 'ANNOUNCER', text: `FIGHT NIGHT! ${fighter?.name ?? 'Your fighter'} vs ${todaysFight.opponent.name} at ${todaysFight.venue}. The crowd is READY.`, choices: [{ label: "LET'S GO!", action: 'start_fight' }, { label: 'Hold on...', action: 'dismiss' }] });
    } else if (nextFight) {
      pushDialog({ speaker: 'ARENA', text: `No fight today. Next bout in ${nextFight.day - day} day${nextFight.day - day !== 1 ? 's' : ''} at ${nextFight.venue}.` });
    } else {
      pushDialog({ speaker: 'ARENA', text: "Nothing booked. Talk to the promoter to line up a fight." });
    }
  });

  const openGym = act(() => {
    const staffList = Object.entries(gym.staff).map(([r, h]) => `${r}: ${h ? '✓' : '✗'}`).join(' | ');
    pushDialog({
      speaker: gymLabel.toUpperCase(), text: `Level ${gym.level} — "${gymLabel}"\nRoster: ${fighters.length}/${gym.maxFighters} | Equipment: ${gym.equipment}%\nStaff: ${staffList}`, choices: [
        nextUpgrade ? { label: `Upgrade ($${nextUpgrade.cost.toLocaleString()})`, action: 'upgrade_gym' } : null,
        !gym.staff.trainer ? { label: 'Hire Trainer ($800)', action: 'hire_trainer' } : null,
        !gym.staff.cutman ? { label: 'Hire Cutman ($500)', action: 'hire_cutman' } : null,
        { label: 'Back', action: 'dismiss' },
      ].filter(Boolean) as { label: string; action: string }[]
    });
  });

  const openTraining = act(() => {
    if (fighters.length === 0) { pushDialog({ speaker: 'GYM', text: "No fighters to train." }); return; }
    const f = fighters[0];
    pushDialog({
      speaker: 'TRAINING', text: `${f.name} ready. What to focus on?`, choices: [
        { label: `Striking (${f.stats.striking}/10)`, action: 'train_striking' },
        { label: `Grappling (${f.stats.grappling}/10)`, action: 'train_grappling' },
        { label: `Conditioning (${f.stats.conditioning}/10)`, action: 'train_conditioning' },
        { label: 'Skip', action: 'dismiss' },
      ]
    });
  });

  const openScout = act(() => {
    pushDialog({
      speaker: 'SCOUT', text: `Yo boss! I know some fighters looking for work.${gym.staff.scout ? " Your scout has leads." : ""}`, choices: [
        { label: "Show me", action: 'open_scout' }, { label: 'Not now', action: 'dismiss' },
      ]
    });
  });

  const openOffice = act(() => {
    pushDialog({
      speaker: 'YOUR DESK', text: `Day ${day}, Week ${week}. $${money.toLocaleString()} in the bank.`, choices: [
        { label: 'Roster', action: 'open_roster' }, { label: 'Finances', action: 'open_finance' },
        { label: 'Save Game', action: 'save_game' }, { label: 'Back', action: 'dismiss' },
      ]
    });
  });

  const openPromoter = act(() => {
    if (fighters.length === 0) { pushDialog({ speaker: 'PROMOTER', text: "No fighters signed." }); return; }
    pushDialog({
      speaker: 'PROMOTER', text: `Gym rep: ${gym.reputation}%. Ready to look at fights?`, choices: [
        { label: 'Show fights', action: 'open_calendar' }, { label: 'Maybe later', action: 'dismiss' },
      ]
    });
  });

  const openVisits = act(() => {
    pushDialog({
      speaker: 'STREETS', text: `Looking for opportunities...${sponsors.length > 0 ? ` ${sponsors.length} sponsor${sponsors.length > 1 ? 's' : ''}.` : ' No sponsors yet.'}`, choices: [
        { label: 'Next day', action: 'advance_day' }, { label: 'Head back', action: 'dismiss' },
      ]
    });
  });

  const openContracts = act(() => {
    if (fighters.length === 0) { pushDialog({ speaker: 'CONTRACTS', text: "No contracts." }); return; }
    pushDialog({
      speaker: 'CONTRACTS', text: fighters.map(f => `${f.name}: ${f.contractWeeksLeft}wk, $${f.salary}/wk`).join('\n'), choices: [
        { label: 'Full roster', action: 'open_roster' }, { label: 'Back', action: 'dismiss' },
      ]
    });
  });

  const handleForward = act(() => {
    advanceDay();
    const gs = useGameStore.getState().gameState;
    if (gs) {
      const todaysFight = gs.schedule.find((f) => f.day <= gs.day);
      if (todaysFight) {
        const fname = gs.fighters.find((f) => f.id === todaysFight.fighterId)?.name ?? 'Your fighter';
        pushDialog({
          speaker: 'PROMOTER', text: `FIGHT DAY! ${fname} vs ${todaysFight.opponent.name}!`, choices: [
            { label: 'ARENA', action: 'start_fight' }, { label: 'Wait', action: 'dismiss' },
          ]
        });
      }
    }
  });

  // ── App grid: 3x3 matching mockup layout ──
  const appGrid = [
    { label: 'FIGHTS', icon: '/icons/fights.svg', action: openFights, alert: hasFightToday },
    { label: 'GYM', icon: '/icons/gym.svg', action: openGym, alert: false },
    { label: 'TRAIN', icon: '/icons/train.svg', action: openTraining, alert: false },
    { label: 'SCOUT', icon: '/icons/scout.png', action: openScout, alert: false },
    { label: 'OFFICE', icon: '/icons/office.svg', action: openOffice, alert: false },
    { label: 'PROMOTOR', icon: '/icons/promotor.svg', action: openPromoter, alert: false },
    { label: 'VISIT', icon: '/icons/visits.svg', action: openVisits, alert: false },
    { label: 'CONTRACTS', icon: '/icons/contracts.svg', action: openContracts, alert: false },
    { label: '>FORWARD', icon: '/icons/dayforward.svg', action: handleForward, alert: false },
  ];

  // ── Dock bar: 3 bottom icons ──
  const dockItems = [
    { icon: '/icons/settings.svg', action: act(() => pushDialog({ speaker: 'SETTINGS', text: `Day ${day} — Week ${week}`, choices: [{ label: 'Save', action: 'save_game' }, { label: 'Back', action: 'dismiss' }] })) },
    { icon: '/icons/notifications.svg', action: act(() => pushDialog({ speaker: 'NEWS', text: nextFight ? `Next fight in ${nextFight.day - day} days.` : 'No upcoming events.' })) },
    { icon: '/icons/home.svg', action: act(() => { }) },
  ];

  const phoneUI = (
    <div className="phone-device">
      {/* Phone bezel frame as background */}
      <img src="/icons/phone-hub.svg" alt="" className="phone-bezel" />

      {/* Phone screen content */}
      <div className="phone-content">
        {/* Status bar */}
        <div className="phone-status">
          <span>mma-fi</span>
          <span>▮▮▮</span>
          <span>▊▊▊</span>
        </div>

        {/* 3x3 App grid */}
        <div className="phone-app-grid">
          {appGrid.map((app) => (
            <button key={app.label} className={`phone-app${app.alert ? ' phone-app--alert' : ''}`} onClick={app.action}>
              <div className="phone-app-icon">
                <img src={app.icon} alt="" draggable={false} />
              </div>
              <span className="phone-app-label">{app.label}</span>
              {app.alert && <span className="phone-app-badge">!</span>}
            </button>
          ))}
        </div>

        {/* Dock bar */}
        <div className="phone-dock">
          {dockItems.map((d, i) => (
            <button key={i} className="phone-dock-btn" onClick={d.action}>
              <img src={d.icon} alt="" draggable={false} />
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="hub-root">
      {/* Office scene */}
      <div className="hub-office">
        <img src="/bg/office.png" alt="" className="hub-office-bg" />
        <div className="hub-character">
          {manager.sprite ? (
            <img src={manager.sprite} alt={manager.name} className="hub-character-img" />
          ) : manager.portrait ? (
            <img src={manager.portrait} alt={manager.name} className="hub-character-img" />
          ) : (
            <div className="hub-character-placeholder">
              <div className="hub-character-silhouette">👤</div>
            </div>
          )}
        </div>
        <img src="/bg/desk.svg" alt="" className="hub-desk-fg" />

        {/* HUD */}
        <div className="hub-hud">
          <div className="hub-hud-row">
            <span className="hub-hud-label">Money</span>
            <div className="hub-hud-bar"><div className="hub-hud-fill hub-hud-fill--money" style={{ width: `${moneyPercent}%` }} /></div>
            <span className="hub-hud-value">${money.toLocaleString()}</span>
          </div>
          <div className="hub-hud-row">
            <span className="hub-hud-label">Morale</span>
            <div className="hub-hud-bar"><div className="hub-hud-fill hub-hud-fill--morale" style={{ width: `${moralePercent}%` }} /></div>
            {topFighter && <span className="hub-hud-value">{moralePercent}%</span>}
          </div>
          <div className="hub-hud-row">
            <span className="hub-hud-label">Rep</span>
            <div className="hub-hud-bar"><div className="hub-hud-fill hub-hud-fill--rep" style={{ width: `${reputationPercent}%` }} /></div>
          </div>
        </div>
        <div className="hub-day-badge">DAY {day} &middot; WEEK {week}</div>

        {/* Mobile toggle */}
        <button className="hub-phone-toggle" onClick={() => setMobileMenuOpen(true)}>
          <img src="/icons/manage.svg" alt="Menu" draggable={false} />
        </button>
      </div>

      {/* Desktop: phone floats in the right panel */}
      <div className="hub-phone-panel">
        {phoneUI}
      </div>

      {/* Mobile: full-screen phone overlay */}
      {mobileMenuOpen && (
        <div className="hub-phone-overlay" onClick={() => setMobileMenuOpen(false)}>
          <div className="hub-phone-overlay-inner" onClick={(e) => e.stopPropagation()}>
            <button className="hub-phone-overlay-close" onClick={() => setMobileMenuOpen(false)}>✕</button>
            {phoneUI}
          </div>
        </div>
      )}
    </div>
  );
}
