import { useJylyStore } from '../store';

export default function GameComplete() {
  const { currentGame, resetGame, setGameMode } = useJylyStore();

  if (!currentGame) {
    return <div>Peli ei löytynyt</div>;
  }

  const sortedPlayers = [...currentGame.players].sort((a, b) => b.totalScore - a.totalScore);
  const winner = sortedPlayers[0];

  const getPlayerStats = (player: any) => {
    const totalRounds = player.rounds.length;
    const averageScore = totalRounds > 0 ? Math.round(player.totalScore / totalRounds) : 0;
    const bestRound = Math.max(...player.rounds.map((r: any) => r.points), 0);
    
    return { averageScore, bestRound };
  };

  const startNewGame = () => {
    resetGame();
  };

  const viewHistory = () => {
    setGameMode('history');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        
        {/* Winner Announcement */}
        <div className="bg-white rounded-xl shadow-xl p-8 mb-6 text-center">
          <h1 className="text-4xl font-bold text-green-800 mb-4">
            🏆 Peli Päättynyt! 🏆
          </h1>
          <div className="text-2xl font-semibold text-gray-700 mb-2">
            Voittaja:
          </div>
          <div className="text-5xl font-bold text-green-600 mb-4">
            {winner.name}
          </div>
          <div className="text-3xl font-bold text-green-500">
            {winner.totalScore} pistettä
          </div>
          <div className="mt-4 text-gray-600">
            {winner.totalScore === 1000 ? 'Täydellinen peli! 🎯' : 
             winner.totalScore >= 800 ? 'Loistava suoritus! 🌟' :
             winner.totalScore >= 600 ? 'Hyvä peli! 👏' : 'Hyvin heitetty! 👍'}
          </div>
        </div>

        {/* Final Scoreboard */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-2xl font-semibold mb-4 text-center">
            Lopputulokset
          </h2>
          <div className="space-y-4">
            {sortedPlayers.map((player, index) => {
              const stats = getPlayerStats(player);
              return (
                <div 
                  key={player.id}
                  className={`p-4 rounded-lg border-2 ${
                    index === 0 
                      ? 'bg-yellow-50 border-yellow-400' 
                      : index === 1
                      ? 'bg-gray-50 border-gray-300'
                      : index === 2
                      ? 'bg-orange-50 border-orange-300'
                      : 'bg-gray-50 border-gray-200'
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className={`text-2xl font-bold ${
                        index === 0 ? 'text-yellow-600' :
                        index === 1 ? 'text-gray-600' :
                        index === 2 ? 'text-orange-600' :
                        'text-gray-500'
                      }`}>
                        #{index + 1}
                      </span>
                      <div>
                        <div className="text-xl font-semibold">
                          {player.name}
                        </div>
                        <div className="text-sm text-gray-600">
                          Keskiarvo: {stats.averageScore} | Paras kierros: {stats.bestRound}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">
                        {player.totalScore}
                      </div>
                      <div className="text-sm text-gray-600">
                        pistettä
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Game Stats */}
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h3 className="text-xl font-semibold mb-4">Pelin tilastot</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
            <div className="p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {currentGame.players.length}
              </div>
              <div className="text-sm text-gray-600">Pelaajaa</div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {currentGame.players.reduce((sum, p) => sum + p.rounds.length, 0)}
              </div>
              <div className="text-sm text-gray-600">Kierrosta</div>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Math.round(sortedPlayers.reduce((sum, p) => sum + p.totalScore, 0) / sortedPlayers.length)}
              </div>
              <div className="text-sm text-gray-600">Keskiarvo</div>
            </div>
            <div className="p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {Math.max(...sortedPlayers.flatMap(p => p.rounds.map(r => r.points)))}
              </div>
              <div className="text-sm text-gray-600">Paras kierros</div>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <button
            onClick={startNewGame}
            className="w-full py-3 px-6 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transition-all"
          >
            Uusi peli
          </button>
          
          <button
            onClick={viewHistory}
            className="w-full py-3 px-6 border-2 border-green-600 text-green-600 rounded-lg font-semibold hover:bg-green-50 transition-colors"
          >
            Katso pelihistoriaa
          </button>
        </div>
      </div>
    </div>
  );
}