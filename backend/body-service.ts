/**
 * Standalone Body service (workouts). Run: tsx body-service.ts
 */
import workoutRouter from './src/routes/workout.js';
import { createStandaloneService } from './src/lib/createStandaloneService.js';

createStandaloneService({
  name: 'Body',
  context: 'body',
  portEnvVar: 'BODY_SERVICE_PORT',
  routers: [workoutRouter],
});
