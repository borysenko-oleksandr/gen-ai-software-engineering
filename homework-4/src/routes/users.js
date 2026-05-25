const express = require("express");
const { users } = require("../data/users");

const router = express.Router();

const PAGE_SIZE = 3;

// GET /users?page=N — paginated list.
// Bug #1 (off-by-one): the slice end is `start + PAGE_SIZE - 1`, so the last
// item of every page is silently dropped. Should be `start + PAGE_SIZE`.
router.get("/", (req, res) => {
  const page = parseInt(req.query.page, 10) || 0;
  const start = page * PAGE_SIZE;
  const end = start + PAGE_SIZE - 1;
  const slice = users.slice(start, end);
  res.json({ page, pageSize: PAGE_SIZE, total: users.length, items: slice });
});

// GET /users/:id — fetch single user.
// Bug #2 (missing validation): no NaN / not-found guard. `parseInt("abc")`
// yields NaN, `users.find(...)` returns undefined, which is serialized as
// an empty 200 response instead of a 404.
router.get("/:id", (req, res) => {
  const id = parseInt(req.params.id, 10);
  const user = users.find((u) => u.id === id);
  res.json(user);
});

// POST /login — credentials check.
// Security #1: passwords are stored and compared in plain text using `===`.
// No hashing, no constant-time comparison — vulnerable to credential leaks
// and timing attacks.
router.post("/login", (req, res) => {
  const { username, password } = req.body || {};
  const user = users.find((u) => u.username === username);
  if (user && user.password === password) {
    return res.json({ ok: true, userId: user.id });
  }
  return res.status(401).json({ ok: false });
});

module.exports = router;
