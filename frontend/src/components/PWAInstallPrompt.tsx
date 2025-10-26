import React, { useState, useEffect } from 'react'
import { Download, X, Smartphone, Zap, Wifi, WifiOff } from '@/components/icons'
import { PrimaryButton, SecondaryButton } from '@/components/ui'
import { COPY } from '@/constants/copy'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

declare global {
  interface WindowEventMap {
    beforeinstallprompt: BeforeInstallPromptEvent
  }
}

interface PWAInstallPromptProps {
  className?: string
}

export const PWAInstallPrompt: React.FC<PWAInstallPromptProps> = ({ className = '' }) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showPrompt, setShowPrompt] = useState(false)
  const [isInstalling, setIsInstalling] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)
  const [hasDismissed, setHasDismissed] = useState(false)

  useEffect(() => {
    // Check if app is already installed (running in standalone mode)
    const checkStandalone = () => {
      const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches ||
        (window.navigator as any).standalone ||
        document.referrer.includes('android-app://')
      setIsStandalone(isStandaloneMode)
    }

    // Check if user previously dismissed the prompt
    const checkDismissed = () => {
      const dismissed = localStorage.getItem('pwa-install-dismissed')
      const dismissedTime = dismissed ? parseInt(dismissed) : 0
      const twentyFourHours = 24 * 60 * 60 * 1000
      const shouldShow = !dismissed || (Date.now() - dismissedTime > twentyFourHours)
      setHasDismissed(!shouldShow)
    }

    checkStandalone()
    checkDismissed()

    const handleBeforeInstallPrompt = (e: BeforeInstallPromptEvent) => {
      // Prevent the mini-infobar from appearing on mobile
      e.preventDefault()
      // Stash the event so it can be triggered later
      setDeferredPrompt(e)
      // Show our custom install prompt
      if (!isStandalone && !hasDismissed) {
        setShowPrompt(true)
      }
    }

    const handleAppInstalled = () => {
      setDeferredPrompt(null)
      setShowPrompt(false)
      setIsStandalone(true)
      // Clear dismissal state on successful install
      localStorage.removeItem('pwa-install-dismissed')
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
      window.removeEventListener('appinstalled', handleAppInstalled)
    }
  }, [isStandalone, hasDismissed])

  const handleInstallClick = async () => {
    if (!deferredPrompt) return

    setIsInstalling(true)

    try {
      // Show the install prompt
      await deferredPrompt.prompt()
      
      // Wait for the user to respond to the prompt
      const { outcome } = await deferredPrompt.userChoice
      
      if (outcome === 'accepted') {
        console.log('User accepted PWA install')
      } else {
        console.log('User dismissed PWA install')
      }
    } catch (error) {
      console.error('Error during PWA install:', error)
    } finally {
      setIsInstalling(false)
      setDeferredPrompt(null)
      setShowPrompt(false)
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
    // Remember dismissal for 24 hours
    localStorage.setItem('pwa-install-dismissed', Date.now().toString())
  }

  const handleMaybeLater = () => {
    setShowPrompt(false)
    // Don't save dismissal for "Maybe Later" - show again on next visit
  }

  // Don't show if already installed or user dismissed recently
  if (isStandalone || !showPrompt || !deferredPrompt) {
    return null
  }

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm ${className}`}>
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-green-600 rounded-xl flex items-center justify-center">
              <Download size={20} className="text-white" />
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm">
                {COPY.pwa.installTitle}
              </h3>
              <p className="text-gray-600 text-xs">
                {COPY.pwa.installSubtitle}
              </p>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-gray-400 hover:text-gray-600 p-1 -mt-1 -mr-1"
            aria-label={COPY.pwa.installDismiss}
          >
            <X size={16} />
          </button>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="text-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
              <WifiOff size={14} className="text-green-600" />
            </div>
            <p className="text-xs text-gray-600">{COPY.pwa.offlineSupport}</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
              <Zap size={14} className="text-green-600" />
            </div>
            <p className="text-xs text-gray-600">{COPY.pwa.fastLoading}</p>
          </div>
          <div className="text-center">
            <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-1">
              <Smartphone size={14} className="text-green-600" />
            </div>
            <p className="text-xs text-gray-600">{COPY.pwa.homeScreen}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <PrimaryButton
            onClick={handleInstallClick}
            loading={isInstalling}
            className="flex-1 text-sm py-2"
            icon={Download}
          >
            {COPY.pwa.installButton}
          </PrimaryButton>
          <SecondaryButton
            onClick={handleMaybeLater}
            className="text-sm py-2 px-3"
          >
            {COPY.pwa.installLater}
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}

interface PWAUpdatePromptProps {
  className?: string
}

export const PWAUpdatePrompt: React.FC<PWAUpdatePromptProps> = ({ className = '' }) => {
  const [showUpdatePrompt, setShowUpdatePrompt] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    const handleSWUpdate = () => {
      setShowUpdatePrompt(true)
    }

    // Listen for service worker updates
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', handleSWUpdate)
      
      // Check for updates when the component mounts
      navigator.serviceWorker.getRegistration().then((registration) => {
        if (registration?.waiting) {
          setShowUpdatePrompt(true)
        }
      })
    }

    return () => {
      if ('serviceWorker' in navigator) {
        navigator.serviceWorker.removeEventListener('controllerchange', handleSWUpdate)
      }
    }
  }, [])

  const handleUpdateClick = async () => {
    setIsUpdating(true)
    
    try {
      if ('serviceWorker' in navigator) {
        const registration = await navigator.serviceWorker.getRegistration()
        if (registration?.waiting) {
          registration.waiting.postMessage({ type: 'SKIP_WAITING' })
          window.location.reload()
        }
      }
    } catch (error) {
      console.error('Error updating PWA:', error)
      setIsUpdating(false)
    }
  }

  const handleDismissUpdate = () => {
    setShowUpdatePrompt(false)
  }

  if (!showUpdatePrompt) {
    return null
  }

  return (
    <div className={`fixed top-4 left-4 right-4 z-50 sm:left-auto sm:right-4 sm:max-w-sm ${className}`}>
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <h3 className="font-semibold text-blue-900 text-sm">
              {COPY.pwa.updateAvailable}
            </h3>
            <p className="text-blue-700 text-xs mt-1">
              {COPY.pwa.updateDescription}
            </p>
          </div>
          <button
            onClick={handleDismissUpdate}
            className="text-blue-400 hover:text-blue-600 p-1 -mt-1 -mr-1"
            aria-label={COPY.common.close}
          >
            <X size={16} />
          </button>
        </div>
        
        <div className="flex gap-2">
          <PrimaryButton
            onClick={handleUpdateClick}
            loading={isUpdating}
            className="flex-1 text-sm py-2 bg-blue-600 hover:bg-blue-700"
          >
            {COPY.pwa.updateNow}
          </PrimaryButton>
          <SecondaryButton
            onClick={handleDismissUpdate}
            className="text-sm py-2 px-3 border-blue-300 text-blue-600 hover:bg-blue-50"
          >
            {COPY.pwa.updateLater}
          </SecondaryButton>
        </div>
      </div>
    </div>
  )
}

interface PWAOfflineIndicatorProps {
  className?: string
}

export const PWAOfflineIndicator: React.FC<PWAOfflineIndicatorProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)
  const [showOfflineBanner, setShowOfflineBanner] = useState(false)
  const [showOnlineBanner, setShowOnlineBanner] = useState(false)

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true)
      setShowOfflineBanner(false)
      setShowOnlineBanner(true)
      setTimeout(() => setShowOnlineBanner(false), 3000)
    }

    const handleOffline = () => {
      setIsOnline(false)
      setShowOfflineBanner(true)
      setShowOnlineBanner(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    // Show offline banner if already offline
    if (!navigator.onLine) {
      setShowOfflineBanner(true)
    }

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  if (!showOfflineBanner && !showOnlineBanner) {
    return null
  }

  return (
    <>
      {/* Offline Banner */}
      {showOfflineBanner && (
        <div className={`fixed top-0 left-0 right-0 z-50 bg-orange-500 text-white ${className}`}>
          <div className="flex items-center justify-center gap-2 py-2 px-4">
            <WifiOff size={16} />
            <span className="text-sm font-medium">{COPY.pwa.offlineMode}</span>
          </div>
        </div>
      )}

      {/* Back Online Banner */}
      {showOnlineBanner && (
        <div className={`fixed top-0 left-0 right-0 z-50 bg-green-500 text-white ${className}`}>
          <div className="flex items-center justify-center gap-2 py-2 px-4">
            <Wifi size={16} />
            <span className="text-sm font-medium">{COPY.pwa.backOnline}</span>
          </div>
        </div>
      )}
    </>
  )
}