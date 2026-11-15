import Complaint from "../models/Complaint.js";
import Counter from "../models/Counter.js";
import {
    COMPLAINT_CATEGORIES,
    COMPLAINT_PRIORITIES,
    COMPLAINT_STATUSES,
    categoryLabel,
    priorityLabel,
    statusLabel
} from "../config/complaint.js";
import {
    createComplaintSchema,
    listComplaintsQuerySchema
} from "../validators/complaintValidators.js";

const isStaff = (user) => user.role === "officer" || user.role === "admin";

// "Zaid Ahmed Khan" -> "Zaid K." so neighbours can see who reported without
// exposing the full identity of the person who filed it.
export const maskName = (name = "") => {
    const parts = name.trim().split(/\s+/).filter(Boolean);

    if (parts.length === 0) return "Citizen";
    if (parts.length === 1) return parts[0];

    return `${parts[0]} ${parts[parts.length - 1].charAt(0)}.`;
};

const baseComplaint = (complaint) => ({
    id: complaint._id.toString(),
    reference: complaint.reference,
    category: complaint.category,
    categoryLabel: categoryLabel(complaint.category),
    title: complaint.title,
    description: complaint.description,
    area: complaint.area,
    address: complaint.address || null,
    priority: complaint.priority,
    priorityLabel: priorityLabel(complaint.priority),
    status: complaint.status,
    statusLabel: statusLabel(complaint.status),
    createdAt: complaint.createdAt,
    updatedAt: complaint.updatedAt
});

const serializeComplaint = (complaint, viewer) => {
    const base = baseComplaint(complaint);

    if (!isStaff(viewer)) {
        // Citizens see other people's reports in their area, but only a masked
        // reporter name — never an email, user id or internal history notes.
        return {
            ...base,
            reporter: {
                displayName: maskName(complaint.citizen?.name)
            },
            assigned: Boolean(complaint.assignedTo),
            isMine: complaint.citizen?._id?.equals(viewer._id) ?? false
        };
    }

    return {
        ...base,
        reporter: {
            id: complaint.citizen?._id?.toString(),
            name: complaint.citizen?.name,
            email: complaint.citizen?.email
        },
        officer: complaint.assignedTo
            ? {
                id: complaint.assignedTo._id.toString(),
                name: complaint.assignedTo.name,
                email: complaint.assignedTo.email
            }
            : null,
        history: complaint.history.map((entry) => ({
            status: entry.status,
            statusLabel: statusLabel(entry.status),
            note: entry.note || null,
            changedBy: entry.changedBy?.toString(),
            changedAt: entry.changedAt
        }))
    };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const getComplaintMeta = (_req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            categories: COMPLAINT_CATEGORIES,
            statuses: COMPLAINT_STATUSES,
            priorities: COMPLAINT_PRIORITIES
        }
    });
};

export const createComplaint = async (req, res, next) => {
    try {
        const parsed = createComplaintSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const sequence = await Counter.next("complaint");
        const reference = `MUN-${new Date().getFullYear()}-${String(sequence).padStart(6, "0")}`;

        const complaint = await Complaint.create({
            ...parsed.data,
            reference,
            citizen: req.user._id,
            history: [
                {
                    status: "submitted",
                    note: "Complaint submitted",
                    changedBy: req.user._id
                }
            ]
        });

        await complaint.populate("citizen", "name email");

        return res.status(201).json({
            success: true,
            message: "Complaint submitted",
            data: {
                complaint: serializeComplaint(complaint, req.user)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const listComplaints = async (req, res, next) => {
    try {
        const parsed = listComplaintsQuerySchema.safeParse(req.query);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Invalid query parameters",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { status, category, area, mine, page, limit } = parsed.data;
        const filter = {};

        if (status) filter.status = status;
        if (category) filter.category = category;
        if (area) filter.area = new RegExp(`^${escapeRegex(area)}$`, "i");
        if (mine) filter.citizen = req.user._id;

        const [total, complaints] = await Promise.all([
            Complaint.countDocuments(filter),
            Complaint.find(filter)
                .sort({ createdAt: -1 })
                .skip((page - 1) * limit)
                .limit(limit)
                .populate("citizen", "name email")
                .populate("assignedTo", "name email")
        ]);

        return res.status(200).json({
            success: true,
            data: {
                complaints: complaints.map((complaint) =>
                    serializeComplaint(complaint, req.user)
                ),
                pagination: {
                    page,
                    limit,
                    total,
                    pages: Math.max(1, Math.ceil(total / limit))
                }
            }
        });
    } catch (error) {
        next(error);
    }
};

export const getComplaint = async (req, res, next) => {
    try {
        const reference = String(req.params.reference ?? "").toUpperCase();

        const complaint = await Complaint.findOne({ reference })
            .populate("citizen", "name email")
            .populate("assignedTo", "name email");

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        return res.status(200).json({
            success: true,
            data: {
                complaint: serializeComplaint(complaint, req.user)
            }
        });
    } catch (error) {
        next(error);
    }
};
