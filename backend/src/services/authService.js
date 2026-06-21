import bcrypt from "bcrypt";
import { query, withTransaction } from "../config/db.js";
import { ApiError } from "../utils/ApiError.js";
import {
  createUser,
  findUserByEmail,
  findUserById,
  findUserByUsername,
  insertPhoneNumbers,
  updatePasswordHash,
} from "../repositories/authRepository.js";

const BCRYPT_PREFIX = "$2";

const sanitizePhoneNumbers = (phones = []) =>
  Array.isArray(phones)
    ? [...new Set(phones.map((phone) => String(phone).replace(/\D/g, "").trim()).filter(Boolean))]
    : [];

const buildSessionUser = (user) => ({
  userId: user.userId,
  username: user.username,
  email: user.email,
});

const verifyPassword = async (user, password) => {
  if (user.passwordHash?.startsWith(BCRYPT_PREFIX)) {
    return bcrypt.compare(password, user.passwordHash);
  }

  return password === user.passwordHash;
};

export const signup = async ({ username, email, password, dob, phones }) => {
  if (!username?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "Username is required.");
  }

  if (!email?.trim()) {
    throw new ApiError(400, "VALIDATION_ERROR", "Email is required.");
  }

  if (!password || password.length < 8) {
    throw new ApiError(400, "VALIDATION_ERROR", "Password must be at least 8 characters long.");
  }

  const existingEmailUser = await findUserByEmail({ query }, email.trim());
  if (existingEmailUser) {
    throw new ApiError(409, "EMAIL_TAKEN", "An account with that email already exists.");
  }

  const existingUsernameUser = await findUserByUsername({ query }, username.trim());
  if (existingUsernameUser) {
    throw new ApiError(409, "USERNAME_TAKEN", "That username is already in use.");
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const normalizedPhones = sanitizePhoneNumbers(phones);

  const user = await withTransaction(async (client) => {
    const createdUser = await createUser(client, {
      username: username.trim(),
      email: email.trim().toLowerCase(),
      passwordHash,
      dob,
    });

    await insertPhoneNumbers(client, createdUser.userId, normalizedPhones);
    return createdUser;
  });

  return { user, sessionUser: buildSessionUser(user) };
};

export const login = async ({ email, password }) => {
  if (!email?.trim() || !password) {
    throw new ApiError(400, "VALIDATION_ERROR", "Email and password are required.");
  }

  const user = await findUserByEmail({ query }, email.trim());
  if (!user) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  const passwordMatches = await verifyPassword(user, password);
  if (!passwordMatches) {
    throw new ApiError(401, "INVALID_CREDENTIALS", "Invalid email or password.");
  }

  if (!user.passwordHash?.startsWith(BCRYPT_PREFIX)) {
    const newHash = await bcrypt.hash(password, 10);
    await updatePasswordHash({ query }, user.userId, newHash);
  }

  return { user, sessionUser: buildSessionUser(user) };
};

export const getCurrentUser = async (userId) => {
  const user = await findUserById({ query }, userId);

  if (!user) {
    throw new ApiError(404, "USER_NOT_FOUND", "User could not be found.");
  }

  return user;
};
