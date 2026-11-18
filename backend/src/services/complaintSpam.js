import Complaint from "../models/Complaint.js";
import {
    COMPLAINT_DAILY_LIMIT,
    COMPLAINT_DUPLICATE_WINDOW_MS
} from "../config/spam.js";

const DAY_MS = 24 * 60 * 60 * 1000;

// Case, punctuation and spacing should not let the same report slip through
// twice ("Pothole on Main Blvd" vs "pothole on main blvd!!!").
export const normalizeTitle = (title = "") =>
    title
        .normalize("NFKC")
        .toLowerCase()
        .replace(/[^\p{L}\p{N}\s]/gu, " ")
        .replace(/\s+/g, " ")
        .trim();

export const checkComplaintSpam = async (citizenId, { title, category }) => {
    const now = Date.now();
    const dayAgo = new Date(now - DAY_MS);
    const lookback = new Date(
        now - Math.max(DAY_MS, COMPLAINT_DUPLICATE_WINDOW_MS)
    );

    const recent = await Complaint.find({
        citizen: citizenId,
        createdAt: { $gte: lookback }
    })
        .select("reference title category createdAt")
        .sort({ createdAt: -1 })
        .limit(100);

    const filedToday = recent.filter(
        (complaint) => complaint.createdAt >= dayAgo
    ).length;

    if (filedToday >= COMPLAINT_DAILY_LIMIT) {
        return {
            status: 429,
            message: `You have reached the limit of ${COMPLAINT_DAILY_LIMIT} reports in 24 hours. Please try again later.`
        };
    }

    const duplicateSince = now - COMPLAINT_DUPLICATE_WINDOW_MS;
    const titleKey = normalizeTitle(title);

    const duplicate = recent.find(
        (complaint) =>
            complaint.category === category &&
            complaint.createdAt.getTime() >= duplicateSince &&
            normalizeTitle(complaint.title) === titleKey
    );

    if (duplicate) {
        return {
            status: 409,
            message: `You already submitted this report as ${duplicate.reference}. Track that report instead of submitting it again.`,
            reference: duplicate.reference
        };
    }

    return null;
};
