import { z } from "zod";

import {
    CATEGORY_SLUGS,
    PRIORITY_SLUGS,
    STATUS_SLUGS
} from "../config/complaint.js";

export const createComplaintSchema = z.object({
    category: z.enum(CATEGORY_SLUGS, {
        error: "Choose a valid category"
    }),

    title: z
        .string()
        .trim()
        .min(5, "Title must be at least 5 characters")
        .max(120, "Title cannot exceed 120 characters"),

    description: z
        .string()
        .trim()
        .min(20, "Description must be at least 20 characters")
        .max(2000, "Description cannot exceed 2000 characters"),

    area: z
        .string()
        .trim()
        .min(2, "Area is required")
        .max(80, "Area cannot exceed 80 characters"),

    address: z
        .string()
        .trim()
        .max(200, "Address cannot exceed 200 characters")
        .optional(),

    location: z
        .object({
            lat: z.coerce
                .number()
                .min(-90, "Latitude must be between -90 and 90")
                .max(90, "Latitude must be between -90 and 90"),
            lng: z.coerce
                .number()
                .min(-180, "Longitude must be between -180 and 180")
                .max(180, "Longitude must be between -180 and 180")
        })
        .optional(),

    priority: z
        .enum(PRIORITY_SLUGS, {
            error: "Choose a valid priority"
        })
        .default("normal")
}).strict();

export const updateComplaintSchema = z
    .object({
        assignedTo: z
            .string()
            .regex(/^[0-9a-f]{24}$/i, "Choose a valid staff account")
            .nullable()
            .optional(),

        status: z
            .enum(STATUS_SLUGS, {
                error: "Choose a valid status"
            })
            .optional(),

        note: z
            .string()
            .trim()
            .max(500, "Note cannot exceed 500 characters")
            .optional()
    })
    .strict()
    .refine(
        (data) =>
            data.assignedTo !== undefined ||
            data.status !== undefined ||
            Boolean(data.note),
        { message: "Provide a status, an assignee or a note" }
    );

export const listComplaintsQuerySchema = z.object({
    status: z.enum(STATUS_SLUGS).optional(),
    category: z.enum(CATEGORY_SLUGS).optional(),
    priority: z.enum(PRIORITY_SLUGS).optional(),

    area: z
        .string()
        .trim()
        .min(1)
        .max(80)
        .optional(),

    mine: z
        .enum(["true", "false"])
        .optional()
        .transform((value) => value === "true"),

    // Staff filters: assigned=mine or assigned=unassigned.
    assigned: z.enum(["mine", "unassigned"]).optional(),

    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20)
});
