import { GoogleMap, Marker } from '@react-google-maps/api'
import { useEffect, useState } from 'react'

const containerStyle = {
  width: '100%',
  height: '100%',
}

export default function MapComponent({ setPickup }) {
  const [location, setLocation] = useState(null)

  const getAddress = async (lat, lng) => {
    const res = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&key=${import.meta.env.VITE_GOOGLE_MAPS_API_KEY}`
    )
    const data = await res.json()
    return data.results[0]?.formatted_address || ""
  }

  useEffect(() => {
    if (!navigator.geolocation) {
      console.log("Geolocation not supported");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude
        const lng = pos.coords.longitude

        const address = await getAddress(lat, lng)

        const coords = { lat, lng }

        setLocation(coords)

        setPickup({
          lat,
          lng,
          address
        })
      },
      (err) => {
        console.log("Error getting location:", err)
      }
    )
  }, []);

  return (
    <GoogleMap
      mapContainerStyle={containerStyle}
      center={location || { lat: 22.5726, lng: 88.3639 }}
      zoom={14}
    >
      {location && <Marker position={location} />}
    </GoogleMap>
  )
}