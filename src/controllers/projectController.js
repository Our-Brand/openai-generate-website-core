import express from "express";
import { getUserOrThrow } from "../services/userService.js";
import {
  listUserProjects,
  getProjectWithPrompts,
  deleteProject,
} from "../services/projectService.js";

const router = express.Router();

/**
 * GET /api/projects?userId=
 * get projects (pass user id) and receive project id and name
 */
router.get("/projects", (req, res) => {
  try {
    const userId = Number(req.query.userId);
    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "Invalid userId." });
    }

    try {
      getUserOrThrow(userId);
    } catch (err) {
      if (err.code === "USER_NOT_FOUND") {
        return res.status(404).json({ error: "User not found." });
      }
      throw err;
    }

    const projects = listUserProjects(userId);
    res.json({ projects });
  } catch (err) {
    console.error("Get projects error:", err);
    res.status(500).json({ error: "Failed to fetch projects." });
  }
});

/**
 * GET /api/project?userId=&projectId=
 * get project (pass project id and user id) receive prompts + react/html code
 */
router.get("/project", (req, res) => {
  try {
    const userId = Number(req.query.userId);
    const projectId = Number(req.query.projectId);

    if (!Number.isInteger(userId) || userId <= 0) {
      return res.status(400).json({ error: "Invalid userId." });
    }
    if (!Number.isInteger(projectId) || projectId <= 0) {
      return res.status(400).json({ error: "Invalid projectId." });
    }

    try {
      getUserOrThrow(userId);
    } catch (err) {
      if (err.code === "USER_NOT_FOUND") {
        return res.status(404).json({ error: "User not found." });
      }
      throw err;
    }

    let result;
    try {
      result = getProjectWithPrompts({ userId, projectId });
    } catch (err) {
      if (err.code === "PROJECT_NOT_FOUND") {
        return res
          .status(404)
          .json({ error: "Project not found for this user." });
      }
      throw err;
    }

    res.json({
      project: {
        id: result.project.id,
        name: result.project.name,
        react_code: result.project.react_code,
        html_code: result.project.html_code,
      },
      prompts: result.prompts,
    });
  } catch (err) {
    console.error("Get project error:", err);
    res.status(500).json({ error: "Failed to fetch project." });
  }
});

/**
 * DELETE /api/project
 * delete project (pass project id, user id)
 * BODY: { userId, projectId }
 */
router.delete("/project", (req, res) => {
  try {
    const { userId, projectId } = req.body;
    const numericUserId = Number(userId);
    const numericProjectId = Number(projectId);

    if (!Number.isInteger(numericUserId) || numericUserId <= 0) {
      return res.status(400).json({ error: "Invalid userId." });
    }
    if (!Number.isInteger(numericProjectId) || numericProjectId <= 0) {
      return res.status(400).json({ error: "Invalid projectId." });
    }

    try {
      getUserOrThrow(numericUserId);
    } catch (err) {
      if (err.code === "USER_NOT_FOUND") {
        return res.status(404).json({ error: "User not found." });
      }
      throw err;
    }

    try {
      deleteProject({ userId: numericUserId, projectId: numericProjectId });
    } catch (err) {
      if (err.code === "PROJECT_NOT_FOUND") {
        return res
          .status(404)
          .json({ error: "Project not found for this user." });
      }
      throw err;
    }

    res.json({ success: true });
  } catch (err) {
    console.error("Delete project error:", err);
    res.status(500).json({ error: "Failed to delete project." });
  }
});

export default router;
