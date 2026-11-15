import { Router } from "express";
import { createAccount, listAccounts } from "../controllers/adminController.js";
import { authorize, protect } from "../middleware/authMiddleware.js";

const router = Router();

router.use(protect, authorize("admin"));
router.route("/accounts").get(listAccounts).post(createAccount);

export default router;
