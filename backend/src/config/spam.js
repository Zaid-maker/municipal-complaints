const positiveInteger = (value, fallback) => {
    const number = Number(value);

    return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
};

// Burst protection: how many reports one account may submit in a short window.
export const COMPLAINT_RATE_LIMIT = positiveInteger(
    process.env.COMPLAINT_RATE_LIMIT,
    5
);

export const COMPLAINT_RATE_WINDOW_MS = positiveInteger(
    process.env.COMPLAINT_RATE_WINDOW_MS,
    10 * 60 * 1000
);

// Rolling 24-hour cap per account.
export const COMPLAINT_DAILY_LIMIT = positiveInteger(
    process.env.COMPLAINT_DAILY_LIMIT,
    15
);

// The same account cannot file the same title and category again inside this
// window; it gets a pointer to the existing report instead.
export const COMPLAINT_DUPLICATE_WINDOW_MS = positiveInteger(
    process.env.COMPLAINT_DUPLICATE_WINDOW_MS,
    24 * 60 * 60 * 1000
);
