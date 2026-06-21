export const formatDuration = (durationMs) => {
  if (!durationMs && durationMs !== 0) {
    return "--:--";
  }

  const totalSeconds = Math.max(Math.floor(durationMs / 1000), 0);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;

  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return `${hours}:${String(remainingMinutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export const pluralize = (count, singular, plural = `${singular}s`) => `${count} ${count === 1 ? singular : plural}`;

export const summarizeNames = (items = [], limit = 5) => {
  const normalizedItems = items.filter(Boolean);

  if (normalizedItems.length <= limit) {
    return normalizedItems.join(", ");
  }

  const remainingCount = normalizedItems.length - limit;
  return `${normalizedItems.slice(0, limit).join(", ")}, ${pluralize(remainingCount, "other")}`;
};

export const fallbackImage =
  "https://img.freepik.com/free-vector/futuristic-gradient-profile-picture_742173-9236.jpg?w=740";
