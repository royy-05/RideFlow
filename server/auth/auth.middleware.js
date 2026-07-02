import jwt from "jsonwebtoken"
import User from "./auth.Models.js"

export const protectUser = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "No token" })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)

    console.log("DECODED:", decoded)
    console.log("RAW TOKEN:", token)

    const user = await User.findById(decoded.id).select("-password")

    if (!user) {
      return res.status(401).json({ message: "User not found" })
    }

    req.user = user
    console.log("user", req.user)

    next()
  } catch (error) {
    res.status(401).json({ message: "Invalid token" })
  }
}
// ✅ ADD THIS
export const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  };
}