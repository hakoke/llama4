/**
 * AudioController - Manages game sound effects and ambient audio
 * Handles: timer warnings, reveal stingers, ambient loops, chat notifications
 */

class AudioController {
  constructor() {
    this.sounds = {}
    this.volume = 0.7
    this.enabled = true
    this.ambient = null
    this.ambientVolume = 0.3
    this.isMuted = false
    
    // Audio contexts
    this.context = null
    this.gainNode = null
    
    this.init()
  }

  init() {
    try {
      this.context = new (window.AudioContext || window.webkitAudioContext)()
      this.gainNode = this.context.createGain()
      this.gainNode.connect(this.context.destination)
      this.gainNode.gain.value = this.volume
    } catch (e) {
      console.warn('AudioContext not supported:', e)
      this.enabled = false
    }
  }

  async loadSound(name, url) {
    if (!this.enabled) return
    
    try {
      // For now, use Web Audio API oscillators for procedural sounds
      // In production, replace with actual sound file loading
      this.sounds[name] = { loaded: true, url }
    } catch (e) {
      console.warn(`Failed to load sound ${name}:`, e)
    }
  }

  // Procedural sound generation (temporary until real sound files added)
  playTone(frequency, duration, type = 'sine') {
    if (!this.enabled || this.isMuted || !this.context) return

    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()

    oscillator.type = type
    oscillator.frequency.value = frequency
    oscillator.connect(gain)
    gain.connect(this.gainNode)

    gain.gain.setValueAtTime(0, this.context.currentTime)
    gain.gain.linearRampToValueAtTime(0.3 * this.volume, this.context.currentTime + 0.01)
    gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration)

    oscillator.start(this.context.currentTime)
    oscillator.stop(this.context.currentTime + duration)
  }

  // Timer warning (last 10 seconds)
  playTimerWarning() {
    this.playTone(800, 0.15, 'square')
  }

  // Timer critical (last 3 seconds)
  playTimerCritical() {
    this.playTone(1200, 0.1, 'sawtooth')
  }

  // Message sent
  playMessageSent() {
    this.playTone(600, 0.08, 'sine')
  }

  // Message received
  playMessageReceived() {
    this.playTone(400, 0.1, 'sine')
  }

  // Mind game reveal stinger
  playRevealStinger() {
    if (!this.enabled || this.isMuted || !this.context) return
    
    // Ascending chord
    setTimeout(() => this.playTone(440, 0.2, 'sine'), 0)
    setTimeout(() => this.playTone(554, 0.2, 'sine'), 100)
    setTimeout(() => this.playTone(659, 0.3, 'sine'), 200)
  }

  // Phase transition
  playPhaseTransition() {
    if (!this.enabled || this.isMuted || !this.context) return
    
    this.playTone(523, 0.15, 'triangle')
    setTimeout(() => this.playTone(659, 0.15, 'triangle'), 150)
  }

  // Player joined
  playPlayerJoined() {
    this.playTone(880, 0.12, 'sine')
  }

  // Vote locked
  playVoteLocked() {
    this.playTone(660, 0.2, 'square')
  }

  // AI revealed
  playAIRevealed() {
    if (!this.enabled || this.isMuted || !this.context) return
    
    // Dramatic descending tone
    this.playTone(880, 0.15, 'sawtooth')
    setTimeout(() => this.playTone(660, 0.15, 'sawtooth'), 150)
    setTimeout(() => this.playTone(440, 0.3, 'sawtooth'), 300)
  }

  // Ambient loop (plays during phases)
  startAmbient(phase = 'playing') {
    if (!this.enabled || this.isMuted || !this.context) return
    
    // Simple ambient drone
    if (this.ambient) {
      this.stopAmbient()
    }

    const oscillator = this.context.createOscillator()
    const gain = this.context.createGain()

    oscillator.type = 'sine'
    oscillator.frequency.value = phase === 'mind_games' ? 110 : 82.41 // Low E or Low A
    oscillator.connect(gain)
    gain.connect(this.gainNode)

    gain.gain.setValueAtTime(0, this.context.currentTime)
    gain.gain.linearRampToValueAtTime(this.ambientVolume * this.volume, this.context.currentTime + 2)

    oscillator.start()
    this.ambient = { oscillator, gain }
  }

  stopAmbient() {
    if (this.ambient) {
      try {
        this.ambient.gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 1)
        this.ambient.oscillator.stop(this.context.currentTime + 1.1)
      } catch (e) {
        // Already stopped
      }
      this.ambient = null
    }
  }

  setVolume(volume) {
    this.volume = Math.max(0, Math.min(1, volume))
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume
    }
  }

  setAmbientVolume(volume) {
    this.ambientVolume = Math.max(0, Math.min(1, volume))
    if (this.ambient && this.ambient.gain) {
      this.ambient.gain.gain.value = this.ambientVolume * this.volume
    }
  }

  mute() {
    this.isMuted = true
    if (this.gainNode) {
      this.gainNode.gain.value = 0
    }
  }

  unmute() {
    this.isMuted = false
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume
    }
  }

  toggle() {
    if (this.isMuted) {
      this.unmute()
    } else {
      this.mute()
    }
  }

  cleanup() {
    this.stopAmbient()
    if (this.context) {
      this.context.close()
    }
  }
}

export const audioController = new AudioController()

// Load default sounds (placeholders for now)
audioController.loadSound('timer_warning', '/sounds/timer_warning.mp3')
audioController.loadSound('reveal', '/sounds/reveal.mp3')
audioController.loadSound('phase_transition', '/sounds/transition.mp3')
audioController.loadSound('message_sent', '/sounds/message_sent.mp3')

export default audioController

