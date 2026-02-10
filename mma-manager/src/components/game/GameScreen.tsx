import { useGameStore } from '../../store/gameStore';
import HubScreen from './HubScreen';
import DialogBox from './DialogBox';
import RosterPanel from './RosterPanel';
import FinancePanel from './FinancePanel';
import ScoutPanel from './ScoutPanel';
import ContractPanel from './ContractPanel';
import FightScreen from './FightScreen';

/** Root gameplay component — renders hub + overlay panels + dialog */
export default function GameScreen() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const screen = gameState.activeScreen;

  return (
    <div style={{ width: '100vw', height: '100dvh', position: 'relative' }}>
      {/* Hub always renders underneath */}
      <HubScreen />

      {/* Overlay panels */}
      {screen === 'roster' && <RosterPanel />}
      {screen === 'finance' && <FinancePanel />}
      {screen === 'scout' && <ScoutPanel />}
      {screen === 'contract' && <ContractPanel />}
      {(screen === 'prefight' || screen === 'fight') && <FightScreen />}

      {/* Dialog always on top */}
      <DialogBox />
    </div>
  );
}
