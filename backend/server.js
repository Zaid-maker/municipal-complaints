import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";

import connectDB from "./src/config/db.js";

dotenv.config();

const DATABASE_STATES = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
};

const app = express();

app.disable("x-powered-by");

app.use(helmet());

app.use(cors({
    origin: process.env.CLIENT_URL,
    credentials: true
}));

app.use(express.json({ limit: "10kb" }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 100,
    standardHeaders: "draft-8",
    legacyHeaders: false
});

// Registered before the routers so every /api request is throttled.
app.use("/api", apiLimiter);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);

if (process.env.NODE_ENV === "development") {
    app.use(morgan("dev"));
}

// Health check
app.get("/api/health", (req, res) => {
    const database = DATABASE_STATES[mongoose.connection.readyState] || "unknown";
    const healthy = mongoose.connection.readyState === 1;

    res.status(healthy ? 200 : 503).json({
        success: healthy,
        message: healthy
            ? "Municipal Complaint Management API is running"
            : "Municipal Complaint Management API is running, but the database is unavailable",
        database
    });
});

// Not found handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "API route not found"
    });
});

// Global error handler
app.use((err, req, res, next) => {
    console.error(err);

    res.status(err.status || 500).json({
        success: false,
        message: err.message || "Internal server error"
    });
});

const startServer = async () => {
    await connectDB();

    const PORT = process.env.PORT || 5000;

    app.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
};

startServer();