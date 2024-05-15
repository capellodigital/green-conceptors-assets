import nodemailer from 'nodemailer';
import { NODEMAILER_PASSWORD, NODEMAILER_SENDER_MAIL } from '@/config';
const gmail = {
  user: NODEMAILER_SENDER_MAIL,
  pass: NODEMAILER_PASSWORD,
};

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmail.user,
    pass: gmail.pass,
  },
  tls: {
    rejectUnauthorized: false,
  },
  debug: true,
});

export default transporter;
