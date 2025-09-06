import { useJylyStore } from './store';
import GameSetup from './components/GameSetup';
import GameView from './components/GameView';
import GameComplete from './components/GameComplete';
import GameHistory from './components/GameHistory';

function App() {
  const { gameMode, currentGame } = useJylyStore();

  const renderCurrentView = () => {
    switch (gameMode) {
      case 'setup':
        return <GameSetup />;
      case 'playing':
        return <GameView />;
      case 'completed':
        return <GameComplete />;
      case 'history':
        return <GameHistory />;
      default:
        return <GameSetup />;
    }
  };

  // Jos peli on valmis mutta gameMode ei ole 'completed', korjaa se
  if (currentGame?.isCompleted && gameMode === 'playing') {
    useJylyStore.getState().setGameMode('completed');
  }

  return (
    <div className="min-h-screen">
      {renderCurrentView()}
    </div>
  );
}

export default App;
