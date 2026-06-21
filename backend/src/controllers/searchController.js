import { getSuggestions, searchCatalog } from "../services/searchService.js";
import { getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/responses.js";

export const getSearchSuggestionsController = async (req, res) => {
  const limit = Math.min(Math.max(Number.parseInt(req.query.limit ?? "10", 10) || 10, 1), 10);
  const suggestions = await getSuggestions(req.query.q, limit);
  return sendSuccess(res, { data: { suggestions } });
};

export const getSearchResultsController = async (req, res) => {
  const queryText = String(req.query.q ?? "").trim();
  const type = String(req.query.type ?? "all");
  const pagination = getPagination(req.query.page, req.query.limit, type === "all" ? 8 : 20, 50);

  const results = await searchCatalog({
    queryText,
    type,
    userId: req.auth.userId,
    ...pagination,
  });

  return sendSuccess(res, {
    data: {
      query: results.query,
      type: results.type,
      results: results.results,
    },
    meta: results.meta,
  });
};
