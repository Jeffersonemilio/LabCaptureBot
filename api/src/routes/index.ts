import { Router } from 'express';
import { casesRouter } from './cases';
import { healthRouter } from './health';

export const router = Router();

router.use('/cases', casesRouter);
router.use('/health', healthRouter);
