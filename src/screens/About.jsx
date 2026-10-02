import { CallLink, Page } from '../components/ui.jsx'

const SECTIONS = [
  [
    'Measuring',
    'You tap each time you breathe in. Four taps give your breathing rate. If your phone allows it, it also feels for shaking in your hands while you hold it. These readings are rough, not medical measurements.',
  ],
  [
    'Slow breathing',
    'Fast breathing keeps the body on alert. The circle starts at your own pace and slows, over about two minutes, to 4 seconds in and 6 seconds out. A longer out-breath helps the body settle.',
  ],
  [
    'Grounding',
    'Naming 5 things you see, 4 you can touch, 3 you hear, 2 you smell and 1 you taste brings your attention back to the room around you.',
  ],
  [
    'Your data',
    'Everything stays in this browser on this device. There is no account and nothing is sent anywhere. Clearing your browser data removes it.',
  ],
]

export default function About({ onBack }) {
  return (
    <Page title="How this works" onBack={onBack}>
      <div className="flex flex-col gap-7">
        {SECTIONS.map(([h, body]) => (
          <section key={h}>
            <h2 className="mb-2 text-xl font-semibold text-calm">{h}</h2>
            <p className="text-lg leading-relaxed text-mist/90">{body}</p>
          </section>
        ))}
        <p className="rounded-3xl bg-deep p-5 text-lg leading-relaxed">
          This is not a diagnosis or a treatment. If episodes are frequent, speak to a doctor.
        </p>
        <p className="text-base text-haze">
          In an emergency call <CallLink className="underline" number="112">112</CallLink>. For mental health
          support in India, Tele-MANAS is free on <CallLink className="underline" number="14416">14416</CallLink>.
        </p>
      </div>
    </Page>
  )
}
