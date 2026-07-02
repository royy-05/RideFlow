import Navbar from '../components/Navbar'
import Hero from '../components/Hero'
import Features from '../components/Features'
import HowItWorks from '../components/HowItWorks'
import DriverCTA from '../components/DriverCTA'
import RecentActivity from '../components/RecentActivity'
import Footer from '../components/Footer'

export default function Home() {
  const isLoggedIn = !!localStorage.getItem("token")
  return (   
    <div className="bg-dark min-h-screen overflow-x-hidden">
      <Navbar />
      <Hero />
       {isLoggedIn ? (
        <RecentActivity />
      ) : (
        <>
          <Features />
        </>
      )}
      <HowItWorks />
      <DriverCTA />
      <Footer />
    </div>
  )
}
