import { describe, it, expect, beforeEach } from 'vitest'
import { useJylyStore } from '../store'

describe('JYLY Game Flow', () => {
  beforeEach(() => {
    useJylyStore.getState().resetGame()
  })

  describe('Multi-player turn management', () => {
    it('should rotate players correctly in turn-based mode', () => {
      const { createGame, addRound, nextTurn, getCurrentPlayer, currentGame } = useJylyStore.getState()
      
      createGame(['Player 1', 'Player 2', 'Player 3'])
      
      // Kierros 1
      expect(getCurrentPlayer()?.name).toBe('Player 1')
      expect(currentGame?.currentRound).toBe(1)
      
      addRound(getCurrentPlayer()!.id, 3)
      nextTurn()
      
      expect(getCurrentPlayer()?.name).toBe('Player 2')
      expect(currentGame?.currentRound).toBe(1) // Sama kierros
      
      addRound(getCurrentPlayer()!.id, 2)
      nextTurn()
      
      expect(getCurrentPlayer()?.name).toBe('Player 3')
      expect(currentGame?.currentRound).toBe(1) // Sama kierros
      
      addRound(getCurrentPlayer()!.id, 4)
      nextTurn()
      
      // Kierros 2 alkaa
      expect(getCurrentPlayer()?.name).toBe('Player 1')
      expect(currentGame?.currentRound).toBe(2) // Uusi kierros
    })

    it('should track individual player progress correctly', () => {
      const { createGame, addRound, nextTurn, currentGame } = useJylyStore.getState()
      
      createGame(['Alice', 'Bob'])
      
      // Alice: 4 osumaa (1. kierros)
      addRound(currentGame!.players[0].id, 4)
      nextTurn()
      
      // Bob: 2 osumaa (1. kierros) 
      addRound(currentGame!.players[1].id, 2)
      nextTurn()
      
      // Alice: 3 osumaa (2. kierros) - pitäisi olla 9m:stä (4 osumaa -> 9m)
      addRound(currentGame!.players[0].id, 3)
      nextTurn()
      
      // Bob: 5 osumaa (2. kierros) - pitäisi olla 7m:stä (2 osumaa -> 7m)
      addRound(currentGame!.players[1].id, 5)
      
      const alice = currentGame!.players[0]
      const bob = currentGame!.players[1]
      
      expect(alice.rounds.length).toBe(2)
      expect(bob.rounds.length).toBe(2)
      
      // Alicen kierrokset
      expect(alice.rounds[0]).toEqual({
        roundNumber: 1,
        distance: 10,
        hits: 4,
        points: 40
      })
      expect(alice.rounds[1]).toEqual({
        roundNumber: 2,
        distance: 9, // 4 osumaa -> 9m
        hits: 3,
        points: 27
      })
      
      // Bobin kierrokset  
      expect(bob.rounds[0]).toEqual({
        roundNumber: 1,
        distance: 10,
        hits: 2,
        points: 20
      })
      expect(bob.rounds[1]).toEqual({
        roundNumber: 2,
        distance: 7, // 2 osumaa -> 7m
        hits: 5,
        points: 35
      })
      
      expect(alice.totalScore).toBe(67) // 40 + 27
      expect(bob.totalScore).toBe(55) // 20 + 35
    })
  })

  describe('Game completion', () => {
    it('should complete game after 20 rounds', () => {
      const { createGame, addRound, nextTurn, currentGame, isGameComplete } = useJylyStore.getState()
      
      createGame(['Test Player'])
      
      // Pelaa 19 kierrosta
      for (let round = 1; round <= 19; round++) {
        addRound(getCurrentPlayer()!.id, 3)
        nextTurn()
      }
      
      expect(isGameComplete()).toBe(false)
      expect(currentGame?.currentRound).toBe(20)
      
      // Viimeinen kierros
      addRound(getCurrentPlayer()!.id, 3)
      nextTurn()
      
      expect(isGameComplete()).toBe(true)
    })

    it('should handle multiple players completing 20 rounds each', () => {
      const { createGame, addRound, nextTurn, currentGame } = useJylyStore.getState()
      
      createGame(['Player 1', 'Player 2'])
      
      // Pelaa koko peli molemmille pelaajille
      for (let round = 1; round <= 20; round++) {
        // Player 1
        addRound(currentGame!.players[0].id, 3)
        nextTurn()
        
        // Player 2  
        addRound(currentGame!.players[1].id, 2)
        if (round < 20) nextTurn()
      }
      
      expect(currentGame!.players[0].rounds.length).toBe(20)
      expect(currentGame!.players[1].rounds.length).toBe(20)
      expect(useJylyStore.getState().isGameComplete()).toBe(true)
    })
  })

  describe('Undo functionality', () => {
    it('should undo last round correctly', () => {
      const { createGame, addRound, nextTurn, undoLastRound, canUndo, getCurrentPlayer, currentGame } = useJylyStore.getState()
      
      createGame(['Player 1', 'Player 2'])
      
      // Player 1 pelaa
      const player1Id = getCurrentPlayer()!.id
      addRound(player1Id, 4) // 40 pistettä
      nextTurn()
      
      // Player 2 pelaa
      const player2Id = getCurrentPlayer()!.id  
      addRound(player2Id, 2) // 20 pistettä
      nextTurn()
      
      expect(canUndo()).toBe(true)
      expect(currentGame?.currentRound).toBe(2)
      expect(getCurrentPlayer()?.name).toBe('Player 1')
      
      // Peru Player 2:n kierros
      undoLastRound()
      
      expect(getCurrentPlayer()?.name).toBe('Player 2') // Palaa Player 2:lle
      expect(currentGame?.currentRound).toBe(1) // Takaisin kierrokselle 1
      expect(currentGame!.players[1].rounds.length).toBe(0) // Player 2:n kierros poistettu
      expect(currentGame!.players[1].totalScore).toBe(0) // Pisteet poistettu
      expect(currentGame!.players[0].rounds.length).toBe(1) // Player 1:n kierros säilyy
    })

    it('should not allow undo when no rounds played', () => {
      const { createGame, canUndo } = useJylyStore.getState()
      
      createGame(['Player 1'])
      
      expect(canUndo()).toBe(false)
    })
  })

  describe('Edge cases', () => {
    it('should handle single player game correctly', () => {
      const { createGame, addRound, nextTurn, getCurrentPlayer, currentGame } = useJylyStore.getState()
      
      createGame(['Solo Player'])
      
      expect(getCurrentPlayer()?.name).toBe('Solo Player')
      expect(currentGame?.currentRound).toBe(1)
      
      addRound(getCurrentPlayer()!.id, 3)
      nextTurn()
      
      // Yksinpelissä kierros vaihtuu heti
      expect(currentGame?.currentRound).toBe(2)
      expect(getCurrentPlayer()?.name).toBe('Solo Player')
    })

    it('should handle maximum number of players', () => {
      const { createGame, addRound, nextTurn, getCurrentPlayer } = useJylyStore.getState()
      
      const players = ['P1', 'P2', 'P3', 'P4', 'P5', 'P6', 'P7', 'P8']
      createGame(players)
      
      // Testaa että kaikki pelaajat ovat vuorollaan
      for (let i = 0; i < 8; i++) {
        expect(getCurrentPlayer()?.name).toBe(`P${i + 1}`)
        addRound(getCurrentPlayer()!.id, 2)
        if (i < 7) nextTurn()
      }
      
      nextTurn() // Kierros 2 alkaa
      expect(getCurrentPlayer()?.name).toBe('P1')
    })
  })
})