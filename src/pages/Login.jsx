import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginUser } from "../features/auth/authService";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await loginUser(form);

      console.log("LOGIN RESPONSE:", res);

      if (res.data && res.data.token) {
        localStorage.setItem("token", res.data.token);
      } else {
        console.error("Token missing", res);
      }

      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-dark bg-grid-pattern bg-grid relative overflow-hidden font-body">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-accent/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 translate-x-1/2 translate-y-1/2 w-80 h-80 bg-accent-blue/10 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="w-full max-w-md bg-card/60 backdrop-blur-xl border border-border p-8 rounded-2xl shadow-2xl relative z-10 transition-all duration-300 hover:border-accent/20">
        
        {/* Brand Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-extrabold font-display bg-gradient-to-r from-accent via-emerald-400 to-accent-blue bg-clip-text text-transparent tracking-tight mb-2">
            RideFlow
          </h1>
          <p className="text-muted text-sm font-medium">Move smarter, together.</p>
        </div>

        <h2 className="text-xl font-bold text-white mb-6 text-center">
          Sign In to Your Account
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Email Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.206" />
              </svg>
            </div>
            <input
              name="email"
              type="email"
              onChange={handleChange}
              placeholder="Email address"
              required
              className="w-full pl-11 pr-4 py-3 bg-dark/50 border border-border rounded-xl text-white placeholder-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
            />
          </div>

          {/* Password Input */}
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <input
              name="password"
              type="password"
              onChange={handleChange}
              placeholder="Password"
              required
              className="w-full pl-11 pr-4 py-3 bg-dark/50 border border-border rounded-xl text-white placeholder-muted focus:border-accent focus:ring-1 focus:ring-accent outline-none transition-all text-sm"
            />
          </div>

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-xs p-3 rounded-lg flex items-center gap-2">
              <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>{error}</span>
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-gradient-to-r from-accent to-emerald-600 hover:from-emerald-500 hover:to-accent text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-accent/20 active:scale-[0.98] transition-all disabled:opacity-50 disabled:pointer-events-none text-sm"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Logging in...
              </span>
            ) : (
              "Login"
            )}
          </button>

        </form>

        {/* Footer Links */}
        <div className="mt-8 pt-6 border-t border-border/60 text-center space-y-3">
          <p className="text-muted text-xs">
            Don't have an account?{" "}
            <span
              onClick={() => navigate("/signup")}
              className="text-accent hover:text-emerald-400 font-semibold cursor-pointer transition-colors"
            >
              Sign Up
            </span>
          </p>
          <p className="text-muted text-xs">
            Are you a driver?{" "}
            <span
              onClick={() => navigate("/driver-login")}
              className="text-accent-blue hover:text-blue-400 font-semibold cursor-pointer transition-colors"
            >
              Driver Login
            </span>
          </p>
        </div>

      </div>
    </div>
  );
}