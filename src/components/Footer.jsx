import { RiFlashlightFill } from 'react-icons/ri'
import { FaTwitter, FaInstagram, FaLinkedin, FaGithub } from 'react-icons/fa'

const columns = [
  {
    title: 'Product',
    links: ['Ride', 'Drive', 'Safety', 'Pricing'],
  },
  {
    title: 'Company',
    links: ['About', 'Careers', 'Blog', 'Press'],
  },
  {
    title: 'Support',
    links: ['Help Center', 'Contact Us', 'Privacy', 'Terms'],
  },
]

const socials = [
  { icon: FaTwitter, href: '#', label: 'Twitter' },
  { icon: FaInstagram, href: '#', label: 'Instagram' },
  { icon: FaLinkedin, href: '#', label: 'LinkedIn' },
  { icon: FaGithub, href: '#', label: 'GitHub' },
]

export default function Footer() {
  return (
    <footer className="border-t border-white/5 pt-16 pb-8 px-6">
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 mb-14">
          {/* Brand */}
          <div className="lg:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-8 h-8 rounded-lg bg-accent flex items-center justify-center">
                <RiFlashlightFill className="text-dark text-lg" />
              </span>
              <span className="font-display font-800 text-xl text-white">
                Ride<span className="text-accent">Flow</span>
              </span>
            </div>
            <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-6">
              Move smarter, arrive faster. Available in 50+ cities across the country.
            </p>
            {/* Socials */}
            <div className="flex gap-3">
              {socials.map((s) => {
                const Icon = s.icon
                return (
                  <a
                    key={s.label}
                    href={s.href}
                    aria-label={s.label}
                    className="w-9 h-9 rounded-lg bg-white/5 border border-white/8 flex items-center justify-center text-gray-400 hover:text-white hover:border-white/20 hover:bg-white/8 transition-all duration-200"
                  >
                    <Icon size={15} />
                  </a>
                )
              })}
            </div>
          </div>

          {/* Link columns */}
          {columns.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold uppercase tracking-widest text-gray-400 mb-4">{col.title}</h4>
              <ul className="space-y-3">
                {col.links.map((link) => (
                  <li key={link}>
                    <a
                      href="#"
                      className="text-sm text-gray-500 hover:text-white transition-colors duration-150"
                    >
                      {link}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-gray-600">
          <span>© {new Date().getFullYear()} RideFlow Technologies, Inc. All rights reserved.</span>
          <div className="flex gap-5">
            <a href="#" className="hover:text-gray-400 transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-gray-400 transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  )
}
