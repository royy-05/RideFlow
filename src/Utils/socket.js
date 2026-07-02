// src/Utils/socket.js
import { io } from "socket.io-client";

const socket = io(import.meta.env.VITE_API_URL || "http://localhost:5000", {
  autoConnect: false, // don't connect until we call socket.connect()
});

export default socket;