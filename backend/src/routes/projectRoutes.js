const express = require('express');
const router = express.Router();
const projectController = require('../controllers/projectController');
const { authenticate } = require('../middleware/auth');

// Project routes under /api/projects
router.post('/', authenticate, projectController.createProject);
router.get('/', authenticate, projectController.listProjects);
router.get('/:projectId', authenticate, projectController.getProject);
router.put('/:projectId', authenticate, projectController.updateProject);
router.delete('/:projectId', authenticate, projectController.deleteProject);

module.exports = router;
