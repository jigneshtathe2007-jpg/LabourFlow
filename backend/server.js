
const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');
require('dotenv').config();
const db = require('./db');

if (!process.env.JWT_SECRET) {
  throw new Error('JWT_SECRET must be configured.');
}

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));
app.use(express.static(
  process.env.WEB_ROOT || path.resolve(__dirname, '..')
));

const RESOURCES = {
  sites: ['lf_sites', 'site_id'],
  trades: ['lf_trades', 'trade_id'],
  labours: ['lf_labours', 'labour_id'],
  labourers: ['lf_labours', 'labour_id'],
  supervisors: ['lf_supervisors', 'supervisor_id'],
  users: ['users', 'user_id'],
  hajiriCodes: ['lf_hajiri_codes', 'hajiri_code'],
  tradeRateMaster: ['lf_trade_rate_master', 'trade_rate_id'],
  labourRateMaster: ['lf_labour_rate_master', 'rate_id'],
  attendanceCards: ['lf_attendance_cards', 'card_id'],
  dailyHajiriLogs: ['lf_daily_hajiri_logs', 'log_id'],
  advanceLedger: ['lf_advance_ledger', 'advance_id'],
  extraWorkLogs: ['lf_extra_work_logs', 'extra_work_id'],
  monthlyPayrollSummary: ['lf_monthly_payroll_summary', 'payroll_id'],
  systemAuditLogs: ['lf_system_audit_logs', 'audit_id'],
  attendance: ['lf_daily_hajiri_logs', 'log_id'],
  payroll: ['lf_monthly_payroll_summary', 'payroll_id']
};

const camel = key =>
  key.replace(/_([a-z])/g, (_, c) => c.toUpperCase());

const snake = key =>
  key.replace(/[A-Z]/g, c => '_' + c.toLowerCase());

const normalize = value =>
  typeof value === 'string' &&
  /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d/.test(value)
    ? value.slice(0, 19).replace('T', ' ')
    : value;

const aliases = {
  users: {
    id: 'user_id',
    userId: 'user_id',
    _id: 'user_id'
  },
  lf_labours: {
    labourId: 'labour_id'
  }
};

const safeIdentifier = name =>
  '`' + name.replace(/`/g, '') + '`';

function outputRow(table, row) {
  const result = Object.fromEntries(
    Object.entries(row).map(([key, value]) => [
      camel(key),
      value
    ])
  );

  const primaryKeys = {
    lf_sites: 'site_id',
    lf_trades: 'trade_id',
    lf_labours: 'labour_id',
    lf_supervisors: 'supervisor_id',
    users: 'user_id',
    lf_hajiri_codes: 'hajiri_code',
    lf_trade_rate_master: 'trade_rate_id',
    lf_labour_rate_master: 'rate_id',
    lf_attendance_cards: 'card_id',
    lf_daily_hajiri_logs: 'log_id',
    lf_advance_ledger: 'advance_id',
    lf_extra_work_logs: 'extra_work_id',
    lf_monthly_payroll_summary: 'payroll_id',
    lf_system_audit_logs: 'audit_id'
  };

  const pk = primaryKeys[table];

  if (pk) result._id = row[pk];

  if (table === 'users') {
    result.id = row.user_id;
    result.isActive =
      row.is_active === undefined
        ? true
        : Boolean(row.is_active);
  }

  if (table === 'lf_labours') {
    result.isActive =
      Boolean(row.is_active) && row.status !== 'INACTIVE';
  }

  return result;
}

async function columnsFor(table) {
  const [rows] = await db.query(
    'SHOW COLUMNS FROM ' + safeIdentifier(table)
  );

  return new Set(rows.map(row => row.Field));
}

function mappedEntries(table, body, columns, primaryKey, isInsert) {
  return Object.entries(body || {})
    .map(([key, value]) => [
      aliases[table]?.[key] || snake(key),
      normalize(value)
    ])
    .filter(([key, value]) =>
      columns.has(key) &&
      value !== undefined &&
      !(isInsert && key === primaryKey &&
        table !== 'lf_hajiri_codes')
    );
}

function auth(req, res, next) {
  const header = req.headers.authorization || '';

  if (!header.startsWith('Bearer ')) {
    return res.status(401).json({
      message: 'Please sign in again.'
    });
  }

  try {
    req.user = jwt.verify(
      header.slice(7),
      process.env.JWT_SECRET
    );
    next();
  } catch {
    res.status(401).json({
      message: 'Session expired. Please sign in again.'
    });
  }
}

app.get('/', (_req, res) => {
  res.send('LabourFlow API is running.');
});

app.get('/api/health', async (_req, res) => {
  try {
    await db.query('SELECT 1');
    res.json({ status: 'ok' });
  } catch (error) {
    console.error('Health check:', error.message);
    res.status(503).json({
      status: 'unavailable',
      message: 'Database connection failed.'
    });
  }
});

app.get('/api/test-db', async (_req, res) => {
  try {
    const [rows] = await db.query(
      'SELECT DATABASE() AS databaseName'
    );

    res.json({
      success: true,
      database: rows[0].databaseName
    });
  } catch (error) {
    console.error('Database test:', error.message);
    res.status(500).json({
      message: 'Database connection failed.'
    });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const email = String(req.body.email || '')
      .trim()
      .toLowerCase();

    const password = String(req.body.password || '');

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    const [rows] = await db.execute(
      'SELECT * FROM users WHERE LOWER(email) = ?',
      [email]
    );

    const user = rows[0];

    if (
      !user ||
      !(await bcrypt.compare(password, user.password_hash))
    ) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    if (user.is_active === 0) {
      return res.status(403).json({
        message: 'This account is disabled.'
      });
    }

    const token = jwt.sign(
      {
        userId: user.user_id,
        fullName: user.full_name,
        role: user.role
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );

    res.json({
      success: true,
      token,
      user: {
        id: user.user_id,
        userId: user.user_id,
        _id: user.user_id,
        fullName: user.full_name,
        email: user.email,
        role: user.role,
        isActive: true
      }
    });
  } catch (error) {
    console.error('Login:', error.message);
    res.status(500).json({
      message: 'Login failed.'
    });
  }
});

app.use('/api', auth);

app.post('/api/users', async (req, res) => {
  try {
    const { fullName, email, password, role } = req.body;

    if (!fullName || !email || !password) {
      return res.status(400).json({
        message: 'Name, email and password are required.'
      });
    }

    const hash = await bcrypt.hash(password, 10);

    const [result] = await db.execute(
      `INSERT INTO users
       (full_name, email, password_hash, role, is_active)
       VALUES (?, ?, ?, ?, 1)`,
      [fullName, email, hash, role || 'SUPERVISOR']
    );

    res.status(201).json({
      success: true,
      id: result.insertId,
      userId: result.insertId,
      _id: result.insertId
    });
  } catch (error) {
    console.error('Create user:', error.message);
    res.status(500).json({
      message: 'Could not create user.'
    });
  }
});

app.post('/api/audit', async (req, res) => {
  try {
    const {
      tableName,
      recordId,
      actionType,
      oldValues,
      newValues
    } = req.body;

    await db.execute(
      `INSERT INTO lf_system_audit_logs
       (user_id, changed_by_name, action_type, table_name,
        record_id, old_values, new_values)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        req.user.userId,
        req.user.fullName || null,
        actionType || 'CHANGE',
        tableName || '',
        String(recordId ?? ''),
        JSON.stringify(oldValues ?? null),
        JSON.stringify(newValues ?? null)
      ]
    );

    res.status(201).json({ success: true });
  } catch (error) {
    console.error('Audit:', error.message);
    res.status(500).json({
      message: 'Could not record audit event.'
    });
  }
});

app.get('/api/:resource', async (req, res) => {
  const config = RESOURCES[req.params.resource];

  if (!config) {
    return res.status(404).json({
      message: 'Unknown resource.'
    });
  }

  const [table, pk] = config;

  try {
    const sql = table === 'users'
      ? `SELECT user_id, full_name, email, role, is_active
         FROM users ORDER BY user_id DESC`
      : 'SELECT * FROM ' + safeIdentifier(table) +
        ' ORDER BY ' + safeIdentifier(pk) + ' DESC';

    const [rows] = await db.query(sql);

    res.json(rows.map(row => outputRow(table, row)));
  } catch (error) {
    console.error('List ' + req.params.resource, error.message);
    res.status(500).json({
      message: 'Could not load records.'
    });
  }
});

app.post('/api/:resource', async (req, res) => {
  const config = RESOURCES[req.params.resource];

  if (!config) {
    return res.status(404).json({
      message: 'Unknown resource.'
    });
  }

  const [table, pk] = config;

  try {
    const entries = mappedEntries(
      table,
      req.body,
      await columnsFor(table),
      pk,
      true
    );

    if (!entries.length) {
      return res.status(400).json({
        message: 'No valid fields to save.'
      });
    }

    const sql =
      'INSERT INTO ' + safeIdentifier(table) +
      ' (' + entries.map(([key]) =>
        safeIdentifier(key)).join(',') + ')' +
      ' VALUES (' + entries.map(() => '?').join(',') + ')';

    const [result] = await db.execute(
      sql,
      entries.map(([, value]) => value)
    );

    const supplied = entries.find(([key]) => key === pk);
    const id = supplied ? supplied[1] : result.insertId;

    res.status(201).json({
      success: true,
      id,
      [camel(pk)]: id,
      _id: id
    });
  } catch (error) {
    console.error(
      'Insert ' + req.params.resource + ':',
      error.message
    );

    res.status(500).json({
      message: 'Could not save record. Check backend terminal.'
    });
  }
});

app.put('/api/:resource/:id', async (req, res) => {
  const config = RESOURCES[req.params.resource];

  if (!config) {
    return res.status(404).json({
      message: 'Unknown resource.'
    });
  }

  const [table, pk] = config;

  try {
    const entries = mappedEntries(
      table,
      req.body,
      await columnsFor(table),
      pk,
      false
    ).filter(([key]) => key !== pk);

    if (!entries.length) {
      return res.status(400).json({
        message: 'No valid fields to update.'
      });
    }

    const sql =
      'UPDATE ' + safeIdentifier(table) +
      ' SET ' + entries.map(([key]) =>
        safeIdentifier(key) + '=?').join(',') +
      ' WHERE ' + safeIdentifier(pk) + '=?';

    const [result] = await db.execute(
      sql,
      [...entries.map(([, value]) => value), req.params.id]
    );

    res.json({
      success: true,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error(
      'Update ' + req.params.resource + ':',
      error.message
    );

    res.status(500).json({
      message: 'Could not update record. Check backend terminal.'
    });
  }
});

app.delete('/api/:resource/:id', async (req, res) => {
  const config = RESOURCES[req.params.resource];

  if (!config) {
    return res.status(404).json({
      message: 'Unknown resource.'
    });
  }

  const [table, pk] = config;

  try {
    const [result] = await db.execute(
      'DELETE FROM ' + safeIdentifier(table) +
      ' WHERE ' + safeIdentifier(pk) + '=?',
      [req.params.id]
    );

    res.json({
      success: true,
      affectedRows: result.affectedRows
    });
  } catch (error) {
    console.error('Delete ' + req.params.resource, error.message);
    res.status(500).json({
      message: 'Could not delete record.'
    });
  }
});

app.use('/api', (req, res) => {
  res.status(404).json({
    message: 'API route not found: ' +
      req.method + ' ' + req.path
  });
});

const PORT = Number(process.env.PORT || 3000);

app.listen(PORT, () => {
  console.log(
    'LabourFlow API running at http://localhost:' + PORT
  );
});
