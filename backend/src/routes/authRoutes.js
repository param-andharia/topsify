import { Router } from "express";
import { asyncHandler } from "../utils/asyncHandler.js";
import { loginController, logoutController, meController, signupController } from "../controllers/authController.js";
import { requireAuth } from "../middlewares/requireAuth.js";

const router = Router();

router.post("/signup", asyncHandler(signupController));
router.post("/login", asyncHandler(loginController));
router.post("/logout", requireAuth, asyncHandler(logoutController));
router.get("/me", requireAuth, asyncHandler(meController));

export default router;
