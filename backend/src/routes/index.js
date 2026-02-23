/**
 * Mount all API routers (auth, users, schedule, transactions, etc.).
 */
import { Router } from 'express';
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
router.use(scheduleRouter);
router.use(transactionRouter);
router.use(workoutRouter);
router.use(foodEntryRouter);
router.use(dailyCheckInRouter);
router.use(goalRouter);
router.use(groupRouter);
router.use(foodSearchRouter);
router.use(voiceRouter);
router.use(jobsRouter);

export default router;
