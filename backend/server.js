const express = require('express');
const cors = require('cors');
require('dotenv').config();
const db = require('./config/db');

const app = express();
app.use(cors());
app.use(express.json());

// Test DB connection
db.getConnection()
  .then(conn => {
    console.log('Connected to MySQL (XAMPP) successfully!');
    conn.release();
  })
  .catch(err => {
    console.error('Database connection failed:', err.message);
  });

app.get('/', (req, res) => {
  res.send('Campus Tech Event Hub API is running with MySQL...');
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));