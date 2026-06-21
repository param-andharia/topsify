import { getArtistDetail } from "../services/catalogService.js";
import { getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/responses.js";

export const getArtistController = async (req, res) => {
  const pagination = getPagination(req.query.page, req.query.limit, 20, 50);
  const data = await getArtistDetail(req.params.artistId, req.auth.userId, pagination.page, pagination.limit, pagination.offset);

  return sendSuccess(res, {
    data: {
      artist: data.artist,
      songs: data.songs,
    },
    meta: data.meta,
  });
};
