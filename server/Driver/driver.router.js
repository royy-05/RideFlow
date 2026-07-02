import express from "express"
import { loginDriver, registerDriver, updateLocation, updateStatus, nearbyDriver } from "./driver.Controllers.js";
import Driver from "./driver.models.js";
import { protectDriver } from "../Driver/driver.middlewares.js"

const router = express.Router()

router.get("/profile", protectDriver, (req, res) => {
    res.json(req.driver);
});
router.post("/login", loginDriver)
router.post("/register", registerDriver)
router.patch("/status", protectDriver, updateStatus)
router.patch("/location", protectDriver, updateLocation)
router.get("/nearby", nearbyDriver)

export default router;