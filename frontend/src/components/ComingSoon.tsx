import React, { useState } from 'react'

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

    // Basic email validation
    if (!email || !email.includes('@')) {
      return
    }

    setIsSubmitting(true)

    // TODO: Backend integration will be added later
    // For now, just simulate a submission
    setTimeout(() => {
      setIsSubmitted(true)
      setIsSubmitting(false)
      setEmail('')
    }, 500)
  }

  return (
    <div className="w-full h-screen bg-matcha-500 flex items-center justify-center px-4">
      <div className="text-center text-white max-w-md w-full">
        <button
          onClick={() => setShowPasswordField(!showPasswordField)}
          className="text-6xl mb-4 cursor-pointer hover:scale-110 transition-transform"
        >
          🍵
        </button>
        <h1 className="text-4xl sm:text-5xl font-bold">MatchaMap</h1>
        <p className="text-lg sm:text-xl mt-4 opacity-90">Your guide to the best matcha in Toronto</p>

        {!isSubmitted ? (
          <div className="mt-8">
            <p className="text-base sm:text-lg mb-4 opacity-90">
              Join the waitlist to get notified when we launch
            </p>
            <form onSubmit={handleWaitlistSubmit} className="flex flex-col gap-3">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                disabled={isSubmitting}
                className="w-full px-4 py-3 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/50 focus:bg-white/25 transition-colors disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full px-6 py-3 bg-white text-matcha-600 font-semibold rounded-lg hover:bg-cream-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? 'Joining...' : 'Join Waitlist'}
              </button>
            </form>
          </div>
        ) : (
          <div className="mt-8 p-6 bg-white/10 rounded-lg border border-white/20">
            <p className="text-lg font-semibold mb-2">✨ You're on the list!</p>
            <p className="text-sm opacity-90">
              We'll notify you when MatchaMap launches.
            </p>
          </div>
        )}

        {showPasswordField && (
          <form onSubmit={handlePasswordSubmit} className="mt-8">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              autoFocus
              className="px-4 py-2 rounded bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:border-white/50"
            />
          </form>
        )}
      </div>
    </div>
  )
}

export default ComingSoon
