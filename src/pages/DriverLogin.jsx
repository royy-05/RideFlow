import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import axios from "../Utils/axios";

export default function DriverLogin() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");
    if (token && role === "driver") navigate("/driver-dashboard");
  }, [navigate]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const res = await axios.post("/driver/login", form);
      if (res.data.success) {
        const { token, driver } = res.data;
        localStorage.setItem("token", token);
        localStorage.setItem("role", "driver");
        localStorage.setItem("driver", JSON.stringify(driver));
        navigate("/driver-dashboard");
      } else {
        setError(res.data.message || "Login failed. Please try again.");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Something went wrong. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0e0e0e] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="flex items-center gap-2 mb-10 justify-center">
          <div className="w-9 h-9 bg-[#22c55e] rounded-lg flex items-center justify-center">
            <svg viewBox="0 0 24 24" fill="white" className="w-5 h-5">
              <path d="M13 2L4.09 12.97A1 1 0 005 14.5h6.5L10 22l9.91-10.97A1 1 0 0019 9.5H12.5L13 2z" />
            </svg>
          </div>
          <span className="text-white font-bold text-xl tracking-tight">
            Ride<span className="text-[#22c55e]">Flow</span>
          </span>
          <span className="ml-2 text-xs text-gray-500 border border-gray-700 rounded-full px-2 py-0.5">
            Driver
          </span>
        </div>

        {/* Card */}
        <div className="bg-[#1a1a1a] rounded-2xl p-8 border border-[#2a2a2a]">
          <h1 className="text-white text-2xl font-bold mb-1">Welcome back</h1>
          <p className="text-gray-400 text-sm mb-8">
            Sign in to your driver account
          </p>

          {error && (
            <div className="mb-5 bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
                Email
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                required
                placeholder="you@example.com"
                className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22c55e] transition-colors"
              />
            </div>

            <div>
              <label className="block text-gray-400 text-xs font-medium mb-1.5 uppercase tracking-wider">
                Password
              </label>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                required
                placeholder="••••••••"
                className="w-full bg-[#111] border border-[#2e2e2e] rounded-xl px-4 py-3 text-white text-sm placeholder-gray-600 focus:outline-none focus:border-[#22c55e] transition-colors"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#22c55e] hover:bg-[#16a34a] disabled:opacity-60 disabled:cursor-not-allowed text-black font-semibold rounded-xl py-3 text-sm transition-colors flex items-center justify-center gap-2 mt-2"
            >
              {loading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8v8H4z"
                    />
                  </svg>
                  Signing in...
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        <p className="text-center text-gray-500 text-sm mt-6">
          New driver?{" "}
          <Link
            to="/driver-signup"
            className="text-[#22c55e] hover:underline font-medium"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}
