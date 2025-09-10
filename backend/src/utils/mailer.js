const nodemailer = require('nodemailer');

// Crear el transporter con configuración mejorada
const createTransporter = () => {
  return nodemailer.createTransport({
    service: 'gmail', // Usar el servicio 'gmail' en lugar de configuración manual
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    },
    // Opciones adicionales para mejor compatibilidad
    pool: true,
    maxConnections: 1,
    rateDelta: 20000,
    rateLimit: 5
  });
};

// Verificar la configuración de correo al iniciar
const verifyEmailConfig = async () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('❌ Configuración de email incompleta. Verifica EMAIL_USER y EMAIL_PASS');
    return false;
  }
  
  try {
    const transporter = createTransporter();
    await transporter.verify();
    console.log('✅ Configuración de email verificada correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error verificando configuración de email:', error.message);
    return false;
  }
};

// Llamar a la verificación al cargar el módulo
verifyEmailConfig();

async function sendQuoteEmail(quote) {
  if (!process.env.FROM_EMAIL || !quote.email) return;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">Estimado ${quote.name}</h2>
      <p>Gracias por solicitar una cotización en AIT Seguros. Aquí tienes un estimado:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <ul style="list-style: none; padding: 0;">
          <li><strong>Plan:</strong> ${quote.plan}</li>
          <li><strong>Estimado anual:</strong> $${quote.estimatedAnnual} MXN</li>
          <li><strong>Estimado mensual:</strong> $${quote.estimatedMonthly} MXN</li>
        </ul>
      </div>
      <p>Nos pondremos en contacto contigo pronto para confirmar los detalles y formalizar tu póliza.</p>
      <p style="color: #5f6368; font-size: 14px;">Atentamente,<br>El equipo de AIT Seguros</p>
    </div>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `AIT Seguros <${process.env.FROM_EMAIL}>`,
      to: quote.email,
      subject: `Tu cotización - ${quote.plan}`,
      html,
      text: `Estimado ${quote.name}. Gracias por solicitar una cotización. Plan: ${quote.plan}. Est. anual: $${quote.estimatedAnnual}. Est. mensual: $${quote.estimatedMonthly}. Nos pondremos en contacto pronto.`
    });
    console.log('✅ Correo de cotización enviado a:', quote.email);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo de cotización:', error.message);
    return false;
  }
}

async function sendAdminNotification(quote, quoteType = 'completa') {
  if (!process.env.ADMIN_EMAIL) {
    console.error('❌ ADMIN_EMAIL no configurado');
    return false;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">Nueva cotización ${quoteType}</h2>
      <p>Se ha recibido una nueva solicitud de cotización:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <ul style="list-style: none; padding: 0;">
          <li><strong>Nombre:</strong> ${quote.name}</li>
          <li><strong>Teléfono:</strong> ${quote.phone || 'No proporcionado'}</li>
          <li><strong>Email:</strong> ${quote.email || 'No proporcionado'}</li>
          <li><strong>Vehículo:</strong> ${quote.vehicle || `${quote.brand} ${quote.model}`}</li>
          <li><strong>Plan:</strong> ${quote.plan}</li>
          <li><strong>Código Postal:</strong> ${quote.postalCode}</li>
          <li><strong>Estimado anual:</strong> $${quote.estimatedAnnual} MXN</li>
          <li><strong>Estimado mensual:</strong> $${quote.estimatedMonthly} MXN</li>
        </ul>
      </div>
      <p><strong>Fecha:</strong> ${new Date(quote.createdAt).toLocaleString('es-MX')}</p>
    </div>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `AIT Seguros <${process.env.FROM_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `Nueva cotización ${quoteType} - ${quote.name}`,
      html,
      text: `Nueva cotización ${quoteType}. Nombre: ${quote.name}. Tel: ${quote.phone}. Email: ${quote.email}. Vehículo: ${quote.vehicle}. Plan: ${quote.plan}. CP: ${quote.postalCode}.`
    });
    console.log('✅ Notificación admin enviada a:', process.env.ADMIN_EMAIL);
    return true;
  } catch (error) {
    console.error('❌ Error enviando notificación admin:', error.message);
    return false;
  }
}

module.exports = { 
  sendQuoteEmail, 
  sendAdminNotification, 
  verifyEmailConfig 
};