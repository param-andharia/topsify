export const getPagination = (pageValue, limitValue, fallbackLimit = 20, maxLimit = 50) => {
  const page = Math.max(Number.parseInt(pageValue ?? "1", 10) || 1, 1);
  const limit = Math.min(Math.max(Number.parseInt(limitValue ?? String(fallbackLimit), 10) || fallbackLimit, 1), maxLimit);
  const offset = (page - 1) * limit;

  return { page, limit, offset };
};

export const buildMeta = ({ page, limit, total }) => ({
  page,
  limit,
  total,
  hasNextPage: page * limit < total,
});
