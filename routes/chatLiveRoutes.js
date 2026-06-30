import express from 'express';
import { getConversations, getMessages } from '../controllers/chatLiveController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

// Temporarily bypass auth for testing, or use protect/admin if frontend sends token properly
router.route('/conversations').get(getConversations);
router.route('/messages/:participantId').get(getMessages);

export default router;
