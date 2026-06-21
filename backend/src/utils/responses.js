export const sendSuccess = (res, { status = 200, data = null, meta } = {}) => {
  const payload = { success: true, data };

  if (meta) {
    payload.meta = meta;
  }

  return res.status(status).json(payload);
};
