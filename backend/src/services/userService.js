import { query } from "../config/db.js";
import {
  getUserProfileById,
  getUserProfileByUsername,
  getOwnedPlaylists,
  getSavedPlaylists,
  getVisibleOwnedPlaylists,
} from "../repositories/userRepository.js";
import { ApiError } from "../utils/ApiError.js";

export const getMyProfile = async (userId) => {
  const profile = await getUserProfileById({ query }, userId);

  if (!profile) {
    throw new ApiError(404, "USER_NOT_FOUND", "User could not be found.");
  }

  return profile;
};

export const getProfileByUsername = async (username) => {
  const profile = await getUserProfileByUsername({ query }, username);

  if (!profile) {
    throw new ApiError(404, "USER_NOT_FOUND", "User could not be found.");
  }

  return profile;
};

export const getUserDetail = async (userId, viewerId) => {
  const profile = await getUserProfileById({ query }, userId);

  if (!profile) {
    throw new ApiError(404, "USER_NOT_FOUND", "User could not be found.");
  }

  const isSelf = profile.userId === viewerId;
  const playlists = await getVisibleOwnedPlaylists({ query }, userId, viewerId);

  return {
    user: {
      ...profile,
      email: isSelf ? profile.email : null,
      isSelf,
    },
    playlists,
  };
};

export const getMyPlaylists = async (userId) => getOwnedPlaylists({ query }, userId);

export const getMySavedPlaylists = async (userId) => getSavedPlaylists({ query }, userId);
