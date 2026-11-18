import mongoose from "mongoose";

import {
    CATEGORY_SLUGS,
    PRIORITY_SLUGS,
    STATUS_SLUGS
} from "../config/complaint.js";

const historyEntrySchema = new mongoose.Schema(
    {
        status: {
            type: String,
            enum: STATUS_SLUGS,
            required: true
        },
        note: {
            type: String,
            trim: true,
            maxlength: 500
        },
        changedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true
        },
        changedAt: {
            type: Date,
            default: Date.now
        }
    },
    { _id: false }
);

const locationSchema = new mongoose.Schema(
    {
        lat: {
            type: Number,
            required: true,
            min: -90,
            max: 90
        },
        lng: {
            type: Number,
            required: true,
            min: -180,
            max: 180
        }
    },
    { _id: false }
);

const attachmentSchema = new mongoose.Schema({
    filename: {
        type: String,
        required: true
    },
    originalName: {
        type: String,
        trim: true,
        maxlength: 200
    },
    mimeType: {
        type: String,
        required: true
    },
    size: {
        type: Number,
        required: true,
        min: 1
    },
    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    uploadedAt: {
        type: Date,
        default: Date.now
    }
});

const complaintSchema = new mongoose.Schema(
    {
        reference: {
            type: String,
            required: true,
            unique: true,
            uppercase: true,
            trim: true
        },

        citizen: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
            index: true
        },

        category: {
            type: String,
            enum: CATEGORY_SLUGS,
            required: [true, "Category is required"],
            index: true
        },

        title: {
            type: String,
            required: [true, "Title is required"],
            trim: true,
            minlength: 5,
            maxlength: 120
        },

        description: {
            type: String,
            required: [true, "Description is required"],
            trim: true,
            minlength: 20,
            maxlength: 2000
        },

        // Human-readable area used for "complaints near me" browsing. Kept as
        // free text for now; can become a reference to an area document later.
        area: {
            type: String,
            required: [true, "Area is required"],
            trim: true,
            maxlength: 80,
            index: true
        },

        address: {
            type: String,
            trim: true,
            maxlength: 200
        },

        // Optional map pin chosen by the citizen. Kept as plain coordinates so
        // the API stays simple; a 2dsphere index can be added when "near me"
        // radius search is introduced.
        location: {
            type: locationSchema,
            default: null
        },

        priority: {
            type: String,
            enum: PRIORITY_SLUGS,
            default: "normal"
        },

        status: {
            type: String,
            enum: STATUS_SLUGS,
            default: "submitted",
            index: true
        },

        assignedTo: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null
        },

        history: {
            type: [historyEntrySchema],
            default: []
        },

        // Photos added by the assigned officer (or an administrator) to
        // document the work, shown to staff and citizens alike.
        attachments: {
            type: [attachmentSchema],
            default: []
        }
    },
    { timestamps: true }
);

complaintSchema.index({ createdAt: -1 });
complaintSchema.index({ area: 1, createdAt: -1 });

const Complaint = mongoose.model("Complaint", complaintSchema);

export default Complaint;
