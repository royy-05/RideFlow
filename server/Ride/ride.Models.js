// models/ride.model.js
import mongoose from "mongoose";

const rideSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  pickup: {
    address: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true }
  },

  destination: {
    address: String,
    lat: Number,
    lng: Number
  },

  fare: Number,

  vehicleType: {
    type: String,
    enum: ["bike", "mini", "sedan", "suv"],
    required: true
  },

  distance: Number,
  duration: Number,

  startedAt: Date,
  completedAt: Date,

  driverId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Driver"
  },

  status: {
    type: String,
    enum: ["requested", "ongoing", "completed", "cancelled", "accepted"],
    default: "requested"
  },
  otp: {
    type: Number,
    required: true
  },
  messages: [
    {
      sender: { type: String, enum: ["user", "driver"], required: true },
      text: { type: String, required: true },
      timestamp: { type: Date, default: Date.now }
    }
  ]

}, { timestamps: true })

export default mongoose.model("Ride", rideSchema)