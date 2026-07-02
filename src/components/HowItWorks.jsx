import { HiMapPin, HiCheckCircle } from 'react-icons/hi2'
import { RiCarLine } from 'react-icons/ri'

const steps = [
  {
    number: '01',
    icon: HiMapPin,
    title: 'Enter Your Route',
    desc: 'Type your pickup and drop-off location. We\'ll auto-complete and suggest the fastest path.',
    color: 'text-accent',
    ring: 'ring-accent/30',
    dot: 'bg-accent',
  },
  {
    number: '02',
    icon: RiCarLine,
    title: 'Choose Your Ride',
    desc: 'Pick from Mini, Sedan, or SUV. Compare prices, ETAs, and driver ratings before confirming.',
    color: 'text-accent-blue',
    ring: 'ring-accent-blue/30',
    dot: 'bg-accent-blue',
  },
  {
    number: '03',
    icon: HiCheckCircle,
    title: 'Track & Go',
    desc: 'Watch your driver arrive in real-time on the map. Rate your ride and earn rewards after.',
    color: 'text-yellow-400',
    ring: 'ring-yellow-400/30',
    dot: 'bg-yellow-400',
  },
]

export default function HowItWorks() {
  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16">
          <span className="inline-block bg-white/5 border border-white/10 text-gray-400 text-xs font-semibold uppercase tracking-widest px-4 py-1.5 rounded-full mb-4">
            How It Works
          </span>
          <h2 className="font-display font-800 text-4xl lg:text-5xl text-white">
            Three steps to your<br />
            <span className="text-accent">next ride</span>
          </h2>
        </div>

        <div className="relative">
          {/* Connector line (desktop) */}
          <div className="hidden lg:block absolute top-14 left-1/6 right-1/6 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent z-0" />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 relative z-10">
            {steps.map((step, i) => {
              const Icon = step.icon
              return (
                <div key={step.number} className="flex flex-col items-center text-center group">
                  {/* Icon circle */}
                  <div className={`relative w-24 h-24 rounded-full bg-white/4 border border-white/8 flex items-center justify-center mb-6 ring-4 ${step.ring} group-hover:scale-105 transition-transform duration-300`}>
                    <Icon className={`text-3xl ${step.color}`} />
                    <span className={`absolute -top-2 -right-2 w-7 h-7 ${step.dot} text-dark text-xs font-bold rounded-full flex items-center justify-center font-display`}>
                      {i + 1}
                    </span>
                  </div>

                  <span className="text-xs font-mono text-gray-600 mb-2">{step.number}</span>
                  <h3 className="font-display font-700 text-xl text-white mb-3">{step.title}</h3>
                  <p className="text-sm text-gray-500 leading-relaxed max-w-xs">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}
