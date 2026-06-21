import { Router } from "express";
import {
  getMeController,
  getMyPlaylistsController,
  getMySavedPlaylistsController,
  getProfileByUsernameController,
  getUserByIdController,
} from "../controllers/userController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/me", requireAuth, asyncHandler(getMeController));
router.get("/me/playlists", requireAuth, asyncHandler(getMyPlaylistsController));
router.get("/me/saved-playlists", requireAuth, asyncHandler(getMySavedPlaylistsController));
router.get("/:userId(\\d+)", requireAuth, asyncHandler(getUserByIdController));
router.get("/:username", requireAuth, asyncHandler(getProfileByUsernameController));

export default router;
