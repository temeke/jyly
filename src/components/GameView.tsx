import { useState, useEffect } from 'react';
import { useJylyStore } from '../store';

export default function GameView() {
  const [inputHits, setInputHits] = useState<string>('');
  const { 
    currentGame, 
    getCurrentPlayer, 
    addRound, 
    nextTurn, 
    resetGame,
    calculateNextDistance,
    undoLastRound,
    canUndo
  } = useJylyStore();

  const currentPlayer = getCurrentPlayer();

  if (!currentGame || !currentPlayer) {
    return <div>Peli ei löytynyt</div>;
  }

  // Auto-advance when hits are selected
  useEffect(() => {
    if (inputHits !== '' && !isNaN(parseInt(inputHits))) {
      const hits = parseInt(inputHits);
      if (hits >= 0 && hits <= 5) {
        const timer = setTimeout(() => {
          addRound(currentPlayer.id, hits);
          nextTurn();
          setInputHits('');
        }, 500); // 0.5s delay to show selection
        
        return () => clearTimeout(timer);
      }
    }
  }, [inputHits, currentPlayer.id, addRound, nextTurn]);

  const handleHitSelection = (hits: number) => {
    setInputHits(hits.toString());
  };

  const handleUndo = () => {
    undoLastRound();
    setInputHits('');
  };

  const getCurrentDistance = () => {
    if (currentPlayer.rounds.length === 0) {
      return 10; // Aloitus etäisyys
    }
    const lastRound = currentPlayer.rounds[currentPlayer.rounds.length - 1];
    return calculateNextDistance(lastRound.hits);
  };

  const getLastRoundInfo = (player: any) => {
    if (player.rounds.length === 0) return null;
    const lastRound = player.rounds[player.rounds.length - 1];
    return lastRound;
  };

  const currentDistance = getCurrentDistance();
  const totalThrows = currentGame.players.reduce((sum, player) => sum + player.rounds.length, 0);
  const maxThrows = currentGame.players.length * 20;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto pt-4">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center mb-4">
            <h1 className="text-2xl font-bold text-green-800">
              Kierros {currentGame.currentRound}/{currentGame.maxRounds}
            </h1>
            <div className="flex gap-2">
              {canUndo() && (
                <button
                  onClick={handleUndo}
                  className="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
                >
                  ↶ Peru
                </button>
              )}
              <button
                onClick={resetGame}
                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Lopeta
              </button>
            </div>
          </div>
          
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div 
              className="bg-green-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(totalThrows / maxThrows) * 100}%` }}
            ></div>
          </div>
          <p className="text-sm text-gray-600 mt-2">
            Heitot: {totalThrows}/{maxThrows}
          </p>
        </div>

        {/* Current Player */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4 text-center">
            {currentPlayer.name} - Vuorossa
          </h2>
          
          <div className="text-center mb-6">
            <div className="text-4xl font-bold text-green-600 mb-2">
              {currentDistance}m
            </div>
            <p className="text-gray-600">Heittoetäisyys</p>
          </div>

          <div className="flex justify-center mb-6">
            <div className="flex gap-2">
              {[0, 1, 2, 3, 4, 5].map(num => (
                <button
                  key={num}
                  onClick={() => handleHitSelection(num)}
                  disabled={inputHits !== ''}
                  className={`min-w-12 h-12 rounded-lg font-semibold transition-all ${
                    inputHits === num.toString()
                      ? 'bg-green-600 text-white shadow-lg scale-110'
                      : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
                  } ${inputHits !== '' && inputHits !== num.toString() ? 'opacity-50' : ''}`}
                >
                  {num}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Scoreboard */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-xl font-semibold mb-4">Pisteetilanne</h3>
          <div className="space-y-3">
            {currentGame.players
              .slice()
              .sort((a, b) => b.totalScore - a.totalScore)
              .map((player, index) => (
                <div 
                  key={player.id}
                  className={`flex justify-between items-center p-3 rounded-lg ${
                    player.id === currentPlayer.id
                      ? 'bg-green-100 border-2 border-green-500'
                      : 'bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="font-semibold text-gray-600">
                      #{index + 1}
                    </span>
                    <div className="flex flex-col">
                      <span className="font-semibold">
                        {player.name}
                      </span>
                      <span className="text-xs text-gray-600">
                        ({player.rounds.length}/{currentGame.maxRounds} kierrosta)
                      </span>
                    </div>
                    {(() => {
                      const lastRound = getLastRoundInfo(player);
                      return lastRound && (
                        <span className="text-xs bg-gray-200 px-2 py-1 rounded">
                          Viimeksi: +{lastRound.points}p ({lastRound.distance}m)
                        </span>
                      );
                    })()}
                  </div>
                  <span className="text-xl font-bold text-green-600">
                    {player.totalScore}
                  </span>
                </div>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}