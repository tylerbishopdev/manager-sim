import { useGameStore } from '../../store/gameStore';
import StatBar from '../StatBar';

export default function RosterPanel() {
  const { gameState, setScreen } = useGameStore();
  if (!gameState) return null;

  return (
    <div className="scanlines" style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10, 10, 26, 0.97)',
      zIndex: 40,
      display: 'flex', flexDirection: 'column',
      padding: 24,
      fontFamily: '"Press Start 2P", monospace',
      overflow: 'auto',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, color: '#d4a017', letterSpacing: 4 }}>ROSTER</h2>
        <button className="btn-outline" onClick={() => setScreen('overworld')}>✕ CLOSE</button>
      </div>

      <div style={{
        width: 200, height: 1, marginBottom: 16,
        background: 'linear-gradient(90deg, #d4a017, transparent)',
      }} />

      {gameState.fighters.length === 0 ? (
        <div style={{ fontSize: 9, color: '#666', textAlign: 'center', marginTop: 40 }}>
          No fighters signed. Go scout some talent downtown!
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {gameState.fighters.map((f) => (
            <div key={f.id} style={{
              border: '2px solid #333',
              padding: 16,
              background: '#12122a',
              display: 'flex',
              gap: 20,
            }}>
              {/* Avatar placeholder */}
              <div style={{
                width: 80, height: 80,
                background: '#1a1a3e',
                border: '2px solid #444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28,
              }}>
                🥊
              </div>

              {/* Info */}
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: '#d4a017', marginBottom: 4 }}>{f.name}</div>
                <div style={{ fontSize: 7, color: '#888', marginBottom: 8 }}>
                  {f.weightClass.toUpperCase()} • {f.wins}W-{f.losses}L • {f.personality.toUpperCase()}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  <StatBar label="STRIKING" value={f.stats.striking} />
                  <StatBar label="GRAPPLING" value={f.stats.grappling} />
                  <StatBar label="CARDIO" value={f.stats.conditioning} />
                  <StatBar label="DURABILITY" value={f.stats.durability} />
                </div>

                <div style={{ display: 'flex', gap: 16, marginTop: 8, fontSize: 7 }}>
                  <span style={{ color: f.health > 50 ? '#4ade80' : '#ef4444' }}>
                    HP: {f.health}%
                  </span>
                  <span style={{ color: f.morale > 50 ? '#60a5fa' : '#f97316' }}>
                    MORALE: {f.morale}%
                  </span>
                  <span style={{ color: '#888' }}>
                    ${f.salary}/wk
                  </span>
                  <span style={{ color: '#888' }}>
                    {f.contractWeeksLeft}wk left
                  </span>
                  {f.injury !== 'none' && (
                    <span style={{ color: '#ef4444' }}>
                      INJURED ({f.injury}) — {f.injuryDaysLeft}d
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
