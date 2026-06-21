import express from 'express';
import { getNews, getNewsById, createNews, updateNews, deleteNews } from '../controllers/newsController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getNews)
    .post(protect, admin, createNews);

router.route('/:id')
    .get(getNewsById)
    .put(protect, admin, updateNews)
    .delete(protect, admin, deleteNews);

export default router;
