const express = require('express');
const router = express.Router();
const { authenticate, authorize } = require('../middleware/auth');
const {
  createRequest, getMyRequests, getAllRequests, getRequestById,
  updateStatus, getRequestLogs,
  createRequestValidation, updateStatusValidation
} = require('../controllers/requestController');

// Module 2 – Request Creation (Users only)
router.post('/', authenticate, authorize('User'), createRequestValidation, createRequest);

// Module 5 – Dashboards
router.get('/my-requests', authenticate, authorize('User'), getMyRequests);
router.get('/', authenticate, authorize('Manager', 'Admin'), getAllRequests);
router.get('/:id', authenticate, getRequestById);

// Module 3 – Workflow Engine
router.patch('/:id/status', authenticate, updateStatusValidation, updateStatus);

// Module 4 – Action Log
router.get('/:id/logs', authenticate, getRequestLogs);

module.exports = router;
