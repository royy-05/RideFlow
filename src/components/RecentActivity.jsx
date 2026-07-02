import { useEffect, useState } from "react"

export default function RecentActivity() {
  const [rides, setRides] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchRides = async () => {
      try {
        const token = localStorage.getItem("token")

        const res = await fetch(`${import.meta.env.VITE_API_URL || "http://localhost:5000"}/api/ride/my-rides`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        })

        const data = await res.json()
        if (!res.ok) throw new Error(data.message)
        setRides(data.data ?? [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchRides()
  }, [])

  // Filter out duplicates created within 10 seconds of each other
  const uniqueRides = [];
  rides.forEach((ride) => {
    const isDuplicate = uniqueRides.some((ur) => {
      const samePickup = ride.pickup?.address === ur.pickup?.address;
      const sameDestination = ride.destination?.address === ur.destination?.address;
      const timeDiff = Math.abs(new Date(ride.createdAt) - new Date(ur.createdAt)) < 10000;
      return samePickup && sameDestination && timeDiff;
    });
    if (!isDuplicate) {
      uniqueRides.push(ride);
    }
  });

  const lastRide = uniqueRides[0];

  const getStatusBadge = (status) => {
    const styles = {
      completed: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
      cancelled: "bg-red-500/10 text-red-400 border-red-500/20",
      requested: "bg-blue-500/10 text-blue-400 border-blue-500/20 animate-pulse",
      accepted: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
      ongoing: "bg-amber-500/10 text-amber-400 border-amber-500/20 animate-pulse",
    };
    return (
      <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${styles[status] || styles.requested} capitalize`}>
        {status || "requested"}
      </span>
    );
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  };

  return (
    <section className="max-w-7xl mx-auto px-6 py-16 font-body">
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-2xl font-bold text-white font-display tracking-tight">
          Your Activity
        </h2>
        <span className="text-xs text-muted font-medium bg-white/5 border border-border px-3 py-1 rounded-full">
          {uniqueRides.length} {uniqueRides.length === 1 ? "Trip" : "Trips"} total
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        
        {/* LEFT: Featured/Most Recent Trip */}
        <div className="lg:col-span-2 bg-card/40 backdrop-blur-xl border border-border rounded-2xl p-6 flex flex-col justify-between shadow-xl transition-all duration-300 hover:border-accent/15 group relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 rounded-full blur-2xl pointer-events-none group-hover:bg-accent/10 transition-colors"></div>
          
          <div>
            <div className="flex items-center justify-between mb-6">
              <span className="text-xs text-muted font-bold tracking-wider uppercase">Most Recent Trip</span>
              {lastRide && getStatusBadge(lastRide.status)}
            </div>

            {loading ? (
              <div className="py-12 flex items-center justify-center">
                <svg className="animate-spin h-6 w-6 text-accent" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
              </div>
            ) : lastRide ? (
              <div className="space-y-6">
                {/* Date */}
                <p className="text-xs text-muted font-medium">{formatDate(lastRide.createdAt)}</p>

                {/* Route Visualizer */}
                <div className="relative pl-6 space-y-4">
                  <div className="absolute left-1.5 top-2 bottom-2 w-0.5 border-l border-dashed border-border"></div>
                  
                  {/* Pickup */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-accent/20 border border-accent flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                    </span>
                    <p className="text-sm font-medium text-white line-clamp-1">
                      {lastRide.pickup?.address || "Pickup location"}
                    </p>
                  </div>

                  {/* Destination */}
                  <div className="relative">
                    <span className="absolute -left-6 top-1 w-3.5 h-3.5 rounded-full bg-accent-blue/20 border border-accent-blue flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-accent-blue"></span>
                    </span>
                    <p className="text-sm font-medium text-muted line-clamp-1">
                      {lastRide.destination?.address || "Destination location"}
                    </p>
                  </div>
                </div>
              </div>
            ) : (
              <div className="py-12 text-center text-muted text-sm">
                No recent activity found.
              </div>
            )}
          </div>

          {lastRide && (
            <div className="mt-8 pt-6 border-t border-border/60 flex justify-between items-center">
              <div>
                <p className="text-xs text-muted mb-0.5">Fare Charged</p>
                <span className="text-2xl font-bold text-accent">
                  ₹{lastRide.fare}
                </span>
              </div>
              <button className="bg-white/5 hover:bg-white/10 text-white font-semibold text-xs py-2.5 px-4 rounded-xl border border-border transition-colors">
                Book Again
              </button>
            </div>
          )}
        </div>

        {/* RIGHT: Previous Trips List */}
        <div className="flex flex-col gap-4">
          <p className="text-xs text-muted font-bold tracking-wider uppercase pl-1">Previous Trips</p>
          
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((n) => (
                <div key={n} className="h-24 bg-card/20 border border-border/50 rounded-xl animate-pulse"></div>
              ))}
            </div>
          ) : uniqueRides.length > 1 ? (
            uniqueRides.slice(1, 4).map((ride) => (
              <div
                key={ride._id}
                className="bg-card/30 border border-border/80 rounded-xl p-4.5 flex flex-col justify-between transition-all duration-300 hover:border-accent/10 hover:bg-card/40 shadow-md hover:-translate-y-0.5 group"
              >
                <div>
                  <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] text-muted font-semibold">{formatDate(ride.createdAt)}</span>
                    {getStatusBadge(ride.status)}
                  </div>
                  
                  <div className="space-y-1">
                    <p className="text-xs font-semibold text-white truncate">
                      {ride.pickup?.address?.split(",")[0] || "Pickup"}
                    </p>
                    <p className="text-[11px] font-medium text-muted truncate">
                      → {ride.destination?.address?.split(",")[0] || "Destination"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-border/40 flex justify-between items-center">
                  <span className="text-sm font-bold text-accent">₹{ride.fare}</span>
                  <span className="text-[10px] text-muted uppercase font-bold tracking-wider">{ride.vehicleType}</span>
                </div>
              </div>
            ))
          ) : (
            <div className="bg-card/10 border border-border/30 rounded-xl p-8 text-center text-xs text-muted">
              No previous trips.
            </div>
          )}
        </div>

      </div>
    </section>
  );
}