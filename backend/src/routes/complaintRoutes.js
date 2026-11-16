import { Router } from "express";

import {
    createComplaint,
    getComplaint,
    getComplaintMeta,
    listComplaints,
    updateComplaint
} from "../controllers/complaintController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

// Vocabulary is public so clients can build forms before signing in.
router.get("/meta", getComplaintMeta);

router.use(protect);

router.route("/").get(listComplaints).post(createComplaint);
router.get("/:reference", getComplaint);
router.patch("/:reference", authorize("officer", "admin"), updateComplaint);

export default router;
