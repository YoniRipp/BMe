/**
 * Mount all API routers (auth, users, schedule, transactions, etc.).
 * When MONEY_SERVICE_URL is set, transaction routes are not mounted here (main app proxies to Money service).
 */
import { Router } from 'express';
import { config } from '../config/index.js';
import authRouter from './auth.js';
import usersRouter from './users.js';
import scheduleRouter from './schedule.js';
import transactionRouter from './transaction.js';
import workoutRouter from './workout.js';
import foodEntryRouter from './foodEntry.js';
import dailyCheckInRouter from './dailyCheckIn.js';
import goalRouter from './goal.js';
import groupRouter from './group.js';
import foodSearchRouter from './foodSearch.js';
import voiceRouter from './voice.js';
import jobsRouter from './jobs.js';
import adminRouter from './admin.js';

const router = Router();

router.use(authRouter);
router.use(adminRouter);
router.use(usersRouter);
if (!config.scheduleServiceUrl) router.use(scheduleRouter);
if (!config.moneyServiceUrl) router.use(transactionRouter);
if (!config.bodyServiceUrl) router.use(workoutRouter);
if (!config.energyServiceUrl) {
  router.use(foodEntryRouter);
  router.use(dailyCheckInRouter);
}
if (!config.goalsServiceUrl) router.use(goalRouter);
router.use(groupRouter);
router.use(foodSearchRouter);
router.use(voiceRouter);
router.use(jobsRouter);

export default router;
