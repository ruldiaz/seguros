const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const morgan = require('morgan');
const { connectDB } = require('./src/utils/db');
const authRoutes = require('./src/routes/auth');
const quoteRoutes = require('./src/routes/quotes');

dotenv.config();

const app = express();

// Configuración CORS más específica
app.use(cors({
  origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'http://localhost:5500', 'http://127.0.0.1:5500'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept']
}));

app.use(express.json());
app.use(morgan('dev'));

// routes
app.get('/', (req, res) => res.send({ ok: true, service: 'SegurAuto API' }));
app.use('/api/auth', authRoutes);
app.use('/api/quotes', quoteRoutes);

const PORT = process.env.PORT || 4000;

connectDB()
.then(() => {
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
})
.catch((err) => {
  console.error('DB connection failed', err);
  process.exit(1);
});