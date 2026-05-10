const fs = require('fs');
const path = require('path');

const dest = path.join(__dirname, '../tests/fixtures');
fs.mkdirSync(dest, { recursive: true });

const categories = ['account_access','technical_issue','billing_question','feature_request','bug_report','other'];
const priorities = ['urgent','high','medium','low'];
const statuses = ['new','in_progress','waiting_customer','resolved','closed'];
const sources = ['web_form','email','api','chat','phone'];
const devices = ['desktop','mobile','tablet'];

const subjects = [
  'Cannot login to my account',
  'Critical production down issue',
  'Invoice not received this month',
  'Feature request for dark mode',
  'Bug causes crash on startup',
  'Password reset not working',
  'Blocking payment failed today',
  'Minor cosmetic issue found',
  'Two-FA not sending code at all',
  'Refund request needed urgently',
  'Enhancement for the dashboard',
  'Steps to reproduce the crash',
  'ASAP billing error appearing',
  'Security concern was reported',
  'Important data seems missing',
  'Error on the checkout page',
  'Login fails after the update',
  'Suggestion to add export feature',
  'Defect in report generation',
  'Account is locked out completely',
];

const descriptions = [
  'I have been unable to login for the past 2 hours and need urgent help resolving this.',
  'Our production environment is completely down and affecting all users right now.',
  'I did not receive my invoice for the last billing cycle, please check and resend.',
  'It would be great to have a dark mode option in the settings panel for comfort.',
  'The application crashes immediately on startup after the latest update was applied.',
  'Password reset emails are not arriving despite multiple attempts over the last day.',
  'Payment is blocking our entire workflow and needs to be fixed as soon as possible.',
  'There is a minor visual alignment issue on the settings configuration page only.',
  'Two-factor authentication codes are not being delivered to my phone number.',
  'I would like to request a refund for my last month subscription payment made.',
  'An enhancement to the dashboard would significantly improve the user experience.',
  'Here are the steps to reproduce the crash: open app, click menu, then it crashes.',
  'Billing shows the wrong amount and I need this corrected asap to avoid payment delay.',
  'There is a potential security vulnerability in the login page that was discovered.',
  'Some important data is completely missing from the exported report file we downloaded.',
  'Getting error 500 on the checkout page every time when trying to complete an order.',
  'Login completely stopped working after the latest update was applied to the system.',
  'Suggestion to add CSV export functionality to the reporting module for all users.',
  'Found a defect in the report generation module that needs to be fixed immediately.',
  'My account has been locked out and I cannot access any features of the application.',
];

function makeTicket(i) {
  return {
    customer_id: `cust-${1000 + i}`,
    customer_email: `user${i}@example.com`,
    customer_name: `Customer ${i}`,
    subject: subjects[i % subjects.length],
    description: descriptions[i % descriptions.length],
    category: categories[i % categories.length],
    priority: priorities[i % priorities.length],
    status: statuses[i % statuses.length],
    assigned_to: i % 3 !== 0 ? `agent-${i % 5 + 1}` : null,
    tags: [`tag-${i % 4}`, `tag-${i % 3}`],
    metadata: {
      source: sources[i % sources.length],
      browser: 'Chrome',
      device_type: devices[i % devices.length],
    },
  };
}

// CSV - 50 tickets
function csvField(value) {
  const str = value === null || value === undefined ? '' : String(value);
  const escaped = str.replace(/"/g, '""');
  return `"${escaped}"`;
}

const tickets50 = Array.from({ length: 50 }, (_, i) => makeTicket(i));
const csvHeader = 'customer_id,customer_email,customer_name,subject,description,category,priority,status,assigned_to,tags,metadata';
const csvRows = tickets50.map(t => {
  const fields = [
    csvField(t.customer_id), csvField(t.customer_email), csvField(t.customer_name),
    csvField(t.subject), csvField(t.description),
    csvField(t.category), csvField(t.priority), csvField(t.status),
    csvField(t.assigned_to),
    csvField(JSON.stringify(t.tags)),
    csvField(JSON.stringify(t.metadata)),
  ];
  return fields.join(',');
});
fs.writeFileSync(path.join(dest, 'sample_tickets.csv'), [csvHeader, ...csvRows].join('\n'));

// JSON - 20 tickets
const tickets20 = Array.from({ length: 20 }, (_, i) => makeTicket(i));
fs.writeFileSync(path.join(dest, 'sample_tickets.json'), JSON.stringify(tickets20, null, 2));

// XML - 30 tickets
const tickets30 = Array.from({ length: 30 }, (_, i) => makeTicket(i));
const xmlTickets = tickets30.map(t => {
  const tagsXml = t.tags.map(tag => `<tag>${tag}</tag>`).join('');
  const assigned = t.assigned_to ? `<assigned_to>${t.assigned_to}</assigned_to>` : '<assigned_to/>';
  return `  <ticket>
    <customer_id>${t.customer_id}</customer_id>
    <customer_email>${t.customer_email}</customer_email>
    <customer_name>${t.customer_name}</customer_name>
    <subject>${t.subject}</subject>
    <description>${t.description}</description>
    <category>${t.category}</category>
    <priority>${t.priority}</priority>
    <status>${t.status}</status>
    ${assigned}
    <tags>${tagsXml}</tags>
    <metadata>
      <source>${t.metadata.source}</source>
      <browser>${t.metadata.browser}</browser>
      <device_type>${t.metadata.device_type}</device_type>
    </metadata>
  </ticket>`;
}).join('\n');
const xmlContent = `<?xml version="1.0" encoding="UTF-8"?>\n<tickets>\n${xmlTickets}\n</tickets>`;
fs.writeFileSync(path.join(dest, 'sample_tickets.xml'), xmlContent);

// Invalid files for negative tests
fs.writeFileSync(path.join(dest, 'invalid_tickets.csv'), 'not,a,valid\n"unclosed quote\n');
fs.writeFileSync(path.join(dest, 'invalid_tickets.json'), '{ this is not valid json }');
fs.writeFileSync(path.join(dest, 'invalid_tickets.xml'), '<tickets><ticket><unclosed></tickets>');

console.log('All fixtures generated successfully.');
