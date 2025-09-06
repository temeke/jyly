import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { useJylyStore } from '../store'
import GameSetup from '../components/GameSetup'
import GameView from '../components/GameView'

// Mock timer functions for auto-advance testing
vi.useFakeTimers()

describe('JYLY Components', () => {
  beforeEach(() => {
    useJylyStore.getState().resetGame()
    useJylyStore.getState().playerDatabase.savedPlayers = []
    vi.clearAllTimers()
  })

  describe('GameSetup Component', () => {
    it('should render initial setup form', () => {
      render(<GameSetup />)
      
      expect(screen.getByText('JYLY')).toBeInTheDocument()
      expect(screen.getByText('Frisbeegolf Puttipeli')).toBeInTheDocument()
      expect(screen.getByPlaceholderText('Pelaaja 1')).toBeInTheDocument()
      expect(screen.getByText('Aloita Peli')).toBeInTheDocument()
    })

    it('should allow adding and removing players', () => {
      render(<GameSetup />)
      
      // Aluksi yksi pelaaja-kenttä
      expect(screen.getAllByRole('textbox')).toHaveLength(1)
      
      // Lisää pelaaja
      fireEvent.click(screen.getByText('+ Lisää pelaaja'))
      expect(screen.getAllByRole('textbox')).toHaveLength(2)
      expect(screen.getByPlaceholderText('Pelaaja 2')).toBeInTheDocument()
      
      // Poista pelaaja (× nappi pitäisi näkyä kun on > 1 pelaaja)
      const removeButtons = screen.getAllByText('×')
      expect(removeButtons).toHaveLength(2) // Kummassakin kentässä on × nappi
      
      fireEvent.click(removeButtons[0])
      expect(screen.getAllByRole('textbox')).toHaveLength(1)
    })

    it('should show saved players when available', () => {
      // Tallenna pelaajia etukäteen
      const store = useJylyStore.getState()
      store.savePlayer('Saved Player 1')
      store.savePlayer('Saved Player 2')
      
      render(<GameSetup />)
      
      expect(screen.getByText(/Tallennetut pelaajat \(2\)/)).toBeInTheDocument()
    })

    it('should validate player names before starting game', () => {
      render(<GameSetup />)
      
      const startButton = screen.getByText('Aloita Peli')
      
      // Tyhjä nimi - nappi pitäisi olla disabloitu
      expect(startButton).toBeDisabled()
      
      // Lisää nimi
      const input = screen.getByPlaceholderText('Pelaaja 1')
      fireEvent.change(input, { target: { value: 'Test Player' } })
      
      expect(startButton).toBeEnabled()
    })
  })

  describe('GameView Component', () => {
    beforeEach(() => {
      // Luo peli ennen jokaista testiä
      useJylyStore.getState().createGame(['Test Player'])
    })

    it('should render game interface correctly', () => {
      render(<GameView />)
      
      expect(screen.getByText('Kierros 1/20')).toBeInTheDocument()
      expect(screen.getByText('Test Player - Vuorossa')).toBeInTheDocument()
      expect(screen.getByText('10m')).toBeInTheDocument() // Aloitus etäisyys
      expect(screen.getByText('Valitse osumat:')).toBeInTheDocument()
      
      // Osuma-napit 0-5
      for (let i = 0; i <= 5; i++) {
        expect(screen.getByRole('button', { name: i.toString() })).toBeInTheDocument()
      }
    })

    it('should show undo button when rounds can be undone', () => {
      const store = useJylyStore.getState()
      const player = store.getCurrentPlayer()!
      
      render(<GameView />)
      
      // Aluksi ei peru-nappia
      expect(screen.queryByText('↶ Peru')).not.toBeInTheDocument()
      
      // Pelaa kierros
      store.addRound(player.id, 3)
      store.nextTurn()
      
      // Re-render komponentin
      render(<GameView />)
      
      expect(screen.getByText('↶ Peru')).toBeInTheDocument()
    })

    it('should handle hit selection and auto-advance', async () => {
      render(<GameView />)
      
      const hitButton = screen.getByRole('button', { name: '3' })
      fireEvent.click(hitButton)
      
      // Nappi pitäisi olla valittuna
      expect(hitButton).toHaveClass('bg-green-600', 'scale-110')
      
      // Pitäisi näyttää automaattinen tallentaminen
      expect(screen.getByText('Tallentamassa automaattisesti...')).toBeInTheDocument()
      expect(screen.getByText('+30 pistettä')).toBeInTheDocument() // 10m × 3 osumaa
      
      // Simuloi timer
      vi.advanceTimersByTime(500)
      
      await waitFor(() => {
        const store = useJylyStore.getState()
        const player = store.getCurrentPlayer()!
        expect(player.totalScore).toBe(30)
      })
    })

    it('should disable hit buttons after selection', () => {
      render(<GameView />)
      
      const hitButton3 = screen.getByRole('button', { name: '3' })
      const hitButton5 = screen.getByRole('button', { name: '5' })
      
      fireEvent.click(hitButton3)
      
      // Valittu nappi aktivinen, muut himmeämpiä
      expect(hitButton3).toHaveClass('bg-green-600')
      expect(hitButton5).toHaveClass('opacity-50')
      expect(hitButton3).not.toBeDisabled() // Valittu nappi ei ole disabled
      expect(hitButton5).toBeDisabled() // Muut napit ovat disabled
    })

    it('should show correct scoreboard information', () => {
      const store = useJylyStore.getState()
      const player = store.getCurrentPlayer()!
      
      // Pelaa kierros
      store.addRound(player.id, 4)
      store.nextTurn()
      
      render(<GameView />)
      
      expect(screen.getByText('Pisteetilanne')).toBeInTheDocument()
      expect(screen.getByText('Test Player')).toBeInTheDocument()
      expect(screen.getByText('40')).toBeInTheDocument() // Pisteet
      expect(screen.getByText('(1/20 kierrosta)')).toBeInTheDocument()
      expect(screen.getByText('Viimeksi: +40p (10m)')).toBeInTheDocument()
    })
  })

  describe('Multi-player gameplay', () => {
    beforeEach(() => {
      useJylyStore.getState().createGame(['Player 1', 'Player 2'])
    })

    it('should rotate between players correctly', async () => {
      render(<GameView />)
      
      // Player 1 on vuorossa
      expect(screen.getByText('Player 1 - Vuorossa')).toBeInTheDocument()
      
      // Player 1 pelaa
      fireEvent.click(screen.getByRole('button', { name: '3' }))
      vi.advanceTimersByTime(500)
      
      await waitFor(() => {
        expect(screen.getByText('Player 2 - Vuorossa')).toBeInTheDocument()
      })
    })

    it('should track individual player distances correctly', async () => {
      render(<GameView />)
      
      const store = useJylyStore.getState()
      
      // Player 1: 2 osumaa (seuraava etäisyys 7m)
      fireEvent.click(screen.getByRole('button', { name: '2' }))
      vi.advanceTimersByTime(500)
      
      await waitFor(() => {
        // Player 2 vuorossa, 10m etäisyys (aloitus)
        expect(screen.getByText('Player 2 - Vuorossa')).toBeInTheDocument()
        expect(screen.getByText('10m')).toBeInTheDocument()
      })
      
      // Player 2: 4 osumaa (seuraava etäisyys 9m)
      fireEvent.click(screen.getByRole('button', { name: '4' }))
      vi.advanceTimersByTime(500)
      
      await waitFor(() => {
        // Takaisin Player 1:lle, 7m etäisyys (2 osumaa -> 7m)
        expect(screen.getByText('Player 1 - Vuorossa')).toBeInTheDocument()
        expect(screen.getByText('7m')).toBeInTheDocument()
      })
    })
  })

  describe('Edge cases and error handling', () => {
    it('should handle missing game state gracefully', () => {
      // Ei luoda peliä
      render(<GameView />)
      
      expect(screen.getByText('Peli ei löytynyt')).toBeInTheDocument()
    })

    it('should validate maximum player count', () => {
      render(<GameSetup />)
      
      // Lisää maksimimäärä pelaajia (8)
      for (let i = 0; i < 7; i++) {
        fireEvent.click(screen.getByText('+ Lisää pelaaja'))
      }
      
      expect(screen.getAllByRole('textbox')).toHaveLength(8)
      
      // Ei pitäisi voida lisätä enempää
      expect(screen.queryByText('+ Lisää pelaaja')).not.toBeInTheDocument()
    })
  })
})