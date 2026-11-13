import React, { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router'
import { COPY } from '../constants/copy'
import { useInstallSupport } from '../pwa/install'
import { useCityStore } from '../stores/cityStore'
import { useDataStore } from '../stores/dataStore'
import { PrimaryButton, SecondaryButton } from './ui/Button'

export const InstallHelpView: React.FC = () => {
  const navigate = useNavigate()
  const headingRef = useRef<HTMLHeadingElement>(null)
  const messageRef = useRef<HTMLParagraphElement>(null)
  const { standalone, canInstall, promptInstall } = useInstallSupport()
  const { clearOfflineCafes, fetchCafes } = useDataStore()
  const selectedCity = useCityStore(state => state.selectedCity)
  const [message, setMessage] = useState('')
  const [clearing, setClearing] = useState(false)
  const [retrying, setRetrying] = useState(false)

  useEffect(() => { headingRef.current?.focus() }, [])

  const install = async () => {
    try {
      const accepted = await promptInstall()
      setMessage(accepted ? COPY.pwa.installStarted : COPY.pwa.installDismissed)
    } catch {
      setMessage(COPY.pwa.installFailed)
    }
    requestAnimationFrame(() => messageRef.current?.focus())
  }

  const retry = async () => {
    if (clearing || retrying) return
    setRetrying(true)
    setMessage(COPY.pwa.refreshing)
    try {
      await fetchCafes({ city: selectedCity }, true)
      const status = useDataStore.getState().cafeStatus
      setMessage(status === 'fresh' ? COPY.pwa.refreshDone : status === 'saved' ? COPY.pwa.savedRefreshFailed : COPY.pwa.refreshFailed)
    } catch {
      setMessage(COPY.pwa.refreshFailed)
    } finally {
      setRetrying(false)
      requestAnimationFrame(() => messageRef.current?.focus())
    }
  }

  const clear = async () => {
    if (clearing || retrying) return
    setClearing(true)
    setMessage('')
    try {
      await clearOfflineCafes()
      setMessage(COPY.pwa.clearDone)
    } catch {
      setMessage(COPY.pwa.clearFailed)
    } finally {
      setClearing(false)
    }
  }

  return (
    <main className="flex-1 overflow-y-auto bg-cream-50 px-4 pb-24 pt-5">
      <div className="mx-auto max-w-2xl space-y-5">
        <h1 ref={headingRef} tabIndex={-1} className="text-2xl font-bold text-charcoal-900 focus:outline-none">
          {standalone ? COPY.pwa.offlineTitle : COPY.pwa.title}
        </h1>
        <p className="text-gray-700">{standalone ? COPY.pwa.standaloneIntro : COPY.pwa.intro}</p>

        {!standalone && (
          <section className="rounded-xl border border-matcha-200 bg-white p-4">
            {canInstall ? (
              <PrimaryButton onClick={() => void install()} className="motion-reduce:transition-none motion-reduce:transform-none">{COPY.pwa.installButton}</PrimaryButton>
            ) : (
              <p className="text-sm text-gray-700">{COPY.pwa.installUnavailable}</p>
            )}
          </section>
        )}
        {standalone && <p className="rounded-xl border border-matcha-200 bg-white p-4 text-gray-700">{COPY.pwa.installed}</p>}

        {!standalone && (
          <section className="rounded-xl border border-matcha-200 bg-white p-4">
            <h2 className="text-lg font-semibold text-charcoal-900">{COPY.pwa.iosTitle}</h2>
            <ol className="ml-5 mt-3 list-decimal space-y-2 text-sm leading-relaxed text-gray-700">
              {COPY.pwa.iosSteps.map(step => <li key={step}>{step}</li>)}
            </ol>
            <a className="mt-3 inline-flex min-h-11 items-center text-green-700 underline underline-offset-2 focus:outline-none focus:ring-2 focus:ring-green-500"
              href="https://support.apple.com/en-lamr/guide/iphone/iphea86e5236/ios" target="_blank" rel="noopener noreferrer">
              {COPY.pwa.appleGuide}
            </a>
          </section>
        )}

        <section className="rounded-xl border border-matcha-200 bg-white p-4">
          <h2 className="text-lg font-semibold text-charcoal-900">{COPY.pwa.offlineTitleSection}</h2>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{COPY.pwa.offlineStored}</p>
          <p className="mt-2 text-sm leading-relaxed text-gray-700">{COPY.pwa.offlineLimits}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <SecondaryButton disabled={clearing || retrying} onClick={() => void clear()} className="motion-reduce:transition-none motion-reduce:transform-none">{COPY.pwa.clearData}</SecondaryButton>
            <SecondaryButton disabled={clearing || retrying} onClick={() => void retry()}>{COPY.pwa.retry}</SecondaryButton>
            <PrimaryButton onClick={() => navigate('/list', { state: { focusCafeView: true } })} className="motion-reduce:transition-none motion-reduce:transform-none">{COPY.pwa.backToList}</PrimaryButton>
          </div>
        </section>
        <p ref={messageRef} tabIndex={-1} role="status" aria-live="polite" className="text-sm text-gray-700 focus:outline-none">
          {message}
        </p>
      </div>
    </main>
  )
}

export default InstallHelpView
