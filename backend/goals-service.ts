/**
 * Standalone Goals service. Run: tsx goals-service.ts
 */
import goalRouter from './src/routes/goal.js';
import { createStandaloneService } from './src/lib/createStandaloneService.js';

createStandaloneService({
  name: 'Goals',
  context: 'goals',
  portEnvVar: 'GOALS_SERVICE_PORT',
  routers: [goalRouter],
});
