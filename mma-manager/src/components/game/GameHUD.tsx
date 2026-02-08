import { useGameStore } from '../../store/gameStore';

export default function GameHUD() {
  const { gameState, manager } = useGameStore();
  if (!gameState || !manager) return null;

  const { day, money, fighters, schedule } = gameState;
  const week = Math.ceil(day / 7);
  const nextFight = schedule.find((f) => f.day >= day);

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0,
      display: 'flex', justifyContent: 'space-between',
      padding: '8px 16px',
      background: 'linear-gradient(180deg, rgba(0,0,0,0.8) 0%, transparent 100%)',
      pointerEvents: 'none',
      zIndex: 10,
      fontFamily: '"Press Start 2P", monospace',
    }}>
      {/* Left: Manager info */}
      <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
        <div style={{ fontSize: 9, color: '#d4a017' }}>{manager.name}</div>
        <div style={{ fontSize: 8, color: '#888' }}>DAY {day} (WK {week})</div>
      </div>

      {/* Center: Quick stats */}
      <div style={{ display: 'flex', gap: 20, alignItems: 'center' }}>
        <div style={{ fontSize: 9, color: money >= 0 ? '#4ade80' : '#ef4444' }}>
          ${money.toLocaleString()}
        </div>
        <div style={{ fontSize: 8, color: '#888' }}>
          {fighters.length} FIGHTER{fighters.length !== 1 ? 'S' : ''}
        </div>
        {nextFight && (
          <div style={{ fontSize: 8, color: '#f0d060' }}>
            FIGHT IN {nextFight.day - day} DAY{nextFight.day - day !== 1 ? 'S' : ''}
          </div>
        )}
      </div>

      {/* Right: Controls hint */}
      <div style={{ fontSize: 7, color: '#555', textAlign: 'right' }}>
        <div>WASD: MOVE</div>
        <div>E/SPACE: INTERACT</div>
      </div>
    </div>
  );
}
