/**
 * Mount all API routers.
 */
import { Router } from 'express';
import scheduleRouter from './schedule.js';
import transactionRouter from './transaction.js';
import workoutRouter from './workout.js';
import foodEntryRouter from './foodEntry.js';
import dailyCheckInRouter from './dailyCheckIn.js';
import goalRouter from './goal.js';
import foodSearchRouter from './foodSearch.js';
import voiceRouter from './voice.js';

const router = Router();

router.use(scheduleRouter);
router.use(transactionRouter);
router.use(workoutRouter);
router.use(foodEntryRouter);
router.use(dailyCheckInRouter);
router.use(goalRouter);
router.use(foodSearchRouter);
router.use(voiceRouter);

export default router;
