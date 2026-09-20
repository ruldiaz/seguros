const mongoose = require('mongoose');

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  phone: { type: String, required: true, trim: true, maxlength: 40 },
  email: { type: String, required: true, lowercase: true, trim: true, maxlength: 160 },
  productInterest: {
    type: String,
    required: true,
    enum: ['auto', 'vida', 'salud', 'hogar', 'proteccion_personal']
  },
  cityState: { type: String, required: true, trim: true, maxlength: 160 },
  message: { type: String, trim: true, maxlength: 1200 },
  source: { type: String, trim: true, maxlength: 120 },
  utmSource: { type: String, trim: true, maxlength: 120 },
  utmMedium: { type: String, trim: true, maxlength: 120 },
  utmCampaign: { type: String, trim: true, maxlength: 160 },
  landingPage: { type: String, trim: true, maxlength: 500 },
  status: {
    type: String,
    enum: ['nuevo', 'contactado', 'cotizando', 'cerrado', 'perdido'],
    default: 'nuevo'
  },
  netlifyFormName: { type: String, trim: true, maxlength: 120 },
  netlifySubmissionId: { type: String, trim: true, maxlength: 160 },
  rawSubmission: { type: mongoose.Schema.Types.Mixed }
}, {
  timestamps: true
});

leadSchema.index({ createdAt: -1 });
leadSchema.index({ status: 1, createdAt: -1 });
leadSchema.index({ productInterest: 1, createdAt: -1 });
leadSchema.index({ netlifySubmissionId: 1 }, { unique: true, sparse: true });

module.exports = mongoose.model('Lead', leadSchema);
