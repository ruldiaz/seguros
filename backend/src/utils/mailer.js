const nodemailer = require('nodemailer');

// Definir función para crear el transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false, // STARTTLS
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
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

// En mailer.js
async function sendQuoteEmail(quote) {
  if (!process.env.FROM_EMAIL || !quote.email) return;
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">Estimado ${quote.name}</h2>
      <p>Gracias por solicitar información en AIT Seguros.</p>
      <p>Hemos recibido tu solicitud de cotización y nos pondremos en contacto contigo en breve con los precios actualizados.</p>
      <p>Nuestro horario de atención es de Lunes a Sábado de 8:00 a 20:00 horas.</p>
      <p>Si necesitas atención inmediata, puedes contactarnos al teléfono: <strong>961 61 5 81 26</strong></p>
      <br/>
      <p style="color: #5f6368; font-size: 14px;">Atentamente,<br>El equipo de AIT Seguros</p>
    </div>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `AIT Seguros <${process.env.FROM_EMAIL}>`,
      to: quote.email,
      subject: `Confirmación de solicitud - AIT Seguros`,
      html,
      text: `Estimado ${quote.name}. Gracias por solicitar información en AIT Seguros. Hemos recibido tu solicitud de cotización y nos pondremos en contacto contigo en breve con los precios actualizados. Horario: Lunes a Sábado 8:00-20:00. Tel: 961 61 5 81 26.`
    });
    console.log('✅ Correo de confirmación enviado a:', quote.email);
    return true;
  } catch (error) {
    console.error('❌ Error enviando correo de confirmación:', error.message);
    return false;
  }
}

// Modificar sendAdminNotification para que no muestre precios
async function sendAdminNotification(quote, quoteType = 'completa') {
  if (!process.env.ADMIN_EMAIL) {
    console.error('❌ ADMIN_EMAIL no configurado');
    return false;
  }
  
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a73e8;">Nueva solicitud de contacto ${quoteType}</h2>
      <p>Se ha recibido una nueva solicitud de información:</p>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px; margin: 15px 0;">
        <ul style="list-style: none; padding: 0;">
          <li><strong>Nombre:</strong> ${quote.name}</li>
          <li><strong>Teléfono:</strong> ${quote.phone || 'No proporcionado'}</li>
          <li><strong>Email:</strong> ${quote.email || 'No proporcionado'}</li>
          <li><strong>Vehículo:</strong> ${quote.vehicle}</li>
          <li><strong>Plan de interés:</strong> ${quote.plan}</li>
          <li><strong>Código Postal:</strong> ${quote.postalCode}</li>
        </ul>
      </div>
      <p><strong>Fecha:</strong> ${new Date(quote.createdAt).toLocaleString('es-MX')}</p>
      <p><em>Nota: Los precios ya no se envían automáticamente debido a su variabilidad.</em></p>
    </div>
  `;

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: `AIT Seguros <${process.env.FROM_EMAIL}>`,
      to: process.env.ADMIN_EMAIL,
      subject: `Nueva solicitud de contacto - ${quote.name}`,
      html,
      text: `Nueva solicitud ${quoteType}. Nombre: ${quote.name}. Tel: ${quote.phone}. Email: ${quote.email}. Vehículo: ${quote.vehicle}. Plan: ${quote.plan}. CP: ${quote.postalCode}.`
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