import { useState, useMemo } from 'react';
import { useGameStore } from '../../store/gameStore';
import { generateOpponent } from '../../services/fighterGen';
import { VENUE_NAMES } from '../../data/fighterNames';
import StatBar from '../StatBar';
import type { ScheduledFight, Fighter } from '../../types/gameplay';

function pick<T>(arr: T[]): T { return arr[Math.floor(Math.random() * arr.length)]; }
function rng(min: number, max: number) { return Math.floor(Math.random() * (max - min + 1)) + min; }

export default function ContractPanel() {
  const { gameState, manager, setScreen, addFight, pushDialog } = useGameStore();
  if (!gameState || !manager) return null;

  const availableFighters = gameState.fighters.filter(
    (f) => f.injury === 'none' && !gameState.schedule.some((s) => s.fighterId === f.id)
  );

  // Generate available fight offers
  const [offers] = useState(() => {
    const count = 2 + Math.floor(manager.connections / 3);
    return Array.from({ length: count }, (_, i) => {
      const prestige = rng(1, Math.min(10, 3 + Math.floor(manager.connections / 2)));
      const isMain = prestige >= 7 && Math.random() < 0.3;
      return {
        id: `offer-${i}-${Date.now()}`,
        venue: pick(VENUE_NAMES),
        prestige,
        isMainEvent: isMain,
        basePurse: prestige * 500 + rng(500, 2000),
        ppvPoints: isMain ? rng(2, 8) : 0,
        ticketRevenueSplit: rng(5, 15 + manager.negotiation * 2),
        daysOut: rng(3, 14),
        difficulty: rng(-1, 2),
      };
    });
  });

  const [selectedOffer, setSelectedOffer] = useState<number | null>(null);
  const [selectedFighter, setSelectedFighter] = useState<string | null>(null);

  const handleBook = () => {
    if (selectedOffer === null || !selectedFighter) return;
    const offer = offers[selectedOffer];
    const fighter = gameState.fighters.find((f) => f.id === selectedFighter);
    if (!fighter) return;

    const opponent = generateOpponent(fighter, offer.difficulty);
    const fight: ScheduledFight = {
      id: `fight-${Date.now()}`,
      day: gameState.day + offer.daysOut,
      fighterId: fighter.id,
      opponent,
      venue: offer.venue,
      isMainEvent: offer.isMainEvent,
      basePurse: offer.basePurse,
      ppvPoints: offer.ppvPoints,
      ticketRevenueSplit: offer.ticketRevenueSplit,
      prestige: offer.prestige,
    };

    addFight(fight);
    pushDialog({
      speaker: 'PROMOTER',
      text: `Fight booked! ${fighter.name} vs ${opponent.name} at ${offer.venue} in ${offer.daysOut} days. Don't let me down!`,
    });
    setScreen('overworld');
  };

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
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, color: '#d4a017', letterSpacing: 4 }}>BOOK A FIGHT</h2>
        <button className="btn-outline" onClick={() => setScreen('overworld')}>✕ CLOSE</button>
      </div>

      {/* Step 1: Pick your fighter */}
      <div style={{ fontSize: 9, color: '#888', marginBottom: 8, letterSpacing: 2 }}>
        1. SELECT YOUR FIGHTER
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 20, flexWrap: 'wrap' }}>
        {availableFighters.length === 0 ? (
          <div style={{ fontSize: 8, color: '#555' }}>No available fighters (all injured or booked)</div>
        ) : (
          availableFighters.map((f) => (
            <div
              key={f.id}
              onClick={() => setSelectedFighter(f.id)}
              style={{
                border: `2px solid ${selectedFighter === f.id ? '#d4a017' : '#333'}`,
                padding: '8px 12px', cursor: 'pointer',
                background: selectedFighter === f.id ? 'rgba(212,160,23,0.1)' : '#12122a',
                fontSize: 8, color: selectedFighter === f.id ? '#f0d060' : '#aaa',
              }}
            >
              {f.name.split('"')[0].trim()} • {f.wins}W-{f.losses}L
            </div>
          ))
        )}
      </div>

      {/* Step 2: Pick an offer */}
      <div style={{ fontSize: 9, color: '#888', marginBottom: 8, letterSpacing: 2 }}>
        2. SELECT FIGHT OFFER
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
        {offers.map((offer, i) => (
          <div
            key={offer.id}
            onClick={() => setSelectedOffer(i)}
            style={{
              border: `2px solid ${selectedOffer === i ? '#d4a017' : '#333'}`,
              padding: 12, cursor: 'pointer',
              background: selectedOffer === i ? 'rgba(212,160,23,0.1)' : '#12122a',
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            }}
          >
            <div>
              <div style={{ fontSize: 9, color: '#d4a017', marginBottom: 2 }}>
                {offer.venue} {offer.isMainEvent ? '★ MAIN EVENT' : ''}
              </div>
              <div style={{ fontSize: 7, color: '#888' }}>
                Prestige: {'⭐'.repeat(Math.min(5, Math.ceil(offer.prestige / 2)))} •
                In {offer.daysOut} days
              </div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 9, color: '#4ade80' }}>${offer.basePurse.toLocaleString()}</div>
              <div style={{ fontSize: 7, color: '#888' }}>
                {offer.ppvPoints > 0 ? `+${offer.ppvPoints}% PPV` : 'No PPV'} •
                {offer.ticketRevenueSplit}% gate
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Book button */}
      {selectedOffer !== null && selectedFighter && (
        <button className="btn-gold" onClick={handleBook}>
          BOOK FIGHT ▶
        </button>
      )}
    </div>
  );
}
