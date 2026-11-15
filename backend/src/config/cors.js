const DEV_ORIGIN_PATTERN = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d{1,5})?$/;

const DEFAULT_METHODS = ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"];

const DEFAULT_HEADERS = ["Content-Type", "Authorization", "Accept"];

// Rate-limit headers are sent on every response; exposing them lets the browser
// read retry information instead of failing silently.
const EXPOSED_HEADERS = ["RateLimit", "RateLimit-Policy", "RateLimit-Reset", "Retry-After"];

function parseList(value) {
    return (value ?? "")
        .split(",")
        .map((entry) => entry.trim())
        .filter(Boolean);
}

function normalize(origin) {
    return origin.trim().replace(/\/+$/, "").toLowerCase();
}

export const isOriginAllowed = (origin) => {
    // Requests without an Origin header are not browser CORS requests:
    // curl, server-to-server calls and same-origin navigation.
    if (!origin) return true;

    const candidate = normalize(origin);
    const configured = parseList(process.env.CLIENT_URL).map(normalize);

    if (configured.includes(candidate)) return true;

    // Vite picks the next free port (5174, 5175, ...) when 5173 is taken, so
    // allow any localhost port in development only.
    return process.env.NODE_ENV === "development" && DEV_ORIGIN_PATTERN.test(candidate);
};

export const corsOptions = {
    origin(origin, callback) {
        if (isOriginAllowed(origin)) return callback(null, true);

        const error = new Error(`Origin ${origin} is not allowed by CORS`);

        error.status = 403;

        return callback(error);
    },
    credentials: true,
    methods: DEFAULT_METHODS,
    allowedHeaders: DEFAULT_HEADERS,
    exposedHeaders: EXPOSED_HEADERS,
    maxAge: 600,
    optionsSuccessStatus: 204
};
