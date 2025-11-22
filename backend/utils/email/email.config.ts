import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

// Create a transporter using your email provider's configuration
const transporter = nodemailer.createTransport({
  service: process.env.EMAIL_SERVICE || 'gmail', // default to gmail but can be changed in .env
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

// Define email sender details
export const sender = {
  email: process.env.EMAIL_USER || 'hello@fastbites.com',
  name: 'FAST-BITES',
};

// Test the connection
transporter.verify((error: Error | null, success: boolean) => {
  if (error) {
    console.log('Error connecting to email server:', error);
  } else {
  }
});

export default transporter; 