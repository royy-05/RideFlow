import { RiCarLine } from 'react-icons/ri'
import { MdOutlineAirlineSeatReclineNormal } from 'react-icons/md'
import { TbTruckDelivery } from 'react-icons/tb'
import { HiBolt } from 'react-icons/hi2'
import { FaMotorcycle } from 'react-icons/fa'

const rides = [
  {
    id: 'bike',
    label: 'Bike',
    icon: FaMotorcycle,
    eta: '2 min',
    surge: false,
    desc: '1 seat · Fast',
  },
  {
    id: 'mini',
    label: 'Mini',
    icon: RiCarLine,
    eta: '3 min',
    surge: false,
    desc: '4 seats · Economy',
  },
  {
    id: 'sedan',
    label: 'Sedan',
    icon: MdOutlineAirlineSeatReclineNormal,
    eta: '5 min',
    surge: true,
    desc: '4 seats · Comfort',
  },
  {
    id: 'suv',
    label: 'SUV',
    icon: TbTruckDelivery,
    eta: '8 min',
    surge: false,
    desc: '6 seats · Premium',
  },
]

export default function RideOptions({ selected, onSelect, fares }) {

  if (!fares) return null;

  return (
    <div className="grid grid-cols-2 gap-2 mt-4">
      {rides.map((ride) => {
        const Icon = ride.icon
        const isSelected = selected === ride.id

        return (
          <button
            key={ride.id}
            onClick={() => onSelect(ride.id)}
            className={`relative flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all duration-200 text-left group
              ${isSelected
                ? 'border-accent bg-accent/10 shadow-lg shadow-accent/10'
                : 'border-white/8 bg-white/3 hover:border-white/15 hover:bg-white/5'
              }`}
          >
            {ride.surge && (
              <span className="absolute -top-2 -right-1 flex items-center gap-0.5 bg-yellow-500 text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                <HiBolt size={9} /> 1.3x
              </span>
            )}

            <Icon className={`text-2xl ${isSelected ? 'text-accent' : 'text-gray-400 group-hover:text-gray-200'}`} />

            <span className={`text-xs font-semibold ${isSelected ? 'text-accent' : 'text-white'}`}>
              {ride.label}
            </span>

            <span className="text-sm font-bold text-white">
              ₹{fares[ride.id]}
            </span>

            <span className="text-[10px] text-gray-500">
              {ride.eta} away
            </span>
          </button>
        )
      })}
    </div>
  )
}
