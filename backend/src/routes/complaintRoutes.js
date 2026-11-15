import { Router } from "express";

import {
    createComplaint,
    getComplaint,
    getComplaintMeta,
    listComplaints
} from "../controllers/complaintController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = Router();

// Vocabulary is public so clients can build forms before signing in.
router.get("/meta", getComplaintMeta);

router.use(protect);

router.route("/").get(listComplaints).post(createComplaint);
router.get("/:reference", getComplaint);

export default router;
