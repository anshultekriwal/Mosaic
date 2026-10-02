import { useEffect } from 'react'
import { reflection } from '../lib/readings.js'

export default function Reflect({ reading, onNext }) {
  useEffect(() => {
    const id = setTimeout(onNext, 4000)
    return () => clearTimeout(id)
  }, [onNext])

  return (
    <button type="button" onClick={onNext} className="w-full max-w-md text-left">
      <p className="text-4xl leading-snug font-medium">{reflection(reading)}</p>
    </button>
  )
}
