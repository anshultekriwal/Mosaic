import { BigButton } from '../components/ui.jsx'

export default function CheckIn({ onAnswer }) {
  return (
    <div className="flex w-full flex-col items-center gap-10">
      <h1 className="text-5xl font-semibold">How do you feel?</h1>
      <div className="flex w-full flex-col items-center gap-4">
        <BigButton onClick={() => onAnswer('better')}>Better</BigButton>
        <BigButton variant="soft" onClick={() => onAnswer('same')}>
          Same
        </BigButton>
        <BigButton variant="soft" onClick={() => onAnswer('worse')}>
          Worse
        </BigButton>
      </div>
    </div>
  )
}
