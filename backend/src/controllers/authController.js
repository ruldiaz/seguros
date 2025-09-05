const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const User = require('../models/User');


exports.register = async (req, res) => {
const errors = validationResult(req);
if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
try {
const { name, email, password, phone } = req.body;
const existing = await User.findOne({ email });
if (existing) return res.status(409).json({ message: 'Correo ya registrado' });
const salt = await bcrypt.genSalt(10);
const passwordHash = await bcrypt.hash(password, salt);
const user = new User({ name, email, phone, passwordHash });
await user.save();
const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
res.status(201).json({ user: { id: user._id, name: user.name, email: user.email }, token });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Error del servidor' });
}
};


exports.login = async (req, res) => {
const errors = validationResult(req);
if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
try {
const { email, password } = req.body;
const user = await User.findOne({ email });
if (!user || !user.passwordHash) return res.status(401).json({ message: 'Credenciales inválidas' });
const ok = await bcrypt.compare(password, user.passwordHash);
if (!ok) return res.status(401).json({ message: 'Credenciales inválidas' });
const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: process.env.JWT_EXPIRES_IN });
res.json({ user: { id: user._id, name: user.name, email: user.email }, token });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Error del servidor' });
}
};