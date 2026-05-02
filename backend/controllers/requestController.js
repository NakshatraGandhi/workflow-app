const { body, validationResult } = require('express-validator');
const db = require('../config/db');

// Allowed workflow transitions
const TRANSITIONS = {
  Submitted:            { Approved: ['Manager'], Rejected: ['Manager'], 'Needs Clarification': ['Manager'] },
  'Needs Clarification':{ Submitted: ['User'] },
  Approved:             { Closed: ['Admin'] },
  Closed:               { Reopened: ['Admin'] },
  Reopened:             { Submitted: ['User'], Approved: ['Manager'], Rejected: ['Manager'] }
};

// POST /requests  (Module 2)
const createRequest = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { title, description, category, priority } = req.body;
  const user_id = req.user.id;

  try {
    const [result] = await db.execute(
      'INSERT INTO requests (title, description, category, priority, status, user_id) VALUES (?, ?, ?, ?, ?, ?)',
      [title.trim(), description.trim(), category.trim(), priority || 'Medium', 'Submitted', user_id]
    );

    // Log creation
    await db.execute(
      'INSERT INTO request_logs (request_id, old_status, new_status, changed_by, role, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [result.insertId, null, 'Submitted', user_id, req.user.role, 'Request created']
    );

    res.status(201).json({ message: 'Request created.', requestId: result.insertId });
  } catch (err) {
    console.error('Create request error:', err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /my-requests  (User dashboard)
const getMyRequests = async (req, res) => {
  const { status, category, from_date, to_date, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT r.*, u.name as user_name FROM requests r JOIN users u ON r.user_id = u.id WHERE r.user_id = ?';
  const params = [req.user.id];

  if (status) { query += ' AND r.status = ?'; params.push(status); }
  if (category) { query += ' AND r.category = ?'; params.push(category); }
  if (from_date) { query += ' AND DATE(r.created_at) >= ?'; params.push(from_date); }
  if (to_date) { query += ' AND DATE(r.created_at) <= ?'; params.push(to_date); }

  query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  try {
    const [rows] = await db.execute(query, params);
    const [[{ total }]] = await db.execute(
      'SELECT COUNT(*) as total FROM requests WHERE user_id = ?', [req.user.id]
    );
    res.json({ requests: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /requests  (Manager/Admin dashboard)
const getAllRequests = async (req, res) => {
  const { status, category, from_date, to_date, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;
  let query = 'SELECT r.*, u.name as user_name FROM requests r JOIN users u ON r.user_id = u.id WHERE 1=1';
  const params = [];

  // Manager sees only Submitted + Needs Clarification by default unless filtered
  if (req.user.role === 'Manager' && !status) {
    query += ' AND r.status IN (?, ?)';
    params.push('Submitted', 'Needs Clarification');
  }
  if (status) { query += ' AND r.status = ?'; params.push(status); }
  if (category) { query += ' AND r.category = ?'; params.push(category); }
  if (from_date) { query += ' AND DATE(r.created_at) >= ?'; params.push(from_date); }
  if (to_date) { query += ' AND DATE(r.created_at) <= ?'; params.push(to_date); }

  query += ' ORDER BY r.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), parseInt(offset));

  try {
    const [rows] = await db.execute(query, params);
    const [[{ total }]] = await db.execute('SELECT COUNT(*) as total FROM requests', []);
    res.json({ requests: rows, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /requests/:id
const getRequestById = async (req, res) => {
  const { id } = req.params;
  try {
    const [rows] = await db.execute(
      'SELECT r.*, u.name as user_name FROM requests r JOIN users u ON r.user_id = u.id WHERE r.id = ?',
      [id]
    );
    if (rows.length === 0) return res.status(404).json({ message: 'Request not found.' });

    // Users can only view their own requests
    if (req.user.role === 'User' && rows[0].user_id !== req.user.id) {
      return res.status(403).json({ message: 'Access denied.' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /requests/:id/status  (Module 3 – Workflow Engine)
const updateStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const { id } = req.params;
  const { status: newStatus, comment } = req.body;
  const { role, id: userId } = req.user;

  try {
    const [rows] = await db.execute('SELECT * FROM requests WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'Request not found.' });

    const request = rows[0];
    const currentStatus = request.status;

    // Validate transition
    const allowedTargets = TRANSITIONS[currentStatus];
    if (!allowedTargets || !allowedTargets[newStatus]) {
      return res.status(400).json({
        message: `Invalid transition from "${currentStatus}" to "${newStatus}".`
      });
    }

    if (!allowedTargets[newStatus].includes(role)) {
      return res.status(403).json({
        message: `Role "${role}" cannot perform this transition.`
      });
    }

    // 'Needs Clarification' → only originating user can resubmit
    if (currentStatus === 'Needs Clarification' && newStatus === 'Submitted') {
      if (request.user_id !== userId) {
        return res.status(403).json({ message: 'Only the request owner can resubmit.' });
      }
    }

    await db.execute('UPDATE requests SET status = ? WHERE id = ?', [newStatus, id]);

    await db.execute(
      'INSERT INTO request_logs (request_id, old_status, new_status, changed_by, role, comment) VALUES (?, ?, ?, ?, ?, ?)',
      [id, currentStatus, newStatus, userId, role, comment || null]
    );

    res.json({ message: `Status updated to "${newStatus}".` });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /requests/:id/logs  (Module 4 – Action Log)
const getRequestLogs = async (req, res) => {
  const { id } = req.params;
  try {
    const [logs] = await db.execute(
      `SELECT rl.*, u.name as changed_by_name 
       FROM request_logs rl 
       JOIN users u ON rl.changed_by = u.id 
       WHERE rl.request_id = ? 
       ORDER BY rl.timestamp ASC`,
      [id]
    );
    res.json(logs);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error.' });
  }
};

// Validation rules
const createRequestValidation = [
  body('title').notEmpty().trim().withMessage('Title is required.'),
  body('description').notEmpty().trim().withMessage('Description is required.'),
  body('category').notEmpty().trim().withMessage('Category is required.'),
  body('priority').optional().isIn(['Low', 'Medium', 'High']).withMessage('Invalid priority.')
];

const updateStatusValidation = [
  body('status').notEmpty().isIn(['Submitted','Approved','Rejected','Needs Clarification','Closed','Reopened'])
    .withMessage('Invalid status value.')
];

module.exports = {
  createRequest, getMyRequests, getAllRequests, getRequestById,
  updateStatus, getRequestLogs,
  createRequestValidation, updateStatusValidation
};
