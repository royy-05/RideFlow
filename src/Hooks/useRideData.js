import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export function useRideData() {
  const navigate = useNavigate();
  const [rideData, setRideData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem("rideData");

    if (!raw) {
      navigate("/");
      return;
    }

    try {
      const parsed = JSON.parse(raw);

      // safer validation
      const isValid =
        parsed &&
        parsed.pickup &&
        parsed.destination &&
        parsed.pickup.address &&
        parsed.destination.address &&
        parsed.fares &&
        typeof parsed.fares === "object";

      if (!isValid) {
        navigate("/");
        return;
      }

      setRideData(parsed);
    } catch (err) {
      console.error("Invalid rideData:", err);
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [navigate]);

  return { rideData, loading };
}