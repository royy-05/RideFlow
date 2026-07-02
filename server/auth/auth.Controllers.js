import User from "./auth.Models.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signup = async (req, res) => {
  const { name, email, password, role, vehicleType, vehicleNumber } = req.body;

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    const hashed = await bcrypt.hash(password, 10);

    // ✅ enforce role
    const roleToAssign = role === "driver" ? "driver" : "user";

    const newUser = await User.create({
      name,
      email,
      password: hashed,
      role: roleToAssign   // ✅ FIX
    });

    // ✅ if driver → create driver doc
    if (roleToAssign === "driver") {
      const Driver = (await import("../Driver/driver.models.js")).default;

      await Driver.create({
        userId: newUser._id,
        vehicleType,
        vehicleNumber
      });
    }

    res.json({ message: "Signup successful" });

  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Signup failed" });
  }
};


export const Login = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: "User not found" });
    }

    const isMatch = await user.comparePassword(password)
    if (!isMatch) {
      return res.status(400).json({ message: "Wrong Password" });
    }

    // ✅ include role in token
    const token = jwt.sign(
      {
        id: user._id,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    // ✅ send role in response
    res.json({
      token,
      user: {
        id: user._id,
        role: user.role
      }
    });

  } catch (error){
    console.log(error)
    res.status(500).json({ message: "server error" });
  }
};