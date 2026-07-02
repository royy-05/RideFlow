import { useState } from "react";
import { signupUser } from "../features/auth/authService";
import { useNavigate } from "react-router-dom";

export default function Signup() {
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
     const res = await signupUser(form);
           navigate("/login");

      // after signup → go to login
      navigate("/login");

    } catch (err) {
      setError(err.response?.data?.message || "Signup failed");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900">

      <div className="w-full max-w-md bg-slate-800 p-8 rounded-xl shadow-lg">

        <h2 className="text-2xl font-bold text-white mb-2">
          Create Account
        </h2>

        <p className="text-gray-400 mb-6">
          Join RideFlow
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">

          <input
            type="text"
            name="name"
            placeholder="Full Name"
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-slate-700 text-white outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="email"
            name="email"
            placeholder="Email"
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-slate-700 text-white outline-none focus:ring-2 focus:ring-green-500"
          />

          <input
            type="password"
            name="password"
            placeholder="Password"
            onChange={handleChange}
            required
            className="w-full p-3 rounded-lg bg-slate-700 text-white outline-none focus:ring-2 focus:ring-green-500"
          />

          <button
            type="submit"
            disabled={loading}
            className="w-full p-3 rounded-lg bg-green-500 hover:bg-green-600 transition font-semibold"
          >
            {loading ? "Creating..." : "Sign Up"}
          </button>

          {error && (
            <p className="text-red-400 text-sm">{error}</p>
          )}

        </form>

        <p className="text-gray-400 text-sm mt-6 text-center">
          Already have an account?{" "}
          <span
            onClick={() => navigate("/login")}
            className="text-green-400 hover:underline cursor-pointer"
          >
            Login
          </span>
        </p>

      </div>

    </div>
  );
}