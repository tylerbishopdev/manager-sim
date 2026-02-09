import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';

export default function DialogBox() {
  const { gameState, popDialog, setScreen } = useGameStore();
  if (!gameState || gameState.dialogQueue.length === 0) return null;

  const msg = gameState.dialogQueue[0];

  const handleChoice = (action: string) => {
    popDialog();

    switch (action) {
      case 'close':
        break;
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
      case 'advance_day': {
        const store = useGameStore.getState();
        store.advanceDay();
        store.pushDialog({ speaker: 'SYSTEM', text: `Day ${(store.gameState?.day ?? 0)} begins. Time to grind.` });
        break;
      }
      case 'save_game':
        if (gameState) {
          try {
            localStorage.setItem('mma_save', JSON.stringify({
              manager: useGameStore.getState().manager,
              gameState,
            }));
            useGameStore.getState().pushDialog({ speaker: 'SYSTEM', text: 'Game saved!' });
          } catch {
            useGameStore.getState().pushDialog({ speaker: 'SYSTEM', text: 'Save failed!' });
          }
        }
        break;
      case 'train_striking':
      case 'train_grappling':
      case 'train_conditioning': {
        const stat = action.replace('train_', '') as 'striking' | 'grappling' | 'conditioning';
        const store = useGameStore.getState();
        const gs = store.gameState;
        if (!gs || gs.fighters.length === 0) break;
        const cost = 200;
        if (gs.money < cost) {
          store.pushDialog({ speaker: 'TRAINER', text: `You need $${cost}. You're broke, boss.` });
          break;
        }
        const fighter = gs.fighters[0]; // Train first fighter for now
        const success = Math.random() < 0.7;
        store.spendMoney(cost);
        if (success && fighter.stats[stat] < 10) {
          store.updateFighter(fighter.id, {
            stats: { ...fighter.stats, [stat]: Math.min(10, fighter.stats[stat] + 1) },
            morale: Math.min(100, fighter.morale + 5),
          });
          store.pushDialog({
            speaker: 'TRAINER',
            text: `${fighter.name.split('"')[0]} improved their ${stat}! ($${cost})`,
          });
        } else {
          store.updateFighter(fighter.id, {
            morale: Math.max(0, fighter.morale - 3),
          });
          store.pushDialog({
            speaker: 'TRAINER',
            text: success
              ? `${stat} is already maxed out!`
              : `Rough session. No improvement today. ($${cost})`,
          });
        }
        break;
      }
      default:
        console.log('Unhandled action:', action);
    }
  };

  // Auto-dismiss simple messages with Enter/Space/E
  useEffect(() => {
    if (msg.choices && msg.choices.length > 0) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ' || e.key === 'e' || e.key === 'E') {
        popDialog();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [msg, popDialog]);

  return (
    <div style={{
      position: 'fixed',
      bottom: 24, left: '50%', transform: 'translateX(-50%)',
      width: 'min(90vw, 600px)',
      background: 'rgba(10, 10, 26, 0.95)',
      border: '3px solid #d4a017',
      padding: 16,
      zIndex: 50,
      fontFamily: '"Press Start 2P", monospace',
    }}>
      {/* Speaker */}
      {msg.speaker && (
        <div style={{
          fontSize: 9, color: '#d4a017', marginBottom: 8, letterSpacing: 2,
        }}>
          {msg.speaker}
        </div>
      )}

      {/* Text */}
      <div style={{ fontSize: 10, color: '#ddd', lineHeight: 1.8, marginBottom: msg.choices ? 12 : 0 }}>
        {msg.text}
      </div>

      {/* Choices */}
      {msg.choices && msg.choices.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {msg.choices.map((choice, i) => (
            <button
              key={i}
              onClick={() => handleChoice(choice.action)}
              style={{
                background: 'transparent',
                border: '2px solid #444',
                color: '#aaa',
                fontFamily: 'inherit',
                fontSize: 9,
                padding: '8px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#d4a017';
                e.currentTarget.style.color = '#f0d060';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = '#444';
                e.currentTarget.style.color = '#aaa';
              }}
            >
              ▸ {choice.label}
            </button>
          ))}
        </div>
      )}

      {/* Dismiss hint for simple messages */}
      {(!msg.choices || msg.choices.length === 0) && (
        <div style={{ fontSize: 7, color: '#555', marginTop: 8, textAlign: 'center' }}>
          PRESS ENTER TO CONTINUE
        </div>
      )}
    </div>
  );
}
