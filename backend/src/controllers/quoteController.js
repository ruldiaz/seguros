const { validationResult } = require('express-validator');
const Quote = require('../models/Quote');
const { sendQuoteEmail, sendAdminNotification } = require('../utils/mailer'); // Agregar sendAdminNotification

// Reemplazar la función computeEstimate para que no calcule precios
function computeEstimate() {
  // Ya no calculamos precios, solo devolvemos valores nulos o mensaje
  return { 
    anual: 0, 
    mensual: 0 
  };
}

// Modificar createQuote para no enviar correos con precios
exports.createQuote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  try {
    const payload = req.body;
    
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
      estimatedAnnual: 0, // Ya no almacenamos precios
      estimatedMonthly: 0,
      status: 'contact_request' // Nuevo estado
    });
    
    await quote.save();
    
    // ENVIAR SOLO NOTIFICACIÓN AL ADMINISTRADOR (sin precios)
    try {
      await sendAdminNotification(quote, 'completa');
    } catch (emailError) {
      console.error('Error enviando notificación admin:', emailError);
    }
    
    res.status(201).json({ 
      message: 'Solicitud recibida. Te contactaremos pronto.', 
      quoteId: quote._id 
    });
    
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};


// Modificar createQuickQuote de manera similar
exports.createQuickQuote = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });
  
  try {
    const { nombre, tel, marca, modelo, cp, paquete } = req.body;
    
    const quote = new Quote({
      name: nombre,
      phone: tel,
      brand: marca,
      model: modelo,
      vehicle: `${marca} ${modelo}`,
      postalCode: cp,
      plan: paquete,
      estimatedAnnual: 0, // Sin precios
      estimatedMonthly: 0,
      status: 'contact_request', // Nuevo estado
      quoteType: 'quick',
      usage: 'No especificado'
    });
    
    await quote.save();
    
    // ENVIAR SOLO NOTIFICACIÓN AL ADMINISTRADOR
    try {
      await sendAdminNotification(quote, 'rápida');
    } catch (emailError) {
      console.error('Error enviando notificación admin:', emailError);
    }
    
    res.status(201).json({
      message: 'Solicitud recibida. Te contactaremos pronto.',
      quoteId: quote._id
    });
    
  } catch (err) {
    console.error('Error en createQuickQuote:', err);
    
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