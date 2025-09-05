const express = require('express');
const { body } = require('express-validator');
const { register, login } = require('../controllers/authController');


const router = express.Router();


router.post('/register', [
body('name').isLength({ min: 2 }).withMessage('Nombre requerido'),
body('email').isEmail().withMessage('Email inválido'),
body('password').isLength({ min: 6 }).withMessage('Password mínimo 6 caracteres')
], register);


router.post('/login', [
body('email').isEmail(),
body('password').exists()
], login);


module.exports = router;