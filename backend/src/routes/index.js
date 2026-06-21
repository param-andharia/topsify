import { Router } from "express";
import albumRoutes from "./albumRoutes.js";
import artistRoutes from "./artistRoutes.js";
import authRoutes from "./authRoutes.js";
import homeRoutes from "./homeRoutes.js";
import playlistRoutes from "./playlistRoutes.js";
import searchRoutes from "./searchRoutes.js";
import songRoutes from "./songRoutes.js";
import userRoutes from "./userRoutes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use("/home", homeRoutes);
router.use("/artists", artistRoutes);
router.use("/albums", albumRoutes);
router.use("/search", searchRoutes);
router.use("/songs", songRoutes);
router.use("/playlists", playlistRoutes);
router.use("/users", userRoutes);

export default router;
