import { config } from 'dotenv';
const dev = process.env.NODE_ENV !== 'production';
config({ path: `.env.${dev ? 'development' : process.env.NODE_ENV}` });

export const CREDENTIALS = process.env.CREDENTIALS === 'true';
export const {
  NODE_ENV,
  PORT,
  SECRET_KEY,
  ORIGIN,
  MONGODB_URI,
  DB_NAME,
  JWT_SECRET,
  JWT_EXPIRY,
  BACKEND_URL,
  APP_NAME,
  IMAGE_BUCKET_NAME,
  NODEMAILER_SENDER_MAIL,
  NODEMAILER_PASSWORD,
} = process.env;
