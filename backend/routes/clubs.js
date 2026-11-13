const express = require('express');
const db = require('../config/db');
const { authenticate, authorize, optionalAuthenticate } = require('../middleware/auth');
const router = express.Router();

router.get('/', optionalAuthenticate, async (req, res, next) => {
  try {
    const [rows] = await db.execute(`SELECT c.*, u.full_name admin_name,
      (SELECT COUNT(*) FROM club_memberships m WHERE m.club_id = c.id AND m.status = 'approved') member_count,
      (my_membership.id IS NOT NULL) joined
      FROM clubs c JOIN users u ON u.id = c.admin_id
      LEFT JOIN club_memberships my_membership ON my_membership.club_id = c.id AND my_membership.user_id = ? AND my_membership.status = 'approved'
      ORDER BY c.name`, [req.user?.id || 0]);
    res.json(rows);
  } catch (error) { next(error); }
});

router.post('/', authenticate, authorize('club_admin', 'super_admin'), async (req, res, next) => {
  try {
    const { name, description, logoUrl } = req.body;
    if (!name || !description) return res.status(400).json({ message: 'Name and description are required' });
    const [result] = await db.execute('INSERT INTO clubs (name, description, logo_url, admin_id) VALUES (?, ?, ?, ?)', [name, description, logoUrl || null, req.user.id]);
    const [rows] = await db.execute('SELECT * FROM clubs WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/:id/join', authenticate, async (req, res, next) => {
  try {
    await db.execute('INSERT INTO club_memberships (user_id, club_id, status) VALUES (?, ?, ?)', [req.user.id, req.params.id, 'approved']);
    res.status(201).json({ message: 'Membership created' });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Already a member of this club' });
    next(error);
  }
});

router.delete('/:id/leave', authenticate, async (req, res, next) => {
  try {
    await db.execute('DELETE FROM club_memberships WHERE user_id = ? AND club_id = ?', [req.user.id, req.params.id]);
    res.status(204).send();
  } catch (error) { next(error); }
});

router.get('/:id/members', authenticate, async (req, res, next) => {
  try {
    const [rows] = await db.execute(`SELECT u.id, u.full_name, u.email, m.status, m.joined_at
      FROM club_memberships m JOIN users u ON u.id = m.user_id WHERE m.club_id = ? ORDER BY m.joined_at DESC`, [req.params.id]);
    res.json(rows);
  } catch (error) { next(error); }
});

module.exports = router;
