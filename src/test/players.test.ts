import { describe, it, expect, beforeEach } from 'vitest'
import { useJylyStore } from '../store'

describe('JYLY Player Management', () => {
  beforeEach(() => {
    // Reset store completely
    const store = useJylyStore.getState()
    store.resetGame()
    // Clear player database
    store.playerDatabase.savedPlayers = []
  })

  describe('Player database', () => {
    it('should save new players to database', () => {
      const { savePlayer, getSavedPlayers } = useJylyStore.getState()
      
      savePlayer('Mikko')
      savePlayer('Anna')
      
      const savedPlayers = getSavedPlayers()
      expect(savedPlayers).toHaveLength(2)
      expect(savedPlayers[0].name).toBe('Anna') // Viimeisin ensin
      expect(savedPlayers[1].name).toBe('Mikko')
      expect(savedPlayers[0].gamesPlayed).toBe(1)
    })

    it('should update existing player stats', () => {
      const { savePlayer, getSavedPlayers } = useJylyStore.getState()
      
      savePlayer('Mikko')
      savePlayer('Mikko') // Sama pelaaja uudelleen
      
      const savedPlayers = getSavedPlayers()
      expect(savedPlayers).toHaveLength(1)
      expect(savedPlayers[0].name).toBe('Mikko')
      expect(savedPlayers[0].gamesPlayed).toBe(2)
    })

    it('should handle empty and whitespace names', () => {
      const { savePlayer, getSavedPlayers } = useJylyStore.getState()
      
      savePlayer('') // Tyhjä
      savePlayer('   ') // Pelkkiä välilyöntejä
      savePlayer('Valid Name')
      
      const savedPlayers = getSavedPlayers()
      expect(savedPlayers).toHaveLength(1)
      expect(savedPlayers[0].name).toBe('Valid Name')
    })

    it('should sort players by last played date (newest first)', () => {
      const { savePlayer, getSavedPlayers } = useJylyStore.getState()
      
      savePlayer('First')
      // Simuloi ajan kulumista
      setTimeout(() => {
        savePlayer('Second')
        
        const savedPlayers = getSavedPlayers()
        expect(savedPlayers[0].name).toBe('Second')
        expect(savedPlayers[1].name).toBe('First')
      }, 10)
    })
  })

  describe('Game creation with player saving', () => {
    it('should save all players when creating a game', () => {
      const { createGame, getSavedPlayers } = useJylyStore.getState()
      
      createGame(['Player1', 'Player2', 'Player3'])
      
      const savedPlayers = getSavedPlayers()
      expect(savedPlayers).toHaveLength(3)
      
      const playerNames = savedPlayers.map(p => p.name)
      expect(playerNames).toContain('Player1')
      expect(playerNames).toContain('Player2') 
      expect(playerNames).toContain('Player3')
    })

    it('should not create duplicate entries for existing players', () => {
      const { savePlayer, createGame, getSavedPlayers } = useJylyStore.getState()
      
      // Tallenna pelaajia etukäteen
      savePlayer('Mikko')
      savePlayer('Anna')
      
      // Luo peli joissa osa on samoja pelaajia
      createGame(['Mikko', 'Jukka', 'Anna'])
      
      const savedPlayers = getSavedPlayers()
      expect(savedPlayers).toHaveLength(3)
      
      // Tarkista että Mikko ja Anna saivat päivitetyt pelimäärät
      const mikko = savedPlayers.find(p => p.name === 'Mikko')
      const anna = savedPlayers.find(p => p.name === 'Anna')
      const jukka = savedPlayers.find(p => p.name === 'Jukka')
      
      expect(mikko?.gamesPlayed).toBe(2) // 1 + 1
      expect(anna?.gamesPlayed).toBe(2) // 1 + 1
      expect(jukka?.gamesPlayed).toBe(1) // Uusi pelaaja
    })
  })

  describe('Game history', () => {
    it('should save completed games to history', () => {
      const { createGame, addRound, nextTurn, completeGame, gameHistory } = useJylyStore.getState()
      
      createGame(['Test Player'])
      
      // Pelaa muutama kierros
      for (let i = 0; i < 3; i++) {
        addRound(useJylyStore.getState().getCurrentPlayer()!.id, 3)
        nextTurn()
      }
      
      completeGame()
      
      expect(gameHistory.games).toHaveLength(1)
      expect(gameHistory.games[0].players[0].name).toBe('Test Player')
      expect(gameHistory.games[0].isCompleted).toBe(true)
    })

    it('should be able to load games from history', () => {
      const { createGame, addRound, nextTurn, completeGame, loadGame, currentGame } = useJylyStore.getState()
      
      createGame(['Historical Player'])
      const gameId = useJylyStore.getState().currentGame!.id
      
      // Pelaa peli loppuun
      for (let round = 1; round <= 20; round++) {
        addRound(useJylyStore.getState().getCurrentPlayer()!.id, 2)
        nextTurn()
      }
      
      completeGame()
      
      // Luo uusi peli
      createGame(['New Player'])
      expect(currentGame?.players[0].name).toBe('New Player')
      
      // Lataa vanha peli
      loadGame(gameId)
      expect(useJylyStore.getState().currentGame?.players[0].name).toBe('Historical Player')
    })
  })

  describe('Data validation and edge cases', () => {
    it('should handle special characters in player names', () => {
      const { savePlayer, getSavedPlayers } = useJylyStore.getState()
      
      const specialNames = [
        'Åke Ölander',
        'José-María',
        '李明',
        'Player123!@#'
      ]
      
      specialNames.forEach(name => savePlayer(name))
      
      const savedPlayers = getSavedPlayers()
      expect(savedPlayers).toHaveLength(4)
      
      specialNames.forEach(name => {
        expect(savedPlayers.some(p => p.name === name)).toBe(true)
      })
    })

    it('should handle very long player names', () => {
      const { savePlayer, getSavedPlayers } = useJylyStore.getState()
      
      const longName = 'A'.repeat(100)
      savePlayer(longName)
      
      const savedPlayers = getSavedPlayers()
      expect(savedPlayers).toHaveLength(1)
      expect(savedPlayers[0].name).toBe(longName)
    })

    it('should preserve player data across game resets', () => {
      const { savePlayer, getSavedPlayers, createGame, resetGame } = useJylyStore.getState()
      
      savePlayer('Persistent Player')
      createGame(['Temporary Player'])
      
      expect(getSavedPlayers()).toHaveLength(2)
      
      resetGame()
      
      // Pelaajien tiedot säilyy, mutta peli nollautuu
      expect(getSavedPlayers()).toHaveLength(2)
      expect(useJylyStore.getState().currentGame).toBeNull()
    })
  })

  describe('Statistics calculation', () => {
    it('should track player statistics correctly', () => {
      const { createGame, addRound, nextTurn, getSavedPlayers } = useJylyStore.getState()
      
      // Luo useita pelejä samalle pelaajalle
      for (let game = 1; game <= 3; game++) {
        createGame(['Stats Player'])
        
        // Pelaa muutama kierros
        for (let round = 1; round <= 5; round++) {
          addRound(useJylyStore.getState().getCurrentPlayer()!.id, round % 6)
          nextTurn()
        }
        
        useJylyStore.getState().completeGame()
      }
      
      const savedPlayers = getSavedPlayers()
      const statsPlayer = savedPlayers.find(p => p.name === 'Stats Player')
      
      expect(statsPlayer?.gamesPlayed).toBe(3)
    })
  })
})