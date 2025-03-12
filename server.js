import express from 'express';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';

const port = 3000;
const host = 'localhost';
const dbHost = 'localhost';
const dbName = 'feedback_support';
const dbUser = 'root';
const dbPwd = '';

const app = express();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

app.use('/includes', express.static(path.join(__dirname, 'includes')));

app.use(bodyParser.urlencoded({ extended: true }));

app.get('/', (req, res) => {
  res.redirect('/customers-users');
});

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

app.get('/support-ticket/:id', async (req, res) => {
  let connection;
  try {
    const id = parseInt(req.params.id);
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });
    const [ticketRows] = await connection.execute('SELECT * FROM support_ticket WHERE id = ?', [id]);
    const [messageRows] = await connection.execute('SELECT * FROM support_message WHERE ticket_id = ?', [id]);
    const [statusRows] = await connection.execute('SELECT * FROM ticket_status');
    if (ticketRows.length === 0) {
      res.status(404).send('Ticket not found');
      return;
    }
    console.log('Ticket:', ticketRows[0]);
    console.log('Messages:', messageRows);
    res.render('support-ticket', { ticket: ticketRows[0], messages: messageRows, statuses: statusRows });
  } catch (err) {
    console.error('Database error:', err.message, 'Errno:', err.errno, 'SQL State:', err.sqlState);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/support-ticket/:id/reply', async (req, res) => {
  let connection;
  try {
    const id = parseInt(req.params.id);
    const { body } = req.body;
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });
    await connection.execute('INSERT INTO support_message (ticket_id, from_user, body) VALUES (?, ?, ?)', [id, 1, body]);
    res.redirect(`/support-ticket/${id}`);
  } catch (err) {
    console.error('Database error:', err.message, 'Errno:', err.errno, 'SQL State:', err.sqlState);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

app.post('/support-ticket/:id/status', async (req, res) => {
  let connection;
  try {
    const id = parseInt(req.params.id);
    const { status } = req.body;
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });
    const handled = status === '4' ? 'NOW()' : 'NULL';
    await connection.execute(`UPDATE support_ticket SET status = ?, handled = ${handled} WHERE id = ?`, [status, id]);
    res.redirect(`/support-ticket/${id}`);
  } catch (err) {
    console.error('Database error:', err.message, 'Errno:', err.errno, 'SQL State:', err.sqlState);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

app.use((err, req, res, next) => {
  console.error('Internal Server Error:', err);
  res.status(500).send('Internal Server Error');
});

async function createDatabaseIfNotExists() {
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
    });
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${dbName}\`;`);
  } catch (err) {
    console.error('Database creation error:', err.message);
  } finally {
    if (connection) await connection.end();
  }
}

createDatabaseIfNotExists().then(() => {
  app.listen(port, host, () => console.log(`${host}:${port} kuuntelee...`));
});