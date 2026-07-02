import Driver from "./driver.models.js";
import JWT from "jsonwebtoken";

// ================= REGISTER =================
export const registerDriver = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, vehicle } = req.body;

    if (
      !firstName ||
      !lastName ||
      !email ||
      !password ||
      !phone ||
      !vehicle?.type ||
      !vehicle?.plateNumber
    ) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existingDriver = await Driver.findOne({ email });
    if (existingDriver) {
      return res.status(400).json({ message: "Driver already exists" });
    }

    const newDriver = await Driver.create({
      firstName,
      lastName,
      email,
      password,
      phone,
      vehicle: {
        type: vehicle.type,
        plateNumber: vehicle.plateNumber
      }
    });

    res.status(201).json({ message: "Driver account created" });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= LOGIN =================
export const loginDriver = async (req, res) => {
  try {
    const { email, password } = req.body;

    const driver = await Driver.findOne({ email });
    if (!driver) {
      return res.status(404).json({ message: "Driver not found" });
    }

    const isMatch = await driver.Comparepassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = JWT.sign(
      { id: driver._id, role: "driver" },
      process.env.JWT_SECRET,
      { expiresIn: "7d" }
    );

    res.status(200).json({
      success: true,
      token,
      driver: {
        id: driver._id,
        firstName: driver.firstName
      }
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE STATUS =================
export const updateStatus = async (req, res) => {
  try {
    const { status } = req.body;

    if (!["online", "offline", "busy"].includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const driver = await Driver.findByIdAndUpdate(
      req.driver._id,
      { status },
      { new: true }
    );

    res.json(driver);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= UPDATE LOCATION =================
export const updateLocation = async (req, res) => {
  try {
    const { coordinates } = req.body;

    if (!coordinates || coordinates.length !== 2) {
      return res.status(400).json({ message: "Invalid coordinates" });
    }

    const driver = await Driver.findByIdAndUpdate(
      req.driver._id,
      {
        location: {
          type: "Point",
          coordinates
        }
      },
      { new: true }
    );

    res.json(driver);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

// ================= NEARBY DRIVERS =================
export const nearbyDriver = async (req, res) => {
  try {
    const { lng, lat } = req.query;

    if (!lng || !lat) {
      return res.status(400).json({ message: "Location required" });
    }

    const drivers = await Driver.find({
      status: "online",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [parseFloat(lng), parseFloat(lat)]
          },
          $maxDistance: 5000
        }
      }
    }).select("firstName vehicle.type vehicle.plateNumber location");

    res.status(200).json(drivers);
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Unable to find nearby drivers" });
  }
};