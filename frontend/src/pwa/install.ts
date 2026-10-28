// Mutable browser prompt state must not be memoized by the React compiler.
'use no memo'

// The prompt can arrive before the help route mounts, so keep it for the app session.
import { useEffect, useState } from 'react'

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

let pendingPrompt: InstallPromptEvent | null = null
const listeners = new Set<() => void>()

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  return (typeof window.matchMedia === 'function' && window.matchMedia('(display-mode: standalone)').matches) ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true
}

function notify() {
  listeners.forEach(listener => listener())
}

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault()
    pendingPrompt = event as InstallPromptEvent
    notify()
  })
  window.addEventListener('appinstalled', () => {
    pendingPrompt = null
    notify()
  })
  if (typeof window.matchMedia === 'function') {
    window.matchMedia('(display-mode: standalone)').addEventListener?.('change', notify)
  }
}

async function promptInstall() {
    if (isStandalone() || !pendingPrompt) return false
    const event = pendingPrompt
    pendingPrompt = null
    notify()
    await event.prompt()
    return (await event.userChoice).outcome === 'accepted'
  }

export function useInstallSupport() {
  const [, refresh] = useState(0)
  useEffect(() => {
    const listener = () => refresh(value => value + 1)
    listeners.add(listener)
    return () => { listeners.delete(listener) }
  }, [])

  const standalone = isStandalone()
  const canInstall = !standalone && pendingPrompt !== null
  return { standalone, canInstall, promptInstall }
}
