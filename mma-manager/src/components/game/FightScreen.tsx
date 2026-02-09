import { useState, useEffect, useRef } from 'react';
import { useGameStore } from '../../store/gameStore';
import { simulateFight } from '../../services/fightSim';
import type { FightOutcome, FightRoundEvent, ScheduledFight, Fighter } from '../../types/gameplay';

export default function FightScreen() {
  const { gameState, setScreen } = useGameStore();
  if (!gameState) return null;

  const todaysFight = gameState.schedule.find((f) => f.day <= gameState.day);
  if (!todaysFight) {
    return (
      <div className="scanlines" style={fullScreen}>
        <div style={{ fontSize: 10, color: '#888' }}>No fight scheduled.</div>
        <button className="btn-outline" onClick={() => setScreen('overworld')}>BACK</button>
      </div>
    );
  }

  const fighter = gameState.fighters.find((f) => f.id === todaysFight.fighterId);
  if (!fighter) return null;

  return <FightSimulation fight={todaysFight} fighter={fighter} />;
}

function FightSimulation({ fight, fighter }: { fight: ScheduledFight; fighter: Fighter }) {
  const { setScreen, recordFight, updateFighter } = useGameStore();

  const [phase, setPhase] = useState<'intro' | 'fighting' | 'result'>('intro');
  const [outcome, setOutcome] = useState<FightOutcome | null>(null);
  const [currentRound, setCurrentRound] = useState(0);
  const [visibleEvents, setVisibleEvents] = useState<FightRoundEvent[]>([]);
  const [f1Hp, setF1Hp] = useState(100);
  const [f2Hp, setF2Hp] = useState(100);
  const eventIdx = useRef(0);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const startFight = () => {
    const result = simulateFight(fight, fighter);
    setOutcome(result);
    setPhase('fighting');
    setCurrentRound(1);
    eventIdx.current = 0;
    setVisibleEvents([]);

    // Play back events with delays
    playRound(result, 0);
  };

  const playRound = (result: FightOutcome, roundIdx: number) => {
    if (roundIdx >= result.rounds.length) {
      // Fight over
      setTimeout(() => setPhase('result'), 1500);
      return;
    }

    const round = result.rounds[roundIdx];
    setCurrentRound(round.number);
    setVisibleEvents((prev) => [...prev, {
      text: `═══ ROUND ${round.number} ═══`,
      type: 'info',
      fighter: 'player',
    }]);

    let idx = 0;
    timerRef.current = setInterval(() => {
      if (idx >= round.events.length) {
        if (timerRef.current) clearInterval(timerRef.current);
        // Update HP at end of round
        setF1Hp(round.f1HpEnd);
        setF2Hp(round.f2HpEnd);

        // Next round after pause
        setTimeout(() => playRound(result, roundIdx + 1), 1200);
        return;
      }

      setVisibleEvents((prev) => [...prev, round.events[idx]]);

      // Interpolate HP during round
      const progress = (idx + 1) / round.events.length;
      const prevHp1 = roundIdx > 0 ? result.rounds[roundIdx - 1].f1HpEnd : 100;
      const prevHp2 = roundIdx > 0 ? result.rounds[roundIdx - 1].f2HpEnd : 100;
      setF1Hp(prevHp1 + (round.f1HpEnd - prevHp1) * progress);
      setF2Hp(prevHp2 + (round.f2HpEnd - prevHp2) * progress);

      idx++;
    }, 800);
  };

  // Auto scroll log
  useEffect(() => {
    if (logRef.current) {
      logRef.current.scrollTop = logRef.current.scrollHeight;
    }
  }, [visibleEvents]);

  // Cleanup
  useEffect(() => () => { if (timerRef.current) clearInterval(timerRef.current); }, []);

  const handleFinish = () => {
    if (!outcome) return;
    const won = outcome.winnerId === fighter.id;

    // Update fighter
    updateFighter(fighter.id, {
      wins: won ? fighter.wins + 1 : fighter.wins,
      losses: won ? fighter.losses : fighter.losses + 1,
      health: Math.max(10, f1Hp),
      morale: Math.min(100, Math.max(0, fighter.morale + (won ? 15 : -20))),
      injury: outcome.injuryToPlayer,
      injuryDaysLeft: outcome.injuryToPlayer === 'minor' ? 5 : outcome.injuryToPlayer === 'major' ? 14 : 0,
      fame: Math.min(100, Math.max(0, fighter.fame + outcome.fameGain)),
    });

    recordFight(outcome);
    setScreen('overworld');
  };

  // ── Intro Screen ──
  if (phase === 'intro') {
    return (
      <div className="scanlines" style={{
        ...fullScreen,
        flexDirection: 'column',
        gap: 16,
      }}>
        <div style={{ fontSize: 10, color: '#888', letterSpacing: 4 }}>
          {fight.venue.toUpperCase()}
          {fight.isMainEvent && <span style={{ color: '#d4a017' }}> ★ MAIN EVENT</span>}
        </div>

        <div style={{ display: 'flex', gap: 40, alignItems: 'center' }}>
          {/* Fighter 1 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, background: '#1a1a3e', border: '2px solid #d4a017', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 8 }}>🥊</div>
            <div style={{ fontSize: 10, color: '#d4a017' }}>{fighter.name.split('"')[0]}</div>
            <div style={{ fontSize: 7, color: '#888' }}>"{fighter.nickname}"</div>
            <div style={{ fontSize: 8, color: '#aaa', marginTop: 4 }}>{fighter.wins}W-{fighter.losses}L</div>
          </div>

          <div style={{ fontSize: 16, color: '#d4a017' }}>VS</div>

          {/* Fighter 2 */}
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 100, height: 100, background: '#1a1a3e', border: '2px solid #e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, marginBottom: 8 }}>🥊</div>
            <div style={{ fontSize: 10, color: '#e74c3c' }}>{fight.opponent.name.split('"')[0]}</div>
            <div style={{ fontSize: 7, color: '#888' }}>"{fight.opponent.nickname}"</div>
            <div style={{ fontSize: 8, color: '#aaa', marginTop: 4 }}>{fight.opponent.wins}W-{fight.opponent.losses}L</div>
          </div>
        </div>

        {/* Purse info */}
        <div style={{ fontSize: 8, color: '#4ade80', marginTop: 8 }}>
          Purse: ${fight.basePurse.toLocaleString()}
          {fight.ppvPoints > 0 && ` + ${fight.ppvPoints}% PPV`}
        </div>

        <button className="btn-gold" onClick={startFight} style={{ marginTop: 12 }}>
          FIGHT! ▶
        </button>
      </div>
    );
  }

  // ── Fighting / Result Screen ──
  return (
    <div className="scanlines" style={{
      ...fullScreen,
      flexDirection: 'column',
      justifyContent: 'space-between',
      padding: 0,
    }}>
      {/* Top: Fighters + HP */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        padding: '16px 24px',
        background: 'rgba(0,0,0,0.5)',
      }}>
        {/* Player fighter */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div style={{ width: 64, height: 64, background: '#1a1a3e', border: '2px solid #d4a017', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🥊</div>
          <div>
            <div style={{ fontSize: 9, color: '#d4a017' }}>{fighter.name.split('"')[0]}</div>
            <HpBar hp={f1Hp} color="#d4a017" />
          </div>
        </div>

        {/* Round indicator */}
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: 8, color: '#888' }}>ROUND</div>
          <div style={{ fontSize: 20, color: '#d4a017' }}>{currentRound}</div>
        </div>

        {/* Opponent */}
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexDirection: 'row-reverse' }}>
          <div style={{ width: 64, height: 64, background: '#1a1a3e', border: '2px solid #e74c3c', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🥊</div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 9, color: '#e74c3c' }}>{fight.opponent.name.split('"')[0]}</div>
            <HpBar hp={f2Hp} color="#e74c3c" />
          </div>
        </div>
      </div>

      {/* Middle: Arena (placeholder) */}
      <div style={{
        flex: 1,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'radial-gradient(ellipse at center, #2a1a1a 0%, #0a0a1a 70%)',
      }}>
        {phase === 'result' && outcome ? (
          <div style={{ textAlign: 'center' }}>
            <div style={{
              fontSize: 20,
              color: outcome.winnerId === fighter.id ? '#4ade80' : '#ef4444',
              textShadow: '0 0 20px currentColor',
              marginBottom: 16,
            }}>
              {outcome.winnerId === fighter.id ? 'VICTORY!' : 'DEFEAT'}
            </div>
            <div style={{ fontSize: 10, color: '#aaa', marginBottom: 4 }}>
              {outcome.result.toUpperCase()} — Round {outcome.finalRound}
            </div>
            <div style={{ fontSize: 9, color: '#4ade80', marginBottom: 8 }}>
              Earnings: ${outcome.earnings.total.toLocaleString()}
            </div>
            {outcome.injuryToPlayer !== 'none' && (
              <div style={{ fontSize: 8, color: '#ef4444', marginBottom: 8 }}>
                Injury: {outcome.injuryToPlayer.toUpperCase()}
              </div>
            )}
            <button className="btn-gold" onClick={handleFinish}>CONTINUE ▶</button>
          </div>
        ) : (
          <div style={{ fontSize: 10, color: '#555', letterSpacing: 4 }}>
            ⚔️ FIGHT IN PROGRESS
          </div>
        )}
      </div>

      {/* Bottom: Commentary log (lower third) */}
      <div
        ref={logRef}
        style={{
          height: '30vh',
          background: 'rgba(0,0,0,0.85)',
          borderTop: '2px solid #333',
          padding: '12px 20px',
          overflow: 'auto',
          fontFamily: '"Press Start 2P", monospace',
        }}
      >
        {visibleEvents.map((evt, i) => (
          <div key={i} style={{
            fontSize: 8,
            color: eventColor(evt),
            marginBottom: 4,
            lineHeight: 1.6,
            opacity: i === visibleEvents.length - 1 ? 1 : 0.7,
          }}>
            {evt.text}
          </div>
        ))}
      </div>
    </div>
  );
}

function HpBar({ hp, color }: { hp: number; color: string }) {
  return (
    <div style={{ width: 140, height: 12, background: '#111', border: '1px solid #333', marginTop: 4 }}>
      <div style={{
        width: `${Math.max(0, hp)}%`,
        height: '100%',
        background: hp > 50 ? color : hp > 25 ? '#f97316' : '#ef4444',
        transition: 'width 0.3s',
      }} />
    </div>
  );
}

function eventColor(evt: FightRoundEvent): string {
  switch (evt.type) {
    case 'knockout': return '#ef4444';
    case 'submission': return '#a855f7';
    case 'strike': return evt.fighter === 'player' ? '#4ade80' : '#f97316';
    case 'grapple': return evt.fighter === 'player' ? '#60a5fa' : '#f97316';
    case 'taunt': return '#f0d060';
    case 'info': return '#d4a017';
    default: return '#888';
  }
}

const fullScreen: React.CSSProperties = {
  position: 'fixed', inset: 0,
  background: '#0a0a1a',
  zIndex: 40,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontFamily: '"Press Start 2P", monospace',
};
