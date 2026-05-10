const logger = require('../utils/logger');

const PRIORITY_RULES = [
  { priority: 'urgent', keywords: ["can't access", 'critical', 'production down', 'security'] },
  { priority: 'high',   keywords: ['important', 'blocking', 'asap'] },
  { priority: 'low',    keywords: ['minor', 'cosmetic', 'suggestion'] },
];

const CATEGORY_RULES = [
  { category: 'account_access',   keywords: ['login', 'password', '2fa'] },
  { category: 'technical_issue',  keywords: ['bug', 'error', 'crash'] },
  { category: 'billing_question', keywords: ['payment', 'invoice', 'refund'] },
  { category: 'feature_request',  keywords: ['enhancement', 'suggestion'] },
  { category: 'bug_report',       keywords: ['defect', 'reproduce', 'steps to reproduce'] },
];

function classify(ticket) {
  const text = `${ticket.subject} ${ticket.description}`.toLowerCase();

  // Priority
  let priority = 'medium';
  let priorityKeywordsFound = [];
  for (const rule of PRIORITY_RULES) {
    const found = rule.keywords.filter(kw => text.includes(kw));
    if (found.length > 0) {
      priority = rule.priority;
      priorityKeywordsFound = found;
      break;
    }
  }

  // Category
  let category = 'other';
  let categoryKeywordsFound = [];
  let bestCount = 0;
  for (const rule of CATEGORY_RULES) {
    const found = rule.keywords.filter(kw => text.includes(kw));
    if (found.length > bestCount) {
      bestCount = found.length;
      category = rule.category;
      categoryKeywordsFound = found;
    }
  }

  const allKeywords = [...priorityKeywordsFound, ...categoryKeywordsFound];
  const confidence = allKeywords.length > 0
    ? Math.min(0.5 + allKeywords.length * 0.15, 1.0)
    : 0.3;

  const reasoning = allKeywords.length > 0
    ? `Matched keywords: [${allKeywords.join(', ')}]. Assigned priority="${priority}", category="${category}".`
    : `No strong keywords found. Defaulted to priority="medium", category="other".`;

  const result = { category, priority, confidence: parseFloat(confidence.toFixed(2)), reasoning, keywords: allKeywords };
  logger.info(`[classifier] ticket=${ticket.id} ${reasoning}`);
  return result;
}

module.exports = { classify };
