import express from 'express';
import {
    getBanners,
    getActiveBanners,
    createBanner,
    updateBanner,
    deleteBanner,
} from '../controllers/bannerController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getBanners)
    .post(protect, admin, createBanner);

router.route('/active').get(getActiveBanners);

router.route('/:id')
    .put(protect, admin, updateBanner)
    .delete(protect, admin, deleteBanner);

export default router;
