import express from "express";
import {
  registerUser,
  authenticateUser,
} from "../services/userService.js";

const router = express.Router();

/**
 * POST /api/users
 * create user (returns userId)
 */
router.post("/users", async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (
      typeof name !== "string" ||
      typeof email !== "string" ||
      typeof password !== "string" ||
      !name.trim() ||
      !email.trim() ||
      !password.trim()
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid name, email, or password." });
    }

    const { id: userId } = await registerUser({
      name: name.trim(),
      email: email.trim(),
      password, // raw here, but hashed in service
    });

    res.status(201).json({ userId });
  } catch (err) {
    console.error("Create user error:", err);
    if (err?.message?.includes("UNIQUE constraint")) {
      return res.status(400).json({ error: "Email already in use." });
    }
    res.status(500).json({ error: "Failed to create user." });
  }
});

/**
 * POST /api/login
 * login user (returns userId)
 */
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (
      typeof email !== "string" ||
      typeof password !== "string" ||
      !email.trim() ||
      !password.trim()
    ) {
      return res
        .status(400)
        .json({ error: "Missing or invalid email or password." });
    }

    let user;
    try {
      user = await authenticateUser(email.trim(), password);
    } catch (authErr) {
      if (authErr.code === "INVALID_CREDENTIALS") {
        return res.status(401).json({ error: "Invalid credentials." });
      }
      throw authErr;
    }

    res.json({ 
      userId: user.id,
      userName: user.name
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Login failed." });
  }
});

/**
 * POST /api/logout
 * logout user (dummy)
 */
router.post("/logout", (req, res) => {
  res.status(200).json({ success: true });
});

export default router;
