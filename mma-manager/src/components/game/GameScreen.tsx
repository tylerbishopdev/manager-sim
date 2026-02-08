import { useGameStore } from '../../store/gameStore';
import OverworldCanvas from './OverworldCanvas';
import GameHUD from './GameHUD';
import DialogBox from './DialogBox';
import RosterPanel from './RosterPanel';
import FinancePanel from './FinancePanel';
import ScoutPanel from './ScoutPanel';
import ContractPanel from './ContractPanel';
import FightScreen from './FightScreen';

/** Root gameplay component — renders overworld + overlays based on activeScreen */
export default function GameScreen() {
  const { gameState } = useGameStore();
  if (!gameState) return null;

  const screen = gameState.activeScreen;

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      {/* Overworld always renders underneath */}
      <OverworldCanvas />
      <GameHUD />

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
