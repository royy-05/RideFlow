import { useNavigate } from "react-router-dom"

export default function LoginModal({ isOpen, onClose }) {
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleContinue = () => {
    onClose()
    navigate("/login")
  }

  return (
    <div className="fixed inset-0 bg-dark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-card border border-border w-full max-w-sm rounded-2xl p-6 shadow-2xl relative overflow-hidden transition-all transform scale-100 flex flex-col items-center text-center">
        
        {/* Keyhole/Security Icon */}
        <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-accent/10 text-accent mb-4 border border-accent/20">
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-white mb-2 font-display tracking-tight">
          Unlock Ride Options
        </h2>

        {/* Subtitle */}
        <p className="text-sm text-muted mb-6 leading-relaxed">
          Please take a moment to quickly sign in or create an account so we can show available drivers, rates, and routes.
        </p>

        {/* CTA Actions */}
        <div className="w-full space-y-2.5">
          <button
            onClick={handleContinue}
            className="w-full bg-gradient-to-r from-accent to-emerald-600 hover:from-emerald-500 hover:to-accent text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-accent/20 active:scale-[0.98] transition-all text-sm outline-none"
          >
            Sign In / Sign Up
          </button>

          <button
            onClick={onClose}
            className="w-full border border-border hover:bg-white/5 text-muted hover:text-white font-semibold py-2.5 px-4 rounded-xl active:scale-[0.98] transition-all text-sm outline-none"
          >
            Cancel
          </button>
        </div>

      </div>
    </div>
  )
}