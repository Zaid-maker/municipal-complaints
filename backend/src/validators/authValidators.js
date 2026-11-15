
import { z } from "zod";

export const registerSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(80, "Name cannot exceed 80 characters"),

    email: z
        .string()
        .trim()
        .email("Enter a valid email address")
        .max(254)
        .transform((value) => value.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password is too long")
}).strict();

export const loginSchema = z.object({
    email: z
        .string()
        .trim()
        .email("Enter a valid email address")
        .max(254)
        .transform((value) => value.toLowerCase()),

    password: z
        .string()
        .min(1, "Password is required")
        .max(72, "Invalid credentials")
}).strict();

export const bootstrapAdminSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(80, "Name cannot exceed 80 characters"),

    email: z
        .string()
        .trim()
        .email("Enter a valid email address")
        .max(254)
        .transform((value) => value.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password is too long"),

    bootstrapKey: z
        .string()
        .min(1, "Bootstrap key is required")
        .max(256, "Invalid bootstrap key")
}).strict();

export const provisionAccountSchema = z.object({
    name: z
        .string()
        .trim()
        .min(2, "Name must be at least 2 characters")
        .max(80, "Name cannot exceed 80 characters"),

    email: z
        .string()
        .trim()
        .email("Enter a valid email address")
        .max(254)
        .transform((value) => value.toLowerCase()),

    password: z
        .string()
        .min(8, "Password must be at least 8 characters")
        .max(72, "Password is too long"),

    role: z.enum(["officer", "admin"], {
        error: "Role must be officer or admin"
    })
}).strict();
