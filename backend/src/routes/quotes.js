const express = require('express');
const { body } = require('express-validator');
const { createQuote, listQuotes, getQuote, createQuickQuote } = require('../controllers/quoteController');
const authMiddleware = require('../utils/authMiddleware');

const router = express.Router();

// Crear cotización pública
router.post('/', [
  body('fullname').optional().isLength({ min: 2 }),
  body('vehiculo').optional().isLength({ min: 2 }),
  body('plan').isIn(['Responsabilidad Civil','Limitada','Amplia']).withMessage('Plan inválido')
], createQuote);

// Nueva ruta para cotización rápida
router.post('/quick', [
  body('nombre').isLength({ min: 2 }),
  body('tel').isLength({ min: 10 }),
  body('marca').isLength({ min: 2 }),
  body('modelo').isLength({ min: 2 }),
  body('cp').isLength({ min: 5, max: 5 }),
  body('paquete').isIn(['Amplia','Limitada','Responsabilidad civil']).withMessage('Paquete inválido')
], createQuickQuote);

// Rutas administrativas (ej. listar cotizaciones)
router.get('/', authMiddleware(['admin']), listQuotes);
router.get('/:id', authMiddleware(['admin']), getQuote);

module.exports = router;