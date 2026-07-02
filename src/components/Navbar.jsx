import { useState, useEffect } from 'react'
import { RiFlashlightFill } from 'react-icons/ri'
import { HiMenuAlt3, HiX } from 'react-icons/hi'
import { Link } from 'react-router-dom'

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [mobileOpen, setMobileOpen] = useState(false)
  const [user, setUser] = useState(null)

  // Fetch user
  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/auth/profile`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        if (!res.ok) {
          localStorage.removeItem("token")
          return
        }

        const data = await res.json()

        setUser(data.user || data)

      } catch (err) {
        console.error(err)
      }
    }

    fetchUser()
  }, [])

  // Scroll effect
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20)
    window.addEventListener('scroll', onScroll)
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const links = [
    { label: 'Home', to: '/' },
    { label: 'Drive', to: '/drive' },
  ]

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? 'glass-dark shadow-lg shadow-black/40' : 'bg-transparent'
        }`}
    >
      <nav className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo */}
        <Link to="/" className="flex items-center gap-2">
          <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
            <RiFlashlightFill className="text-dark text-lg" />
          </span>
          <span className="text-white text-xl font-bold">
            Ride<span className="text-accent">Flow</span>
          </span>
        </Link>

        {/* Desktop Links */}
        <ul className="hidden md:flex items-center gap-8">
          {links.map((link) => (
            <li key={link.label}>
              <Link to={link.to} className="text-gray-400 hover:text-white text-sm">
                {link.label}
              </Link>
            </li>
          ))}

        </ul>

        {/* Auth Section */}
        <div className="hidden md:flex items-center gap-3">

          {!user ? (
            <>
              <Link to="/login" className="px-4 py-2 text-sm font-semibold text-muted hover:text-white hover:bg-white/5 rounded-xl transition-all duration-200">
                Login
              </Link>

              <Link to="/signup" className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-accent to-emerald-600 hover:from-emerald-500 hover:to-accent rounded-xl shadow-lg shadow-accent/15 active:scale-[0.97] transition-all duration-200">
                Sign Up
              </Link>
            </>
          ) : (
            <div className="flex items-center gap-3 text-white">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center text-dark font-bold">
                {user?.name?.[0]}
              </div>
              <span className="text-sm font-medium">
                {user?.name}
              </span>

              <button
                onClick={() => {
                  localStorage.removeItem("token")
                  window.location.reload()
                }}
                className="ml-3 px-3 py-1 text-xs bg-red-500 rounded"
              >
                Logout
              </button>
            </div>
          )}

        </div>

        {/* Mobile Toggle */}
        <button
          className="md:hidden text-gray-300"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <HiX size={24} /> : <HiMenuAlt3 size={24} />}
        </button>

      </nav>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div className="md:hidden px-6 py-4 flex flex-col gap-4 bg-black">
          {links.map((link) => (
            <Link key={link.label} to={link.to} className="text-gray-300">
              {link.label}
            </Link>
          ))}

          {!user && (
            <div className="flex gap-3 pt-2">
              <Link to="/login" className="flex-1 py-2.5 text-center text-sm font-semibold text-muted hover:text-white border border-border bg-dark/50 hover:bg-white/5 rounded-xl transition-all">
                Login
              </Link>
              <Link to="/signup" className="flex-1 py-2.5 text-center text-sm font-semibold text-white bg-gradient-to-r from-accent to-emerald-600 hover:from-emerald-500 hover:to-accent rounded-xl active:scale-[0.98] transition-all">
                Sign Up
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  )
}