import { Router } from "express";
import { getAlbumController } from "../controllers/albumController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/", requireAuth, asyncHandler(getAlbumController));

export default router;

