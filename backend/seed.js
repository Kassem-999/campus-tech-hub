require('dotenv').config();
const bcrypt = require('bcryptjs');
const db = require('./config/db');

async function seed() {
  const password = await bcrypt.hash('Campus123!', 12);
  const connection = await db.getConnection();
  try {
    await connection.beginTransaction();
    await connection.execute(
      `INSERT INTO users (full_name, email, password, role)
       VALUES (?, ?, ?, ?), (?, ?, ?, ?)
       ON DUPLICATE KEY UPDATE full_name = VALUES(full_name), role = VALUES(role)`,
      ['Alex Student', 'student@campus.test', password, 'student', 'Maya Admin', 'admin@campus.test', password, 'club_admin']
    );
    const [[student]] = await connection.query('SELECT id FROM users WHERE email = ?', ['student@campus.test']);
    const [[admin]] = await connection.query('SELECT id FROM users WHERE email = ?', ['admin@campus.test']);
    const clubs = [
      ['DevSoc', 'A community for software builders, open-source contributors and curious makers.', admin.id],
      ['AI & Robotics Club', 'Explore machine learning, robotics and responsible emerging technology.', admin.id],
      ['Cybersecurity Guild', 'Learn practical security through workshops, labs and capture-the-flag events.', admin.id]
    ];
    for (const club of clubs) await connection.execute('INSERT INTO clubs (name, description, admin_id) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE description = VALUES(description)', club);
    const [clubRows] = await connection.query('SELECT id, name FROM clubs WHERE name IN (?, ?, ?)', clubs.map(club => club[0]));
    const byName = Object.fromEntries(clubRows.map(club => [club.name, club.id]));
    await connection.execute('INSERT IGNORE INTO club_memberships (user_id, club_id, status) VALUES (?, ?, ?)', [student.id, byName.DevSoc, 'approved']);
    const events = [
      [byName.DevSoc, 'Build Night: AI for Good', 'Ship a practical AI prototype with fellow builders.', 'workshop', 'Innovation Lab', 3, 40],
      [byName['AI & Robotics Club'], 'Campus Robotics Hackathon', 'A weekend challenge for autonomous systems and creative hardware.', 'hackathon', 'Engineering Hall', 7, 80],
      [byName['Cybersecurity Guild'], 'Threat Hunting 101', 'Hands-on threat detection with a security operations mentor.', 'guest_speaker', 'Cyber Lab', 10, 35],
      [byName.DevSoc, 'Open Source Launchpad', 'Turn your first contribution into a confident open-source workflow.', 'other', 'Library Commons', 14, 60]
    ];
    for (const event of events) {
      await connection.execute(
        `INSERT INTO events (club_id, title, description, category, venue, event_date, total_capacity, available_seats)
         SELECT ?, ?, ?, ?, ?, DATE_ADD(NOW(), INTERVAL ? DAY), ?, ?
         WHERE NOT EXISTS (SELECT 1 FROM events WHERE title = ?)`,
        [...event, event[6], event[1]]
      );
    }
    const [[firstEvent]] = await connection.query('SELECT id FROM events ORDER BY id LIMIT 1');
    await connection.execute(
      `INSERT IGNORE INTO tickets (ticket_code, event_id, user_id, status) VALUES ('CTH-DEMO01', ?, ?, 'confirmed')`,
      [firstEvent.id, student.id]
    );
    await connection.execute('UPDATE events SET available_seats = total_capacity - 1 WHERE id = ? AND EXISTS (SELECT 1 FROM tickets WHERE event_id = ? AND user_id = ? AND status = "confirmed")', [firstEvent.id, firstEvent.id, student.id]);
    await connection.commit();
    console.log('Seed complete. Demo login: student@campus.test / Campus123!');
  } catch (error) {
    await connection.rollback();
    console.error('Seed failed:', error);
    process.exitCode = 1;
  } finally {
    connection.release();
    await db.end();
  }
}

seed();
