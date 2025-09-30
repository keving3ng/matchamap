import React, { useState } from 'react'

interface ComingSoonProps {
  onPasswordCorrect: () => void
}

export const ComingSoon: React.FC<ComingSoonProps> = ({ onPasswordCorrect }) => {
  const [showPasswordField, setShowPasswordField] = useState(false)
  const [password, setPassword] = useState('')

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const correctPassword = import.meta.env.VITE_ACCESS_PASSWORD

    if (password === correctPassword) {
      onPasswordCorrect()
    } else {
      setPassword('')
    }
  }

  return (
    <div className="w-full h-screen bg-matcha-500 flex items-center justify-center">
      <div className="text-center text-white">
        <button
          onClick={() => setShowPasswordField(!showPasswordField)}
          className="text-6xl mb-4 cursor-pointer hover:scale-110 transition-transform"
        >
          🍵
        </button>
        <h1 className="text-5xl font-bold">MatchaMap</h1>
        <p className="text-xl mt-4 opacity-90">Coming Soon</p>

        {showPasswordField && (
          <form onSubmit={handlePasswordSubmit} className="mt-6">
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
