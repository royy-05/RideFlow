import { HiBolt, HiMapPin, HiArrowPath } from 'react-icons/hi2'
import { MdPriceChange } from 'react-icons/md'

const features = [
  {
    icon: HiBolt,
    title: 'Smart Matching',
    desc: 'Our algorithm finds the closest, highest-rated driver for your route in under 30 seconds.',
    color: 'text-accent',
    bg: 'bg-accent/10',
    border: 'border-accent/20',
  },
  {
    icon: MdPriceChange,
    title: 'Surge Pricing',
    desc: 'Transparent surge alerts before you confirm. No surprises — always see the real fare upfront.',
    color: 'text-yellow-400',
    bg: 'bg-yellow-400/10',
    border: 'border-yellow-400/20',
  },
  {
    icon: HiArrowPath,
    title: 'Multiple Trip Types',
    desc: 'Instant pickups, round trips, or hourly rentals — all in one seamless booking flow.',
    color: 'text-accent-blue',
    bg: 'bg-accent-blue/10',
    border: 'border-accent-blue/20',
  },
  {
    icon: HiMapPin,
    title: 'Real-time Tracking',
    desc: 'Live GPS tracking with driver location updates every 5 seconds. Share your trip with family.',
    color: 'text-rose-400',
    bg: 'bg-rose-400/10',
    border: 'border-rose-400/20',
  },
]

export default function Features() {
  return (
    <section className="py-24 px-6 relative">
      <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-30 pointer-events-none" />
      <div className="max-w-7xl mx-auto relative">
        {/* Header */}
        <div className="text-center mb-16">
          <span className="inline-block bg-white/5 border border-white/10 text-gray-400 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            Why RideFlow
          </span>
          <h2 className="font-display font-800 text-4xl lg:text-5xl text-white leading-tight">
            Built for the way<br />
            <span className="text-accent">you move</span>
          </h2>
        </div>

        {/* Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {features.map((f, i) => {
            const Icon = f.icon
            return (
              <div
                key={f.title}
                className={`group p-6 rounded-2xl border ${f.border} ${f.bg} hover:scale-[1.02] transition-all duration-300 cursor-default`}
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-5 ${f.bg} border ${f.border}`}>
                  <Icon className={`${f.color} text-xl`} />
                </div>
                <h3 className="font-display font-700 text-lg text-white mb-2">{f.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{f.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
