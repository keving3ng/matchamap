import React, { useState } from 'react'
import { useNavigate, useLocation } from 'react-router'
import { COPY } from '../constants/copy'
import { useConnectionStatus } from '../hooks/useConnectionStatus'
import { useDataStore } from '../stores/dataStore'
import { PrimaryButton, SecondaryButton } from './ui'

interface CafeDataNoticeProps {
  city: string
  detail?: boolean
  missingCafe?: boolean
}

export const CafeDataNotice: React.FC<CafeDataNoticeProps> = ({ city, detail = false, missingCafe = false }) => {
  const navigate = useNavigate()
  const location = useLocation()
  const online = useConnectionStatus()
  const { cafeCity, cafeStatus, cafeSource, cafesObservedAt, fetchCafes, clearOfflineCafes } = useDataStore()
  const [clearing, setClearing] = useState(false)
  const [retrying, setRetrying] = useState(false)
  const [clearMessage, setClearMessage] = useState('')
  const status = cafeStatus === 'cleared' ? 'cleared' : cafeCity === city ? cafeStatus : 'idle'
  const saved = status === 'saved' && cafeSource === 'saved' && cafesObservedAt !== null

  let title = ''
  let description = ''
  if (status === 'cleared') {
    title = COPY.pwa.clearDone
    description = COPY.pwa.clearRetry
  } else if (saved) {
    title = COPY.pwa.savedFrom(new Date(cafesObservedAt).toLocaleString())
    description = online ? COPY.pwa.savedRefreshFailed : COPY.pwa.savedOffline
  } else if (status === 'expired') {
    title = COPY.pwa.expired
    description = online ? COPY.pwa.refreshFailed : COPY.pwa.missingOffline
  } else if (detail && missingCafe) {
    title = online ? (status === 'error' ? COPY.pwa.detailUnavailable : COPY.pwa.detailNotFound) : COPY.pwa.detailMissing
    description = online ? COPY.pwa.refreshFailed : COPY.pwa.missingOffline
  } else if (!online) {
    title = COPY.pwa.offline
    description = status === 'loading' ? COPY.pwa.lookingForSaved :
      status === 'error' || status === 'idle' ? COPY.pwa.missingOffline : COPY.pwa.offlineMap
  } else if (status === 'error') {
    title = COPY.pwa.refreshFailed
  }

  if (!title && !clearMessage && !retrying && !clearing) return null
  if (!title) title = clearing ? COPY.pwa.clearing : retrying ? COPY.pwa.refreshing : clearMessage

  const retry = async () => {
    if (retrying || clearing) return
    setRetrying(true)
    setClearMessage('')
    try { await fetchCafes({ city }, true) }
    finally {
      setRetrying(false)
      requestAnimationFrame(() => {
        if (!document.querySelector('[data-cafe-notice]')) document.querySelector<HTMLElement>('[data-cafe-view]')?.focus()
      })
    }
  }
  const clear = async () => {
    if (retrying || clearing) return
    setClearing(true)
    setClearMessage('')
    try {
      await clearOfflineCafes()
      setClearMessage(COPY.pwa.clearDone)
      requestAnimationFrame(() => {
        if (!document.querySelector('[data-cafe-notice]')) document.querySelector<HTMLElement>('[data-cafe-view]')?.focus()
      })
    } catch {
      setClearMessage(COPY.pwa.clearFailed)
    } finally {
      setClearing(false)
    }
  }

  return (
    <section data-cafe-notice className={`${detail ? 'mx-4 mt-8 max-w-2xl self-center' : 'mx-4 mt-2'} rounded-xl border border-matcha-200 bg-white p-4 text-charcoal-900 shadow-xs`}>
      <div role="status" aria-live="polite" aria-atomic="true">
        <h2 className="text-base font-semibold">{title}</h2>
        {description && <p className="mt-1 text-sm text-gray-700">{description}</p>}
        {!online && <p className="mt-1 text-sm text-gray-700">{COPY.pwa.offlineLimits}</p>}
        {clearMessage && clearMessage !== title && <p className="mt-1 text-sm text-gray-700">{clearMessage}</p>}
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <PrimaryButton onClick={() => void retry()} className="motion-reduce:transition-none motion-reduce:transform-none">{COPY.pwa.retry}</PrimaryButton>
        <SecondaryButton onClick={() => void clear()} className="motion-reduce:transition-none motion-reduce:transform-none">{COPY.pwa.clearData}</SecondaryButton>
        {location.pathname !== '/list' && (
          <SecondaryButton onClick={() => navigate('/list', { state: { focusCafeView: true } })} className="motion-reduce:transition-none motion-reduce:transform-none">{COPY.pwa.backToList}</SecondaryButton>
        )}
      </div>
    </section>
  )
}
