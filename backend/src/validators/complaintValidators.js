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

    priority: z
        .enum(PRIORITY_SLUGS, {
            error: "Choose a valid priority"
        })
        .default("normal")
}).strict();

export const listComplaintsQuerySchema = z.object({
    status: z.enum(STATUS_SLUGS).optional(),
    category: z.enum(CATEGORY_SLUGS).optional(),

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

    page: z.coerce.number().int().min(1).default(1),
    limit: z.coerce.number().int().min(1).max(50).default(20)
});
