import dotenv from 'dotenv';
dotenv.config();

import connectDB from './configs/db.js';
import User from './models/User.js';
import sendEmail from './utils/sendEmail.js';

async function test() {
  await connectDB();
  const testEmail = 'jonhsmith911@vomoto.com';
  const user = await User.findOne({ email: testEmail });
  console.log('Query result for', testEmail, ':', user ? user.email : 'NOT FOUND IN DATABASE');

  const allUsers = await User.find({}).select('email name').limit(5);
  console.log('Sample existing users in DB:', allUsers);

  if (user) {
    try {
      console.log('Attempting sendEmail to', user.email);
      await sendEmail({
        email: user.email,
        subject: 'Test Local',
        message: 'Test message',
        html: '<p>Test message</p>'
      });
      console.log('sendEmail success!');
    } catch (err) {
      console.error('sendEmail failed:', err.message);
    }
  }

  process.exit(0);
}

test();
