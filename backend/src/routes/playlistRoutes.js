import { Router } from "express";
import {
  addTrackToPlaylistController,
  createPlaylistController,
  followPlaylistController,
  getPlaylistController,
  removeTrackFromPlaylistController,
  unfollowPlaylistController,
} from "../controllers/playlistController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/:playlistId", requireAuth, asyncHandler(getPlaylistController));
router.post("/", requireAuth, asyncHandler(createPlaylistController));
router.post("/:playlistId/songs", requireAuth, asyncHandler(addTrackToPlaylistController));
router.delete("/:playlistId/songs/:trackId", requireAuth, asyncHandler(removeTrackFromPlaylistController));
router.post("/:playlistId/follow", requireAuth, asyncHandler(followPlaylistController));
router.delete("/:playlistId/follow", requireAuth, asyncHandler(unfollowPlaylistController));

export default router;
