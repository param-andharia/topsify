import { Router } from "express";
import { getSearchResultsController, getSearchSuggestionsController } from "../controllers/searchController.js";
import { requireAuth } from "../middlewares/requireAuth.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const router = Router();

router.get("/suggest", requireAuth, asyncHandler(getSearchSuggestionsController));
router.get("/", requireAuth, asyncHandler(getSearchResultsController));

export default router;
