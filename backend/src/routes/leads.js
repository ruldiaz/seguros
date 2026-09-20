const express = require('express');
const { body } = require('express-validator');
const {
  createLeadFromWebhook,
  listLeads,
  getLead,
  updateLeadStatus
} = require('../controllers/leadController');
const authMiddleware = require('../utils/authMiddleware');

const router = express.Router();

router.post('/webhook', createLeadFromWebhook);

router.get('/', authMiddleware(['admin']), listLeads);
router.get('/:id', authMiddleware(['admin']), getLead);
router.patch('/:id/status', authMiddleware(['admin']), [
  body('status').isIn(['nuevo', 'contactado', 'cotizando', 'cerrado', 'perdido'])
], updateLeadStatus);

module.exports = router;
