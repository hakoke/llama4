import { useState, useEffect } from 'react'
import './ResearchPhase.css'

function ResearchPhase() {
  const [dots, setDots] = useState('')
  const [currentFact, setCurrentFact] = useState(0)
  
  const facts = [
    "Analyzing your social media...",
    "Learning your personality traits...",
    "Studying your typing patterns...",
    "Building impersonation strategy...",
    "Preparing to deceive your friends...",
    "Almost ready..."
  ]
  
  useEffect(() => {
    const dotsTimer = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '' : prev + '.')
    }, 500)
    
    const factTimer = setInterval(() => {
      setCurrentFact(prev => (prev + 1) % facts.length)
    }, 2000)
    
    return () => {
      clearInterval(dotsTimer)
      clearInterval(factTimer)
    }
  }, [])
  
  return (
    <div className="research-phase">
      <div className="research-content">
        <div className="brain-animation">
          <div className="brain-icon">🧠</div>
          <div className="pulse-ring"></div>
          <div className="pulse-ring delay-1"></div>
          <div className="pulse-ring delay-2"></div>
        </div>
        
        <h1 className="research-title">
          AI is Researching{dots}
        </h1>
        
        <p className="research-status">
          {facts[currentFact]}
        </p>
        
        <div className="progress-bar">
          <div className="progress-fill"></div>
        </div>
        
        <div className="research-warning">
          ⚠️ The AI is searching the internet for information about you...
        </div>
      </div>
    </div>
  )
}

export default ResearchPhase

