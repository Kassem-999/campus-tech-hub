const express = require('express');
const db = require('../config/db');
const { authenticate, authorize } = require('../middleware/auth');
const router = express.Router();

const allowedCategories = ['workshop', 'hackathon', 'guest_speaker', 'other'];
router.get('/', async (req, res, next) => {
  try {
    const { q, search, category, date, from, to, sort = 'date' } = req.query;
    const where = [], values = [];
    const keyword = search || q;
    if (keyword) { where.push('(e.title LIKE ? OR e.description LIKE ? OR e.venue LIKE ?)'); values.push(`%${keyword}%`, `%${keyword}%`, `%${keyword}%`); }
    if (category && allowedCategories.includes(category)) { where.push('e.category = ?'); values.push(category); }
    if (date) { where.push('DATE(e.event_date) = ?'); values.push(date); }
    if (from) { where.push('e.event_date >= ?'); values.push(from); }
    if (to) { where.push('e.event_date <= ?'); values.push(to); }
    const order = sort === 'popularity' ? 'e.popularity_score DESC, e.event_date ASC' : 'e.event_date ASC';
    const [rows] = await db.execute(`SELECT e.*, c.name club_name FROM events e JOIN clubs c ON c.id = e.club_id ${where.length ? `WHERE ${where.join(' AND ')}` : ''} ORDER BY ${order}`, values);
    res.json(rows);
  } catch (error) { next(error); }
});

router.get('/:id', async (req, res, next) => {
  try {
    const [rows] = await db.execute('SELECT e.*, c.name club_name FROM events e JOIN clubs c ON c.id = e.club_id WHERE e.id = ?', [req.params.id]);
    if (!rows[0]) return res.status(404).json({ message: 'Event not found' });
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.post('/', authenticate, authorize('club_admin', 'super_admin'), async (req, res, next) => {
  try {
    const { title, description, category, venue, eventDate, totalCapacity, bannerUrl, clubId } = req.body;
    if (!title || !description || !venue || !eventDate || !clubId || !allowedCategories.includes(category) || !Number.isInteger(Number(totalCapacity)) || Number(totalCapacity) < 1) return res.status(400).json({ message: 'Invalid event details' });
    const [result] = await db.execute(`INSERT INTO events
      (club_id, title, description, category, venue, event_date, total_capacity, available_seats, banner_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`, [clubId, title, description, category, venue, eventDate, totalCapacity, totalCapacity, bannerUrl || null]);
    const [rows] = await db.execute('SELECT * FROM events WHERE id = ?', [result.insertId]);
    res.status(201).json(rows[0]);
  } catch (error) { next(error); }
});

router.put('/:id', authenticate, authorize('club_admin', 'super_admin'), async (req, res, next) => {
  try {
    const [existing] = await db.execute('SELECT * FROM events WHERE id = ?', [req.params.id]);
    if (!existing[0]) return res.status(404).json({ message: 'Event not found' });
    const body = req.body;
    const capacity = body.totalCapacity === undefined ? existing[0].total_capacity : Number(body.totalCapacity);
    const booked = existing[0].total_capacity - existing[0].available_seats;
    if (capacity < booked) return res.status(409).json({ message: 'Capacity cannot be lower than existing bookings' });
    await db.execute(`UPDATE events SET title=?, description=?, category=?, venue=?, event_date=?, total_capacity=?, available_seats=?, banner_url=? WHERE id=?`,
      [body.title || existing[0].title, body.description || existing[0].description, body.category || existing[0].category, body.venue || existing[0].venue, body.eventDate || existing[0].event_date, capacity, capacity - booked, body.bannerUrl || existing[0].banner_url, req.params.id]);
    const [rows] = await db.execute('SELECT * FROM events WHERE id = ?', [req.params.id]);
    res.json(rows[0]);
  } catch (error) { next(error); }
});

router.delete('/:id', authenticate, authorize('club_admin', 'super_admin'), async (req, res, next) => {
  try { await db.execute('DELETE FROM events WHERE id = ?', [req.params.id]); res.status(204).send(); } catch (error) { next(error); }
});

module.exports = router;
