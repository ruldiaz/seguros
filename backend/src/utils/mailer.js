const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  },
  tls: {
    rejectUnauthorized: false
  }
});

async function sendQuoteEmail(quote) {
  if (!process.env.FROM_EMAIL) return;
  
  const html = `
    <h2>Estimado ${quote.name}</h2>
    <p>Gracias por solicitar una cotización. Aquí tienes un estimado:</p>
    <ul>
      <li>Plan: ${quote.plan}</li>
      <li>Est. anual: $${quote.estimatedAnnual}</li>
      <li>Est. mensual: $${quote.estimatedMonthly}</li>
    </ul>
    <p>Nos pondremos en contacto pronto.</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: quote.email || process.env.FROM_EMAIL,
      subject: `Tu cotización - ${quote.plan}`,
      html
    });
    console.log('Correo de cotización enviado a:', quote.email);
  } catch (error) {
    console.error('Error enviando correo de cotización:', error);
  }
}

async function sendAdminNotification(quote, quoteType = 'completa') {
  if (!process.env.ADMIN_EMAIL) return;
  
  const html = `
    <h2>Nueva cotización ${quoteType}</h2>
    <p>Se ha recibido una nueva solicitud de cotización:</p>
    <ul>
      <li>Nombre: ${quote.name}</li>
      <li>Teléfono: ${quote.phone || 'No proporcionado'}</li>
      <li>Email: ${quote.email || 'No proporcionado'}</li>
      <li>Vehículo: ${quote.vehicle || `${quote.brand} ${quote.model}`}</li>
      <li>Plan: ${quote.plan}</li>
      <li>Código Postal: ${quote.postalCode}</li>
      <li>Estimado anual: $${quote.estimatedAnnual}</li>
      <li>Estimado mensual: $${quote.estimatedMonthly}</li>
    </ul>
    <p>Fecha: ${new Date(quote.createdAt).toLocaleString('es-MX')}</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `Nueva cotización ${quoteType} - ${quote.name}`,
      html
    });
    console.log('Notificación admin enviada a:', process.env.ADMIN_EMAIL);
  } catch (error) {
    console.error('Error enviando notificación admin:', error);
  }
}

async function sendAdminNotificationWebhook({ name, contact, message, formType = 'contacto' }) {
  if (!process.env.ADMIN_EMAIL) return;
  
  const html = `
    <h2>Nuevo mensaje de ${formType}</h2>
    <p>Se ha recibido un nuevo mensaje:</p>
    <ul>
      <li>Nombre: ${name}</li>
      <li>Contacto: ${contact}</li>
      <li>Mensaje: ${message}</li>
    </ul>
    <p>Fecha: ${new Date().toLocaleString('es-MX')}</p>
  `;

  try {
    await transporter.sendMail({
      from: process.env.FROM_EMAIL,
      to: process.env.ADMIN_EMAIL,
      subject: `Nuevo mensaje de ${formType} - ${name}`,
      html
    });
    console.log('Notificación webhook enviada a:', process.env.ADMIN_EMAIL);
  } catch (error) {
    console.error('Error enviando notificación webhook:', error);
  }
}

// Exportar las funciones
module.exports = { 
  sendQuoteEmail, 
  sendAdminNotification, 
  sendAdminNotificationWebhook 
};