import db from "../db.js";

export function getProjectsByUserIdLight(userId) {
  return db
    .prepare(
      `SELECT id, name
       FROM project
       WHERE user_id = ?
       ORDER BY id DESC`
    )
    .all(userId);
}

export function getProjectByIdForUser(projectId, userId) {
  return db
    .prepare(
      `SELECT id, user_id, name, react_code, html_code
       FROM project
       WHERE id = ? AND user_id = ?`
    )
    .get(projectId, userId);
}

export function countProjectsForUser(userId) {
  const row = db
    .prepare(`SELECT COUNT(*) AS count FROM project WHERE user_id = ?`)
    .get(userId);
  return row?.count ?? 0;
}

export function insertProject({ userId, name, reactCode, htmlCode }) {
  const stmt = db.prepare(
    `INSERT INTO project (user_id, name, react_code, html_code)
     VALUES (?, ?, ?, ?)`
  );
  const info = stmt.run(userId, name, reactCode, htmlCode);
  return getProjectByIdForUser(info.lastInsertRowid, userId);
}

export function updateProjectCodeForUser({ projectId, userId, reactCode, htmlCode }) {
  db.prepare(
    `UPDATE project
     SET react_code = ?, html_code = ?
     WHERE id = ? AND user_id = ?`
  ).run(reactCode, htmlCode, projectId, userId);

  return getProjectByIdForUser(projectId, userId);
}

export function deleteProjectForUser({ projectId, userId }) {
  const info = db
    .prepare(
      `DELETE FROM project
       WHERE id = ? AND user_id = ?`
    )
    .run(projectId, userId);

  return info.changes > 0;
}
