const jwt = require('jsonwebtoken');
const User = require('../models/User');


module.exports = (roles = []) => async (req, res, next) => {
// roles puede ser array o string
if (typeof roles === 'string') roles = [roles];
try {
const header = req.header('Authorization');
if (!header) return res.status(401).json({ message: 'No autorizado' });
const token = header.replace('Bearer ', '');
const payload = jwt.verify(token, process.env.JWT_SECRET);
const user = await User.findById(payload.id);
if (!user) return res.status(401).json({ message: 'Usuario no encontrado' });
if (roles.length && !roles.includes(user.role)) return res.status(403).json({ message: 'Acceso denegado' });
req.user = user;
next();
} catch (err) {
console.error(err);
res.status(401).json({ message: 'Token inválido' });
}
};