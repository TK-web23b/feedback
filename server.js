import express from 'express';
import mysql from 'mysql2/promise';
import path from 'path';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import session from 'express-session';
import bcrypt from 'bcrypt';

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

app.use(session({
  secret: 'your_secret_key',
  resave: false,
  saveUninitialized: true,
}));

// Middleware tarkistaa, onko käyttäjä kirjautunut sisään
function isAuthenticated(req, res, next) {
  if (req.session.user) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Middleware tarkistaa, onko käyttäjä järjestelmänvalvoja
function isAdmin(req, res, next) {
  if (req.session.user && req.session.user.admin) {
    return next();
  } else {
    res.redirect('/login');
  }
}

// Lisää käyttäjäistunto paikallisiin muuttujille
app.use((req, res, next) => {
  res.locals.user = req.session.user;
  next();
});

// Ohjaa pääsivu asiakas- ja käyttäjälistaukseen
app.get('/', (req, res) => {
  res.redirect('/customers-users');
});

// Kirjautumissivu
app.get('/login', (req, res) => {
  res.render('login');
});

// Käsittele kirjautumispyyntö
app.post('/login', async (req, res) => {
  const { identifier, password } = req.body;
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });
    const [rows] = await connection.execute('SELECT * FROM system_user WHERE id = ? OR email = ?', [identifier, identifier]);
    if (rows.length > 0) {
      const user = rows[0];
      const passwordMatch = await bcrypt.compare(password, user.password || '');
      // Tarkista, täsmääkö salasana ja onko käyttäjä järjestelmänvalvoja
      if (passwordMatch && user.admin) {
        req.session.user = user;
        res.redirect('/customers-users');
        return;
      }
    }
    res.render('login', { error: 'Virheelliset tunnistetiedot tai ei järjestelmänvalvoja' });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

// Kirjaa käyttäjä ulos
app.get('/logout', (req, res) => {
  req.session.destroy();
  res.redirect('/login');
});

// Hae kaikki palautteet API:n kautta
app.get('/api/feedback', isAuthenticated, async (req, res) => {
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

// Hae yksittäinen palaute API:n kautta
app.get('/api/feedback/:id', isAuthenticated, async (req, res) => {
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

// Näytä palautesivu
app.get('/feedback', isAuthenticated, async (req, res) => {
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

// Näytä asiakkaat ja käyttäjät
app.get('/customers-users', isAuthenticated, async (req, res) => {
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

// Näytä tukipyynnöt
app.get('/support-tickets', isAuthenticated, async (req, res) => {
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

// Näytä yksittäinen tukipyyntö
app.get('/support-ticket/:id', isAuthenticated, async (req, res) => {
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

// Lisää vastaus tukipyyntöön
app.post('/support-ticket/:id/reply', isAuthenticated, async (req, res) => {
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

// Päivitä tukipyynnön tila
app.post('/support-ticket/:id/status', isAuthenticated, async (req, res) => {
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

// Näytä yksittäisen käyttäjän tiedot
app.get('/user/:id', isAuthenticated, async (req, res) => {
  let connection;
  try {
    const id = parseInt(req.params.id);
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });
    const [rows] = await connection.execute('SELECT * FROM system_user WHERE id = ?', [id]);
    if (rows.length === 0) {
      res.status(404).send('User not found');
      return;
    }
    res.render('user', { user: rows[0] });
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

// Päivitä käyttäjän tiedot
app.post('/user/:id', isAuthenticated, async (req, res) => {
  let connection;
  try {
    const id = parseInt(req.params.id);
    const { fullname, email, mailing_list, customer_id, admin, password } = req.body;
    connection = await mysql.createConnection({
      host: dbHost,
      user: dbUser,
      password: dbPwd,
      database: dbName,
    });

    let query = 'UPDATE system_user SET fullname = ?, email = ?, mailing_list = ?, customer_id = ?, admin = ? WHERE id = ?';
    const params = [fullname, email, mailing_list === 'true', customer_id || null, admin === 'true', id];

    if (password) {
      const hashedPassword = await bcrypt.hash(password, 10);
      query = 'UPDATE system_user SET fullname = ?, email = ?, mailing_list = ?, customer_id = ?, admin = ?, password = ? WHERE id = ?';
      params.splice(5, 0, hashedPassword);
    }

    await connection.execute(query, params);
    res.redirect(`/user/${id}`);
  } catch (err) {
    console.error('Database error:', err.message);
    res.status(500).send('Internal Server Error');
  } finally {
    if (connection) await connection.end();
  }
});

// Käsittele palvelinvirheet
app.use((err, req, res, next) => {
  console.error('Sisäinen palvelinvirhe:', err);
  res.status(500).send('Sisäinen palvelinvirhe');
});

// Luo tietokanta, jos sitä ei ole olemassa
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

// Käynnistä palvelin
createDatabaseIfNotExists().then(() => {
  app.listen(port, host, () => console.log(`${host}:${port} kuuntelee...`));
});