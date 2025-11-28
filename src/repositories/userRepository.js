import db from "../db.js";

export function createUser({ name, email, password }) {
  const stmt = db.prepare(
    `INSERT INTO user (name, email, password) VALUES (?, ?, ?)`
  );
  const info = stmt.run(name, email, password);
  return { id: info.lastInsertRowid };
}

export function findUserById(id) {
  return db
    .prepare(`SELECT id, name, email, password FROM user WHERE id = ?`)
    .get(id);
}

export function findUserByEmail(email) {
  return db
    .prepare(`SELECT id, name, email, password FROM user WHERE email = ?`)
    .get(email);
}
