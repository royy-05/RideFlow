import { useRef, useState, useEffect } from 'react'
import { HiLocationMarker, HiFlag } from 'react-icons/hi'
import { RiFlashlightFill } from 'react-icons/ri'
import { MdMyLocation } from 'react-icons/md'
import RideOptions from './RideOptions'
import MapComponent from './Maps'
import LoginModal from './LoginModal'
import { useNavigate } from 'react-router-dom'
import { Autocomplete } from '@react-google-maps/api'
import socket from '../Utils/socket.js'

export default function Hero() {
  const [pickup, setPickup] = useState({ lat: null, lng: null, address: '' })
  const [RideData, setRideData] = useState(null)
  const [showRides, setShowRides] = useState(false)
  const [destination, setDestination] = useState({ lat: null, lng: null, address: '' })
  const [tripType, setTripType] = useState('instant')
  const [selectedRide, setSelectedRide] = useState(null)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [booking, setBooking] = useState(false)
  const navigate = useNavigate()

  // connect socket and join room with user ID
  useEffect(() => {
    const token = localStorage.getItem("token")
    const role = localStorage.getItem("role")

    // only connect if logged in as user
    if (!token || role !== "user") return

    const payload = JSON.parse(atob(token.split(".")[1]))
    socket.connect()
    socket.emit("join", payload.id)

    // listen for ride accepted
    socket.on("ride:accepted", (ride) => {
      navigate(`/ride-status/${ride._id}`)
    })

    // listen for ride rejected (driver declined, reassigning)
    socket.on("ride:rejected", ({ message }) => {
      alert(message) // we'll replace this with a proper toast later
    })

    return () => {
      socket.off("ride:accepted")
      socket.off("ride:rejected")
      socket.disconnect()
    }
  }, [navigate])

  const handleBookRide = () => {
    if (!pickup.lat || !destination.lat) return alert("Select valid locations")
    if (!RideData || !RideData.fare) return alert("Wait for fare calculation")
    if (!selectedRide) return alert("Select a vehicle type")

    const token = localStorage.getItem("token")
    if (!token || token === "undefined") { setShowLoginModal(true); return }

    navigate("/ride-status", {
      state: {
        pickup,
        destination,
        fares: RideData.fare,
        vehicleType: selectedRide.toLowerCase(),
        distance: RideData.distance,
        duration: RideData.duration
      }
    })
  }

  const pickupRef = useRef(null)
  const destinationRef = useRef(null)

  return (
    <>
      <section className="relative min-h-screen flex flex-col bg-dark overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid opacity-60 pointer-events-none" />
        <div className="absolute top-1/4 left-1/3 w-96 h-96 bg-accent/5 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/3 right-1/4 w-64 h-64 bg-accent-blue/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative flex-1 flex flex-col lg:flex-row max-w-7xl mx-auto w-full px-6 pt-24 pb-10 gap-6">
          {/* Left Panel */}
          <div className="flex flex-col justify-center w-full lg:w-[420px] xl:w-[460px] shrink-0 z-10">
            <div className="inline-flex items-center gap-2 bg-accent/10 border border-accent/20 rounded-full px-3 py-1.5 w-fit mb-6 animate-fadeUp">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-green" />
              <span className="text-accent text-xs font-semibold tracking-wide uppercase">Live in your city</span>
            </div>

            <h1 className="font-display font-900 text-4xl xl:text-5xl leading-[1.08] text-white mb-3 animate-fadeUp delay-100">
              Move smarter,<br />
              <span className="text-accent">arrive faster.</span>
            </h1>
            <p className="text-gray-400 text-base mb-8 leading-relaxed animate-fadeUp delay-200">
              Book a ride in seconds. Real-time tracking, surge alerts, and flexible trip types — all in one place.
            </p>

            {/* Booking Card */}
            <div className="glass-dark rounded-2xl p-5 shadow-2xl animate-fadeUp delay-300">
              {/* Trip Type */}
              <div className="flex gap-1 bg-white/5 rounded-xl p-1 mb-4">
                {['instant', 'round', 'rental'].map((t) => (
                  <button
                    key={t}
                    onClick={() => setTripType(t)}
                    className={`flex-1 py-1.5 text-xs font-semibold rounded-lg capitalize transition-all duration-200
                    ${tripType === t ? 'bg-accent text-dark shadow' : 'text-gray-400 hover:text-white'}`}
                  >
                    {t}
                  </button>
                ))}
              </div>

              {/* Inputs */}
              <div className="space-y-2 mb-4">
                <div className="relative">
                  <MdMyLocation className="absolute left-3 top-1/2 -translate-y-1/2 text-accent text-lg" />
                  <Autocomplete
                    onLoad={(ref) => (pickupRef.current = ref)}
                    onPlaceChanged={() => {
                      const place = pickupRef.current.getPlace()
                      if (!place.geometry) return
                      setPickup({
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.formatted_address
                      })
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Pickup location"
                      onChange={(e) => setPickup({ ...pickup, address: e.target.value })}
                      value={pickup.address}
                      className="w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-accent/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 transition-colors"
                    />
                  </Autocomplete>
                </div>

                <div className="flex items-center gap-3 px-3">
                  <div className="flex flex-col items-center gap-0.5">
                    <div className="w-px h-1.5 bg-white/15" />
                    <div className="w-px h-1.5 bg-white/15" />
                  </div>
                </div>

                <div className="relative">
                  <HiFlag className="absolute left-3 top-1/2 -translate-y-1/2 text-accent-blue text-lg" />
                  <Autocomplete
                    onLoad={(ref) => (destinationRef.current = ref)}
                    onPlaceChanged={async () => {
                      const place = destinationRef.current.getPlace()
                      if (!place.geometry) return

                      const drop = {
                        lat: place.geometry.location.lat(),
                        lng: place.geometry.location.lng(),
                        address: place.formatted_address
                      }
                      setDestination(drop)

                      if (pickup.lat && pickup.lng && drop.lat && drop.lng) {
                        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/fare/calculate`, {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ pickup, drop })
                        });

                        const data = await res.json();
                        setRideData(data);
                        setShowRides(true);
                      }
                    }}
                  >
                    <input
                      type="text"
                      placeholder="Where to?"
                      className="w-full bg-white/5 border border-white/8 hover:border-white/15 focus:border-accent-blue/50 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 transition-colors"
                    />
                  </Autocomplete>
                </div>
              </div>

              {showRides && RideData && RideData.isSurge && (
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5 mb-3 flex items-center gap-2 text-amber-400 animate-fadeIn">
                  <span className="text-base animate-pulse">⚡</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-bold leading-none">{RideData.surgeReason}</p>
                    <p className="text-[10px] text-amber-400/70 mt-1">High demand: Fares adjusted by {RideData.surgeMultiplier}x</p>
                  </div>
                </div>
              )}

              {showRides && RideData && (
                <RideOptions selected={selectedRide} onSelect={setSelectedRide} fares={RideData.fare} />
              )}

              {/* Book Button */}
              <button
                onClick={handleBookRide}
                disabled={!RideData || !RideData.fare || !selectedRide}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3.5 bg-gradient-to-r from-accent to-emerald-600 hover:from-emerald-500 hover:to-accent text-white font-bold text-sm rounded-xl transition-all duration-200 shadow-lg shadow-accent/20 hover:shadow-accent/30 active:scale-[0.98] disabled:opacity-40 disabled:pointer-events-none"
              >
                {booking ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                    </svg>
                    Finding driver...
                  </>
                ) : (
                  <>
                    <RiFlashlightFill className="text-lg" />
                    Book Ride Now
                  </>
                )}
              </button>

              <p className="text-center text-xs text-gray-600 mt-3">No hidden fees · Cancel anytime</p>
            </div>
          </div>

          {/* Right: Map */}
          <div className="flex-1 min-h-[300px] lg:min-h-0 rounded-2xl overflow-hidden relative animate-fadeIn delay-400 border border-white/8 shadow-2xl">
            <MapComponent setPickup={setPickup} />
            <div className="absolute bottom-4 left-4 glass-dark rounded-xl px-3 py-2 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-accent animate-pulse-green" />
              <span className="text-xs font-medium text-white">12 drivers nearby</span>
            </div>
            <div className="absolute top-4 right-4 bg-accent text-dark text-xs font-bold px-3 py-1.5 rounded-lg shadow-lg">
              ≈ 5 min ETA
            </div>
          </div>
        </div>
      </section>

      {showLoginModal && (
        <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      )}
    </>
  )
}