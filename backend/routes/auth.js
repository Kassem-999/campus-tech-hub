const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { authenticate, secret } = require('../middleware/auth');

const router = express.Router();
const tokenFor = user => jwt.sign({ id: user.id, email: user.email, role: user.role, fullName: user.full_name }, secret, { expiresIn: '7d' });

router.post('/register', async (req, res, next) => {
  try {
    const fullName = req.body.fullName || req.body.full_name;
    const email = String(req.body.email || '').trim().toLowerCase();
    const password = req.body.password;
    const role = 'student';
    if (!fullName || !email || !password) return res.status(400).json({ message: 'full_name, email and password are required' });
    const hash = await bcrypt.hash(password, 12);
    const [result] = await db.execute('INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, ?)', [fullName, email, hash, role]);
    const user = { id: result.insertId, full_name: fullName, email, role };
    res.status(201).json({ user, token: tokenFor(user) });
  } catch (error) {
    if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ message: 'Email is already registered' });
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT * FROM users WHERE email = ?', [req.body.email]);
    const user = rows[0];
    if (!user || !(await bcrypt.compare(req.body.password || '', user.password))) return res.status(401).json({ message: 'Invalid email or password' });
    delete user.password;
    res.json({ user, token: tokenFor(user) });
  } catch (error) { next(error); }
});

router.get('/me', authenticate, async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT id, full_name, email, role, avatar_url, bio, created_at FROM users WHERE id = ?', [req.user.id]);
    if (!rows[0]) return res.status(404).json({ message: 'User not found' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

module.exports = router;
