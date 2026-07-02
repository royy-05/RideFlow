import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GoogleMap, Marker, DirectionsRenderer } from "@react-google-maps/api";
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
  { featureType: "transit", elementType: "geometry", stylers: [{ color: "#1f1f1f" }] },
  { featureType: "administrative", elementType: "geometry.stroke", stylers: [{ color: "#2a2a2a" }] },
];

const mapContainerStyle = { width: "100%", height: "100%" };

// Build a clean SVG data URI icon for vehicle markers — works reliably with Google Maps
const getVehicleIcon = (vehicleType, color = "#22c55e") => {
  const emojis = {
    bike: "🏍",
    mini: "🚗",
    sedan: "🚗",
    suv: "🚙",
    auto: "🛺",
  };
  const emoji = emojis[vehicleType] || "🚗";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" fill="${color}" fill-opacity="0.15" stroke="${color}" stroke-width="2"/>
    <text x="22" y="30" text-anchor="middle" font-size="22">${emoji}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(44, 44),
    anchor: new window.google.maps.Point(22, 22),
  };
};

function getBearing(start, end) {
  const lat1 = (start.lat * Math.PI) / 180;
  const lat2 = (end.lat * Math.PI) / 180;
  const dLng = ((end.lng - start.lng) * Math.PI) / 180;
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x =
    Math.cos(lat1) * Math.sin(lat2) -
    Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  const bearing = (Math.atan2(y, x) * 180) / Math.PI;
  return (bearing + 360) % 360;
}

export default function DriverActiveRide() {
  const navigate = useNavigate();
  const location = useLocation();
  const ride = location.state?.ride;

  const [phase, setPhase] = useState("to_pickup");
  const [driverLocation, setDriverLocation] = useState(() => {
    if (ride?.pickup?.lat) {
      return {
        lat: ride.pickup.lat + 0.005,
        lng: ride.pickup.lng - 0.005,
      };
    }
    return { lat: 22.5726, lng: 88.3639 };
  });
  const [bearing, setBearing] = useState(0);
  const lastLocationRef = useRef(null);

  const [directions, setDirections] = useState(null);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [startingRide, setStartingRide] = useState(false);
  const [completingRide, setCompletingRide] = useState(false);
  const [eta, setEta] = useState(null);
  const mapRef = useRef(null);
  const otpRefs = [useRef(), useRef(), useRef(), useRef()];
  const watchRef = useRef(null);

  // Chat state
  const [messages, setMessages] = useState([]);
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [newMessage, setNewMessage] = useState("");
  const messagesEndRef = useRef(null);
  const chatOpenRef = useRef(chatOpen);

  useEffect(() => {
    chatOpenRef.current = chatOpen;
  }, [chatOpen]);

  // Redirect if no ride data
  useEffect(() => {
    if (!ride) navigate("/driver-dashboard");
  }, [ride, navigate]);

  // Watch driver GPS & emit real-time location stream
  useEffect(() => {
    if (!navigator.geolocation) return;
    watchRef.current = navigator.geolocation.watchPosition(
      (pos) => {
        const newPos = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setDriverLocation(newPos);

        if (lastLocationRef.current) {
          const b = getBearing(lastLocationRef.current, newPos);
          if (b !== 0) setBearing(b);
        }
        lastLocationRef.current = newPos;

        socket.emit("driver:location", {
          rideId: ride?._id,
          lat: newPos.lat,
          lng: newPos.lng,
        });
      },
      () => {},
      { enableHighAccuracy: true }
    );
    return () => navigator.geolocation.clearWatch(watchRef.current);
  }, [ride?._id]);

  // Draw route: driver → pickup (to_pickup) OR pickup → destination (ongoing)
  const drawRoute = useCallback(() => {
    if (!driverLocation || !ride || !window.google) return;

    const directionsService = new window.google.maps.DirectionsService();

    let origin, destination;

    if (phase === "to_pickup") {
      origin = driverLocation;
      destination = { lat: ride.pickup.lat, lng: ride.pickup.lng };
    } else if (phase === "ongoing") {
      origin = { lat: ride.pickup.lat, lng: ride.pickup.lng };
      destination = { lat: ride.destination.lat, lng: ride.destination.lng };
    } else {
      return;
    }

    directionsService.route(
      {
        origin,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          setDirections(result);
          const leg = result.routes[0]?.legs[0];
          if (leg?.duration?.text) setEta(leg.duration.text);
        }
      }
    );
  }, [driverLocation, ride, phase]);

  useEffect(() => {
    if (driverLocation) drawRoute();
  }, [phase, driverLocation, drawRoute]);

  // Socket — keep connected & listen to chat messages
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!socket.connected && token) {
      const payload = JSON.parse(atob(token.split(".")[1]));
      const driverId = payload.id;
      socket.connect();
      socket.emit("join", driverId);
    }

    socket.on("chat:receive", ({ rideId: msgRideId, message }) => {
      if (msgRideId === ride?._id) {
        setMessages((prev) => [...prev, message]);
        if (!chatOpenRef.current) {
          setUnreadCount((c) => c + 1);
        }
      }
    });

    return () => {
      socket.off("chat:receive");
    };
  }, [ride?._id]);

  // OTP handlers
  const handleOtpChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    setOtpError("");
    if (value && index < 3) otpRefs[index + 1].current?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs[index - 1].current?.focus();
    }
  };

  const handleStartRide = async () => {
    const enteredOtp = parseInt(otp.join(""));
    if (otp.some((d) => d === "")) {
      setOtpError("Please enter the 4-digit OTP");
      return;
    }
    setStartingRide(true);
    setOtpError("");
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `/ride/${ride._id}/start`,
        { otp: enteredOtp },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setPhase("ongoing");
        setDirections(null);
        setEta(null);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Failed to start ride";
      setOtpError(msg === "Invalid OTP" ? "Wrong OTP. Ask passenger for correct OTP." : msg);
    } finally {
      setStartingRide(false);
    }
  };

  const handleCompleteRide = async () => {
    setCompletingRide(true);
    try {
      const token = localStorage.getItem("token");
      const res = await axios.patch(
        `/ride/${ride._id}/complete`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setPhase("completed");
      }
    } catch (err) {
      console.error("Complete ride error:", err.response?.data || err.message);
    } finally {
      setCompletingRide(false);
    }
  };

  const handleGoHome = () => {
    navigate("/driver-dashboard");
  };

  useEffect(() => {
    if (chatOpen) {
      setUnreadCount(0);
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 50);
    }
  }, [chatOpen, messages]);

  useEffect(() => {
    if (!ride?._id) return;
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`/ride/${ride._id}/messages`);
        if (res.data.success) {
          setMessages(res.data.data);
        }
      } catch (err) {
        console.error("Failed to fetch messages", err);
      }
    };
    fetchMessages();
  }, [ride?._id]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !ride?._id) return;

    socket.emit("chat:send", {
      rideId: ride._id,
      text: newMessage,
      sender: "driver",
    });
    setNewMessage("");
  };

  if (!ride) return null;

  const mapCenter = driverLocation || { lat: ride.pickup.lat, lng: ride.pickup.lng };

  // Icon color changes based on phase
  const iconColor = phase === "ongoing" ? "#f59e0b" : "#22c55e";

  return (
    <div className="relative w-full h-screen bg-[#0e0e0e] overflow-hidden">

      {/* FULL SCREEN MAP */}
      <div className="absolute inset-0">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={15}
          options={{ styles: mapStyles, disableDefaultUI: true, gestureHandling: "greedy" }}
          onLoad={(map) => (mapRef.current = map)}
        >
          {/* Driver marker — SVG data URI, no broken path string */}
          {driverLocation && (
            <Marker
              position={driverLocation}
              icon={getVehicleIcon(ride.vehicleType, iconColor)}
            />
          )}

          {/* Pickup marker — always show */}
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

          {/* Destination marker — show during ongoing */}
          {phase === "ongoing" && ride.destination?.lat && (
            <Marker
              position={{ lat: ride.destination.lat, lng: ride.destination.lng }}
              icon={{
                path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
                fillColor: "#f59e0b",
                fillOpacity: 1,
                strokeColor: "#0e0e0e",
                strokeWeight: 2,
                scale: 1.8,
                anchor: { x: 12, y: 24 },
              }}
            />
          )}

          {/* Route polyline */}
          {directions && (
            <DirectionsRenderer
              directions={directions}
              options={{
                suppressMarkers: true,
                polylineOptions: {
                  strokeColor: phase === "ongoing" ? "#f59e0b" : "#22c55e",
                  strokeWeight: 4,
                  strokeOpacity: 0.9,
                },
              }}
            />
          )}
        </GoogleMap>
      </div>

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4">
        <div className="flex items-center justify-between">
          <div className={`flex items-center gap-2 backdrop-blur border rounded-2xl px-3 py-2 ${
            phase === "to_pickup"
              ? "bg-[#0e0e0e]/90 border-[#22c55e]/30"
              : phase === "ongoing"
              ? "bg-[#0e0e0e]/90 border-[#f59e0b]/30"
              : "bg-[#0e0e0e]/90 border-[#2a2a2a]"
          }`}>
            <div className={`w-2 h-2 rounded-full ${
              phase === "to_pickup" ? "bg-[#22c55e] animate-pulse" :
              phase === "ongoing" ? "bg-[#f59e0b] animate-pulse" : "bg-gray-500"
            }`} />
            <span className={`text-xs font-semibold ${
              phase === "to_pickup" ? "text-[#22c55e]" :
              phase === "ongoing" ? "text-[#f59e0b]" : "text-gray-400"
            }`}>
              {phase === "to_pickup" ? "Heading to pickup" :
               phase === "ongoing" ? "Ride in progress" : "Ride complete"}
            </span>
          </div>

          {eta && phase !== "completed" && (
            <div className="bg-[#0e0e0e]/90 backdrop-blur border border-[#2a2a2a] rounded-2xl px-3 py-2">
              <span className="text-white text-xs font-semibold">{eta} away</span>
            </div>
          )}
        </div>
      </div>

      {/* PHASE: to_pickup — OTP entry */}
      {phase === "to_pickup" && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-[#0e0e0e] border-t border-[#2a2a2a] rounded-t-3xl px-5 pt-4 pb-8 shadow-2xl">
            <div className="w-10 h-1 bg-[#2a2a2a] rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-gray-500 text-xs uppercase tracking-wider">Heading to pickup</p>
                <p className="text-white font-semibold text-base mt-0.5">Enter passenger OTP to start</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
            </div>

            {/* Ride info */}
            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3 mb-3">
                <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#22c55e] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-xs mb-0.5">Pickup</p>
                  <p className="text-white text-sm font-medium leading-tight truncate">{ride.pickup?.address}</p>
                </div>
              </div>
              <div className="ml-1 border-l-2 border-dashed border-[#2e2e2e] h-3 mb-3" />
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-xs mb-0.5">Drop-off</p>
                  <p className="text-white text-sm font-medium leading-tight truncate">{ride.destination?.address}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#2a2a2a] flex items-center justify-between">
                <span className="text-gray-500 text-xs">Fare</span>
                <span className="text-[#22c55e] font-bold text-sm">₹{ride.fare}</span>
              </div>
            </div>

            {/* OTP Input */}
            <div className="mb-4">
              <p className="text-gray-500 text-xs mb-3 text-center">Ask passenger for their OTP</p>
              <div className="flex items-center justify-center gap-3">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={otpRefs[i]}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(i, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(i, e)}
                    className={`w-14 h-14 text-center text-white text-2xl font-bold rounded-2xl border bg-[#1a1a1a] outline-none transition-all
                      ${digit ? "border-[#22c55e] bg-[#22c55e]/10" : "border-[#2a2a2a]"}
                      ${otpError ? "border-red-500/60" : ""}
                      focus:border-[#22c55e] focus:bg-[#22c55e]/5`}
                  />
                ))}
              </div>
              {otpError && (
                <p className="text-red-400 text-xs text-center mt-2">{otpError}</p>
              )}
            </div>

            <button
              onClick={handleStartRide}
              disabled={startingRide || otp.some((d) => d === "")}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-40 disabled:cursor-not-allowed text-black font-bold rounded-2xl py-4 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {startingRide ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Verifying OTP...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  Start Ride
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PHASE: ongoing */}
      {phase === "ongoing" && (
        <div className="absolute bottom-0 left-0 right-0 z-20">
          <div className="bg-[#0e0e0e] border-t border-[#2a2a2a] rounded-t-3xl px-5 pt-4 pb-8 shadow-2xl">
            <div className="w-10 h-1 bg-[#2a2a2a] rounded-full mx-auto mb-5" />

            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[#f59e0b] text-xs uppercase tracking-wider font-semibold">● Ride in progress</p>
                <p className="text-white font-semibold text-base mt-0.5">Head to destination</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#f59e0b]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 mb-4">
              <div className="flex items-start gap-3">
                <div className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#f59e0b] flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-gray-500 text-xs mb-0.5">Destination</p>
                  <p className="text-white text-sm font-medium leading-tight">{ride.destination?.address}</p>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-[#2a2a2a] grid grid-cols-3 gap-3 text-center">
                <div>
                  <p className="text-gray-500 text-xs">Fare</p>
                  <p className="text-[#22c55e] font-bold text-sm mt-0.5">₹{ride.fare}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">Distance</p>
                  <p className="text-white font-semibold text-sm mt-0.5">{ride.distance} km</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs">ETA</p>
                  <p className="text-white font-semibold text-sm mt-0.5">{eta || "—"}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleCompleteRide}
              disabled={completingRide}
              className="w-full bg-[#f59e0b] hover:bg-[#d97706] disabled:opacity-40 text-black font-bold rounded-2xl py-4 text-sm transition-colors flex items-center justify-center gap-2"
            >
              {completingRide ? (
                <>
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Completing...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  Complete Ride
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* PHASE: completed */}
      {phase === "completed" && (
        <div className="absolute inset-0 z-30 flex items-end">
          <div className="w-full bg-[#0e0e0e] border-t border-[#2a2a2a] rounded-t-3xl px-5 pt-6 pb-10 shadow-2xl">
            <div className="w-10 h-1 bg-[#2a2a2a] rounded-full mx-auto mb-6" />

            <div className="flex flex-col items-center mb-6">
              <div className="w-16 h-16 rounded-full bg-[#22c55e]/15 border border-[#22c55e]/30 flex items-center justify-center mb-3">
                <svg className="w-8 h-8 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-white font-bold text-xl">Ride Complete!</p>
              <p className="text-gray-500 text-sm mt-1">Great job 🎉</p>
            </div>

            <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 mb-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-gray-500 text-xs uppercase tracking-wider">Fare Earned</p>
                <p className="text-[#22c55e] text-3xl font-bold">₹{ride.fare}</p>
              </div>
              <div className="space-y-2.5">
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">From</span>
                  <span className="text-white text-xs font-medium text-right max-w-[60%] truncate">{ride.pickup?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">To</span>
                  <span className="text-white text-xs font-medium text-right max-w-[60%] truncate">{ride.destination?.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Distance</span>
                  <span className="text-white text-xs font-medium">{ride.distance} km</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 text-xs">Vehicle</span>
                  <span className="text-white text-xs font-medium capitalize">{ride.vehicleType}</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleGoHome}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded-2xl py-4 text-sm transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}

      {/* FLOATING CHAT WIDGET */}
      {ride && phase !== "completed" && (
        <>
          <button
            onClick={() => setChatOpen(!chatOpen)}
            className="absolute bottom-24 right-5 z-30 w-12 h-12 rounded-full bg-[#22c55e] text-black border border-[#22c55e]/30 flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all duration-200"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[10px] font-bold rounded-full w-5 h-5 flex items-center justify-center animate-bounce border border-[#0e0e0e]">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Chat Side Drawer */}
          <div
            className={`absolute top-0 right-0 h-full w-80 max-w-[90%] bg-[#0e0e0e]/95 backdrop-blur-md border-l border-[#2a2a2a] z-40 transition-transform duration-300 flex flex-col ${
              chatOpen ? "translate-x-0" : "translate-x-full"
            }`}
          >
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between pt-16">
              <div>
                <p className="text-white text-sm font-bold">Rider Chat</p>
                <p className="text-gray-500 text-[10px]">Active Ride</p>
              </div>
              <button
                onClick={() => setChatOpen(false)}
                className="text-gray-400 hover:text-white transition-colors"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-4">
                  <p className="text-2xl">💬</p>
                  <p className="text-xs mt-1 text-slate-400">Say hello to your passenger!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender === "driver";
                  return (
                    <div key={i} className={`flex flex-col ${isMe ? "items-end" : "items-start"}`}>
                      <div
                        className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-xs leading-relaxed ${
                          isMe
                            ? "bg-[#22c55e] text-black rounded-tr-none font-medium"
                            : "bg-[#1a1a1a] text-white border border-[#2e2e2e] rounded-tl-none"
                        }`}
                      >
                        {msg.text}
                      </div>
                      <span className="text-[9px] text-gray-500 mt-1 px-1">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSendMessage} className="p-3 border-t border-[#2a2a2a] flex items-center gap-2">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Send message..."
                className="flex-1 bg-white/5 border border-white/10 focus:border-[#22c55e]/50 rounded-xl px-3 py-2.5 text-xs text-white placeholder-gray-600 transition-colors"
              />
              <button
                type="submit"
                disabled={!newMessage.trim()}
                className="bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-40 w-9 h-9 flex items-center justify-center rounded-xl text-black transition-colors flex-shrink-0"
              >
                <svg className="w-4 h-4 transform rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                </svg>
              </button>
            </form>
          </div>
        </>
      )}

    </div>
  );
}