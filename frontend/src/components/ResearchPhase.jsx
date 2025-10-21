import { useState, useEffect, useMemo } from 'react'
import { motion } from 'framer-motion'
import './ResearchPhase.css'

const SCAN_FACTS = [
  'Indexing social handles and public aliases',
  'Cross-referencing typing tells with sentiment archives',
  'Ripping EXIF data and timestamp habits',
  'Mapping your slang dictionary to urban lexicons',
  'Synthesising mimicry script and fallback personas'
]

const beamVariants = {
  initial: { scaleY: 0, opacity: 0.4 },
  animate: {
    scaleY: [0, 1, 0],
    opacity: [0.2, 0.8, 0.2],
    transition: { duration: 4, repeat: Infinity, ease: 'easeInOut' }
  }
}

function ResearchPhase({ players = [] }) {
  const [factIndex, setFactIndex] = useState(0)
  const [globalProgress, setGlobalProgress] = useState(0)
  const [playerProgress, setPlayerProgress] = useState(() => (
    players.reduce((acc, player) => ({ ...acc, [player.id]: 10 }), {})
  ))

  useEffect(() => {
    const factTimer = setInterval(() => {
      setFactIndex((prev) => (prev + 1) % SCAN_FACTS.length)
    }, 2600)
    return () => clearInterval(factTimer)
  }, [])

  useEffect(() => {
    const progressTimer = setInterval(() => {
      setGlobalProgress((prev) => Math.min(100, prev + 3))
      setPlayerProgress((prev) => {
        const next = { ...prev }
        players.forEach((player) => {
          next[player.id] = Math.min(100, (next[player.id] ?? 10) + Math.random() * 8)
        })
        return next
      })
    }, 500)
    return () => clearInterval(progressTimer)
  }, [players])

  const intelRows = useMemo(() => (
    players.map((player) => ({
      id: player.id,
      username: player.username,
      progress: Math.round(playerProgress[player.id] ?? 10)
    }))
  ), [players, playerProgress])

  return (
    <section className="research-holo">
      <div className="scan-grid">
        {[...Array(5)].map((_, idx) => (
          <motion.div
            key={idx}
            className="scan-beam"
            variants={beamVariants}
            initial="initial"
            animate="animate"
            transition={{ delay: idx * 0.4 }}
          />
        ))}
      </div>

      <div className="scan-core">
        <div className="scan-core__orb" />
        <div className="scan-core__ring" />
        <div className="scan-core__label">Deep Web Harvest</div>
      </div>

      <div className="scan-panel">
        <header className="scan-panel__header">
          <div>
            <span>Research Phase</span>
            <h2>Compiling Persona Dossiers</h2>
          </div>
          <div className="scan-progress">
            <span>{SCAN_FACTS[factIndex]}</span>
            <div className="scan-progress__bar">
              <motion.div
                className="scan-progress__fill"
                animate={{ width: `${globalProgress}%` }}
                transition={{ ease: 'easeOut', duration: 0.45 }}
              />
            </div>
          </div>
        </header>

        <div className="scan-intel">
          {intelRows.length === 0 && (
            <p className="scan-intel__empty">Awaiting player data streams…</p>
          )}
          {intelRows.map((row, idx) => (
            <motion.div
              key={row.id}
              className="scan-intel__row"
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.08 }}
            >
              <div className="scan-intel__label">
                <span>{row.username}</span>
                <small>{row.progress >= 100 ? 'Profile complete' : 'Harvesting'}</small>
              </div>
              <div className="scan-intel__meter">
                <motion.div
                  className="scan-intel__meter-fill"
                  animate={{ width: `${row.progress}%` }}
                  transition={{ ease: 'easeOut', duration: 0.4 }}
                />
              </div>
            </motion.div>
          ))}
        </div>

        <footer className="scan-footer">
          <p>
            The AI is crawling public traces, mirroring your online persona and locking in a deception playbook.
            Once complete, it will slide into the arena armed with your digital fingerprint.
          </p>
        </footer>
      </div>
    </section>
  )
}

export default ResearchPhase

