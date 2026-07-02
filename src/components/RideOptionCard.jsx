const VEHICLE_META = {
  bike: {
    icon: "🏍️",
    label: "Bike",
    tagline: "Fastest · Beat traffic",
  },
  auto: {
    icon: "🛺",
    label: "Auto",
    tagline: "Comfortable · Best value",
  },
  sedan: {
    icon: "🚗",
    label: "Car",
    tagline: "Premium · AC ride",
  },
};

export default function RideOptionCard({ vehicleId, price, eta, isSelected, onSelect }) {
  const meta = VEHICLE_META[vehicleId];

  return (
    <button
      onClick={() => onSelect(vehicleId)}
      className={`
        relative w-full text-left rounded-2xl px-5 py-4 transition-all duration-300 cursor-pointer
        border backdrop-blur-md
        ${
          isSelected
            ? "bg-green-500/10 border-green-400 shadow-[0_0_20px_rgba(74,222,128,0.15)]"
            : "bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20"
        }
      `}
    >
      {isSelected && (
        <span className="absolute top-3 right-3 w-2 h-2 rounded-full bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]" />
      )}

      <div className="flex items-center gap-4">
        <span className="text-3xl">{meta.icon}</span>

        <div className="flex-1 min-w-0">
          <p className={`font-semibold text-sm tracking-wide ${isSelected ? "text-green-300" : "text-white"}`}>
            {meta.label}
          </p>
          <p className="text-xs text-slate-400 mt-0.5 truncate">{meta.tagline}</p>
        </div>

        <div className="text-right shrink-0">
          <p className={`font-bold text-base ${isSelected ? "text-green-300" : "text-white"}`}>
            ₹{price}
          </p>
          <p className="text-xs text-slate-400 mt-0.5">{eta} away</p>
        </div>
      </div>
    </button>
  );
}
