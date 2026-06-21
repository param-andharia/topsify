import { Router } from "express";
import { getArtistController } from "../controllers/artistController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/:artistId", requireAuth, asyncHandler(getArtistController));

export default router;

