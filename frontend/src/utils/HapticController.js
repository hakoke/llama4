/**
 * HapticController - Manages haptic feedback for mobile devices
 * Uses Vibration API when available
 */

class HapticController {
  constructor() {
    this.enabled = 'vibrate' in navigator
    this.userEnabled = true
  }

  isAvailable() {
    return this.enabled && this.userEnabled
  }

  vibrate(pattern) {
    if (!this.isAvailable()) return
    
    try {
      navigator.vibrate(pattern)
    } catch (e) {
      console.warn('Haptic feedback failed:', e)
    }
  }

  // Light tap (button press, selection)
  tap() {
    this.vibrate(10)
  }

  // Double tap (confirmation)
  doubleTap() {
    this.vibrate([10, 50, 10])
  }

  // Success (vote submitted, answer locked)
  success() {
    this.vibrate([20, 40, 40])
  }

  // Error (deadline missed, invalid input)
  error() {
    this.vibrate([50, 30, 50, 30, 50])
  }

  // Timer warning (last 10 seconds)
  timerWarning() {
    this.vibrate(30)
  }

  // Timer critical (last 3 seconds)
  timerCritical() {
    this.vibrate(50)
  }

  // Phase transition (learning → research → playing)
  phaseTransition() {
    this.vibrate([30, 100, 30])
  }

  // Mind game prompt appears
  mindGamePrompt() {
    this.vibrate([20, 50, 20, 50, 40])
  }

  // Mind game reveal
  mindGameReveal() {
    this.vibrate([40, 60, 80])
  }

  // AI revealed (final reveal)
  aiRevealed() {
    this.vibrate([50, 100, 50, 100, 100])
  }

  // Player joined
  playerJoined() {
    this.vibrate(15)
  }

  // Typing indicator (subtle pulse)
  typing() {
    this.vibrate(5)
  }

  // Cancel all vibrations
  stop() {
    if (this.isAvailable()) {
      navigator.vibrate(0)
    }
  }

  // Enable/disable haptics
  setEnabled(enabled) {
    this.userEnabled = enabled
    if (!enabled) {
      this.stop()
    }
  }

  toggle() {
    this.setEnabled(!this.userEnabled)
  }
}

export const hapticController = new HapticController()

export default hapticController

