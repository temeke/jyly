import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { GameState, Player, Round, GameHistory, GameMode, SavedPlayer, PlayerDatabase } from './types';

interface JylyStore {
  // Game state
  currentGame: GameState | null;
  gameMode: GameMode;
  gameHistory: GameHistory;
  playerDatabase: PlayerDatabase;
  
  // Actions
  setGameMode: (mode: GameMode) => void;
  createGame: (playerNames: string[], maxRounds?: number) => void;
  addRound: (playerId: string, hits: number) => void;
  undoLastRound: () => void;
  nextTurn: () => void;
  resetGame: () => void;
  completeGame: () => void;
  loadGame: (gameId: string) => void;
  
  // Player management
  savePlayer: (playerName: string) => void;
  getSavedPlayers: () => SavedPlayer[];
  
  // Helper functions
  getCurrentPlayer: () => Player | null;
  calculateNextDistance: (previousHits: number) => number;
  isGameComplete: () => boolean;
  canUndo: () => boolean;
}

export const useJylyStore = create<JylyStore>()(
  persist(
    (set, get) => ({
      currentGame: null,
      gameMode: 'setup',
      gameHistory: { games: [] },
      playerDatabase: { savedPlayers: [] },

      setGameMode: (mode) => set({ gameMode: mode }),

      createGame: (playerNames, maxRounds = 20) => {
        // Tallenna pelaajat tietokantaan
        playerNames.forEach(name => get().savePlayer(name));
        const players: Player[] = playerNames.map((name, index) => ({
          id: `player-${Date.now()}-${index}`,
          name,
          rounds: [],
          totalScore: 0,
        }));

        const newGame: GameState = {
          id: `game-${Date.now()}`,
          players,
          currentRound: 1,
          currentPlayerIndex: 0,
          isCompleted: false,
          createdAt: new Date(),
          maxRounds,
        };

        set({ currentGame: newGame, gameMode: 'playing' });
      },

      calculateNextDistance: (previousHits) => {
        // JYLY säännöt: 0->5m, 1->6m, 2->7m, 3->8m, 4->9m, 5->10m
        const distanceMap: { [key: number]: number } = {
          0: 5, 1: 6, 2: 7, 3: 8, 4: 9, 5: 10
        };
        return distanceMap[previousHits] || 10;
      },

      addRound: (playerId, hits) => {
        const { currentGame } = get();
        if (!currentGame) return;

        const player = currentGame.players.find(p => p.id === playerId);
        if (!player) return;

        // Etäisyys on jo laskettu getCurrentDistance funktiossa
        // Käytetään sitä etäisyyttä joka näytetään käyttäjälle
        let distance = 10; // Aloitus etäisyys
        if (player.rounds.length > 0) {
          const lastRound = player.rounds[player.rounds.length - 1];
          distance = get().calculateNextDistance(lastRound.hits);
        }

        const validHits = Math.min(Math.max(hits, 0), 5); // Varmista 0-5 väli
        const newRound: Round = {
          roundNumber: currentGame.currentRound,
          distance,
          hits: validHits,
          points: distance * validHits,
        };

        player.rounds.push(newRound);
        player.totalScore += newRound.points;

        set({
          currentGame: {
            ...currentGame,
            players: [...currentGame.players],
          }
        });
      },

      nextTurn: () => {
        const { currentGame } = get();
        if (!currentGame) return;

        const nextPlayerIndex = (currentGame.currentPlayerIndex + 1) % currentGame.players.length;
        const nextRound = nextPlayerIndex === 0 ? currentGame.currentRound + 1 : currentGame.currentRound;

        const updatedGame = {
          ...currentGame,
          currentPlayerIndex: nextPlayerIndex,
          currentRound: nextRound,
        };

        // Tarkista onko peli valmis
        if (nextRound > 20) {
          updatedGame.isCompleted = true;
          get().completeGame();
          return;
        }

        set({ currentGame: updatedGame });
      },

      getCurrentPlayer: () => {
        const { currentGame } = get();
        if (!currentGame) return null;
        return currentGame.players[currentGame.currentPlayerIndex] || null;
      },

      isGameComplete: () => {
        const { currentGame } = get();
        return currentGame ? currentGame.currentRound > currentGame.maxRounds : false;
      },

      completeGame: () => {
        const { currentGame, gameHistory } = get();
        if (!currentGame) return;

        const completedGame = { ...currentGame, isCompleted: true };
        const updatedHistory = {
          games: [...gameHistory.games, completedGame]
        };

        set({ 
          gameHistory: updatedHistory,
          gameMode: 'completed'
        });
      },

      loadGame: (gameId) => {
        const { gameHistory } = get();
        const game = gameHistory.games.find(g => g.id === gameId);
        if (game) {
          set({ 
            currentGame: game,
            gameMode: game.isCompleted ? 'completed' : 'playing'
          });
        }
      },

      undoLastRound: () => {
        const { currentGame } = get();
        if (!currentGame || !get().canUndo()) return;

        // Palaa edelliseen pelaajaan ja kierrokseen
        let newPlayerIndex = currentGame.currentPlayerIndex - 1;
        let newRound = currentGame.currentRound;
        
        if (newPlayerIndex < 0) {
          newPlayerIndex = currentGame.players.length - 1;
          newRound = Math.max(1, currentGame.currentRound - 1);
        }
        
        // Etsi se pelaaja, joka on vuorossa tämän jälkeen
        const playerToUndo = currentGame.players[newPlayerIndex];
        if (!playerToUndo || playerToUndo.rounds.length === 0) {
          // Jos pelaajalla ei ole kierroksia, etsi viimeksi pelannut
          for (let i = currentGame.players.length - 1; i >= 0; i--) {
            if (currentGame.players[i].rounds.length > 0) {
              newPlayerIndex = i;
              const player = currentGame.players[i];
              newRound = player.rounds[player.rounds.length - 1].roundNumber;
              break;
            }
          }
        }

        const targetPlayer = currentGame.players[newPlayerIndex];
        if (targetPlayer && targetPlayer.rounds.length > 0) {
          // Poista viimeinen kierros
          const lastRound = targetPlayer.rounds[targetPlayer.rounds.length - 1];
          targetPlayer.rounds.pop();
          targetPlayer.totalScore -= lastRound.points;
        }

        set({
          currentGame: {
            ...currentGame,
            currentPlayerIndex: newPlayerIndex,
            currentRound: newRound,
            players: [...currentGame.players],
          }
        });
      },

      canUndo: () => {
        const { currentGame } = get();
        if (!currentGame) return false;
        
        // Voidaan aina peruuttaa jos jollain pelaajalla on kierroksia
        return currentGame.players.some(player => player.rounds.length > 0);
      },

      savePlayer: (playerName: string) => {
        const { playerDatabase } = get();
        const trimmedName = playerName.trim();
        if (!trimmedName) return;

        const existingPlayer = playerDatabase.savedPlayers.find(p => p.name === trimmedName);
        if (existingPlayer) {
          existingPlayer.gamesPlayed += 1;
          existingPlayer.lastPlayed = new Date();
        } else {
          playerDatabase.savedPlayers.push({
            name: trimmedName,
            gamesPlayed: 1,
            lastPlayed: new Date()
          });
        }

        set({ playerDatabase: { ...playerDatabase } });
      },

      getSavedPlayers: () => {
        const { playerDatabase } = get();
        return playerDatabase.savedPlayers
          .slice()
          .sort((a, b) => new Date(b.lastPlayed).getTime() - new Date(a.lastPlayed).getTime());
      },

      resetGame: () => {
        set({ 
          currentGame: null, 
          gameMode: 'setup' 
        });
      },
    }),
    {
      name: 'jyly-storage',
    }
  )
);