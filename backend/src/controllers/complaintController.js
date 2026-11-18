import fs from "node:fs/promises";
import path from "node:path";

import Complaint from "../models/Complaint.js";
import Counter from "../models/Counter.js";
import User from "../models/User.js";
import {
    COMPLAINT_CATEGORIES,
    COMPLAINT_PRIORITIES,
    COMPLAINT_STATUSES,
    categoryLabel,
    priorityLabel,
    statusLabel
} from "../config/complaint.js";
import { COMPLAINT_UPLOAD_DIR } from "../config/uploads.js";
import {
    createComplaintSchema,
    listComplaintsQuerySchema,
    updateComplaintSchema
} from "../validators/complaintValidators.js";
import { checkComplaintSpam } from "../services/complaintSpam.js";

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
    location: complaint.location
        ? { lat: complaint.location.lat, lng: complaint.location.lng }
        : null,
    priority: complaint.priority,
    priorityLabel: priorityLabel(complaint.priority),
    status: complaint.status,
    statusLabel: statusLabel(complaint.status),
    attachments: (complaint.attachments ?? []).map((attachment) => ({
        id: attachment._id.toString(),
        url: `/uploads/complaints/${attachment.filename}`,
        name: attachment.originalName || attachment.filename,
        mimeType: attachment.mimeType,
        size: attachment.size,
        uploadedAt: attachment.uploadedAt
    })),
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

        const { website, ...fields } = parsed.data;

        if (website) {
            return res.status(400).json({
                success: false,
                message: "Your report could not be submitted."
            });
        }

        const spam = await checkComplaintSpam(req.user._id, fields);

        if (spam) {
            return res.status(spam.status).json({
                success: false,
                message: spam.message,
                data: spam.reference ? { reference: spam.reference } : undefined
            });
        }

        const sequence = await Counter.next("complaint");
        const reference = `MUN-${new Date().getFullYear()}-${String(sequence).padStart(6, "0")}`;

        const complaint = await Complaint.create({
            ...fields,
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

        const { status, category, priority, area, mine, assigned, page, limit } =
            parsed.data;
        const filter = {};

        if (status) filter.status = status;
        if (category) filter.category = category;
        if (priority) filter.priority = priority;
        if (area) filter.area = new RegExp(`^${escapeRegex(area)}$`, "i");
        if (mine) filter.citizen = req.user._id;

        if (assigned === "mine") filter.assignedTo = req.user._id;
        if (assigned === "unassigned") filter.assignedTo = null;

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

export const updateComplaint = async (req, res, next) => {
    try {
        const parsed = updateComplaintSchema.safeParse(req.body);

        if (!parsed.success) {
            const errors = parsed.error.flatten();

            return res.status(400).json({
                success: false,
                message: errors.formErrors[0] ?? "Validation failed",
                errors: errors.fieldErrors
            });
        }

        const reference = String(req.params.reference ?? "").toUpperCase();
        const complaint = await Complaint.findOne({ reference });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        const actor = req.user;
        const isAdmin = actor.role === "admin";
        const changes = parsed.data;
        const notes = [];

        if (changes.assignedTo !== undefined) {
            const targetId = changes.assignedTo;
            const currentAssignee = complaint.assignedTo?.toString() ?? null;

            if (!isAdmin) {
                // Officers can claim an unassigned complaint for themselves, but
                // cannot move or take over somebody else's work.
                if (!targetId || targetId !== actor._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: "Officers can only claim complaints for themselves"
                    });
                }

                if (currentAssignee && currentAssignee !== actor._id.toString()) {
                    return res.status(403).json({
                        success: false,
                        message: "This complaint is already assigned to another officer"
                    });
                }
            }

            if (targetId) {
                const target = await User.findOne({
                    _id: targetId,
                    role: { $in: ["officer", "admin"] }
                }).select("name");

                if (!target) {
                    return res.status(400).json({
                        success: false,
                        message: "Choose an officer account to assign"
                    });
                }

                if (currentAssignee !== target._id.toString()) {
                    complaint.assignedTo = target._id;
                    notes.push(`Assigned to ${target.name}`);
                }
            } else if (complaint.assignedTo) {
                complaint.assignedTo = null;
                notes.push("Unassigned");
            }
        }

        const assignedToActor =
            complaint.assignedTo?.toString() === actor._id.toString();

        if (
            (changes.status !== undefined || changes.note) &&
            !isAdmin &&
            !assignedToActor
        ) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the assigned officer or an administrator can update this complaint"
            });
        }

        if (changes.status && changes.status !== complaint.status) {
            complaint.status = changes.status;
            notes.push(
                changes.note || `Status changed to ${statusLabel(changes.status)}`
            );
        } else if (changes.note) {
            notes.push(changes.note);
        }

        if (notes.length > 0) {
            complaint.history.push(
                ...notes.map((note) => ({
                    status: complaint.status,
                    note,
                    changedBy: actor._id
                }))
            );

            await complaint.save();
        }

        await complaint.populate("citizen", "name email");
        await complaint.populate("assignedTo", "name email");

        return res.status(200).json({
            success: true,
            message: notes[0] ?? "Complaint unchanged",
            data: {
                complaint: serializeComplaint(complaint, actor)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const addComplaintAttachments = async (req, res, next) => {
    const files = req.files ?? [];

    try {
        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Attach at least one photo"
            });
        }

        const complaint = req.complaint;
        const label = `${files.length} photo${files.length === 1 ? "" : "s"}`;

        complaint.attachments.push(
            ...files.map((file) => ({
                filename: file.filename,
                originalName: file.originalname,
                mimeType: file.mimetype,
                size: file.size,
                uploadedBy: req.user._id
            }))
        );

        complaint.history.push({
            status: complaint.status,
            note: `Added ${label}`,
            changedBy: req.user._id
        });

        await complaint.save();
        await complaint.populate("citizen", "name email");
        await complaint.populate("assignedTo", "name email");

        return res.status(201).json({
            success: true,
            message: `Added ${label}`,
            data: {
                complaint: serializeComplaint(complaint, req.user)
            }
        });
    } catch (error) {
        // Do not leave orphaned files behind when the database write fails.
        await Promise.all(
            files.map((file) => fs.rm(file.path, { force: true }).catch(() => {}))
        );

        next(error);
    }
};

export const deleteComplaintAttachment = async (req, res, next) => {
    try {
        const complaint = req.complaint;
        const attachment = complaint.attachments.id(req.params.attachmentId);

        if (!attachment) {
            return res.status(404).json({
                success: false,
                message: "Photo not found"
            });
        }

        const { filename } = attachment;

        attachment.deleteOne();
        complaint.history.push({
            status: complaint.status,
            note: "Removed 1 photo",
            changedBy: req.user._id
        });

        await complaint.save();

        // The database no longer references the file. A failed unlink only
        // leaves an orphan on disk, never a broken image in the record.
        await fs
            .rm(path.join(COMPLAINT_UPLOAD_DIR, filename), { force: true })
            .catch(() => {});

        await complaint.populate("citizen", "name email");
        await complaint.populate("assignedTo", "name email");

        return res.status(200).json({
            success: true,
            message: "Photo removed",
            data: {
                complaint: serializeComplaint(complaint, req.user)
            }
        });
    } catch (error) {
        next(error);
    }
};
