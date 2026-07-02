import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import http from "http";
import { Server } from "socket.io";
import { connectDB } from "./config/db.js";
import authRoutes from "./auth/auth.Routers.js";
import fareroutes from "./Fare Calculator/Fare.Router.js";
import rideroutes from "./Ride/ride.routes.js";
import driverroutes from "./Driver/driver.router.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, ".env") });

const app = express();
const httpServer = http.createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: process.env.FRONTEND_URL || "http://localhost:5173",
    methods: ["GET", "POST", "PATCH"],
  },
});

// attach io to app so controllers can access it via req.app.get("io")
app.set("io", io);

// middleware
app.use(cors());
app.use(express.json());

// routes
app.use("/api/auth", authRoutes);
app.use("/api/fare", fareroutes);
app.use("/api/ride", rideroutes);
app.use("/api/driver", driverroutes);

// socket connection
io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("join", (userId) => {
    socket.join(userId);
    console.log(`User/Driver ${userId} joined room`);
  });

  socket.on("chat:send", async (data) => {
    const { rideId, text, sender } = data;
    try {
      const { default: Ride } = await import("./Ride/ride.Models.js");
      const ride = await Ride.findById(rideId);
      if (ride) {
        const message = {
          sender,
          text,
          timestamp: new Date()
        };
        ride.messages.push(message);
        await ride.save();

        const userRoom = ride.user.toString();
        const driverRoom = ride.driverId ? ride.driverId.toString() : null;

        // Emit to both so they sync in real-time
        io.to(userRoom).emit("chat:receive", { rideId, message });
        if (driverRoom) {
          io.to(driverRoom).emit("chat:receive", { rideId, message });
        }
      }
    } catch (err) {
      console.error("Socket chat error:", err);
    }
  });

  socket.on("driver:location", async (data) => {
    const { rideId, lat, lng } = data;
    try {
      const { default: Ride } = await import("./Ride/ride.Models.js");
      const ride = await Ride.findById(rideId);
      if (ride) {
        const userRoom = ride.user.toString();
        io.to(userRoom).emit("driver:location", { lat, lng });
      }
    } catch (err) {
      console.error("Socket driver location update error:", err);
    }
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected:", socket.id);
  });
});

// connect DB
connectDB();

// server — httpServer instead of app.listen
const PORT = process.env.PORT || 5000;
httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});