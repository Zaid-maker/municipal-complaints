
import jwt from "jsonwebtoken";
import { timingSafeEqual } from "node:crypto";
import User from "../models/User.js";
import Bootstrap from "../models/Bootstrap.js";
import {
    bootstrapAdminSchema,
    registerSchema,
    loginSchema
} from "../validators/authValidators.js";

const createToken = (user) => {
    return jwt.sign(
        {
            sub: user._id.toString(),
            role: user.role
        },
        process.env.JWT_SECRET,
        {
            expiresIn: process.env.JWT_EXPIRES_IN || "1d"
        }
    );
};

const publicUser = (user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
});

// POST /api/auth/register
export const register = async (req, res, next) => {
    try {
        const parsed = registerSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { name, email, password } = parsed.data;

        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        // Role is deliberately not accepted from public registration.
        const user = await User.create({
            name,
            email,
            password,
            role: "citizen"
        });

        const token = createToken(user);

        return res.status(201).json({
            success: true,
            message: "Account created successfully",
            data: {
                user: publicUser(user),
                token
            }
        });
    } catch (error) {
        // Handle a duplicate email if two requests race.
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        next(error);
    }
};

// POST /api/auth/login
export const login = async (req, res, next) => {
    try {
        const parsed = loginSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { email, password } = parsed.data;

        const user = await User.findOne({ email }).select("+password");

        // Use the same response for unknown email and wrong password.
        if (!user || !(await user.comparePassword(password))) {
            return res.status(401).json({
                success: false,
                message: "Invalid email or password"
            });
        }

        const token = createToken(user);

        return res.status(200).json({
            success: true,
            message: "Login successful",
            data: {
                user: publicUser(user),
                token
            }
        });
    } catch (error) {
        next(error);
    }
};

// GET /api/auth/me
export const getMe = async (req, res) => {
    return res.status(200).json({
        success: true,
        data: {
            user: publicUser(req.user)
        }
    });
};

export const getBootstrapStatus = async (_req, res, next) => {
    try {
        const [adminExists, bootstrapCompleted] = await Promise.all([
            User.exists({ role: "admin" }),
            Bootstrap.exists({ _id: "initial-admin" })
        ]);

        return res.status(200).json({
            success: true,
            data: {
                available: !adminExists
                    && !bootstrapCompleted
                    && Boolean(process.env.ADMIN_BOOTSTRAP_KEY)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const bootstrapAdmin = async (req, res, next) => {
    const parsed = bootstrapAdminSchema.safeParse(req.body);

    if (!parsed.success) {
        return res.status(400).json({
            success: false,
            message: "Validation failed",
            errors: parsed.error.flatten().fieldErrors
        });
    }

    const configuredKey = process.env.ADMIN_BOOTSTRAP_KEY;
    const suppliedKey = parsed.data.bootstrapKey;

    if (!configuredKey) {
        return res.status(503).json({
            success: false,
            message: "Initial administrator setup is not enabled"
        });
    }

    const configuredBuffer = Buffer.from(configuredKey);
    const suppliedBuffer = Buffer.from(suppliedKey);
    const keyMatches = configuredBuffer.length === suppliedBuffer.length
        && timingSafeEqual(configuredBuffer, suppliedBuffer);

    if (!keyMatches) {
        return res.status(403).json({
            success: false,
            message: "Invalid bootstrap key"
        });
    }

    try {
        if (await User.exists({ role: "admin" })) {
            return res.status(409).json({
                success: false,
                message: "An administrator account has already been created"
            });
        }

        await Bootstrap.create({ _id: "initial-admin" });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "Initial administrator setup has already been completed"
            });
        }

        return next(error);
    }

    try {
        const { name, email, password } = parsed.data;
        const user = await User.create({
            name,
            email,
            password,
            role: "admin"
        });

        return res.status(201).json({
            success: true,
            message: "Initial administrator account created",
            data: {
                user: publicUser(user),
                token: createToken(user)
            }
        });
    } catch (error) {
        await Bootstrap.deleteOne({ _id: "initial-admin" });

        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        return next(error);
    }
};
