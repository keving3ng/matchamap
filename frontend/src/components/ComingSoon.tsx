import React, { useState } from 'react'
import { isValidEmail } from '../utils/validation'

interface ComingSoonProps {
  onPasswordCorrect: () => void
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onPasswordCorrect }) => {
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [password, setPassword] = useState('')
  const [email, setEmail] = useState('')
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = import.meta.env.VITE_ACCESS_PASSWORD

    if (password === correctPassword) {
      onPasswordCorrect()
    } else {
      setPassword('')
    }
  }

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Email validation
    if (!email || !isValidEmail(email)) {
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/waitlist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      })

      if (response.ok) {
        setIsSubmitted(true)
        setEmail('')
      } else {
        console.error('Failed to join waitlist')
      }
    } catch (error) {
      console.error('Error joining waitlist:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="w-full h-screen bg-matcha-500 flex items-center justify-center px-4">
      <div className="text-center text-white max-w-sm w-full">
        <button
          onClick={() => setShowPasswordField(!showPasswordField)}
          className="text-7xl sm:text-8xl mb-6 cursor-pointer hover:scale-110 transition-transform duration-300"
        >
          🍵
        </button>
        <h1 className="text-5xl sm:text-6xl font-bold tracking-tight mb-8">MatchaMap</h1>

        {!isSubmitted ? (
          <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-3">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your email"
              required
              disabled={isSubmitting}
              className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white text-center placeholder-white/50 focus:outline-none focus:border-white/40 focus:bg-white/15 transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full px-6 py-3 bg-white/90 text-matcha-600 font-medium rounded-lg hover:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? '...' : 'notify me'}
            </button>
          </form>
        ) : (
          <div className="mt-2 py-3 text-white/90">
            <p className="text-lg">you're in.</p>
          </div>
        )}

        {showPasswordField && (
          <form onSubmit={handlePasswordSubmit} className="mt-8">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="password"
              autoFocus
              className="px-4 py-2 rounded bg-white/10 border border-white/20 text-white text-center placeholder-white/50 focus:outline-none focus:border-white/40"
            />
          </form>
        )}
      </div>
    </div>
  )
}

export default ComingSoon
