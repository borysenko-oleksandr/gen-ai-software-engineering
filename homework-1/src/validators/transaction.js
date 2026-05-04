const VALID_CURRENCIES = new Set([
  'AED', 'AFN', 'ALL', 'AMD', 'ANG', 'AOA', 'ARS', 'AUD', 'AWG', 'AZN',
  'BAM', 'BBD', 'BDT', 'BGN', 'BHD', 'BMD', 'BND', 'BOB', 'BRL', 'BSD',
  'BTN', 'BWP', 'BYN', 'BZD', 'CAD', 'CDF', 'CHF', 'CLP', 'CNY', 'COP',
  'CRC', 'CUP', 'CVE', 'CZK', 'DJF', 'DKK', 'DOP', 'DZD', 'EGP', 'ERN',
  'ETB', 'EUR', 'FJD', 'FKP', 'GBP', 'GEL', 'GHS', 'GIP', 'GMD', 'GNF',
  'GTQ', 'GYD', 'HKD', 'HNL', 'HRK', 'HTG', 'HUF', 'IDR', 'ILS', 'INR',
  'IQD', 'IRR', 'ISK', 'JMD', 'JOD', 'JPY', 'KES', 'KGS', 'KHR', 'KMF',
  'KPW', 'KRW', 'KWD', 'KYD', 'KZT', 'LAK', 'LBP', 'LKR', 'LRD', 'LSL',
  'LYD', 'MAD', 'MDL', 'MGA', 'MKD', 'MMK', 'MNT', 'MOP', 'MRU', 'MUR',
  'MVR', 'MWK', 'MXN', 'MYR', 'MZN', 'NAD', 'NGN', 'NIO', 'NOK', 'NPR',
  'NZD', 'OMR', 'PAB', 'PEN', 'PGK', 'PHP', 'PKR', 'PLN', 'PYG', 'QAR',
  'RON', 'RSD', 'RUB', 'RWF', 'SAR', 'SBD', 'SCR', 'SDG', 'SEK', 'SGD',
  'SHP', 'SLL', 'SOS', 'SRD', 'STN', 'SVC', 'SYP', 'SZL', 'THB', 'TJS',
  'TMT', 'TND', 'TOP', 'TRY', 'TTD', 'TWD', 'TZS', 'UAH', 'UGX', 'USD',
  'UYU', 'UZS', 'VES', 'VND', 'VUV', 'WST', 'XAF', 'XCD', 'XOF', 'XPF',
  'YER', 'ZAR', 'ZMW', 'ZWL',
]);

const VALID_TYPES = ['deposit', 'withdrawal', 'transfer'];
const ACCOUNT_REGEX = /^ACC-[A-Za-z0-9]{5}$/;

function validateAmount(amount, errors) {
  if (amount === undefined || amount === null) {
    errors.push({ field: 'amount', message: 'Amount is required' });
    return;
  }
  if (typeof amount !== 'number' || isNaN(amount) || amount <= 0) {
    errors.push({ field: 'amount', message: 'Amount must be a positive number' });
    return;
  }
  if (Math.round(amount * 100) / 100 !== amount) {
    errors.push({ field: 'amount', message: 'Amount must have at most 2 decimal places' });
  }
}

function validateAccount(value, field, errors) {
  if (!value) {
    errors.push({ field, message: `${field} is required` });
  } else if (!ACCOUNT_REGEX.test(value)) {
    errors.push({ field, message: 'Account must follow format ACC-XXXXX (5 alphanumeric chars)' });
  }
}

function validateTransaction(data) {
  const errors = [];

  if (!data.type || !VALID_TYPES.includes(data.type)) {
    errors.push({ field: 'type', message: `Type must be one of: ${VALID_TYPES.join(', ')}` });
  }

  validateAmount(data.amount, errors);

  if (!data.currency) {
    errors.push({ field: 'currency', message: 'Currency is required' });
  } else if (!VALID_CURRENCIES.has(data.currency.toUpperCase())) {
    errors.push({ field: 'currency', message: 'Invalid ISO 4217 currency code' });
  }

  const type = data.type;
  if (type === 'deposit') {
    validateAccount(data.toAccount, 'toAccount', errors);
  } else if (type === 'withdrawal') {
    validateAccount(data.fromAccount, 'fromAccount', errors);
  } else if (type === 'transfer') {
    validateAccount(data.fromAccount, 'fromAccount', errors);
    validateAccount(data.toAccount, 'toAccount', errors);
    if (
      data.fromAccount &&
      data.toAccount &&
      ACCOUNT_REGEX.test(data.fromAccount) &&
      ACCOUNT_REGEX.test(data.toAccount) &&
      data.fromAccount === data.toAccount
    ) {
      errors.push({ field: 'toAccount', message: 'fromAccount and toAccount must be different' });
    }
  }

  return errors;
}

module.exports = { validateTransaction };
