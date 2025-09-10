const mongoose = require('mongoose');

const quoteSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  phone: { type: String },
  vehicle: { type: String, required: function() {
    // Hacer vehicle requerido solo si no es una cotización rápida
    return this.quoteType !== 'quick';
  }},
  brand: { type: String },
  model: { type: String },
  year: { type: Number },
  postalCode: { type: String },
  usage: { 
    type: String, 
    enum: ['Personal', 'Uber/Didi', 'Comercial', 'Otro', 'No especificado'], 
    default: 'Personal' 
  },
  plan: { 
    type: String, 
    enum: ['Responsabilidad Civil', 'Limitada', 'Amplia'], 
    required: true 
  },
  estimatedAnnual: { type: Number },
  estimatedMonthly: { type: Number },
  status: { 
    type: String, 
    enum: ['pending', 'sent', 'closed', 'quick_quote'], 
    default: 'pending' 
  },
  quoteType: {
    type: String,
    enum: ['full', 'quick'],
    default: 'full'
  },
  createdAt: { type: Date, default: Date.now }
});

// Agregar índice para búsquedas más eficientes
quoteSchema.index({ createdAt: -1 });
quoteSchema.index({ status: 1 });

module.exports = mongoose.model('Quote', quoteSchema);