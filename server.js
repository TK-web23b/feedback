import express from 'express';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';

const port = 3000;
const host = 'localhost';
const dbHost = 'localhost';
const dbName = 'feedback_support';
const dbUser = 'root';
const dbPwd = '';

const app = express();

// Määritetään __dirname ES-moduuleille
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Asetetaan EJS näkymämoottoriksi
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Lisätään staattisten tiedostojen palvelu
app.use('/includes', express.static(path.join(__dirname, 'includes')));

// Reitti, joka ohjaa juuriosoitteen (/) asiakkaat ja käyttäjät sivulle
app.get('/', (req, res) => {
  res.redirect('/customers-users');
});

// REST API reitti palauttaa JSON-datan
app.get('/api/feedback', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });
    const [rows] = await connection.execute('SELECT * FROM feedback');
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err.message, 'Errno:', err.errno, 'SQL State:', err.sqlState);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

// REST API reitti, joka hakee palautteen ID:n perusteella
app.get('/api/feedback/:id', async (req, res) => {
  let connection;
  try {
    const id = parseInt(req.params.id);
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });
    const [rows] = await connection.execute('SELECT * FROM feedback WHERE id = ?', [id]);
    res.json(rows);
  } catch (err) {
    console.error('Database error:', err.message, 'Errno:', err.errno, 'SQL State:', err.sqlState);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

// Reitti, joka renderöi palautesivun EJS:n avulla
app.get('/feedback', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });
    const [rows] = await connection.execute('SELECT * FROM feedback');
    res.render('feedback', { rows });
  } catch (err) {
    console.error('Database error:', err.message, 'Errno:', err.errno, 'SQL State:', err.sqlState);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

// Reitti, joka renderöi asiakkaat ja käyttäjät sivun EJS:n avulla
app.get('/customers-users', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });
    const [customers] = await connection.execute('SELECT * FROM customer');
    const [users] = await connection.execute('SELECT * FROM system_user');
    res.render('customers-users', { customers, users });
  } catch (err) {
    console.error('Database error:', err.message, 'Errno:', err.errno, 'SQL State:', err.sqlState);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

// Reitti, joka renderöi tukipyynnöt sivun EJS:n avulla
app.get('/support-tickets', async (req, res) => {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });
    const [tickets] = await connection.execute('SELECT * FROM support_ticket');
    res.render('support-tickets', { tickets });
  } catch (err) {
    console.error('Database error:', err.message, 'Errno:', err.errno, 'SQL State:', err.sqlState);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).send('Internal Server Error');
});

app.listen(port, host, () => console.log(`${host}:${port} kuuntelee...`));
