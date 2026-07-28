/**
 * Smoke-test SMTP config without going through forgot-password flow.
 *
 * Usage:
 *   node scripts/test-smtp.js
 *   node scripts/test-smtp.js you@example.com
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import sendEmail from '../utils/sendEmail.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const to = process.argv[2] || process.env.SMTP_EMAIL;

if (!to) {
  console.error('Missing recipient. Pass email as argv or set SMTP_EMAIL.');
  process.exit(1);
}

console.log('SMTP config:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_EMAIL,
  from: process.env.FROM_EMAIL,
  to,
});

try {
  await sendEmail({
    email: to,
    subject: '[Aventis] SMTP test',
    message: 'Nếu bạn nhận được email này, cấu hình SMTP đang hoạt động.',
    html: '<p>Nếu bạn nhận được email này, cấu hình <strong>SMTP</strong> đang hoạt động.</p>',
  });
  console.log('Done.');
  process.exit(0);
} catch (err) {
  console.error('SMTP test failed.');
  process.exit(1);
}
