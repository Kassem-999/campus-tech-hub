const express = require('express');
const crypto = require('crypto');
const db = require('../config/db');
const { authenticate } = require('../middleware/auth');
const router = express.Router();

async function getMyTickets(req, res, next) {
  try {
    const [rows] = await db.execute(`SELECT t.*, e.title, e.description, e.venue, e.event_date,
      e.total_capacity, e.available_seats, c.name club_name
      FROM tickets t JOIN events e ON e.id=t.event_id JOIN clubs c ON c.id=e.club_id WHERE t.user_id=? ORDER BY e.event_date`, [req.user.id]);
    res.json(rows);
  } catch (error) { next(error); }
}

router.get('/mine', authenticate, getMyTickets);
router.get('/my', authenticate, getMyTickets);

router.post('/', authenticate, async (req, res, next) => {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [events] = await connection.execute('SELECT * FROM events WHERE id = ? FOR UPDATE', [req.body.eventId]);
    const event = events[0];
    if (!event) { await connection.rollback(); return res.status(404).json({ message: 'Event not found' }); }
    if (event.available_seats < 1) { await connection.rollback(); return res.status(409).json({ message: 'This event is sold out' }); }
    const [duplicates] = await connection.execute("SELECT id FROM tickets WHERE event_id=? AND user_id=? AND status <> 'cancelled'", [event.id, req.user.id]);
    if (duplicates[0]) { await connection.rollback(); return res.status(409).json({ message: 'You already have a ticket for this event' }); }
    const ticketCode = `CTH-${crypto.randomBytes(5).toString('hex').toUpperCase()}`;
    const [result] = await connection.execute('INSERT INTO tickets (ticket_code, event_id, user_id) VALUES (?, ?, ?)', [ticketCode, event.id, req.user.id]);
    await connection.execute('UPDATE events SET available_seats = available_seats - 1, popularity_score = popularity_score + 1 WHERE id = ?', [event.id]);
    await connection.commit();
    res.status(201).json({ id: result.insertId, ticketCode, eventId: event.id, status: 'confirmed' });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
});

async function cancelTicket(req, res, next) {
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    const [tickets] = await connection.execute("SELECT * FROM tickets WHERE id=? AND user_id=? AND status='confirmed' FOR UPDATE", [req.params.id, req.user.id]);
    if (!tickets[0]) { await connection.rollback(); return res.status(404).json({ message: 'Active ticket not found' }); }
    await connection.execute("UPDATE tickets SET status='cancelled' WHERE id=?", [req.params.id]);
    await connection.execute('UPDATE events SET available_seats = available_seats + 1, popularity_score = GREATEST(popularity_score - 1, 0) WHERE id=?', [tickets[0].event_id]);
    await connection.commit();
    res.json({ message: 'Ticket cancelled' });
  } catch (error) { await connection.rollback(); next(error); } finally { connection.release(); }
}

router.patch('/:id/cancel', cancelTicket);
router.put('/:id/cancel', cancelTicket);

module.exports = router;
