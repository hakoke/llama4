import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import './AccessibilityPanel.css'
import { audioController } from '../utils/AudioController'
import { hapticController } from '../utils/HapticController'

function AccessibilityPanel({
  textSize,
  onTextSizeChange,
  colorblindMode,
  onColorblindModeChange,
  highContrast,
  onHighContrastChange,
  reducedMotion,
  onReducedMotionChange,
  hapticsEnabled,
  onHapticsChange,
  audioVolume,
  onAudioVolumeChange
}) {
  const [isOpen, setIsOpen] = useState(false)

  const togglePanel = () => {
    setIsOpen(!isOpen)
    if (!isOpen) {
      audioController.playTone(440, 0.1, 'sine')
    }
  }

  return (
    <div className="accessibility-panel">
      <button
        className="a11y-toggle"
        onClick={togglePanel}
        aria-label="Toggle accessibility settings"
        aria-expanded={isOpen}
      >
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 6v2m0 8v2m-6-6h2m8 0h2"/>
        </svg>
        <span>A11Y</span>
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            className="a11y-panel-content"
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
          >
            <header>
              <h3>Accessibility</h3>
              <button className="close-btn" onClick={togglePanel} aria-label="Close settings">×</button>
            </header>

            <div className="a11y-section">
              <label htmlFor="text-size">Text Size</label>
              <div className="button-group">
                <button
                  className={textSize === 'small' ? 'active' : ''}
                  onClick={() => onTextSizeChange('small')}
                >
                  A
                </button>
                <button
                  className={textSize === 'normal' ? 'active' : ''}
                  onClick={() => onTextSizeChange('normal')}
                >
                  A
                </button>
                <button
                  className={textSize === 'large' ? 'active' : ''}
                  onClick={() => onTextSizeChange('large')}
                >
                  A
                </button>
              </div>
            </div>

            <div className="a11y-section">
              <label htmlFor="colorblind-mode">Colorblind Mode</label>
              <select
                id="colorblind-mode"
                value={colorblindMode}
                onChange={(e) => onColorblindModeChange(e.target.value)}
              >
                <option value="none">None</option>
                <option value="protanopia">Protanopia (Red-blind)</option>
                <option value="deuteranopia">Deuteranopia (Green-blind)</option>
                <option value="tritanopia">Tritanopia (Blue-blind)</option>
              </select>
            </div>

            <div className="a11y-section">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={highContrast}
                  onChange={(e) => onHighContrastChange(e.target.checked)}
                />
                <span>High Contrast Mode</span>
              </label>
            </div>

            <div className="a11y-section">
              <label className="toggle-label">
                <input
                  type="checkbox"
                  checked={reducedMotion}
                  onChange={(e) => onReducedMotionChange(e.target.checked)}
                />
                <span>Reduce Motion</span>
              </label>
            </div>

            {hapticController.isAvailable() && (
              <div className="a11y-section">
                <label className="toggle-label">
                  <input
                    type="checkbox"
                    checked={hapticsEnabled}
                    onChange={(e) => {
                      onHapticsChange(e.target.checked)
                      hapticController.setEnabled(e.target.checked)
                      if (e.target.checked) hapticController.tap()
                    }}
                  />
                  <span>Haptic Feedback</span>
                </label>
              </div>
            )}

            <div className="a11y-section">
              <label htmlFor="audio-volume">Audio Volume</label>
              <input
                id="audio-volume"
                type="range"
                min="0"
                max="100"
                value={audioVolume || 70}
                onChange={(e) => {
                  const vol = parseInt(e.target.value) / 100
                  onAudioVolumeChange(parseInt(e.target.value))
                  audioController.setVolume(vol)
                }}
              />
              <span className="volume-value">{audioVolume || 70}%</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export default AccessibilityPanel

