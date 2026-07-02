import { HiArrowRight, HiCurrencyDollar, HiClock, HiStar } from 'react-icons/hi2'

const perks = [
  { icon: HiCurrencyDollar, label: 'Avg. $28/hr', sub: 'Earnings' },
  { icon: HiClock, label: 'Flexible hours', sub: 'Schedule' },
  { icon: HiStar, label: '4.9 avg rating', sub: 'Community' },
]

export default function DriverCTA() {
  return (
    <section className="py-24 px-6 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent-blue/5 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-2/3 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />

      <div className="max-w-5xl mx-auto relative">
        <div className="rounded-3xl border border-accent/15 bg-gradient-to-br from-accent/8 via-transparent to-transparent p-10 lg:p-16 text-center">

          {/* Tag */}
          <span className="inline-block bg-accent/10 border border-accent/20 text-accent text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
            Drive with us
          </span>

          <h2 className="font-display font-900 text-4xl lg:text-5xl xl:text-6xl text-white mb-4 leading-tight">
            Earn with
            <span className="text-accent"> RideFlow</span>
          </h2>
          <p className="text-gray-400 text-lg mb-10 max-w-2xl mx-auto leading-relaxed">
            Join thousands of drivers earning great income on their own schedule.
            Set your hours, keep more earnings, and grow with us.
          </p>

          {/* Perks row */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-10">
            {perks.map((p) => {
              const Icon = p.icon
              return (
                <div key={p.label} className="flex items-center gap-3 bg-white/5 border border-white/8 rounded-2xl px-5 py-3">
                  <Icon className="text-accent text-xl shrink-0" />
                  <div className="text-left">
                    <div className="text-sm font-semibold text-white">{p.label}</div>
                    <div className="text-xs text-gray-500">{p.sub}</div>
                  </div>
                </div>
              )
            })}
          </div>

          {/* CTA button */}
          <button className="inline-flex items-center gap-2 px-8 py-4 bg-accent hover:bg-green-400 text-dark font-bold text-base rounded-xl transition-all duration-200 shadow-xl shadow-accent/25 hover:shadow-accent/40 active:scale-95 group">
            Become a Driver
            <HiArrowRight className="group-hover:translate-x-1 transition-transform" />
          </button>

          <p className="text-xs text-gray-600 mt-4">Background check required · 18+ · Valid license</p>
        </div>
      </div>
    </section>
  )
}
