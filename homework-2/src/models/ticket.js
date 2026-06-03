const { v4: uuidv4 } = require('uuid');
const validator = require('validator');

const VALID_CATEGORIES = ['account_access', 'technical_issue', 'billing_question', 'feature_request', 'bug_report', 'other'];
const VALID_PRIORITIES = ['urgent', 'high', 'medium', 'low'];
const VALID_STATUSES = ['new', 'in_progress', 'waiting_customer', 'resolved', 'closed'];
const VALID_SOURCES = ['web_form', 'email', 'api', 'chat', 'phone'];
const VALID_DEVICE_TYPES = ['desktop', 'mobile', 'tablet'];

function validateTicket(data) {
  const errors = [];

  if (!data.customer_id || typeof data.customer_id !== 'string') {
    errors.push({ field: 'customer_id', message: 'customer_id is required' });
  }

  if (!data.customer_email || !validator.isEmail(String(data.customer_email))) {
    errors.push({ field: 'customer_email', message: 'customer_email must be a valid email address' });
  }

  if (!data.customer_name || typeof data.customer_name !== 'string') {
    errors.push({ field: 'customer_name', message: 'customer_name is required' });
  }

  if (!data.subject || typeof data.subject !== 'string' || data.subject.length < 1 || data.subject.length > 200) {
    errors.push({ field: 'subject', message: 'subject is required and must be 1-200 characters' });
  }

  if (!data.description || typeof data.description !== 'string' || data.description.length < 10 || data.description.length > 2000) {
    errors.push({ field: 'description', message: 'description is required and must be 10-2000 characters' });
  }

  if (data.category && !VALID_CATEGORIES.includes(data.category)) {
    errors.push({ field: 'category', message: `category must be one of: ${VALID_CATEGORIES.join(', ')}` });
  }

  if (data.priority && !VALID_PRIORITIES.includes(data.priority)) {
    errors.push({ field: 'priority', message: `priority must be one of: ${VALID_PRIORITIES.join(', ')}` });
  }

  if (data.status && !VALID_STATUSES.includes(data.status)) {
    errors.push({ field: 'status', message: `status must be one of: ${VALID_STATUSES.join(', ')}` });
  }

  if (data.metadata) {
    if (data.metadata.source && !VALID_SOURCES.includes(data.metadata.source)) {
      errors.push({ field: 'metadata.source', message: `source must be one of: ${VALID_SOURCES.join(', ')}` });
    }
    if (data.metadata.device_type && !VALID_DEVICE_TYPES.includes(data.metadata.device_type)) {
      errors.push({ field: 'metadata.device_type', message: `device_type must be one of: ${VALID_DEVICE_TYPES.join(', ')}` });
    }
  }

  return errors;
}

function createTicket(data) {
  const now = new Date().toISOString();
  return {
    id: uuidv4(),
    customer_id: data.customer_id,
    customer_email: data.customer_email,
    customer_name: data.customer_name,
    subject: data.subject,
    description: data.description,
    category: data.category || 'other',
    priority: data.priority || 'medium',
    status: data.status || 'new',
    created_at: now,
    updated_at: now,
    resolved_at: null,
    assigned_to: data.assigned_to || null,
    tags: Array.isArray(data.tags) ? data.tags : [],
    metadata: {
      source: data.metadata?.source || 'api',
      browser: data.metadata?.browser || '',
      device_type: data.metadata?.device_type || 'desktop',
    },
    confidence: null,
    reasoning: null,
  };
}

module.exports = { validateTicket, createTicket, VALID_CATEGORIES, VALID_PRIORITIES, VALID_STATUSES };
