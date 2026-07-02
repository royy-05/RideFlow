import express from "express";
import jwt from "jsonwebtoken";
import {
  createRide,
  startRide,
  completeRide,
  getUserRides,
  getSingleRide,
  acceptRide,
  rejectRide,
  cancelRide,
  getDriverStats,
  getAvailableRide,
  getRideMessages
} from "./ride.Controllers.js";

import { protectUser } from "../auth/auth.middleware.js";
import { protectDriver } from "../Driver/driver.middlewares.js";

const router = express.Router();

const protectAny = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({ message: "No token provided" });
    }
    const token = authHeader.split(" ")[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.userId = decoded.id;
    next();
  } catch (error) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
};


// USER ROUTES
router.post("/create", protectUser, createRide);
router.get("/my-rides", protectUser, getUserRides);
router.get("/ride/:id", protectUser, getSingleRide);
router.post("/cancel", protectUser, cancelRide);


// DRIVER ROUTES
router.post("/accept", protectDriver, acceptRide);
router.post("/reject", protectDriver, rejectRide);
router.patch("/:id/start", protectDriver, startRide);
router.patch("/:id/complete", protectDriver, completeRide);
router.get("/driver-stats", protectDriver, getDriverStats);
router.get("/available", protectDriver, getAvailableRide);

// GENERAL ROUTES
router.get("/:id/messages", protectAny, getRideMessages);

router.get("/test", (req, res) => {
  res.send("Ride route working");
});

export default router;