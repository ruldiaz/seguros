const crypto = require('crypto');
const { validationResult } = require('express-validator');
const Lead = require('../models/Lead');

const PRODUCT_INTERESTS = ['auto', 'vida', 'salud', 'hogar', 'proteccion_personal'];
const LEAD_STATUSES = ['nuevo', 'contactado', 'cotizando', 'cerrado', 'perdido'];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function clean(value, maxLength = 500) {
  if (value === undefined || value === null) return '';
  return String(value).replace(/[<>]/g, '').trim().slice(0, maxLength);
}

function firstValue(...values) {
  for (const value of values) {
    const cleaned = clean(value);
    if (cleaned) return cleaned;
  }
  return '';
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function normalizeProduct(value) {
  const normalized = clean(value).toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, '_');

  const map = {
    auto: 'auto',
    seguro_de_auto: 'auto',
    vida: 'vida',
    seguro_de_vida: 'vida',
    salud: 'salud',
    gastos_medicos: 'salud',
    gastos_medicos_salud: 'salud',
    hogar: 'hogar',
    proteccion_personal: 'proteccion_personal',
    accidentes_personales: 'proteccion_personal',
    responsabilidad_civil_personal: 'proteccion_personal'
  };

  return map[normalized] || normalized;
}

function extractSubmission(body = {}) {
  if (body.data && typeof body.data === 'object') return body.data;
  if (body.payload && body.payload.data && typeof body.payload.data === 'object') return body.payload.data;
  return body;
}

function extractSubmissionId(body = {}) {
  return firstValue(
    body.id,
    body.submission_id,
    body.submissionId,
    body.payload && body.payload.id,
    body.payload && body.payload.submission_id
  );
}

function extractFormName(body = {}, data = {}) {
  return firstValue(
    data['form-name'],
    data.formName,
    body.form_name,
    body.formName,
    body.name,
    body.payload && body.payload.form_name,
    body.payload && body.payload.formName
  );
}

function normalizeLead(body = {}) {
  const data = extractSubmission(body);
  const productInterest = normalizeProduct(firstValue(
    data.product_interest,
    data.productInterest,
    data.producto_interes,
    data.cobertura,
    data.form_product
  ));

  return {
    name: firstValue(data.name, data.nombre, data.nombre_completo, data.fullname),
    phone: firstValue(data.phone, data.telefono, data.whatsapp, data.tel),
    email: firstValue(data.email, data.correo, data.correo_electronico),
    productInterest,
    cityState: firstValue(data.city_state, data.cityState, data.ciudad_estado, data.ciudad),
    message: firstValue(data.message, data.mensaje, data.comentarios),
    source: firstValue(data.source, data.fuente, extractFormName(body, data), 'netlify-form'),
    utmSource: firstValue(data.utm_source, data.utmSource),
    utmMedium: firstValue(data.utm_medium, data.utmMedium),
    utmCampaign: firstValue(data.utm_campaign, data.utmCampaign),
    landingPage: firstValue(data.landing_page, data.landingPage),
    netlifyFormName: extractFormName(body, data),
    netlifySubmissionId: extractSubmissionId(body),
    rawSubmission: body
  };
}

function isWebhookAuthorized(req) {
  const configuredSecret = process.env.NETLIFY_FORMS_WEBHOOK_SECRET;
  if (!configuredSecret) return false;

  const providedSecret = firstValue(
    req.get('x-webhook-secret'),
    req.get('x-netlify-webhook-secret'),
    req.query.secret
  );

  if (!providedSecret) return false;

  const expected = Buffer.from(configuredSecret);
  const actual = Buffer.from(providedSecret);
  return expected.length === actual.length && crypto.timingSafeEqual(expected, actual);
}

async function findRecentDuplicate(lead) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  return Lead.findOne({
    productInterest: lead.productInterest,
    createdAt: { $gte: since },
    $or: [
      { email: lead.email },
      { phone: lead.phone }
    ]
  });
}

exports.createLeadFromWebhook = async (req, res) => {
  if (!isWebhookAuthorized(req)) {
    return res.status(401).json({ message: 'Webhook no autorizado' });
  }

  const leadData = normalizeLead(req.body);
  const missing = ['name', 'phone', 'email', 'productInterest', 'cityState'].filter((field) => !leadData[field]);

  if (missing.length) {
    return res.status(400).json({ message: 'Datos incompletos', missing });
  }

  if (!PRODUCT_INTERESTS.includes(leadData.productInterest)) {
    return res.status(400).json({ message: 'Producto de interés inválido' });
  }

  if (!EMAIL_PATTERN.test(leadData.email)) {
    return res.status(400).json({ message: 'Email inválido' });
  }

  if (leadData.phone.replace(/\D/g, '').length < 10) {
    return res.status(400).json({ message: 'Teléfono inválido' });
  }

  try {
    if (leadData.netlifySubmissionId) {
      const existingBySubmission = await Lead.findOne({ netlifySubmissionId: leadData.netlifySubmissionId });
      if (existingBySubmission) {
        return res.status(200).json({ message: 'Lead ya registrado', leadId: existingBySubmission._id, duplicate: true });
      }
    }

    const recentDuplicate = await findRecentDuplicate(leadData);
    if (recentDuplicate) {
      return res.status(200).json({ message: 'Lead duplicado reciente', leadId: recentDuplicate._id, duplicate: true });
    }

    const lead = await Lead.create(leadData);
    res.status(201).json({ message: 'Lead registrado', leadId: lead._id });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(200).json({ message: 'Lead ya registrado', duplicate: true });
    }

    console.error('Error creando lead desde webhook:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.listLeads = async (req, res) => {
  const status = clean(req.query.status, 40);
  const productInterest = normalizeProduct(req.query.productInterest);
  const search = clean(req.query.search, 120);
  const query = {};

  if (status) query.status = status;
  if (productInterest) query.productInterest = productInterest;
  if (search) {
    const safeSearch = escapeRegExp(search);
    query.$or = [
      { name: new RegExp(safeSearch, 'i') },
      { email: new RegExp(safeSearch, 'i') },
      { phone: new RegExp(safeSearch, 'i') },
      { cityState: new RegExp(safeSearch, 'i') }
    ];
  }

  try {
    const leads = await Lead.find(query).sort({ createdAt: -1 }).limit(200);
    res.json({ leads });
  } catch (err) {
    console.error('Error listando leads:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.getLead = async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'No encontrado' });
    res.json({ lead });
  } catch (err) {
    console.error('Error obteniendo lead:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};

exports.updateLeadStatus = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) return res.status(400).json({ errors: errors.array() });

  const status = clean(req.body.status, 40);
  if (!LEAD_STATUSES.includes(status)) {
    return res.status(400).json({ message: 'Estado inválido' });
  }

  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!lead) return res.status(404).json({ message: 'No encontrado' });
    res.json({ lead });
  } catch (err) {
    console.error('Error actualizando lead:', err);
    res.status(500).json({ message: 'Error del servidor' });
  }
};
