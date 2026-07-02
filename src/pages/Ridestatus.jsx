import { useEffect, useState, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { GoogleMap, Marker, Polyline } from "@react-google-maps/api";
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

// Build a clean SVG data URI icon for vehicle markers
const getVehicleIcon = (vehicleType) => {
  const emojis = {
    bike: "🏍",
    mini: "🚗",
    sedan: "🚗",
    suv: "🚙",
    auto: "🛺",
  };
  const emoji = emojis[vehicleType] || "🚗";
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="44" height="44" viewBox="0 0 44 44">
    <circle cx="22" cy="22" r="20" fill="#22c55e" fill-opacity="0.15" stroke="#22c55e" stroke-width="2"/>
    <text x="22" y="30" text-anchor="middle" font-size="22">${emoji}</text>
  </svg>`;
  return {
    url: `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`,
    scaledSize: new window.google.maps.Size(44, 44),
    anchor: new window.google.maps.Point(22, 22),
  };
};

// Interpolate between two lat/lng points
function interpolate(start, end, t) {
  return {
    lat: start.lat + (end.lat - start.lat) * t,
    lng: start.lng + (end.lng - start.lng) * t,
  };
}

// Calculate bearing angle between two GPS points
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

const MIN_MOVEMENT_THRESHOLD = 0.00005;

export default function RideStatus() {
  const location = useLocation();
  const navigate = useNavigate();
  const bookingData = location.state;

  const [ride, setRide] = useState(null);
  const [creating, setCreating] = useState(true);
  const [error, setError] = useState("");
  const [routePath, setRoutePath] = useState([]);
  const [driverMarker, setDriverMarker] = useState(null);
  const [cardVisible, setCardVisible] = useState(false);

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

  const currentPosRef = useRef(null);
  const bearingRef = useRef(0);
  const mapRef = useRef(null);
  const animFrameRef = useRef(null);
  const animStartTimeRef = useRef(null);
  const requestSentRef = useRef(false);

  // Redirect if no booking data
  useEffect(() => {
    if (!bookingData) navigate("/");
  }, [bookingData, navigate]);

  // Create ride + connect socket on mount
  useEffect(() => {
    if (!bookingData) return;
    if (requestSentRef.current) return;
    requestSentRef.current = true;

    const createRide = async () => {
      try {
        const token = localStorage.getItem("token");
        const payload = JSON.parse(atob(token.split(".")[1]));

        socket.connect();
        socket.emit("join", payload.id);

        const res = await axios.post("/ride/create", {
          pickup: bookingData.pickup,
          destination: bookingData.destination,
          fares: bookingData.fares,
          vehicleType: bookingData.vehicleType,
          distance: bookingData.distance,
          duration: bookingData.duration,
        });

        if (res.data.success) {
          setRide(res.data.data);
        } else {
          setError(res.data.message || "Failed to create ride");
        }
      } catch (err) {
        setError(err.response?.data?.message || "Failed to create ride");
      } finally {
        setCreating(false);
      }
    };

    createRide();

    return () => {
      socket.off("ride:accepted");
      socket.off("ride:started");
      socket.off("ride:completed");
      socket.off("driver:location");
      socket.disconnect();
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  const routeDrawnRef = useRef(null);

  // Fetch route polyline from Google Directions
  const fetchRoute = (origin, destination) => {
    if (!window.google || !origin || !destination) return;
    const directionsService = new window.google.maps.DirectionsService();
    directionsService.route(
      {
        origin: { lat: origin.lat, lng: origin.lng },
        destination: { lat: destination.lat, lng: destination.lng },
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      (result, status) => {
        if (status === "OK") {
          const points = result.routes[0].overview_path.map((p) => ({
            lat: p.lat(),
            lng: p.lng(),
          }));
          setRoutePath(points);

          if (mapRef.current) {
            const bounds = new window.google.maps.LatLngBounds();
            points.forEach((p) => bounds.extend(p));
            mapRef.current.fitBounds(bounds, { top: 80, bottom: 300, left: 40, right: 40 });
          }
        }
      }
    );
  };

  useEffect(() => {
    if (!ride) return;

    if (ride.status === "accepted" && driverMarker) {
      if (routeDrawnRef.current !== "driver_to_pickup") {
        fetchRoute(driverMarker, ride.pickup);
        routeDrawnRef.current = "driver_to_pickup";
      }
    } else if (ride.status === "ongoing") {
      if (routeDrawnRef.current !== "pickup_to_destination") {
        fetchRoute(ride.pickup, ride.destination);
        routeDrawnRef.current = "pickup_to_destination";
      }
    } else if (ride.status === "requested" || !ride.status) {
      if (routeDrawnRef.current !== "pickup_to_destination_preview") {
        fetchRoute(bookingData?.pickup, bookingData?.destination);
        routeDrawnRef.current = "pickup_to_destination_preview";
      }
    }
  }, [ride?.status, !!driverMarker]);

  // Smooth animation from current position to target
  const animateDriverTo = (targetPos) => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }

    const startPos = currentPosRef.current;
    if (!startPos) return;

    bearingRef.current = getBearing(startPos, targetPos);

    animStartTimeRef.current = null;
    const duration = 1000;

    const step = (timestamp) => {
      if (!animStartTimeRef.current) animStartTimeRef.current = timestamp;
      const elapsed = timestamp - animStartTimeRef.current;
      const t = Math.min(elapsed / duration, 1);

      const current = interpolate(startPos, targetPos, t);

      setDriverMarker({ ...current, bearing: bearingRef.current });
      currentPosRef.current = current;

      if (t < 1) {
        animFrameRef.current = requestAnimationFrame(step);
      } else {
        animFrameRef.current = null;
      }
    };

    animFrameRef.current = requestAnimationFrame(step);
  };

  // Socket listeners
  useEffect(() => {
    if (!ride) return;

    socket.on("ride:accepted", (updatedRide) => {
      setRide(updatedRide);
      setCardVisible(true);

      const initialDriverPos = {
        lat: updatedRide.pickup.lat + (Math.random() * 0.008 - 0.004),
        lng: updatedRide.pickup.lng + (Math.random() * 0.008 - 0.004),
      };

      setDriverMarker({ ...initialDriverPos, bearing: 0 });
      currentPosRef.current = initialDriverPos;

      if (mapRef.current) {
        const bounds = new window.google.maps.LatLngBounds();
        bounds.extend(initialDriverPos);
        bounds.extend({ lat: updatedRide.pickup.lat, lng: updatedRide.pickup.lng });
        mapRef.current.fitBounds(bounds, { top: 80, bottom: 320, left: 60, right: 60 });
      }
    });

    socket.on("ride:started", (updatedRide) => {
      setRide(updatedRide);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      fetchRoute(updatedRide.pickup, updatedRide.destination);
    });

    socket.on("ride:completed", (updatedRide) => {
      setRide(updatedRide);
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      setDriverMarker(null);
      currentPosRef.current = null;
    });

    socket.on("driver:location", (newPos) => {
      if (!currentPosRef.current) {
        setDriverMarker({ ...newPos, bearing: 0 });
        currentPosRef.current = newPos;
        return;
      }

      const dLat = Math.abs(newPos.lat - currentPosRef.current.lat);
      const dLng = Math.abs(newPos.lng - currentPosRef.current.lng);
      if (dLat < MIN_MOVEMENT_THRESHOLD && dLng < MIN_MOVEMENT_THRESHOLD) return;

      animateDriverTo(newPos);

      if (mapRef.current) {
        mapRef.current.panTo(newPos);
      }
    });

    socket.on("chat:receive", ({ rideId: msgRideId, message }) => {
      if (msgRideId === ride?._id) {
        setMessages((prev) => [...prev, message]);
        if (!chatOpenRef.current) {
          setUnreadCount((c) => c + 1);
        }
      }
    });

    return () => {
      socket.off("ride:accepted");
      socket.off("ride:started");
      socket.off("ride:completed");
      socket.off("driver:location");
      socket.off("chat:receive");
    };
  }, [ride?._id]);

  const handleCancel = async () => {
    try {
      await axios.post("/ride/cancel", { rideId: ride._id });
      navigate("/");
    } catch (err) {
      console.error("Cancel failed", err);
    }
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
      sender: "user",
    });
    setNewMessage("");
  };

  // Loading state
  if (creating) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center gap-4">
        <div className="relative">
          <div className="w-16 h-16 rounded-full border-2 border-[#22c55e]/20 flex items-center justify-center">
            <svg className="animate-spin w-8 h-8 text-[#22c55e]" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          </div>
        </div>
        <p className="text-white font-semibold text-sm">Finding your driver...</p>
        <p className="text-gray-600 text-xs">Please wait</p>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-[#0e0e0e] flex flex-col items-center justify-center gap-4 px-6">
        <div className="w-16 h-16 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <svg className="w-8 h-8 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </div>
        <p className="text-white font-semibold text-center">{error}</p>
        <button
          onClick={() => navigate("/")}
          className="bg-[#22c55e] text-black font-bold rounded-xl px-6 py-3 text-sm"
        >
          Go Back
        </button>
      </div>
    );
  }

  const pickup = bookingData?.pickup;
  const destination = bookingData?.destination;
  const mapCenter = pickup ? { lat: pickup.lat, lng: pickup.lng } : { lat: 22.5726, lng: 88.3639 };

  return (
    <div className="relative w-full h-screen bg-[#0e0e0e] overflow-hidden">

      {/* FULL SCREEN MAP */}
      <div className="absolute inset-0">
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={mapCenter}
          zoom={14}
          options={{ styles: mapStyles, disableDefaultUI: true, gestureHandling: "greedy" }}
          onLoad={(map) => {
            mapRef.current = map;
            if (routePath.length > 0) {
              const bounds = new window.google.maps.LatLngBounds();
              routePath.forEach((p) => bounds.extend(p));
              map.fitBounds(bounds, { top: 80, bottom: 300, left: 40, right: 40 });
            }
          }}
        >
          {/* Route polyline */}
          {routePath.length > 0 && (
            <Polyline
              path={routePath}
              options={{
                strokeColor: "#22c55e",
                strokeOpacity: 0.8,
                strokeWeight: 4,
              }}
            />
          )}

          {/* Pickup marker */}
          {pickup && (
            <Marker
              position={{ lat: pickup.lat, lng: pickup.lng }}
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
          )}

          {/* Destination marker */}
          {destination && (
            <Marker
              position={{ lat: destination.lat, lng: destination.lng }}
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

          {/* Driver marker — SVG data URI, no broken path string */}
          {driverMarker && ride && (ride.status === "accepted" || ride.status === "ongoing") && (
            <Marker
              position={{ lat: driverMarker.lat, lng: driverMarker.lng }}
              icon={getVehicleIcon(ride?.vehicleType)}
            />
          )}
        </GoogleMap>
      </div>

      {/* TOP BAR */}
      <div className="absolute top-0 left-0 right-0 z-10 px-4 pt-4">
        <div className="flex items-center gap-3 bg-[#0e0e0e]/90 backdrop-blur border border-[#2a2a2a] rounded-2xl px-4 py-3">
          {ride?.status === "requested" && (
            <svg className="animate-spin w-4 h-4 text-[#f59e0b] flex-shrink-0" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
            </svg>
          )}
          {ride?.status === "accepted" && (
            <div className="w-4 h-4 rounded-full bg-[#22c55e] flex-shrink-0 animate-pulse" />
          )}
          {ride?.status === "ongoing" && (
            <div className="w-4 h-4 rounded-full bg-[#3b82f6] flex-shrink-0 animate-pulse" />
          )}
          {ride?.status === "completed" && (
            <div className="w-4 h-4 rounded-full bg-[#22c55e] flex-shrink-0" />
          )}
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-semibold truncate">
              {ride?.status === "requested" && "Finding your driver..."}
              {ride?.status === "accepted" && "Driver is on the way"}
              {ride?.status === "ongoing" && "Ride in progress"}
              {ride?.status === "completed" && "Ride completed"}
            </p>
            <p className="text-gray-500 text-xs truncate">
              {pickup?.address}
              {" → "}
              {destination?.address}
            </p>
          </div>
        </div>
      </div>

      {/* BOTTOM CARD */}
      <div className={`absolute bottom-0 left-0 right-0 z-20 transition-transform duration-500 ease-out ${
        ride?.status === "requested" ? "translate-y-[calc(100%-80px)]" : "translate-y-0"
      }`}>
        <div className="bg-[#0e0e0e] border-t border-[#2a2a2a] rounded-t-3xl px-5 pt-4 pb-8 shadow-2xl">

          <div className="w-10 h-1 bg-[#2a2a2a] rounded-full mx-auto mb-4" />

          {/* Requested state — peek */}
          {ride?.status === "requested" && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-white font-semibold text-sm">Finding your driver</p>
                <p className="text-gray-500 text-xs mt-0.5">Please wait...</p>
              </div>
              <button
                onClick={handleCancel}
                className="text-red-400 text-xs border border-red-500/30 rounded-xl px-3 py-2 hover:bg-red-500/10 transition-colors"
              >
                Cancel
              </button>
            </div>
          )}

          {/* Accepted state */}
          {ride?.status === "accepted" && (
            <>
              <div className="flex items-center gap-3 mb-5">
                <div className="w-10 h-10 rounded-full bg-[#22c55e]/20 border border-[#22c55e]/40 flex items-center justify-center text-[#22c55e] font-bold text-sm flex-shrink-0">
                  D
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Driver on the way</p>
                  <p className="text-gray-500 text-xs capitalize">{ride.vehicleType} · {ride.distance} km away</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[#22c55e] font-bold text-base">₹{ride.fare}</p>
                  <p className="text-gray-600 text-xs">fare</p>
                </div>
              </div>

              {/* OTP */}
              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4 mb-4 flex items-center justify-between">
                <div>
                  <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Your OTP</p>
                  <p className="text-[#22c55e] text-4xl font-bold tracking-widest">{ride.otp}</p>
                </div>
                <div className="text-right">
                  <p className="text-gray-500 text-xs mb-1">Share with driver</p>
                  <svg className="w-8 h-8 text-gray-600 ml-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
              </div>

              {/* Route */}
              <div className="flex items-start gap-3 mb-2">
                <div className="flex flex-col items-center gap-1 mt-1.5">
                  <div className="w-2 h-2 rounded-full bg-[#22c55e]" />
                  <div className="w-px h-6 border-l border-dashed border-[#2e2e2e]" />
                  <div className="w-2 h-2 rounded-full bg-blue-400" />
                </div>
                <div className="flex-1 flex flex-col gap-3">
                  <p className="text-white text-xs font-medium leading-tight">{ride.pickup?.address}</p>
                  <p className="text-white text-xs font-medium leading-tight">{ride.destination?.address}</p>
                </div>
              </div>
            </>
          )}

          {/* Ongoing state */}
          {ride?.status === "ongoing" && (
            <>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-[#3b82f6]/20 border border-[#3b82f6]/40 flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-[#3b82f6]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-white font-semibold text-sm">Ride in progress</p>
                  <p className="text-gray-500 text-xs">Heading to your destination</p>
                </div>
                <div className="ml-auto text-right">
                  <p className="text-[#22c55e] font-bold text-base">₹{ride.fare}</p>
                  <p className="text-gray-600 text-xs">fare</p>
                </div>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-4">
                <div className="flex items-start gap-3">
                  <div className="mt-1 w-2 h-2 rounded-full bg-blue-400 flex-shrink-0" />
                  <div>
                    <p className="text-gray-500 text-xs mb-0.5">Dropping at</p>
                    <p className="text-white text-sm font-medium">{ride.destination?.address}</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* Completed state */}
          {ride?.status === "completed" && (
            <>
              <div className="flex flex-col items-center mb-5">
                <div className="w-16 h-16 rounded-full bg-[#22c55e]/10 border border-[#22c55e]/20 flex items-center justify-center mb-3">
                  <svg className="w-8 h-8 text-[#22c55e]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <p className="text-white font-bold text-lg">Ride Complete!</p>
                <p className="text-gray-500 text-xs mt-1">Thanks for riding with RideFlow</p>
              </div>

              <div className="bg-[#1a1a1a] border border-[#2a2a2a] rounded-2xl p-5 mb-4 text-center">
                <p className="text-gray-500 text-xs uppercase tracking-wider mb-1">Total Fare</p>
                <p className="text-[#22c55e] text-4xl font-bold">₹{ride.fare}</p>
                <div className="flex justify-center gap-6 mt-3">
                  <div>
                    <p className="text-gray-600 text-xs">Distance</p>
                    <p className="text-white text-sm font-semibold">{ride.distance} km</p>
                  </div>
                  <div>
                    <p className="text-gray-600 text-xs">Vehicle</p>
                    <p className="text-white text-sm font-semibold capitalize">{ride.vehicleType}</p>
                  </div>
                </div>
              </div>

              <button
                onClick={() => navigate("/")}
                className="w-full bg-[#22c55e] hover:bg-[#16a34a] text-black font-bold rounded-2xl py-4 text-sm transition-colors"
              >
                Back to Home
              </button>
            </>
          )}
        </div>
      </div>

      {/* FLOATING CHAT WIDGET */}
      {ride && ride.status !== "requested" && (
        <>
          {/* Floating Action Button */}
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
            {/* Header */}
            <div className="p-4 border-b border-[#2a2a2a] flex items-center justify-between pt-16">
              <div>
                <p className="text-white text-sm font-bold">Driver Chat</p>
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

            {/* Message Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 scrollbar-thin">
              {messages.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center opacity-30 px-4">
                  <p className="text-2xl">💬</p>
                  <p className="text-xs mt-1 text-slate-400">Say hello to your driver!</p>
                </div>
              ) : (
                messages.map((msg, i) => {
                  const isMe = msg.sender === "user";
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

            {/* Input */}
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