import express from 'express';
import { getFlashSales, createFlashSale, updateFlashSale, deleteFlashSale } from '../controllers/flashSaleController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(getFlashSales)
    .post(protect, admin, createFlashSale);

router.route('/:id')
    .put(protect, admin, updateFlashSale)
    .delete(protect, admin, deleteFlashSale);

export default router;
