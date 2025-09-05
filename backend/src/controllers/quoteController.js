const { validationResult } = require('express-validator');
const Quote = require('../models/Quote');
const { sendQuoteEmail } = require('../utils/mailer');

function computeEstimate({ plan, usage, year, paquete }){
  // Normalizar el nombre del plan/paquete
  const planType = (paquete || plan || '').toLowerCase();
  
  let base = 4200;
  const currentYear = new Date().getFullYear();
  
  // Ajustar por año del vehículo si está disponible
  if (year) {
    base += Math.max(0, (currentYear - year)) * 120;
  }
  
  // Ajustar por uso si está disponible
  if (usage && usage === 'Uber/Didi') base *= 1.35;
  if (usage && usage === 'Comercial') base *= 1.5;
  
  // Ajustar por tipo de plan
  if (planType.includes('limitada')) base *= 1.6;
  if (planType.includes('amplia')) base *= 2.3;
  
  const anual = Math.round(Math.max(3500, base));
  return { 
    anual, 
    mensual: Math.round(anual / 12) 
  };
}

// Cotización completa (existente)
exports.createQuote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  try {
    const payload = req.body;
    const estimate = computeEstimate(payload);
    
    const quote = new Quote({
      name: payload.fullname || payload.name,
      email: payload.email,
      phone: payload.whatsapp || payload.phone,
      vehicle: payload.vehiculo || `${payload.brand || ''} ${payload.model || ''}`,
      brand: payload.brand,
      model: payload.model,
      year: payload.anio || payload.year,
      postalCode: payload.cp || payload.postalCode,
      usage: payload.uso || payload.usage,
      plan: payload.plan,
      estimatedAnnual: estimate.anual,
      estimatedMonthly: estimate.mensual
    });
    
    await quote.save();
    sendQuoteEmail(quote).catch(err => console.error('Mailer error', err));
    
    res.status(201).json({ 
      message: 'Cotización generada', 
      anual: estimate.anual,
      mensual: estimate.mensual,
      quoteId: quote._id 
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

// Nueva función para cotización rápida
exports.createQuickQuote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  try {
    const { nombre, tel, marca, modelo, cp, paquete } = req.body;
    
    // Normalizar el nombre del paquete para que coincida con las opciones del modelo
    const normalizedPaquete = paquete === 'Responsabilidad civil' ? 'Responsabilidad Civil' : paquete;
    
    const estimate = computeEstimate({ paquete: normalizedPaquete });
    
    const quote = new Quote({
      name: nombre,
      phone: tel,
      brand: marca,
      model: modelo,
      vehicle: `${marca} ${modelo}`, // Crear vehicle a partir de marca y modelo
      postalCode: cp,
      plan: normalizedPaquete,
      estimatedAnnual: estimate.anual,
      estimatedMonthly: estimate.mensual,
      status: 'quick_quote',
      quoteType: 'quick',
      usage: 'No especificado' // Valor por defecto para cotizaciones rápidas
    });
    
    await quote.save();
    
    // Formatear precios para mostrar en frontend
    const formatPrice = (price) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN',
        minimumFractionDigits: 0,
        maximumFractionDigits: 0
      }).format(price);
    };
    
    res.status(201).json({
      message: 'Cotización rápida generada',
      anual: formatPrice(estimate.anual),
      mensual: formatPrice(estimate.mensual),
      quoteId: quote._id
    });
    
  } catch (err) {
    console.error('Error en createQuickQuote:', err);
    
    // Manejar errores de validación de Mongoose de manera más específica
    if (err.name === 'ValidationError') {
      const errors = Object.values(err.errors).map(error => error.message);
      return res.status(400).json({ 
        message: 'Error de validación', 
        errors 
      });
    }
    
    res.status(500).json({ message: 'Error del servidor' });
  }
};


exports.listQuotes = async (req, res) => {
try {
const quotes = await Quote.find().sort({ createdAt: -1 }).limit(200);
res.json({ quotes });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Error del servidor' });
}
};


exports.getQuote = async (req, res) => {
try {
const { id } = req.params;
const quote = await Quote.findById(id);
if (!quote) return res.status(404).json({ message: 'No encontrado' });
res.json({ quote });
} catch (err) {
console.error(err);
res.status(500).json({ message: 'Error del servidor' });
}
};