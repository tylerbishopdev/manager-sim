import { useState } from 'react';
import type { Screen, ManagerCharacter } from './types';
import { useGameStore } from './store/gameStore';
import TitleScreen from './components/TitleScreen';
import CharacterSelect from './components/CharacterSelect';
import CharacterCreator from './components/CharacterCreator';
import ConfirmScreen from './components/ConfirmScreen';
import GameScreen from './components/game/GameScreen';

export default function App() {
  const [screen, setScreen] = useState<Screen>('title');
  const [selectedManager, setSelectedManager] = useState<ManagerCharacter | null>(null);
  const { gameStarted, startGame } = useGameStore();

  // If game is running, render the gameplay
  if (gameStarted) {
    return <GameScreen />;
  }

  const handleSelectPreset = (char: ManagerCharacter) => {
    setSelectedManager(char);
    setScreen('confirm');
  };

  const handleCustomConfirm = (char: ManagerCharacter) => {
    setSelectedManager(char);
    setScreen('confirm');
  };

  const handleBegin = () => {
    if (selectedManager) {
      startGame(selectedManager);
    }
  };

  switch (screen) {
    case 'title':
      return <TitleScreen onStart={() => setScreen('select')} />;
    case 'select':
      return (
        <CharacterSelect
          onSelect={handleSelectPreset}
          onCustom={() => setScreen('create')}
          onBack={() => setScreen('title')}
        />
      );
    case 'create':
      return (
        <CharacterCreator
          onConfirm={handleCustomConfirm}
          onBack={() => setScreen('select')}
        />
      );
    case 'confirm':
      return selectedManager ? (
        <ConfirmScreen
          manager={selectedManager}
          onConfirm={handleBegin}
          onBack={() => setScreen(selectedManager.preset ? 'select' : 'create')}
        />
      ) : null;
    default:
      return null;
  }
}
