
import { Router } from "express";
import rateLimit from "express-rate-limit";

import {
    register,
    login,
    getMe,
    getBootstrapStatus,
    bootstrapAdmin
} from "../controllers/authController.js";

import { protect } from "../middleware/authMiddleware.js";

const router = Router();

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 10,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    message: {
        success: false,
        message: "Too many authentication attempts. Please try again later."
    }
});

router.post("/register", authLimiter, register);
router.post("/login", authLimiter, login);
router.get("/bootstrap-status", getBootstrapStatus);
router.post("/bootstrap-admin", authLimiter, bootstrapAdmin);
router.get("/me", protect, getMe);

export default router;
