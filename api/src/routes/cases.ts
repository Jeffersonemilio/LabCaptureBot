import { Router } from 'express';
import { casesController } from '../controllers/casesController';
import { upload } from '../middleware/upload';

export const casesRouter = Router();

casesRouter.post('/open', casesController.openCase.bind(casesController));

casesRouter.post(
  '/:caseId/message',
  casesController.addMessage.bind(casesController)
);

casesRouter.post(
  '/:caseId/file',
  upload.single('file'),
  casesController.addFile.bind(casesController)
);

casesRouter.post(
  '/:caseId/close',
  casesController.closeCase.bind(casesController)
);

casesRouter.get('/active', casesController.getActiveCase.bind(casesController));
