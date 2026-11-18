import Complaint from "../models/Complaint.js";

// Loads the complaint before a photo upload so unauthorised requests fail
// before multer writes anything to disk.
export const requireAttachmentAccess = async (req, res, next) => {
    try {
        const reference = String(req.params.reference ?? "").toUpperCase();
        const complaint = await Complaint.findOne({ reference });

        if (!complaint) {
            return res.status(404).json({
                success: false,
                message: "Complaint not found"
            });
        }

        const isAdmin = req.user.role === "admin";
        const isAssignedOfficer =
            complaint.assignedTo?.toString() === req.user._id.toString();

        if (!isAdmin && !isAssignedOfficer) {
            return res.status(403).json({
                success: false,
                message:
                    "Only the assigned officer or an administrator can change photos"
            });
        }

        req.complaint = complaint;
        next();
    } catch (error) {
        next(error);
    }
};
