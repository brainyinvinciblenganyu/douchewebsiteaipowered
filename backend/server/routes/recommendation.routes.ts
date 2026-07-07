import { Router } from 'express';
import { handleGetRecommendations, handleTrack } from '../controllers/recommendation.controller.js';

const router = Router();

router.post('/track', handleTrack);
router.get('/', handleGetRecommendations);

export default router;
