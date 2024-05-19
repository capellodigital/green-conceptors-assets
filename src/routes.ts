import HomeRoute from '@routes/index';
import GeneratorRoute from '@routes/generator';

/**
 * Routes for the application
 */
const routes = [
  {
    path: '/',
    func: HomeRoute,
  },

  {
    path: '/images',
    func: GeneratorRoute,
  },
];

export default routes;
