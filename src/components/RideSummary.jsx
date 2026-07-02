function AddressRow({ label, address, dotColor }) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex flex-col items-center mt-1 shrink-0">
        <span className={`w-2.5 h-2.5 rounded-full ${dotColor}`} />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-widest text-slate-500 mb-0.5">{label}</p>
        <p className="text-sm text-slate-200 leading-snug truncate">{address}</p>
      </div>
    </div>
  );
}

export default function RideSummary({ pickup, destination, distance, fare }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md p-5 space-y-4">
      <h2 className="text-xs font-semibold uppercase tracking-widest text-slate-400">Your Ride</h2>

      <div className="relative space-y-4">
        <AddressRow label="From" address={pickup.address} dotColor="bg-green-400" />

        <div className="absolute left-[5px] top-[22px] bottom-[22px] w-px bg-gradient-to-b from-green-400/60 to-slate-500/30" />

        <AddressRow label="To" address={destination.address} dotColor="bg-slate-400" />
      </div>

      <div className="border-t border-white/5 pt-3 flex items-center justify-between">
        {distance && (
          <div>
            <p className="text-[11px] text-slate-500 uppercase tracking-widest">Distance</p>
            <p className="text-sm font-semibold text-white mt-0.5">{distance} km</p>
          </div>
        )}
        {fare && (
          <div className="text-right">
            <p className="text-[11px] text-slate-500 uppercase tracking-widest">Est. Fare</p>
            <p className="text-sm font-bold text-green-400 mt-0.5">₹{fare}</p>
          </div>
        )}
      </div>
    </div>
  );
}
