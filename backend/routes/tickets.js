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
  let transactionStarted = false;
  try {
    await connection.beginTransaction();
    transactionStarted = true;

    const ticketId = Number.parseInt(req.params.id, 10);
    if (!Number.isInteger(ticketId) || ticketId < 1) {
      await connection.rollback();
      return res.status(400).json({ message: 'Invalid ticket id' });
    }

    // Keep this query limited to columns required by cancellation so schema
    // extensions do not make a valid cancellation fail.
    const [tickets] = await connection.execute(
      'SELECT id, event_id, status FROM tickets WHERE id = ? AND user_id = ? FOR UPDATE',
      [ticketId, req.user.id]
    );
    const ticket = tickets[0];
    if (!ticket) {
      await connection.rollback();
      return res.status(404).json({ message: 'Ticket not found for this user' });
    }
    if (ticket.status === 'cancelled') {
      await connection.commit();
      return res.status(200).json({ message: 'Ticket already cancelled', ticketId });
    }
    if (ticket.status !== 'confirmed') {
      await connection.rollback();
      return res.status(409).json({ message: `Ticket cannot be cancelled from status '${ticket.status}'` });
    }

    const [updated] = await connection.execute(
      "UPDATE tickets SET status = 'cancelled' WHERE id = ? AND user_id = ? AND status = 'confirmed'",
      [ticketId, req.user.id]
    );
    if (updated.affectedRows !== 1) {
      await connection.rollback();
      return res.status(409).json({ message: 'Ticket status changed; please refresh and try again' });
    }

    // Do not touch popularity_score here: cancellation only needs to restore
    // capacity, and this remains compatible with older event table variants.
    await connection.execute(
      'UPDATE events SET available_seats = available_seats + 1 WHERE id = ?',
      [ticket.event_id]
    );
    await connection.commit();
    res.status(200).json({ message: 'Ticket cancelled', ticketId, eventId: ticket.event_id, status: 'cancelled' });
  } catch (error) {
    if (transactionStarted) {
      try { await connection.rollback(); } catch (rollbackError) { console.error('Ticket cancellation rollback failed:', rollbackError); }
    }
    next(error);
  } finally {
    connection.release();
  }
}

router.patch('/:id/cancel', authenticate, cancelTicket);
router.put('/:id/cancel', authenticate, cancelTicket);

module.exports = router;
