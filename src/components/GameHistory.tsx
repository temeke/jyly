import { useJylyStore } from '../store';

export default function GameHistory() {
  const { gameHistory, resetGame, loadGame } = useJylyStore();

  const backToSetup = () => {
    resetGame();
  };

  const formatDate = (date: Date) => {
    const d = new Date(date);
    return d.toLocaleDateString('fi-FI') + ' ' + d.toLocaleTimeString('fi-FI', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const getGameWinner = (game: any) => {
    const sortedPlayers = [...game.players].sort((a, b) => b.totalScore - a.totalScore);
    return sortedPlayers[0];
  };

  if (gameHistory.games.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
        <div className="max-w-md mx-auto pt-16">
          <div className="bg-white rounded-xl shadow-xl p-8 text-center">
            <h1 className="text-2xl font-bold text-gray-800 mb-4">
              Pelihistoria
            </h1>
            <p className="text-gray-600 mb-8">
              Et ole vielä pelannut yhtään peliä.
            </p>
            <button
              onClick={backToSetup}
              className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
            >
              Aloita ensimmäinen peli
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto pt-4">
        
        {/* Header */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex justify-between items-center">
            <h1 className="text-3xl font-bold text-green-800">
              Pelihistoria
            </h1>
            <button
              onClick={backToSetup}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Uusi peli
            </button>
          </div>
          <p className="text-gray-600 mt-2">
            {gameHistory.games.length} peliä pelattu
          </p>
        </div>

        {/* Games List */}
        <div className="space-y-4">
          {gameHistory.games
            .slice()
            .reverse() // Uusimmat ensin
            .map((game, index) => {
              const winner = getGameWinner(game);
              const gameDate = formatDate(game.createdAt);
              
              return (
                <div 
                  key={game.id}
                  className="bg-white rounded-xl shadow-lg p-6"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <div className="text-lg font-semibold text-gray-800">
                        Peli #{gameHistory.games.length - index}
                      </div>
                      <div className="text-sm text-gray-600">
                        {gameDate}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-semibold text-green-600">
                        🏆 {winner.name}
                      </div>
                      <div className="text-sm text-gray-600">
                        {winner.totalScore} pistettä
                      </div>
                    </div>
                  </div>

                  {/* Players in this game */}
                  <div className="mb-4">
                    <h4 className="font-medium text-gray-700 mb-2">Pelaajat:</h4>
                    <div className="space-y-1">
                      {game.players
                        .slice()
                        .sort((a, b) => b.totalScore - a.totalScore)
                        .map((player, playerIndex) => (
                          <div 
                            key={player.id}
                            className="flex justify-between items-center py-1"
                          >
                            <span className="text-sm">
                              {playerIndex + 1}. {player.name}
                            </span>
                            <span className="text-sm font-medium">
                              {player.totalScore} pistettä
                            </span>
                          </div>
                        ))}
                    </div>
                  </div>

                  {/* Game stats */}
                  <div className="grid grid-cols-3 gap-4 text-center text-sm">
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-semibold">{game.players.length}</div>
                      <div className="text-gray-600">Pelaajaa</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-semibold">
                        {Math.round(game.players.reduce((sum, p) => sum + p.totalScore, 0) / game.players.length)}
                      </div>
                      <div className="text-gray-600">Keskiarvo</div>
                    </div>
                    <div className="p-2 bg-gray-50 rounded">
                      <div className="font-semibold">
                        {Math.max(...game.players.flatMap(p => p.rounds.map(r => r.points)))}
                      </div>
                      <div className="text-gray-600">Paras kierros</div>
                    </div>
                  </div>

                  {!game.isCompleted && (
                    <button
                      onClick={() => loadGame(game.id)}
                      className="w-full mt-4 py-2 px-4 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
                    >
                      Jatka peliä
                    </button>
                  )}
                </div>
              );
            })}
        </div>

        {/* Summary Stats */}
        {gameHistory.games.length > 1 && (
          <div className="bg-white rounded-xl shadow-lg p-6 mt-6">
            <h3 className="text-xl font-semibold mb-4">Kokonaistilastot</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {gameHistory.games.length}
                </div>
                <div className="text-sm text-gray-600">Peliä</div>
              </div>
              <div className="p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.round(gameHistory.games.reduce((sum, game) => 
                    sum + game.players.reduce((pSum, p) => pSum + p.totalScore, 0) / game.players.length, 0
                  ) / gameHistory.games.length)}
                </div>
                <div className="text-sm text-gray-600">Keskiarvo</div>
              </div>
              <div className="p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {Math.max(...gameHistory.games.flatMap(game => 
                    game.players.map(p => p.totalScore)
                  ))}
                </div>
                <div className="text-sm text-gray-600">Paras tulos</div>
              </div>
              <div className="p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.max(...gameHistory.games.flatMap(game => 
                    game.players.flatMap(p => p.rounds.map(r => r.points))
                  ))}
                </div>
                <div className="text-sm text-gray-600">Paras kierros</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}