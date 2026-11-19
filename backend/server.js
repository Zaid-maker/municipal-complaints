import "dotenv/config";

import express from "express";
import cors from "cors";
import helmet from "helmet";
import mongoose from "mongoose";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

import authRoutes from "./src/routes/authRoutes.js";
import adminRoutes from "./src/routes/adminRoutes.js";
import complaintRoutes from "./src/routes/complaintRoutes.js";

import { corsOptions } from "./src/config/cors.js";
import connectDB from "./src/config/db.js";
import { UPLOAD_ROOT } from "./src/config/uploads.js";

const DATABASE_STATES = {
    0: "disconnected",
    1: "connected",
    2: "connecting",
    3: "disconnecting"
};

const app = express();

app.disable("x-powered-by");

// Behind a reverse proxy (Render, Railway, Nginx) the forwarded client IP is
// needed for rate limiting to work correctly.
if (process.env.TRUST_PROXY) {
    const hops = Number(process.env.TRUST_PROXY);

    app.set("trust proxy", Number.isInteger(hops) && hops > 0 ? hops : 1);
}

app.use(helmet());

app.use(cors(corsOptions));

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

// Complaint photos are public to signed-in citizens as well as staff, so they
// are served as plain static files rather than through the API.
app.use(
    "/uploads",
    express.static(UPLOAD_ROOT, {
        index: false,
        maxAge: "7d",
        dotfiles: "deny",
        setHeaders: (res) => {
            res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
        }
    })
);

app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/complaints", complaintRoutes);

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
    const status = err.status || 500;

    // Client errors (bad CORS origin, malformed request) are expected; only
    // log the ones that indicate a real server fault.
    if (status >= 500) console.error(err);

    res.status(status).json({
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