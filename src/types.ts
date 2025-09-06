export interface Round {
  roundNumber: number;
  distance: number; // 5-10 meters
  hits: number; // 0-5
  points: number; // distance * hits
}

export interface Player {
  id: string;
  name: string;
  rounds: Round[];
  totalScore: number;
}

export interface GameState {
  id: string;
  players: Player[];
  currentRound: number;
  currentPlayerIndex: number; // 0 to players.length-1
  isCompleted: boolean;
  createdAt: Date;
  maxRounds: number; // 10 or 20
}

export interface GameHistory {
  games: GameState[];
}

export interface SavedPlayer {
  name: string;
  gamesPlayed: number;
  lastPlayed: Date;
}

export interface PlayerDatabase {
  savedPlayers: SavedPlayer[];
}

export type GameMode = 'setup' | 'playing' | 'completed' | 'history';