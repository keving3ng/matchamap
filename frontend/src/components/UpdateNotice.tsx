import { useRef, useState, useSyncExternalStore } from 'react'
import { COPY } from '../constants/copy'
import { hasShellUpdate, subscribeShellUpdate } from '../pwa/register'
import { PrimaryButton, SecondaryButton } from './ui/Button'

export const UpdateNotice = () => {
  const available = useSyncExternalStore(subscribeShellUpdate, hasShellUpdate, () => false)
  const [dismissed, setDismissed] = useState(false)
  const [instructions, setInstructions] = useState(false)
  const instructionRef = useRef<HTMLParagraphElement>(null)
  if (!available || dismissed) return null
  return <section className="mx-4 mt-2 rounded-xl border border-matcha-200 bg-white p-4 text-charcoal-900">
    <p role="status" aria-live="polite">{COPY.pwa.updateAvailable}</p>
    {instructions && <p ref={instructionRef} tabIndex={-1} className="mt-2 text-sm focus:outline-none">{COPY.pwa.updateInstructions}</p>}
    <div className="mt-3 flex flex-wrap gap-2">
      <PrimaryButton onClick={() => {
        setInstructions(true)
        requestAnimationFrame(() => instructionRef.current?.focus())
      }}>{COPY.pwa.updateAction}</PrimaryButton>
      <SecondaryButton onClick={() => {
        setDismissed(true)
        requestAnimationFrame(() => document.querySelector<HTMLElement>('[data-cafe-view], main h1, header button')?.focus())
      }}>{COPY.pwa.dismissUpdate}</SecondaryButton>
    </div>
  </section>
}
