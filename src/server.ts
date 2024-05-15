import app from '@/app';
import { PORT } from '@config';
import routes from './routes';
import express from 'express';
import { fallback } from '@/controllers';
import validateEnv from '@/utils/validateEnv';
import { logger, rainbow } from '@/utils/logger';
/**
 * Validate Environment Variables
 */
validateEnv();
/**
 * Connect to MongoDB
 */
// connect();

const version = '/api/v1';
routes.forEach((route) => {
  const path = version + route.path;
  // console.log(path);
  app.use(path, route.func);
});
/**
 * Static Files
 */
app.use(`${version}/static`, express.static('public'));
/**
 * Fallback Route
 */
app.all('*', fallback);

// LISTEN PORT
app.listen(PORT, () => {
  // rainbow('·•· ·•· ·•· ·•· ·•· ·•· ·•· ·•· ·•·');
  logger('success', '✴︎')(`App is running on http://localhost:${PORT}`);
  // rainbow('·•· ·•· ·•· ·•· ·•· ·•· ·•· ·•· ·•·');
});
