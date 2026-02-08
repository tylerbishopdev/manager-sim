import { useGameStore } from '../../store/gameStore';

export default function FinancePanel() {
  const { gameState, setScreen } = useGameStore();
  if (!gameState) return null;

  const weeklyExpenses = {
    salaries: gameState.fighters.reduce((s, f) => s + f.salary, 0),
    gymRent: gameState.gym.rent,
    total: 0,
  };
  weeklyExpenses.total = weeklyExpenses.salaries + weeklyExpenses.gymRent;

  const lastFight = gameState.fightHistory[gameState.fightHistory.length - 1];

  return (
    <div className="scanlines" style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10, 10, 26, 0.97)',
      zIndex: 40,
      display: 'flex', flexDirection: 'column',
      padding: 24,
      fontFamily: '"Press Start 2P", monospace',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ fontSize: 14, color: '#d4a017', letterSpacing: 4 }}>FINANCES</h2>
        <button className="btn-outline" onClick={() => setScreen('overworld')}>✕ CLOSE</button>
      </div>

      <div style={{ width: 200, height: 1, marginBottom: 20, background: 'linear-gradient(90deg, #d4a017, transparent)' }} />

      {/* Balance */}
      <div style={{
        border: '2px solid #333', padding: 16, background: '#12122a', marginBottom: 16,
      }}>
        <div style={{ fontSize: 8, color: '#888', marginBottom: 4 }}>CURRENT BALANCE</div>
        <div style={{
          fontSize: 20, color: gameState.money >= 0 ? '#4ade80' : '#ef4444',
          textShadow: '0 0 10px currentColor',
        }}>
          ${gameState.money.toLocaleString()}
        </div>
      </div>

      {/* Weekly expenses */}
      <div style={{ border: '2px solid #333', padding: 16, background: '#12122a', marginBottom: 16 }}>
        <div style={{ fontSize: 9, color: '#ef4444', marginBottom: 8, letterSpacing: 2 }}>
          WEEKLY EXPENSES
        </div>
        <Row label="Fighter Salaries" value={-weeklyExpenses.salaries} />
        <Row label="Gym Rent" value={-weeklyExpenses.gymRent} />
        <div style={{ borderTop: '1px solid #333', marginTop: 8, paddingTop: 8 }}>
          <Row label="TOTAL / WEEK" value={-weeklyExpenses.total} bold />
        </div>
      </div>

      {/* Last fight earnings */}
      {lastFight && (
        <div style={{ border: '2px solid #333', padding: 16, background: '#12122a', marginBottom: 16 }}>
          <div style={{ fontSize: 9, color: '#4ade80', marginBottom: 8, letterSpacing: 2 }}>
            LAST FIGHT EARNINGS
          </div>
          <Row label="Base Purse" value={lastFight.earnings.basePurse} />
          <Row label="Win Bonus" value={lastFight.earnings.winBonus} />
          <Row label="PPV Revenue" value={lastFight.earnings.ppvRevenue} />
          <Row label="Ticket Revenue" value={lastFight.earnings.ticketRevenue} />
          <Row label="Sponsor Bonuses" value={lastFight.earnings.sponsorBonuses} />
          <Row label="Medical Costs" value={-lastFight.earnings.medicalCosts} />
          <div style={{ borderTop: '1px solid #333', marginTop: 8, paddingTop: 8 }}>
            <Row label="NET" value={lastFight.earnings.total} bold />
          </div>
        </div>
      )}

      {/* Career stats */}
      <div style={{ border: '2px solid #333', padding: 16, background: '#12122a' }}>
        <div style={{ fontSize: 9, color: '#888', marginBottom: 8, letterSpacing: 2 }}>CAREER</div>
        <Row label="Total Earned" value={gameState.totalEarnings} />
        <Row label="Total Spent" value={-gameState.totalSpent} />
        <Row label="Fights" value={gameState.fightHistory.length} plain />
        <Row label="Gym Level" value={gameState.gym.level} plain />
      </div>
    </div>
  );
}

function Row({ label, value, bold, plain }: { label: string; value: number; bold?: boolean; plain?: boolean }) {
  const color = plain ? '#aaa' : value >= 0 ? '#4ade80' : '#ef4444';
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between',
      fontSize: bold ? 9 : 8,
      color: bold ? color : '#aaa',
      marginBottom: 4,
    }}>
      <span>{label}</span>
      <span style={{ color }}>
        {plain ? value : (value >= 0 ? '+' : '') + '$' + Math.abs(value).toLocaleString()}
      </span>
    </div>
  );
}
