import { Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import DriverLogin from './pages/DriverLogin'
import DriverSignup from './pages/DriverSignup'
import DriverDashboard from './pages/DriverDashboard'
import DriverLanding from './pages/DriverLanding'
import RideStatus from './pages/Ridestatus'
import DriverActiveRide from "./pages/Driveractiveride";
import { LoadScript } from '@react-google-maps/api'

function App() {
  return (
    <LoadScript googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY} libraries={['places']}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/driver-login" element={<DriverLogin />} />
        <Route path="/driver-signup" element={<DriverSignup />} />
        <Route path="/driver-dashboard" element={<DriverDashboard />} />
        <Route path="/drive" element={<DriverLanding />} />
        <Route path="/ride-status" element={<RideStatus />} />
        <Route path="/driver/active-ride" element={<DriverActiveRide />}/>

      </Routes>
    </LoadScript>
  );
}

export default App;