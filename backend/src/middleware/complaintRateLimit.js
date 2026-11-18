import rateLimit from "express-rate-limit";

import {
    COMPLAINT_RATE_LIMIT,
    COMPLAINT_RATE_WINDOW_MS
} from "../config/spam.js";

const minutes = Math.max(1, Math.round(COMPLAINT_RATE_WINDOW_MS / 60000));

// Registered after `protect`, so every request has an account to key on.
// Per-user keys avoid punishing a whole office or household that shares an IP.
export const complaintSubmitLimiter = rateLimit({
    windowMs: COMPLAINT_RATE_WINDOW_MS,
    limit: COMPLAINT_RATE_LIMIT,
    standardHeaders: "draft-8",
    legacyHeaders: false,
    keyGenerator: (req) => req.user._id.toString(),
    handler: (_req, res) =>
        res.status(429).json({
            success: false,
            message: `You can submit up to ${COMPLAINT_RATE_LIMIT} reports every ${minutes} minute${minutes === 1 ? "" : "s"}. Please wait before trying again.`
        })
});
