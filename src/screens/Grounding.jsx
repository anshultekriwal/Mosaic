import { useState } from 'react'
import { BigButton } from '../components/ui.jsx'

const PROMPTS = [
  [5, 'things you can see'],
  [4, 'things you can touch'],
  [3, 'things you can hear'],
  [2, 'things you can smell'],
  [1, 'thing you can taste'],
]

/** 5-4-3-2-1 grounding, one prompt per screen. */
export default function Grounding({ onDone }) {
  const [i, setI] = useState(0)
  const [n, text] = PROMPTS[i]

  function next() {
    if (i + 1 < PROMPTS.length) setI(i + 1)
    else onDone()
  }

  return (
    <div key={i} className="settle flex w-full flex-col items-center gap-12 text-center short:gap-6">
      <p className="text-lg text-haze">Look around you. Take your time.</p>
      <div>
        <p className="text-[7rem] leading-none font-semibold text-calm short:text-[5rem]">{n}</p>
        <p className="mt-4 text-4xl font-medium">{text}</p>
      </div>
      <BigButton onClick={next}>Next</BigButton>
    </div>
  )
}
