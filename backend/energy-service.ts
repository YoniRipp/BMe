/**
 * Standalone Energy service (food entries, daily check-ins). Run: tsx energy-service.ts
 */
import foodEntryRouter from './src/routes/foodEntry.js';
import dailyCheckInRouter from './src/routes/dailyCheckIn.js';
import { createStandaloneService } from './src/lib/createStandaloneService.js';

createStandaloneService({
  name: 'Energy',
  context: 'energy',
  portEnvVar: 'ENERGY_SERVICE_PORT',
  routers: [foodEntryRouter, dailyCheckInRouter],
});
