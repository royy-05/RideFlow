import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useRideData } from "../Hooks/useRideData";
import RideSummary from "../components/RideSummary";
import RideOptionCard from "../components/RideOptionCard";
// import MapComponent from "../components/MapComponent"; // uncomment when ready

const VEHICLE_OPTIONS = [
  { vehicleId: "bike", eta: "2 min" },
  { vehicleId: "auto", eta: "4 min" },
  { vehicleId: "sedan", eta: "6 min" },
];

const FARE_KEY_MAP = {
  bike: "bike",
  auto: "auto",
  sedan: "sedan",
};

export default function Dashboard() {
  const navigate = useNavigate();
  const { rideData, loading } = useRideData();
  const [selectedVehicle, setSelectedVehicle] = useState("sedan");
  const [confirmed, setConfirmed] = useState(false);

  function handleConfirm() {
    console.log("Ride Confirmed", {
      vehicle: selectedVehicle,
      pickup: rideData.pickup,
      destination: rideData.destination,
      fare: rideData.fares[FARE_KEY_MAP[selectedVehicle]],
    });
    setConfirmed(true);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="w-6 h-6 rounded-full border-2 border-green-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!rideData) return null;

  const { pickup, destination, fares, distance } = rideData;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      {/* Ambient background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-green-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-green-400/3 rounded-full blur-3xl" />
      </div>

      {/* Header */}
      <header className="relative z-10 border-b border-white/5 bg-slate-950/80 backdrop-blur-sm px-4 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-green-500/20 border border-green-400/30 flex items-center justify-center">
              <span className="text-green-400 text-sm">⚡</span>
            </div>
            <span className="font-semibold text-white tracking-tight">RideBook</span>
          </div>

          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors px-3 py-1.5 rounded-lg hover:bg-white/5 border border-transparent hover:border-white/10"
          >
            <span>←</span>
            <span>Edit Ride</span>
          </button>
        </div>
      </header>

      {/* Main layout */}
      <main className="relative z-10 max-w-5xl mx-auto px-4 py-6 lg:py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* Left: Map placeholder + summary */}
          <div className="space-y-5">
            {/* Map Section */}
            <div className="rounded-2xl overflow-hidden border border-white/10 bg-white/5 backdrop-blur-md h-64 lg:h-80 flex items-center justify-center">
              {/* Replace this div with <MapComponent pickup={pickup} /> */}
              <div className="text-center space-y-2 opacity-40">
                <div className="text-4xl">🗺️</div>
                <p className="text-xs text-slate-400">Map Component goes here</p>
                <p className="text-xs text-slate-500 font-mono">{"<MapComponent pickup={pickup} />"}</p>
              </div>
            </div>

            {/* Ride Summary */}
            <RideSummary
              pickup={pickup}
              destination={destination}
              distance={distance}
              fare={fares[FARE_KEY_MAP[selectedVehicle]]}
            />
          </div>

          {/* Right panel: vehicle options + confirm */}
          <div className="space-y-4">
            <div>
              <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400 mb-3">
                Choose a ride
              </h2>
              <div className="space-y-2.5">
                {VEHICLE_OPTIONS.map(({ vehicleId, eta }) => (
                  <RideOptionCard
                    key={vehicleId}
                    vehicleId={vehicleId}
                    price={fares[FARE_KEY_MAP[vehicleId]]}
                    eta={eta}
                    isSelected={selectedVehicle === vehicleId}
                    onSelect={setSelectedVehicle}
                  />
                ))}
              </div>
            </div>

            {/* Fare summary line */}
            <div className="flex items-center justify-between px-1 py-1">
              <span className="text-xs text-slate-500">Selected fare</span>
              <span className="text-sm font-bold text-green-400">
                ₹{fares[FARE_KEY_MAP[selectedVehicle]]}
              </span>
            </div>

            {/* Confirm Button */}
            {confirmed ? (
              <div className="rounded-2xl border border-green-400/30 bg-green-500/10 px-5 py-4 text-center">
                <p className="text-green-400 font-semibold text-sm">✓ Ride Confirmed</p>
                <p className="text-slate-400 text-xs mt-1">Looking for your driver…</p>
              </div>
            ) : (
              <button
                onClick={handleConfirm}
                className="w-full rounded-2xl bg-green-500 hover:bg-green-400 active:scale-[0.98] transition-all duration-200 px-5 py-4 font-semibold text-slate-950 text-sm tracking-wide shadow-[0_0_24px_rgba(74,222,128,0.25)] hover:shadow-[0_0_32px_rgba(74,222,128,0.4)]"
              >
                Confirm Ride
              </button>
            )}

            <p className="text-center text-[11px] text-slate-600">
              You won't be charged until the ride starts
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
