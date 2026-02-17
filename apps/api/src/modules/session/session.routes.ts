import { Router } from 'express';
import { scanLimiter } from '../../middleware/rate-limiter';
import * as sessionController from './session.controller';

export const sessionRouter = Router();

sessionRouter.get('/:qrToken', scanLimiter, sessionController.scanQr);
