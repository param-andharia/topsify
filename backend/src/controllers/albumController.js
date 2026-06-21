import { getAlbumDetail } from "../services/catalogService.js";
import { getPagination } from "../utils/pagination.js";
import { sendSuccess } from "../utils/responses.js";

export const getAlbumController = async (req, res) => {
  const pagination = getPagination(req.query.page, req.query.limit, 20, 50);
  const data = await getAlbumDetail(String(req.query.name ?? ""), req.auth.userId, pagination.page, pagination.limit, pagination.offset);

  return sendSuccess(res, {
    data: {
      album: data.album,
      songs: data.songs,
    },
    meta: data.meta,
  });
};
