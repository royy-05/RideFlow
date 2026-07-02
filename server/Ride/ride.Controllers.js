import Ride from "./ride.Models.js";
import Driver from "../Driver/driver.models.js";
import mongoose from "mongoose";

const ok = (res, message, data) =>
  res.status(200).json({ success: true, message, data });

const fail = (res, code, message) =>
  res.status(code).json({ success: false, message });


// CREATE RIDE
export const createRide = async (req, res) => {
  try {
    const { pickup, destination, vehicleType } = req.body;

    if (
      !pickup?.lat ||
      !pickup?.lng ||
      !destination?.lat ||
      !destination?.lng ||
      !vehicleType
    ) {
      return fail(res, 400, "Invalid input");
    }

    const drivers = await Driver.find({
      status: "online",
      "vehicle.type": vehicleType,
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [pickup.lng, pickup.lat]
          },
          $maxDistance: 3000
        }
      }
    }).limit(1);
    console.log("ALL ONLINE DRIVERS:", JSON.stringify(drivers, null, 2));
    console.log("Pickup coords:", pickup.lng, pickup.lat);
    console.log("Drivers found:", drivers.length);  
    if (drivers.length === 0) {
      return fail(res, 404, "No drivers nearby");
    }

    const otp = Math.floor(1000 + Math.random() * 9000);

    const ride = await Ride.create({
      user: req.user._id,
      driverId: drivers[0]._id,
      pickup,
      destination,
      vehicleType,
      fare: req.body.fares?.[vehicleType],
      distance: req.body.distance,
      duration: req.body.duration,
      status: "requested",
      otp
    });

    // notify driver a ride has been requested
    const io = req.app.get("io");
    io.to(drivers[0]._id.toString()).emit("ride:requested", ride);

    return ok(res, "Driver assigned", ride);

  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");

  }
};


// ACCEPT RIDE (RACE SAFE)
export const acceptRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return fail(res, 400, "rideId required");

    const ride = await Ride.findOneAndUpdate(
      { _id: rideId, status: "requested" },
      { status: "accepted" },
      { new: true }
    );

    if (!ride) return fail(res, 400, "Ride already taken");

    if (ride.driverId.toString() !== req.driver._id.toString()) {
      return fail(res, 403, "Not your ride");
    }

    await Driver.findByIdAndUpdate(req.driver._id, { status: "busy" });

    // notify passenger their ride was accepted
    const io = req.app.get("io");
    io.to(ride.user.toString()).emit("ride:accepted", ride);

    return ok(res, "Ride accepted", ride);

  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};


// REJECT RIDE
export const rejectRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return fail(res, 400, "rideId required");

    const ride = await Ride.findById(rideId);
    if (!ride) return fail(res, 404, "Ride not found");

    if (ride.driverId.toString() !== req.driver._id.toString()) {
      return fail(res, 403, "Not your ride");
    }

    await Driver.findByIdAndUpdate(req.driver._id, { status: "online" });

    const nextDrivers = await Driver.find({
      _id: { $ne: req.driver._id },
      status: "online",
      location: {
        $near: {
          $geometry: {
            type: "Point",
            coordinates: [ride.pickup.lng, ride.pickup.lat]
          },
          $maxDistance: 5000
        }
      }
    }).limit(1);

    const io = req.app.get("io");

    if (nextDrivers.length === 0) {
      ride.driverId = null;
      ride.status = "requested";
      await ride.save();

      // notify passenger no drivers available
      io.to(ride.user.toString()).emit("ride:rejected", {
        rideId: ride._id,
        message: "No drivers available"
      });

      return ok(res, "No drivers available", ride);
    }

    ride.driverId = nextDrivers[0]._id;
    await ride.save();

    // notify passenger ride is being reassigned
    io.to(ride.user.toString()).emit("ride:rejected", {
      rideId: ride._id,
      message: "Driver declined, finding another driver"
    });

    // notify next driver
    io.to(nextDrivers[0]._id.toString()).emit("ride:requested", ride);

    return ok(res, "Ride reassigned", ride);

  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};


// START RIDE
export const startRide = async (req, res) => {
  try {
    const { otp } = req.body;

    const ride = await Ride.findById(req.params.id);
    if (!ride) return fail(res, 404, "Ride not found");

    if (ride.driverId.toString() !== req.driver._id.toString()) {
      return fail(res, 403, "Not your ride");
    }

    if (ride.status !== "accepted") {
      return fail(res, 400, "Ride not ready to start");
    }

    if (!otp || ride.otp !== otp) {
      return fail(res, 400, "Invalid OTP");
    }

    ride.status = "ongoing";
    ride.startedAt = new Date();
    await ride.save();

    // notify passenger ride has started
    const io = req.app.get("io");
    io.to(ride.user.toString()).emit("ride:started", ride);

    return ok(res, "Ride started", ride);

  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};


// COMPLETE RIDE
export const completeRide = async (req, res) => {
  try {
    const ride = await Ride.findById(req.params.id);
    if (!ride) return fail(res, 404, "Ride not found");

    if (ride.driverId.toString() !== req.driver._id.toString()) {
      return fail(res, 403, "Not your ride");
    }

    if (ride.status !== "ongoing") {
      return fail(res, 400, "Ride not in progress");
    }

    ride.status = "completed";
    ride.completedAt = new Date();
    await ride.save();

    await Driver.findByIdAndUpdate(ride.driverId, { status: "online" });

    // notify passenger ride is complete
    const io = req.app.get("io");
    io.to(ride.user.toString()).emit("ride:completed", ride);

    return ok(res, "Ride completed", ride);

  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};


// USER RIDES
export const getUserRides = async (req, res) => {
  try {
    const rides = await Ride.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .limit(10);

    return ok(res, "User rides fetched", rides);

  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};


// SINGLE RIDE
export const getSingleRide = async (req, res) => {
  try {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, "Invalid ride id");
    }

    const ride = await Ride.findById(id);
    if (!ride) return fail(res, 404, "Ride not found");

    if (ride.user.toString() !== req.user._id.toString()) {
      return fail(res, 403, "Unauthorized");
    }

    return ok(res, "Ride fetched", ride);

  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};


// DRIVER RIDES
export const getDriverRides = async (req, res) => {
  try {
    const rides = await Ride.find({
      driverId: req.driver._id,
      status: "requested"
    })
      .select("pickup destination vehicleType status createdAt")
      .sort({ createdAt: -1 })
      .limit(10);

    return ok(res, "Driver rides fetched", rides);

  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};


// CANCEL RIDE
export const cancelRide = async (req, res) => {
  try {
    const { rideId } = req.body;
    if (!rideId) return fail(res, 400, "rideId required");

    const ride = await Ride.findById(rideId);
    if (!ride) return fail(res, 404, "Ride not found");

    if (ride.user.toString() !== req.user._id.toString()) {
      return fail(res, 403, "Unauthorized");
    }

    if (ride.status === "completed") {
      return fail(res, 400, "Ride already completed");
    }

    if (ride.status === "ongoing") {
      return fail(res, 400, "Cannot cancel ongoing ride");
    }

    ride.status = "cancelled";
    await ride.save();

    if (ride.driverId) {
      await Driver.findByIdAndUpdate(ride.driverId, { status: "online" });
    }

    return ok(res, "Ride cancelled", ride);

  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};


// DRIVER STATS
export const getDriverStats = async (req, res) => {
  try {
    const completedRides = await Ride.find({
      driverId: req.driver._id,
      status: "completed"
    });

    const totalRides = completedRides.length;
    const totalEarnings = completedRides.reduce((sum, ride) => sum + (ride.fare || 0), 0);

    const recentRides = await Ride.find({
      driverId: req.driver._id,
      status: "completed"
    })
      .select("pickup destination fare completedAt")
      .sort({ completedAt: -1 })
      .limit(5);

    return ok(res, "Driver stats fetched", {
      totalRides,
      totalEarnings,
      recentRides
    });

  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};


// AVAILABLE RIDE FOR DRIVER
export const getAvailableRide = async (req, res) => {
  try {
    const ride = await Ride.findOne({
      driverId: req.driver._id,
      status: "requested"
    }).select("pickup destination fare distance vehicleType createdAt");

    if (!ride) return fail(res, 404, "No rides available");

    return ok(res, "Ride found", ride);
  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};

// GET RIDE MESSAGES
export const getRideMessages = async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return fail(res, 400, "Invalid ride id");
    }

    const ride = await Ride.findById(id).select("messages");
    if (!ride) return fail(res, 404, "Ride not found");

    return ok(res, "Messages fetched", ride.messages || []);
  } catch (err) {
    console.error(err);
    return fail(res, 500, "Server error");
  }
};