import { Router } from "express";
import { getHomeController } from "../controllers/homeController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(getHomeController));

export default router;
