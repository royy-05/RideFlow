import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { GoogleMap, Marker } from "@react-google-maps/api";
import axios from "../Utils/axios.js";
import socket from "../Utils/socket.js";

const mapStyles = [
  { elementType: "geometry", stylers: [{ color: "#1a1a1a" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#6b7280" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#0e0e0e" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#2a2a2a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#2e2e2e" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#333333" }] },
  { featureType: "road.highway", elementType: "geometry.stroke", stylers: [{ color: "#1a1a1a" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#111111" }] },
  { featureType: "poi", elementType: "geometry", stylers: [{ color: "#1f1f1f" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#4b5563" }] },
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1f1f1f" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2a2a2a" }] },
];

const mapContainerStyle = { width: "100%", height: "100%" };
const defaultCenter = { lat: 22.5726, lng: 88.3639 };

export default function DriverDashboard() {
  const navigate = useNavigate();

  const [driver, setDriver] = useState(null);
  const [isOnline, setIsOnline] = useState(false);
  const [ride, setRide] = useState(null);
  const [loadingRide, setLoadingRide] = useState(false);
  const [acceptingRide, setAcceptingRide] = useState(false);
  const [rideError, setRideError] = useState("");
  const [acceptSuccess, setAcceptSuccess] = useState(false);
  const [stats, setStats] = useState({ totalRides: 0, totalEarnings: 0, recentRides: [] });
  const [driverLocation, setDriverLocation] = useState(defaultCenter);
  const [showStats, setShowStats] = useState(false);
  const [timer, setTimer] = useState(20);
  const timerRef = useRef(null);
  const mapRef = useRef(null);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.watchPosition(
        (pos) => setDriverLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => { },
        { enableHighAccuracy: true }
      );
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/ride/driver-stats", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) setStats(res.data.data);
    } catch {
      console.error("Failed to fetch stats");
    }
  }, []);

  // Auth check + socket setup
  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (!token || role !== "driver") { navigate("/driver-login"); return; }

    try {
      const stored = localStorage.getItem("driver");
      const driverData = stored ? JSON.parse(stored) : { name: "Driver", email: "" };
      setDriver(driverData);

      const payload = JSON.parse(atob(token.split(".")[1]));
      const driverId = payload.id;

      // connect socket and join room with driver's ID
      socket.connect();
      socket.emit("join", driverId);

    } catch {
      setDriver({ name: "Driver", email: "" });
    }

    fetchStats();

    // cleanup on unmount
    return () => {
      socket.disconnect();
    };
  }, [navigate, fetchStats]);

  // Listen for ride:requested from server
  useEffect(() => {
    socket.on("ride:requested", (incomingRide) => {
      setRide(incomingRide);
      setTimer(20);
      setRideError("");
      setAcceptSuccess(false);
    });

    return () => {
      socket.off("ride:requested");
    };
  }, []);

  const fetchRide = useCallback(async () => {
    setLoadingRide(true);
    setRideError("");
    setAcceptSuccess(false);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.get("/ride/available", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success && res.data.data) {
        setRide(res.data.data);
        setTimer(20);
      } else {
        setRide(null);
      }
    } catch {
      setRideError("Failed to fetch rides.");
      setRide(null);
    } finally {
      setLoadingRide(false);
    }
  }, []);

  useEffect(() => {
    if (isOnline) fetchRide();
    else { setRide(null); setRideError(""); }
  }, [isOnline]);

  // Countdown timer
  useEffect(() => {
    if (ride) {
      timerRef.current = setInterval(() => {
        setTimer((t) => {
          if (t <= 1) { clearInterval(timerRef.current); setRide(null); return 20; }
          return t - 1;
        });
      }, 1000);
    } else {
      clearInterval(timerRef.current);
      setTimer(20);
    }
    return () => clearInterval(timerRef.current);
  }, [ride]);

  const handleAccept = async () => {
    if (!ride) return;
    setAcceptingRide(true);
    clearInterval(timerRef.current);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        "/ride/accept",
        { rideId: ride._id || ride.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        // Navigate to active ride page, passing full ride data
        navigate("/driver/active-ride", { state: { ride } });
      }
    } catch {
      setRideError("Could not accept ride.");
      setAcceptingRide(false);
    }
  }

  const handleReject = async () => {
    clearInterval(timerRef.current);
    try {
      const token = localStorage.getItem("token");
      await axios.post("/ride/reject", { rideId: ride._id }, {
        headers: { Authorization: `Bearer ${token}` }
      });
    } catch (err) {
      console.error("Failed to reject ride", err.response?.data || err.message);
    } finally {
      setRide(null);
    }
  };

  const handleToggleStatus = async () => {
    const newStatus = isOnline ? "offline" : "online";
    try {
      const token = localStorage.getItem("token");

      if (newStatus === "online" && driverLocation) {
        await axios.patch("/driver/location", {
          coordinates: [driverLocation.lng, driverLocation.lat]
        }, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }

      await axios.patch("/driver/status", { status: newStatus }, {
        headers: { Authorization: `Bearer ${token}` }
      });

      setIsOnline((v) => !v);
    } catch (err) {
      console.error("Failed to update status", err.response?.data || err.message);
    }
  };

  const handleLogout = () => {
    socket.disconnect();
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("driver");
    navigate("/driver-login");
  };

  const timerPercent = (timer / 20) * 100;
  const timerColor = timer > 10 ? "#22c55e" : timer > 5 ? "#f59e0b" : "#ef4444";

  if (!driver) return null;

  return (
    <div className="relative w-full h-screen bg-[#0e0e0e] overflow-hidden">

      {/* FULL SCREEN MAP */}
      <div className="absolute inset-0">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={driverLocation}
          zoom={15}
          options={{ styles: mapStyles, disableDefaultUI: true, gestureHandling: "greedy" }}
          onLoad={(map) => (mapRef.current = map)}
        >
          <Marker
            position={driverLocation}
            icon={{
              path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
              fillColor: "#22c55e",
              fillOpacity: 1,
              strokeColor: "#0e0e0e",
              strokeWeight: 2,
              scale: 1.8,
              anchor: { x: 12, y: 24 },
            }}
          />
          {ride?.pickup?.lat && ride?.pickup?.lng && (
            <Marker
              position={{ lat: ride.pickup.lat, lng: ride.pickup.lng }}
              icon={{
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                fillColor: "#3b82f6",
                fillOpacity: 1,
                strokeColor: "#0e0e0e",
                strokeWeight: 2,
                scale: 1.8,
                anchor: { x: 12, y: 24 },
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 bg-[#0e0e0e]/90 backdrop-blur border border-[#2a2a2a] rounded-2xl px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/40 flex items-center justify-center text-[#22c55e] font-bold text-xs">
              {driver.name?.charAt(0).toUpperCase() || "D"}
            </div>
            <div>
              <p className="text-white text-xs font-semibold leading-tight">{driver.name}</p>
              <p className="text-xs leading-tight">
                {isOnline ? <span className="text-[#22c55e]">● Online</span> : <span className="text-gray-500">○ Offline</span>}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowStats((v) => !v)}
              className="bg-[#0e0e0e]/90 backdrop-blur border border-[#2a2a2a] rounded-2xl p-2.5 text-gray-400 hover:text-white transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </button>

            <button
              onClick={handleToggleStatus}
              className={`relative inline-flex h-8 w-14 items-center rounded-full transition-colors border ${isOnline ? "bg-[#22c55e] border-[#22c55e]" : "bg-[#1a1a1a] border-[#2a2a2a]"}`}
            >
              <span className={`inline-block h-6 w-6 transform rounded-full bg-white shadow-lg transition-transform ${isOnline ? "translate-x-7" : "translate-x-1"}`} />
            </button>

            <button
              onClick={handleLogout}
              className="bg-[#0e0e0e]/90 backdrop-blur border border-[#2a2a2a] rounded-2xl px-3 py-2 text-gray-500 hover:text-red-400 text-xs transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>

      {/* STATS DRAWER */}
      <div className={`absolute top-0 left-0 right-0 z-20 transition-transform duration-300 ${showStats ? "translate-y-0" : "-translate-y-full"}`}>
        <div className="bg-[#0e0e0e]/95 backdrop-blur border-b border-[#2a2a2a] px-4 pt-16 pb-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-white font-semibold text-sm">Your Stats</h2>
            <button onClick={() => setShowStats(false)} className="text-gray-500 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Earnings</p>
              <p className="text-[#22c55e] text-2xl font-bold">₹{stats.totalEarnings}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
              <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Rides</p>
              <p className="text-white text-2xl font-bold">{stats.totalRides}</p>
            </div>
          </div>

          <div className="space-y-2 max-h-52 overflow-y-auto">
            {stats.recentRides.length === 0 ? (
              <p className="text-gray-600 text-xs text-center py-3">No completed rides yet</p>
            ) : (
              stats.recentRides.map((item) => (
                <div key={item._id} className="flex items-center justify-between bg-[#1a1a1a] rounded-xl px-3 py-2.5 border border-[#222]">
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-xs font-medium truncate">
                      {item.pickup?.address} <span className="text-gray-600">→</span> {item.destination?.address}
                    </p>
                    <p className="text-gray-600 text-xs mt-0.5">
                      {item.completedAt ? new Date(item.completedAt).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                    </p>
                  </div>
                  <p className="text-[#22c55e] font-semibold text-sm ml-3 flex-shrink-0">₹{item.fare}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* OFFLINE OVERLAY */}
      {!isOnline && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
          <div className="bg-[#0e0e0e]/90 backdrop-blur border border-[#2a2a2a] rounded-2xl px-8 py-5 text-center">
            <div className="w-10 h-10 rounded-full bg-[#1f1f1f] border border-[#2e2e2e] flex items-center justify-center mx-auto mb-2">
              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M18.364 5.636a9 9 0 010 12.728M15.536 8.464a5 5 0 010 7.072M12 12h.01" />
              </svg>
            </div>
            <p className="text-white font-semibold text-sm">You're offline</p>
            <p className="text-gray-500 text-xs mt-1">Toggle to go online</p>
          </div>
        </div>
      )}

      {/* ACCEPT SUCCESS TOAST */}
      {acceptSuccess && (
        <div className="absolute top-20 left-1/2 -translate-x-1/2 z-30 animate-bounce">
          <div className="bg-[#22c55e] text-black font-semibold text-sm rounded-2xl px-5 py-3 flex items-center gap-2 shadow-lg">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
            </svg>
            Ride accepted! Head to pickup.
          </div>
        </div>
      )}

      {/* RIDE REQUEST SLIDE-UP CARD */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-500 ease-out ${ride ? "translate-y-0" : "translate-y-full"}`}>
        <div className="bg-[#0e0e0e] border-t border-[#2a2a2a] rounded-t-3xl px-5 pt-4 pb-8 shadow-2xl">

          <div className="w-10 h-1 bg-[#2a2a2a] rounded-full mx-auto mb-4" />

          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-gray-500 text-xs uppercase tracking-wider">New Request</p>
              <p className="text-white font-semibold text-base mt-0.5">Ride nearby</p>
            </div>
            <div className="relative w-14 h-14">
              <svg className="w-14 h-14 -rotate-90" viewBox="0 0 56 56">
                <circle cx="28" cy="28" r="24" fill="none" stroke="#1f1f1f" strokeWidth="4" />
                <circle
                  cx="28" cy="28" r="24"
                  fill="none"
                  stroke={timerColor}
                  strokeWidth="4"
                  strokeDasharray={`${2 * Math.PI * 24}`}
                  strokeDashoffset={`${2 * Math.PI * 24 * (1 - timerPercent / 100)}`}
                  strokeLinecap="round"
                  style={{ transition: "stroke-dashoffset 1s linear, stroke 0.3s" }}
                />
              </svg>
              <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm">
                {timer}
              </span>
            </div>
          </div>

          <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 mb-3">
            <div className="flex items-start gap-3 mb-3">
              <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#22c55e] flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Pickup</p>
                <p className="text-white text-sm font-medium leading-tight">{ride?.pickup?.address || "—"}</p>
              </div>
            </div>
            <div className="ml-1 border-l-2 border-dashed border-[#2e2e2e] h-3 mb-3" />
            <div className="flex items-start gap-3">
              <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
              <div>
                <p className="text-gray-500 text-xs mb-0.5">Drop-off</p>
                <p className="text-white text-sm font-medium leading-tight">{ride?.destination?.address || "—"}</p>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-2 py-2.5 text-center">
              <p className="text-gray-500 text-xs mb-0.5">Fare</p>
              <p className="text-[#22c55e] font-bold text-sm">₹{ride?.fare ?? "—"}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-2 py-2.5 text-center">
              <p className="text-gray-500 text-xs mb-0.5">Distance</p>
              <p className="text-white font-semibold text-sm">{ride?.distance ? `${ride.distance} km` : "—"}</p>
            </div>
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-xl px-2 py-2.5 text-center">
              <p className="text-gray-500 text-xs mb-0.5">Type</p>
              <p className="text-white font-semibold text-sm capitalize">{ride?.vehicleType ?? "—"}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleReject}
              className="bg-[#1a1a1a] border border-[#2a2a2a] hover:border-red-500/50 hover:text-red-400 text-gray-400 font-semibold rounded-2xl py-4 text-sm transition-all"
            >
              Decline
            </button>
            <button
              onClick={handleAccept}
              disabled={acceptingRide}
              className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-60 text-black font-bold rounded-2xl py-4 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {acceptingRide ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Accepting...
                </>
              ) : "Accept Ride"}
            </button>
          </div>

        </div>
      </div>

      {/* BOTTOM STATUS BAR */}
      {isOnline && !ride && (
        <div className="absolute bottom-0 left-0 right-0 z-10 px-4 pb-6">
          <div className="bg-[#0e0e0e]/90 backdrop-blur border border-[#2a2a2a] rounded-2xl px-5 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-[#22c55e] animate-pulse" />
              <div>
                <p className="text-white text-sm font-semibold">Looking for rides</p>
                <p className="text-gray-500 text-xs">Visible to nearby passengers</p>
              </div>
            </div>
            <button
              onClick={fetchRide}
              disabled={loadingRide}
              className="text-[#22c55e] text-xs flex items-center gap-1.5 hover:opacity-80 transition-opacity disabled:opacity-50"
            >
              <svg className={`w-4 h-4 ${loadingRide ? "animate-spin" : ""}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      )}

    </div>
  );
}