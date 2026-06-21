import { Router } from "express";
import {
  getSongController,
  likeSongController,
  recordSongPlayController,
  unlikeSongController,
} from "../controllers/songController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/:trackId", requireAuth, asyncHandler(getSongController));
router.post("/:trackId/like", requireAuth, asyncHandler(likeSongController));
router.delete("/:trackId/like", requireAuth, asyncHandler(unlikeSongController));
router.post("/:trackId/play", requireAuth, asyncHandler(recordSongPlayController));

export default router;
