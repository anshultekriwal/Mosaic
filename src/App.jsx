import { useEffect, useState } from 'react'
import { startMotion } from './lib/motion.js'
import Session from './Session.jsx'
import Home from './screens/Home.jsx'
import Log from './screens/Log.jsx'
import Wearable from './screens/Wearable.jsx'
import About from './screens/About.jsx'
import Settings from './screens/Settings.jsx'

export default function App() {
  const [view, setView] = useState('home')

  // Let the phone's back gesture return home instead of leaving the app.
  useEffect(() => {
    const onPop = () => setView('home')
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  function navigate(next) {
    if (next !== 'home' && view === 'home') history.pushState({ steady: next }, '')
    setView(next)
  }

  function goHome() {
    if (history.state?.steady) history.back()
    else setView('home')
  }

  // Must run synchronously inside the tap so iOS will show the motion prompt.
  function startHelp() {
    startMotion()
    navigate('session')
  }

  switch (view) {
    case 'session':
      return <Session onExit={goHome} />
    case 'practice':
      return <Session practice onExit={goHome} />
    case 'log':
      return <Log onBack={goHome} />
    case 'wearable':
      return <Wearable onBack={goHome} onStart={startHelp} />
    case 'about':
      return <About onBack={goHome} />
    case 'settings':
      return <Settings onBack={goHome} />
    default:
      return <Home onHelp={startHelp} onNavigate={navigate} />
  }
}
