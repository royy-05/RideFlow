import jwt from "jsonwebtoken";
import Driver from "../Driver/driver.models.js";

export const protectDriver = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith("Bearer ")) {
            return res.status(401).json({ message: "No token provided" });
        }

        const token = authHeader.split(" ")[1];

        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        const driver = await Driver.findById(decoded.id).select("-password");

        if (!driver) {
            return res.status(401).json({ message: "Unauthorized" });
        }

        req.driver = driver;

        next();
    } catch (error) {
        return res.status(401).json({ message: "Invalid or expired token" });
    }
};