const express = require('express');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

async function getProfile(req, res, next) {
  try {
    const [rows] = await db.execute('SELECT id, full_name, email, role, avatar_url, bio, created_at FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0] || null);
  } catch (error) { next(error); }
}

async function updateProfile(req, res, next) {
  try {
    const fullName = req.body.fullName || req.body.full_name;
    const avatarUrl = req.body.avatarUrl ?? req.body.avatar_url;
    const bio = req.body.bio;
    await db.execute(
      'UPDATE users SET full_name = COALESCE(?, full_name), avatar_url = COALESCE(?, avatar_url), bio = COALESCE(?, bio) WHERE id = ?',
      [fullName || null, avatarUrl ?? null, bio ?? null, req.user.id]
    );
    const [rows] = await db.execute('SELECT id, full_name, email, role, avatar_url, bio, created_at FROM users WHERE id = ?', [req.user.id]);
    res.json(rows[0]);
  } catch (error) { next(error); }
}

router.get('/me', authenticate, getProfile);
router.get('/profile', authenticate, getProfile);
router.put('/me', authenticate, updateProfile);
router.put('/profile', authenticate, updateProfile);

router.get('/me/events', authenticate, async (req, res, next) => {
  try {
    const [rows] = await db.execute(`SELECT e.*, t.id ticket_id, t.ticket_code, t.status ticket_status, c.name club_name
      FROM tickets t JOIN events e ON e.id = t.event_id JOIN clubs c ON c.id = e.club_id
      WHERE t.user_id = ? ORDER BY e.event_date ASC`, [req.user.id]);
    res.json(rows);
  } catch (error) { next(error); }
});

module.exports = router;
