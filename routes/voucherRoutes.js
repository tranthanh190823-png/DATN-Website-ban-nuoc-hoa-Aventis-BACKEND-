import express from 'express';
import {
    checkVoucher,
    createVoucher,
    getVouchers,
    deleteVoucher,
    updateVoucher
} from '../controllers/voucherController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .get(protect, admin, getVouchers)
    .post(protect, admin, createVoucher);

router.post('/check', protect, checkVoucher);

router.route('/:id')
    .put(protect, admin, updateVoucher)
    .delete(protect, admin, deleteVoucher);

export default router;
