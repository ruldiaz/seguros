const nodemailer = require('nodemailer');


const transporter = nodemailer.createTransport({
host: process.env.EMAIL_HOST,
port: process.env.EMAIL_PORT,
secure: false,
auth: {
user: process.env.EMAIL_USER,
pass: process.env.EMAIL_PASS
}
});


async function sendQuoteEmail(quote){
if(!process.env.FROM_EMAIL) return;
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


await transporter.sendMail({
from: process.env.FROM_EMAIL,
to: quote.email || process.env.FROM_EMAIL,
subject: `Tu cotización - ${quote.plan}`,
html
});
}


module.exports = { sendQuoteEmail };