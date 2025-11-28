import bcrypt from "bcryptjs";
import {
  createUser,
  findUserByEmail,
  findUserById,
} from "../repositories/userRepository.js";

const SALT_ROUNDS = 10;

export async function registerUser({ name, email, password }) {
  // hash password before storing
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = createUser({ name, email, password: hashed });
  return user; // { id }
}

export function getUserOrThrow(userId) {
  const user = findUserById(userId);
  if (!user) {
    const err = new Error("User not found.");
    err.code = "USER_NOT_FOUND";
    throw err;
  }
  return user;
}

export async function authenticateUser(email, password) {
  const user = findUserByEmail(email);
  if (!user) {
    const err = new Error("Invalid credentials.");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }

  const match = await bcrypt.compare(password, user.password);
  if (!match) {
    const err = new Error("Invalid credentials.");
    err.code = "INVALID_CREDENTIALS";
    throw err;
  }

  return { id: user.id, name: user.name, email: user.email };
}
