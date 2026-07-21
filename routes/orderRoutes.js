import express from 'express';
import {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToProcessed,
    updateOrderToShipping,
    updateOrderToDelivered,
    getMyOrders,
    getOrders,
    cancelOrder
} from '../controllers/orderController.js';
import { sepayWebhook } from '../controllers/sepayController.js';
import {
    createPaymentUrl,
    vnpayReturn,
    vnpayIpn,
    refundOrder,
    requestRefund,
    approveRefundRequest,
    rejectRefundRequest,
} from '../controllers/vnpayController.js';
import { protect, admin } from '../middlewares/authMiddleware.js';

const router = express.Router();

router.route('/')
    .post(protect, addOrderItems)
    .get(protect, admin, getOrders);

router.route('/mine').get(protect, getMyOrders);

// Payment webhooks (Public routes)
router.post('/sepay/webhook', sepayWebhook);
router.post('/vnpay_return', vnpayReturn);
router.get('/vnpay_ipn', vnpayIpn);

router.post('/:id/create_payment_url', protect, createPaymentUrl);
router.put('/:id/request-refund', protect, requestRefund);
router.put('/:id/refund-request/approve', protect, admin, approveRefundRequest);
router.put('/:id/refund-request/reject', protect, admin, rejectRefundRequest);
router.put('/:id/refund', protect, admin, refundOrder);
router.route('/:id').get(protect, getOrderById);
router.route('/:id/pay').put(protect, updateOrderToPaid);
router.route('/:id/process').put(protect, admin, updateOrderToProcessed);
router.route('/:id/ship').put(protect, admin, updateOrderToShipping);
router.route('/:id/deliver').put(protect, admin, updateOrderToDelivered);
router.route('/:id/cancel').put(protect, cancelOrder);

export default router;
