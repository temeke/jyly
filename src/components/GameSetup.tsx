import { useState } from 'react';
import { useJylyStore } from '../store';

export default function GameSetup() {
  const [playerNames, setPlayerNames] = useState<string[]>(['']);
  const [gameLength, setGameLength] = useState<number>(20);
  const createGame = useJylyStore(state => state.createGame);
  const setGameMode = useJylyStore(state => state.setGameMode);
  const getSavedPlayers = useJylyStore(state => state.getSavedPlayers);
  
  const savedPlayers = getSavedPlayers();
  
  // Suodata pois jo valitut pelaajat
  const availablePlayers = savedPlayers.filter(savedPlayer => 
    !playerNames.some(name => name.trim().toLowerCase() === savedPlayer.name.toLowerCase())
  );

  const addPlayer = () => {
    if (playerNames.length < 8) { // Max 8 pelaajaa
      setPlayerNames([...playerNames, '']);
    }
  };

  const removePlayer = (index: number) => {
    if (playerNames.length > 1) {
      setPlayerNames(playerNames.filter((_, i) => i !== index));
    }
  };

  const updatePlayerName = (index: number, name: string) => {
    const updated = [...playerNames];
    updated[index] = name;
    setPlayerNames(updated);
  };

  const selectSavedPlayer = (playerName: string) => {
    // Etsi ensimmäinen tyhjä kenttä tai lisää uusi
    const emptyIndex = playerNames.findIndex(name => name.trim() === '');
    if (emptyIndex !== -1) {
      updatePlayerName(emptyIndex, playerName);
    } else if (playerNames.length < 8) {
      setPlayerNames([...playerNames, playerName]);
    }
  };

  const startGame = () => {
    const validNames = playerNames.filter(name => name.trim() !== '');
    if (validNames.length > 0) {
      createGame(validNames, gameLength);
    }
  };

  const showHistory = () => {
    setGameMode('history');
  };

  const canStartGame = playerNames.some(name => name.trim() !== '');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-md mx-auto pt-8">
        <div className="bg-white rounded-xl shadow-xl p-6">
          <h1 className="text-3xl font-bold text-center mb-2 text-green-800">
            JYLY
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Frisbeegolf Puttipeli
          </p>

          <div className="space-y-4 mb-6">
            <h2 className="text-xl font-semibold text-gray-800">
              Pelaajat
            </h2>
            
            {playerNames.map((name, index) => (
              <div key={index} className="flex gap-2">
                <input
                  type="text"
                  placeholder={`Pelaaja ${index + 1}`}
                  value={name}
                  onChange={(e) => updatePlayerName(index, e.target.value)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  maxLength={20}
                />
                {playerNames.length > 1 && (
                  <button
                    onClick={() => removePlayer(index)}
                    className="px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}

            {playerNames.length < 8 && (
              <button
                onClick={addPlayer}
                className="w-full py-2 border-2 border-dashed border-gray-300 text-gray-600 rounded-lg hover:border-green-500 hover:text-green-600 transition-colors"
              >
                + Lisää pelaaja
              </button>
            )}

            {availablePlayers.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Tallennetut pelaajat ({availablePlayers.length})
                </h3>
                
                <div className="max-h-40 overflow-y-auto border border-gray-200 rounded-lg bg-gray-50">
                  {availablePlayers.map((player, index) => (
                    <button
                      key={index}
                      onClick={() => selectSavedPlayer(player.name)}
                      className="w-full px-4 py-2 text-left hover:bg-white transition-colors border-b border-gray-200 last:border-b-0"
                    >
                      <div className="flex justify-between items-center">
                        <span className="font-medium">{player.name}</span>
                        <span className="text-xs text-gray-500">
                          {player.gamesPlayed} peliä
                        </span>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Pelin pituuden valinta */}
            <div className="mt-6">
              <h3 className="text-sm font-medium text-gray-700 mb-3">
                Pelin pituus
              </h3>
              <div className="flex gap-2">
                <button
                  onClick={() => setGameLength(10)}
                  className={`flex-1 py-2 px-2 rounded-lg font-medium transition-colors text-sm ${
                    gameLength === 10
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  10 kierrosta
                </button>
                <button
                  onClick={() => setGameLength(20)}
                  className={`flex-1 py-2 px-2 rounded-lg font-medium transition-colors text-sm ${
                    gameLength === 20
                      ? 'bg-green-600 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  20 kierrosta
                </button>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <button
              onClick={startGame}
              disabled={!canStartGame}
              className={`w-full py-3 px-6 rounded-lg font-semibold transition-all ${
                canStartGame
                  ? 'bg-green-600 hover:bg-green-700 text-white shadow-lg hover:shadow-xl'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Aloita Peli
            </button>

            <button
              onClick={showHistory}
              className="w-full py-3 px-6 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
            >
              Pelihistoria
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}