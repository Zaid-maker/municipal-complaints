import User from "../models/User.js";
import { provisionAccountSchema } from "../validators/authValidators.js";

const publicAccount = (user) => ({
    id: user._id.toString(),
    name: user.name,
    email: user.email,
    role: user.role,
    createdAt: user.createdAt
});

export const listAccounts = async (_req, res, next) => {
    try {
        const users = await User.find({
            role: { $in: ["officer", "admin"] }
        })
            .select("name email role createdAt")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            success: true,
            data: {
                accounts: users.map(publicAccount)
            }
        });
    } catch (error) {
        next(error);
    }
};

export const createAccount = async (req, res, next) => {
    try {
        const parsed = provisionAccountSchema.safeParse(req.body);

        if (!parsed.success) {
            return res.status(400).json({
                success: false,
                message: "Validation failed",
                errors: parsed.error.flatten().fieldErrors
            });
        }

        const { name, email, password, role } = parsed.data;
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        const user = await User.create({ name, email, password, role });

        return res.status(201).json({
            success: true,
            message: `${role === "admin" ? "Administrator" : "Officer"} account created`,
            data: {
                account: publicAccount(user)
            }
        });
    } catch (error) {
        if (error.code === 11000) {
            return res.status(409).json({
                success: false,
                message: "An account with this email already exists"
            });
        }

        next(error);
    }
};
