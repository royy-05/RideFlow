import { Link } from "react-router-dom";
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'

const benefits = [
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "Flexible Hours",
    desc: "Drive whenever you want. No fixed shifts, no pressure — you're the boss.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: "High Earnings",
    desc: "Earn daily with transparent pricing. Know exactly what you make per trip.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
      </svg>
    ),
    title: "Easy Payments",
    desc: "Get paid directly to your account. Instant payouts, no waiting period.",
  },
  {
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
      </svg>
    ),
    title: "Safety First",
    desc: "Verified riders and secure trips. RideFlow has your back on every journey.",
  },
];

const requirements = [
  { icon: "🪪", text: "Age 18 or above" },
  { icon: "📄", text: "Valid driving license" },
  { icon: "📱", text: "Android or iOS smartphone" },
  { icon: "🚗", text: "Own vehicle — bike or car" },
];

const steps = [
  {
    num: "01",
    title: "Sign Up",
    desc: "Create your driver account with basic details in under 2 minutes.",
  },
  {
    num: "02",
    title: "Get Verified",
    desc: "Submit your documents. Our team verifies them within 24 hours.",
  },
  {
    num: "03",
    title: "Start Earning",
    desc: "Go online and accept rides. Money hits your account daily.",
  },
];

export default function DriverLanding() {
  return (
    <>
    <Navbar />
    <div className="min-h-screen bg-[#0e0e0e] text-white">

      {/* ── Hero ── */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 flex flex-col items-center text-center">
        {/* Badge */}
        <span className="inline-flex items-center gap-1.5 bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-medium px-3 py-1 rounded-full mb-6">
          <span className="w-1.5 h-1.5 rounded-full bg-[#22c55e] animate-pulse" />
          Now live in 50+ cities
        </span>

        <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold leading-tight tracking-tight max-w-3xl">
          Drive and earn{" "}
          <span className="text-[#22c55e]">on your schedule</span>
        </h1>

        <p className="mt-5 text-gray-400 text-base sm:text-lg max-w-xl leading-relaxed">
          Join RideFlow and start earning with flexible hours and instant
          payouts. No targets, no pressure — just you and the road.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row gap-3">
          <Link
            to="/driver-signup"
            className="px-7 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold rounded-xl text-sm transition-colors"
          >
            Start Driving →
          </Link>
          <Link
            to="/driver-login"
            className="px-7 py-3 border border-[#2e2e2e] hover:border-[#3e3e3e] text-gray-300 hover:text-white rounded-xl text-sm transition-colors"
          >
            Already a driver? Login
          </Link>
        </div>

        {/* Stats strip */}
        <div className="mt-14 grid grid-cols-3 gap-6 sm:gap-12 w-full max-w-lg">
          {[
            { val: "50K+", label: "Active Drivers" },
            { val: "₹28/hr", label: "Avg. Earnings" },
            { val: "4.9★", label: "Driver Rating" },
          ].map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-[#22c55e] text-2xl font-bold">{s.val}</p>
              <p className="text-gray-500 text-xs mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Benefits ── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-[#1a1a1a]">
        <div className="text-center mb-10">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
            Why Drive With Us
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold mt-2">
            Everything you need to{" "}
            <span className="text-[#22c55e]">earn more</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {benefits.map((b) => (
            <div
              key={b.title}
              className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 hover:border-[#22c55e]/30 transition-colors"
            >
              <div className="w-9 h-9 rounded-xl bg-[#22c55e]/10 border border-[#22c55e]/20 text-[#22c55e] flex items-center justify-center mb-4">
                {b.icon}
              </div>
              <h3 className="text-white font-semibold text-sm mb-1.5">
                {b.title}
              </h3>
              <p className="text-gray-500 text-xs leading-relaxed">{b.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Requirements + How It Works (side by side on lg) ── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-[#1a1a1a] grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Requirements */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
            Eligibility
          </span>
          <h2 className="text-xl font-bold mt-2 mb-6">
            What you'll need
          </h2>
          <ul className="space-y-3">
            {requirements.map((r) => (
              <li
                key={r.text}
                className="flex items-center gap-3 bg-[#111] border border-[#222] rounded-xl px-4 py-3"
              >
                <span className="text-lg">{r.icon}</span>
                <span className="text-gray-300 text-sm">{r.text}</span>
                <span className="ml-auto">
                  <svg className="w-4 h-4 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* How It Works */}
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-6">
          <span className="text-xs font-medium text-gray-500 uppercase tracking-widest">
            How It Works
          </span>
          <h2 className="text-xl font-bold mt-2 mb-6">
            3 steps to your first ride
          </h2>
          <div className="space-y-4">
            {steps.map((step, i) => (
              <div key={step.num} className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-8 h-8 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 text-[#22c55e] text-xs font-bold flex items-center justify-center flex-shrink-0">
                    {step.num}
                  </div>
                  {i < steps.length - 1 && (
                    <div className="w-px flex-1 bg-[#2a2a2a] mt-2 mb-0" style={{ minHeight: "20px" }} />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-white font-semibold text-sm">{step.title}</p>
                  <p className="text-gray-500 text-xs mt-1 leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="max-w-5xl mx-auto px-6 py-16 border-t border-[#1a1a1a]">
        <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl px-8 py-12 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold mb-3">
            Ready to start{" "}
            <span className="text-[#22c55e]">earning?</span>
          </h2>
          <p className="text-gray-400 text-sm max-w-md mx-auto mb-7">
            Thousands of drivers across the country trust RideFlow. Join them
            today and take control of your income.
          </p>
          <Link
            to="/driver-signup"
            className="inline-flex items-center gap-2 px-8 py-3 bg-[#22c55e] hover:bg-[#16a34a] text-black font-semibold rounded-xl text-sm transition-colors"
          >
            Register as Driver →
          </Link>
          <p className="text-gray-600 text-xs mt-4">
            Background check required · 18+ · Valid license
          </p>
        </div>
      </section>

    </div>
    <Footer/>
    </>
  );
}
