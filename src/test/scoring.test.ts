import { describe, it, expect, beforeEach } from 'vitest'
import { useJylyStore } from '../store'

describe('JYLY Scoring System', () => {
  beforeEach(() => {
    // Reset store before each test
    useJylyStore.getState().resetGame()
  })

  describe('Distance calculation based on hits', () => {
    it('should return correct distances for different hit counts', () => {
      const { calculateNextDistance } = useJylyStore.getState()
      
      // JYLY säännöt: 0->5m, 1->6m, 2->7m, 3->8m, 4->9m, 5->10m
      expect(calculateNextDistance(0)).toBe(5)
      expect(calculateNextDistance(1)).toBe(6)
      expect(calculateNextDistance(2)).toBe(7)
      expect(calculateNextDistance(3)).toBe(8)
      expect(calculateNextDistance(4)).toBe(9)
      expect(calculateNextDistance(5)).toBe(10)
    })

    it('should default to 10m for invalid hit counts', () => {
      const { calculateNextDistance } = useJylyStore.getState()
      
      expect(calculateNextDistance(-1)).toBe(10)
      expect(calculateNextDistance(6)).toBe(10)
      expect(calculateNextDistance(100)).toBe(10)
    })
  })

  describe('Point calculation', () => {
    it('should calculate points correctly (distance × hits)', () => {
      const { createGame, addRound, getCurrentPlayer } = useJylyStore.getState()
      
      createGame(['Test Player'])
      const player = getCurrentPlayer()!
      
      // Ensimmäinen kierros aloitetaan aina 10m:stä
      addRound(player.id, 3) // 3 osumaa 10m:stä = 30 pistettä
      
      expect(player.totalScore).toBe(30)
      expect(player.rounds[0].points).toBe(30)
      expect(player.rounds[0].distance).toBe(10)
      expect(player.rounds[0].hits).toBe(3)
    })

    it('should accumulate points correctly over multiple rounds', () => {
      const { createGame, addRound, nextTurn, getCurrentPlayer } = useJylyStore.getState()
      
      createGame(['Test Player'])
      let player = getCurrentPlayer()!
      
      // Kierros 1: 3 osumaa 10m:stä = 30 pistettä
      addRound(player.id, 3)
      nextTurn()
      
      // Kierros 2: 2 osumaa 8m:stä = 16 pistettä (3 osumaa -> 8m)
      player = getCurrentPlayer()!
      addRound(player.id, 2)
      nextTurn()
      
      // Kierros 3: 5 osumaa 7m:stä = 35 pistettä (2 osumaa -> 7m)
      player = getCurrentPlayer()!
      addRound(player.id, 5)
      
      expect(player.totalScore).toBe(81) // 30 + 16 + 35
    })

    it('should handle zero hits correctly', () => {
      const { createGame, addRound, nextTurn, getCurrentPlayer } = useJylyStore.getState()
      
      createGame(['Test Player'])
      let player = getCurrentPlayer()!
      
      // Kierros 1: 0 osumaa 10m:stä = 0 pistettä
      addRound(player.id, 0)
      nextTurn()
      
      // Kierros 2: 3 osumaa 5m:stä = 15 pistettä (0 osumaa -> 5m)
      player = getCurrentPlayer()!
      addRound(player.id, 3)
      
      expect(player.totalScore).toBe(15) // 0 + 15
      expect(player.rounds[1].distance).toBe(5)
    })

    it('should handle perfect score correctly', () => {
      const { createGame, addRound, nextTurn, getCurrentPlayer } = useJylyStore.getState()
      
      createGame(['Test Player'])
      let player = getCurrentPlayer()!
      
      // Kierros 1: 5 osumaa 10m:stä = 50 pistettä
      addRound(player.id, 5)
      nextTurn()
      
      // Kierros 2: 5 osumaa 10m:stä = 50 pistettä (5 osumaa -> 10m)
      player = getCurrentPlayer()!
      addRound(player.id, 5)
      
      expect(player.totalScore).toBe(100) // 50 + 50
      expect(player.rounds[1].distance).toBe(10)
    })
  })

  describe('Maximum possible score', () => {
    it('should be able to achieve 1000 points (perfect game)', () => {
      const { createGame, addRound, nextTurn, getCurrentPlayer } = useJylyStore.getState()
      
      createGame(['Perfect Player'])
      
      // Simuloi täydellinen peli: 5 osumaa joka kierroksella 10m:stä
      for (let round = 1; round <= 20; round++) {
        let player = getCurrentPlayer()!
        addRound(player.id, 5) // Aina 5 osumaa
        
        if (round < 20) {
          nextTurn()
        }
      }
      
      const finalPlayer = getCurrentPlayer()!
      expect(finalPlayer.totalScore).toBe(1000) // 20 kierrosta × 50 pistettä
      expect(finalPlayer.rounds.length).toBe(20)
      
      // Kaikki kierrokset pitäisi olla 10m:stä
      finalPlayer.rounds.forEach(round => {
        expect(round.distance).toBe(10)
        expect(round.hits).toBe(5)
        expect(round.points).toBe(50)
      })
    })
  })

  describe('Input validation', () => {
    it('should clamp hits to 0-5 range', () => {
      const { createGame, addRound, getCurrentPlayer } = useJylyStore.getState()
      
      createGame(['Test Player'])
      const player = getCurrentPlayer()!
      
      // Testi negatiivisilla ja suurilla arvoilla
      addRound(player.id, -1) // Pitäisi muuttua 0:ksi
      expect(player.rounds[0].hits).toBe(0)
      
      addRound(player.id, 10) // Pitäisi muuttua 5:ksi  
      expect(player.rounds[1].hits).toBe(5)
    })
  })
})