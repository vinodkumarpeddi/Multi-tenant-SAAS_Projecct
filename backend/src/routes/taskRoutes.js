const express = require('express');
const router = express.Router();
const taskController = require('../controllers/taskController');
const { authenticate } = require('../middleware/auth');

// Task routes under /api/tasks
router.patch('/:taskId/status', authenticate, taskController.updateTaskStatus);
router.put('/:taskId', authenticate, taskController.updateTask);

module.exports = router;
