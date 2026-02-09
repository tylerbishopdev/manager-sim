import { useState } from 'react';
import { useGameStore } from '../../store/gameStore';
import { generateFighter } from '../../services/fighterGen';
import StatBar from '../StatBar';
import type { Fighter } from '../../types/gameplay';

export default function ScoutPanel() {
  const { gameState, manager, setScreen, addFighter, spendMoney, pushDialog } = useGameStore();
  if (!gameState || !manager) return null;

  // Generate pool of available fighters based on manager scouting skill
  const [pool] = useState<Fighter[]>(() => {
    const tiers = manager.scouting >= 7
      ? ['local', 'regional', 'national'] as const
      : manager.scouting >= 4
        ? ['scrub', 'local', 'regional'] as const
        : ['scrub', 'local'] as const;
    return Array.from({ length: 4 + Math.floor(manager.connections / 3) }, () =>
      generateFighter({ tier: tiers[Math.floor(Math.random() * tiers.length)] })
    );
  });

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [scouted, setScouted] = useState<Set<string>>(new Set());

  const selected = pool.find((f) => f.id === selectedId);
  const scoutCost = Math.max(0, 200 - manager.scouting * 20); // free at scouting 10

  const handleScout = (f: Fighter) => {
    if (scouted.has(f.id)) return;
    if (!spendMoney(scoutCost)) {
      pushDialog({ speaker: 'SCOUT', text: `Need $${scoutCost} to scout. You're short.` });
      return;
    }
    setScouted(new Set(scouted).add(f.id));
  };

  const handleSign = (f: Fighter) => {
    if (gameState.fighters.length >= gameState.gym.maxFighters) {
      pushDialog({ speaker: 'SYSTEM', text: 'Roster is full! Upgrade your gym for more slots.' });
      return;
    }
    const signingBonus = f.salary * 2;
    if (!spendMoney(signingBonus)) {
      pushDialog({ speaker: 'SCOUT', text: `Need $${signingBonus} signing bonus. Can't afford it.` });
      return;
    }
    const signed: Fighter = {
      ...f,
      contractWeeksLeft: 8 + Math.floor(manager.negotiation * 1.5),
      signedDay: gameState.day,
    };
    addFighter(signed);
    pushDialog({ speaker: 'SCOUT', text: `${f.name} SIGNED! Welcome to the team.` });
    setScreen('overworld');
  };

  return (
    <div className="scanlines" style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10, 10, 26, 0.97)',
      zIndex: 40,
      display: 'flex',
      fontFamily: '"Press Start 2P", monospace',
    }}>
      {/* Left: Fighter list */}
      <div style={{ flex: '0 0 320px', padding: 20, borderRight: '2px solid #222', overflow: 'auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ fontSize: 12, color: '#d4a017', letterSpacing: 3 }}>SCOUT</h2>
          <button className="btn-outline" onClick={() => setScreen('overworld')}>✕</button>
        </div>
        <div style={{ fontSize: 7, color: '#666', marginBottom: 12 }}>
          Scout cost: ${scoutCost} | Roster: {gameState.fighters.length}/{gameState.gym.maxFighters}
        </div>

        {pool.map((f) => (
          <div
            key={f.id}
            onClick={() => setSelectedId(f.id)}
            style={{
              border: `2px solid ${selectedId === f.id ? '#d4a017' : '#333'}`,
              padding: 10, marginBottom: 6, cursor: 'pointer',
              background: selectedId === f.id ? 'rgba(212,160,23,0.1)' : '#12122a',
            }}
          >
            <div style={{ fontSize: 8, color: '#d4a017' }}>{f.name}</div>
            <div style={{ fontSize: 7, color: '#888' }}>
              {f.weightClass.toUpperCase()} • {f.wins}W-{f.losses}L • ${f.salary}/wk
            </div>
          </div>
        ))}
      </div>

      {/* Right: Selected fighter details */}
      <div style={{ flex: 1, padding: 24, overflow: 'auto' }}>
        {selected ? (
          <>
            <div style={{ fontSize: 12, color: '#d4a017', marginBottom: 4, letterSpacing: 2 }}>
              {selected.name}
            </div>
            <div style={{ fontSize: 8, color: '#888', marginBottom: 16 }}>
              "{selected.nickname}" • {selected.weightClass.toUpperCase()} •{' '}
              {selected.personality.toUpperCase()} • {selected.wins}W-{selected.losses}L
            </div>

            {/* Stats */}
            <div style={{ marginBottom: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
              <StatBar label="STRIKING" value={selected.stats.striking} />
              <StatBar label="GRAPPLING" value={selected.stats.grappling} />
              <StatBar label="CARDIO" value={selected.stats.conditioning} />
              <StatBar label="DURABILITY" value={selected.stats.durability} />
            </div>

            {/* Potential (if scouted) */}
            {scouted.has(selected.id) ? (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 8, color: '#f0d060', marginBottom: 6, letterSpacing: 2 }}>
                  ★ POTENTIAL (SCOUTED)
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                  <StatBar label="STR POT" value={selected.potential.striking} />
                  <StatBar label="GRP POT" value={selected.potential.grappling} />
                  <StatBar label="CRD POT" value={selected.potential.conditioning} />
                  <StatBar label="DUR POT" value={selected.potential.durability} />
                </div>
              </div>
            ) : (
              <button
                className="btn-outline"
                onClick={() => handleScout(selected)}
                style={{ marginBottom: 16 }}
              >
                SCOUT (${scoutCost})
              </button>
            )}

            {/* Contract info */}
            <div style={{ fontSize: 8, color: '#888', marginBottom: 16, lineHeight: 2 }}>
              Asking salary: ${selected.salary}/wk<br />
              Signing bonus: ${selected.salary * 2}<br />
              Fight bonus: {selected.fightBonus}% of purse<br />
            </div>

            <button className="btn-gold" onClick={() => handleSign(selected)}>
              SIGN FIGHTER (${selected.salary * 2})
            </button>
          </>
        ) : (
          <div style={{ fontSize: 9, color: '#555', textAlign: 'center', marginTop: 60 }}>
            Select a fighter to view details
          </div>
        )}
      </div>
    </div>
  );
}
