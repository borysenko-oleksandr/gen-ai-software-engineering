const crypto = require("crypto");
const express = require("express");
const { users } = require("../data/users");

const router = express.Router();

const PAGE_SIZE = 3;
// Salt must match the value used to pre-compute the hashes in src/data/users.js.
const HASH_SALT = Buffer.from("pipeline-demo-salt");
const HASH_KEYLEN = 32;

// GET /users?page=N — paginated list (Bug #1 fixed: end is exclusive).
router.get("/", (req, res) => {
  const page = parseInt(req.query.page, 10) || 0;
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const slice = users.slice(start, end);
  res.json({ page, pageSize: PAGE_SIZE, total: users.length, items: slice });
});

// GET /users/:id — fetch single user (Bug #2 fixed: NaN and not-found guards).
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  if (isNaN(id)) {
    return res.status(404).json({ error: "User not found" });
  }
  const user = users.find((u) => u.id === id);
  if (user === undefined) {
    return res.status(404).json({ error: "User not found" });
  }
  res.json(user);
});

// POST /login — credentials check (Security #1 fixed: scrypt + timingSafeEqual).
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find((u) => u.username === username);
  if (!user || typeof password !== "string") {
    return res.status(401).json({ ok: false });
  }
  const incoming = crypto.scryptSync(password, HASH_SALT, HASH_KEYLEN);
  const stored = Buffer.from(user.passwordHash, "hex");
  const match = crypto.timingSafeEqual(incoming, stored);
  if (match) {
    return res.json({ ok: true, userId: user.id });
  }
  return res.status(401).json({ ok: false });
});

module.exports = router;
