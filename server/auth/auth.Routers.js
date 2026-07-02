import express from "express";
import { Login, signup } from "./auth.Controllers.js";
import {protectUser } from "./auth.middleware.js";
import User from "./auth.Models.js";
const router = express.Router();
router.post("/signup", signup);
router.post("/login", Login);
router.get("/profile", protectUser , async (req, res) => {
    try{
        const user = await User.findById(req.user.id).select("-password");
        res.json(user);
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
});
export default router;