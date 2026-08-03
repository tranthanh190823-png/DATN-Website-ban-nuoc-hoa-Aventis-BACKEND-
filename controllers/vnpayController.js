import { dateFormat, getDateInGMT7 } from 'vnpay';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import { notifyOrderPaid } from '../utils/sendOrderPaymentEmail.js';
import { getVnpayClient, ProductCode, RefundTransactionType } from '../utils/vnpayClient.js';

function parseOrderIdFromTxnRef(txnRef = '') {
    const idx = txnRef.indexOf('_');
    return idx > 0 ? txnRef.substring(0, idx) : txnRef;
}

function getClientIp(req) {
    let ipAddr =
        req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
        req.socket?.remoteAddress ||
        req.connection?.remoteAddress ||
        '127.0.0.1';

    if (ipAddr.includes('::ffff:')) {
        ipAddr = ipAddr.split('::ffff:')[1];
    } else if (ipAddr === '::1') {
        ipAddr = '127.0.0.1';
    }

    return ipAddr;
}

async function markOrderPaidFromVnpay(order, vnp_Params) {
    const wasAlreadyPaid = order.isPaid;
    // verifyReturnUrl/verifyIpnCall đã chuẩn hóa vnp_Amount về đơn vị VND
    const paidAmount = Math.round(Number(vnp_Params['vnp_Amount']));
    const expectedAmount = Math.round(order.totalPrice);

    if (paidAmount !== expectedAmount) {
        return {
            success: false,
            rspCode: '04',
            message: 'Invalid amount'
        };
    }

    order.isPaid = true;
    order.paidAt = Date.now();
    order.paymentMethod = 'VNPAY';
    order.vnpTxnRef = vnp_Params['vnp_TxnRef'];
    order.paymentResult = {
        id: vnp_Params['vnp_TransactionNo'],
        status: 'VNPAY_SUCCESS',
        update_time: String(vnp_Params['vnp_PayDate'] || ''),
        email_address: ''
    };
    await order.save();

    if (!wasAlreadyPaid) {
        notifyOrderPaid(order).catch((err) =>
            console.error('[Order Email] paid (vnpay) failed:', err.message)
        );
    }

    return {
        success: true,
        rspCode: '00',
        message: 'Confirm Success'
    };
}

// @desc    Tạo URL thanh toán VNPay
// @route   POST /api/orders/:id/create_payment_url
// @access  Private
export const createPaymentUrl = async (req, res) => {
    try {
        const orderId = req.params.id;
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền thanh toán đơn hàng này' });
        }

        if (order.isPaid) {
            return res.status(400).json({ message: 'Đơn hàng đã được thanh toán' });
        }

        const returnUrl = process.env.VNP_RETURN_URL?.trim();
        if (!returnUrl) {
            return res.status(500).json({ message: 'Chưa cấu hình VNP_RETURN_URL' });
        }

        const vnpay = getVnpayClient();
        const bankCode = req.body.bankCode;
        const now = getDateInGMT7();
        const expireAt = new Date(now.getTime() + 15 * 60 * 1000);

        // TxnRef unique mỗi lần thanh toán (VNPay không cho trùng trong ngày)
        const txnRef = `${orderId}_${Date.now()}`;

        const paymentUrl = vnpay.buildPaymentUrl({
            vnp_Amount: Math.round(order.totalPrice),
            vnp_IpAddr: getClientIp(req),
            vnp_TxnRef: txnRef,
            vnp_OrderInfo: `ThanhToanDonHang${String(orderId).slice(-8)}`,
            vnp_OrderType: ProductCode.Other,
            vnp_ReturnUrl: returnUrl,
            vnp_ExpireDate: dateFormat(expireAt, 'yyyyMMddHHmmss'),
            ...(bankCode ? { vnp_BankCode: bankCode } : {}),
        });

        res.status(200).json({ url: paymentUrl });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo url thanh toán VNPay', error: error.message });
    }
};

// @desc    Xử lý kết quả trả về từ VNPay (Return URL)
// @route   POST /api/orders/vnpay_return
// @access  Public
export const vnpayReturn = async (req, res) => {
    try {
        const vnpay = getVnpayClient();
        const verify = vnpay.verifyReturnUrl(req.body);

        if (!verify.isVerified) {
            return res.status(400).json({ message: 'Sai chữ ký bảo mật', code: '97' });
        }

        if (!verify.isSuccess) {
            const responseCode = String(verify.vnp_ResponseCode || '99');

            // 24 = khách hàng hủy giao dịch — chữ ký hợp lệ, không coi là lỗi hệ thống
            if (responseCode === '24') {
                return res.status(200).json({
                    message: 'Bạn đã hủy thanh toán',
                    code: responseCode
                });
            }

            return res.status(400).json({
                message: verify.message || 'Thanh toán VNPay thất bại',
                code: responseCode
            });
        }

        const orderId = parseOrderIdFromTxnRef(verify.vnp_TxnRef);
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng', code: '99' });
        }

        const result = await markOrderPaidFromVnpay(order, verify);
        if (!result.success) {
            return res.status(400).json({ message: result.message, code: result.rspCode });
        }

        res.status(200).json({
            message: 'Thanh toán thành công',
            code: '00',
            order: {
                _id: order._id,
                totalPrice: order.totalPrice,
                discountPrice: order.discountPrice || 0,
                orderItems: order.orderItems,
                shippingAddress: order.shippingAddress,
                isPaid: order.isPaid
            }
        });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xử lý VNPay', error: error.message });
    }
};

async function restoreOrderStock(order) {
    for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
            product.stock += item.qty;
            if (item.volume && product.volumes) {
                const volumeObj = product.volumes.find((v) => v.ml === item.volume);
                if (volumeObj) {
                    volumeObj.stock += item.qty;
                }
            }
            await product.save();
        }
    }
}

// User có thể xin hoàn tiền khi đã thanh toán & đơn đã được xử lý trở đi;
// sau khi nhận (Đã giao) dùng cho trả hàng / hoàn tiền.
const REFUNDABLE_STATUSES = ['Đã xử lý', 'Đang giao', 'Đã giao'];

function canRequestRefund(order) {
    if (order.isRefunded || order.isCancelled) return false;
    if (order.refundRequestStatus === 'pending') return false;
    // Đã giao: cho phép xin trả/hoàn (COD đã mark paid khi deliver)
    if (order.status === 'Đã giao' && (order.isPaid || order.isDelivered)) {
        return true;
    }
    if (!order.isPaid) return false;
    return REFUNDABLE_STATUSES.includes(order.status);
}

async function executeOrderRefund(order, { reason, shouldCancel, refundedBy, manualRefundData, req }) {
    // COD đã giao có thể xin trả/hoàn dù trước đó chưa gắn isPaid
    if (!order.isPaid && !(order.isDelivered && order.status === 'Đã giao')) {
        return { success: false, status: 400, message: 'Chỉ hoàn tiền được cho đơn đã thanh toán hoặc đã giao' };
    }
    if (order.isRefunded) {
        return { success: false, status: 400, message: 'Đơn hàng này đã được hoàn tiền' };
    }
    if (!order.isPaid && order.isDelivered) {
        order.isPaid = true;
        order.paidAt = order.paidAt || order.deliveredAt || Date.now();
    }

    const refundReason = reason?.trim() || 'Hoàn tiền theo yêu cầu';
    const refundAmount = Math.round(order.totalPrice);
    const isVnpayPayment = String(order.paymentMethod || '').toUpperCase() === 'VNPAY';

    if (isVnpayPayment) {
        if (!order.vnpTxnRef || !order.paymentResult?.update_time) {
            return {
                success: false,
                status: 400,
                message: 'Thiếu mã giao dịch VNPay. Không thể hoàn tiền tự động cho đơn này.',
            };
        }

        const vnpay = getVnpayClient();
        const now = getDateInGMT7();
        const requestId = `${dateFormat(now, 'HHmmss')}${String(Date.now()).slice(-6)}`;

        const refundResponse = await vnpay.refund({
            vnp_RequestId: requestId,
            vnp_TxnRef: order.vnpTxnRef,
            vnp_TransactionDate: Number(order.paymentResult.update_time),
            vnp_Amount: refundAmount,
            vnp_TransactionType: RefundTransactionType.FULL_REFUND,
            vnp_CreateBy: refundedBy || 'admin',
            vnp_CreateDate: Number(dateFormat(now, 'yyyyMMddHHmmss')),
            vnp_IpAddr: getClientIp(req),
            vnp_OrderInfo: `HoanTienDonHang${String(order._id).slice(-8)}`,
            vnp_TransactionNo: order.paymentResult.id || '0',
        });

        if (!refundResponse.isVerified || String(refundResponse.vnp_ResponseCode) !== '00') {
            return {
                success: false,
                status: 400,
                message: refundResponse.vnp_Message || 'VNPay từ chối yêu cầu hoàn tiền',
                code: String(refundResponse.vnp_ResponseCode || '99'),
            };
        }

        order.refundResult = {
            id: refundResponse.vnp_ResponseId || refundResponse.vnp_TransactionNo,
            status: 'VNPAY_REFUND_SUCCESS',
            responseCode: String(refundResponse.vnp_ResponseCode),
            message: refundResponse.vnp_Message || 'Hoàn tiền thành công',
            refundedBy,
        };
    } else {
        order.refundResult = {
            id: `MANUAL_${Date.now()}`,
            status: 'MANUAL_REFUND',
            responseCode: '00',
            message: 'Hoàn tiền thủ công (không qua VNPay)',
            refundedBy,
        };
    }

    order.isRefunded = true;
    order.refundedAt = Date.now();
    order.refundAmount = refundAmount;
    order.refundReason = refundReason;
    order.refundRequestStatus = 'approved';
    order.refundRequestNote = '';

    if (shouldCancel && !order.isCancelled) {
        order.status = 'Đã hủy';
        order.isCancelled = true;
        order.cancelledAt = Date.now();
        order.cancelReason = order.cancelReason || refundReason;
        await restoreOrderStock(order);
    }

    if (manualRefundData) {
        if (manualRefundData.refundBankAccount) order.refundBankAccount = manualRefundData.refundBankAccount;
        if (manualRefundData.refundBankName) order.refundBankName = manualRefundData.refundBankName;
        if (manualRefundData.refundBankBank) order.refundBankBank = manualRefundData.refundBankBank;
        if (manualRefundData.refundTransferImage) order.refundTransferImage = manualRefundData.refundTransferImage;
    }

    await order.save();
    return { success: true, order };
}

// @desc    Khách hàng gửi yêu cầu hoàn tiền
// @route   PUT /api/orders/:id/request-refund
// @access  Private
export const requestRefund = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        if (order.user.toString() !== req.user._id.toString()) {
            return res.status(403).json({ message: 'Bạn không có quyền yêu cầu hoàn tiền đơn này' });
        }

        if (!canRequestRefund(order)) {
            if (order.refundRequestStatus === 'pending') {
                return res.status(400).json({ message: 'Yêu cầu hoàn tiền đang được xử lý' });
            }
            return res.status(400).json({
                message: 'Đơn hàng không đủ điều kiện yêu cầu hoàn/trả hàng (cần đã thanh toán hoặc đã giao, chưa hủy/hoàn, trạng thái Đã xử lý trở đi)',
            });
        }

        const reason = req.body?.reason?.trim();
        if (!reason || reason.length < 10) {
            return res.status(400).json({ message: 'Vui lòng nhập lý do hoàn tiền (ít nhất 10 ký tự)' });
        }

        order.refundRequestStatus = 'pending';
        order.refundRequestReason = reason;
        order.refundRequestedAt = Date.now();
        order.refundRequestNote = '';

        const updatedOrder = await order.save();
        const isReturn = order.status === 'Đã giao';
        res.json({
            message: isReturn
                ? 'Đã gửi yêu cầu trả hàng/hoàn tiền. Shop sẽ xem xét trong 1-3 ngày làm việc.'
                : 'Đã gửi yêu cầu hoàn tiền. Shop sẽ xem xét trong 1-3 ngày làm việc.',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('[Request Refund Error]:', error.message);
        res.status(500).json({ message: 'Lỗi khi gửi yêu cầu hoàn/trả hàng', error: error.message });
    }
};

// @desc    Admin duyệt yêu cầu hoàn tiền
// @route   PUT /api/orders/:id/refund-request/approve
// @access  Private/Admin
export const approveRefundRequest = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        if (order.refundRequestStatus !== 'pending') {
            return res.status(400).json({ message: 'Đơn hàng không có yêu cầu hoàn tiền đang chờ duyệt' });
        }

        const shouldCancel = req.body?.cancelOrder !== false;
        const result = await executeOrderRefund(order, {
            reason: order.refundRequestReason,
            shouldCancel,
            refundedBy: req.user.name || req.user.email,
            manualRefundData: req.body,
            req,
        });

        if (!result.success) {
            return res.status(result.status || 400).json({
                message: result.message,
                code: result.code,
            });
        }

        res.json({
            message: 'Đã duyệt và hoàn tiền thành công',
            order: result.order,
        });
    } catch (error) {
        console.error('[Approve Refund Error]:', error.message);
        res.status(500).json({ message: 'Lỗi khi duyệt hoàn tiền', error: error.message });
    }
};

// @desc    Admin từ chối yêu cầu hoàn tiền
// @route   PUT /api/orders/:id/refund-request/reject
// @access  Private/Admin
export const rejectRefundRequest = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        if (order.refundRequestStatus !== 'pending') {
            return res.status(400).json({ message: 'Đơn hàng không có yêu cầu hoàn tiền đang chờ duyệt' });
        }

        const note = req.body?.note?.trim() || 'Yêu cầu hoàn tiền không đủ điều kiện';
        order.refundRequestStatus = 'rejected';
        order.refundRequestNote = note;

        const updatedOrder = await order.save();
        res.json({
            message: 'Đã từ chối yêu cầu hoàn tiền',
            order: updatedOrder,
        });
    } catch (error) {
        console.error('[Reject Refund Error]:', error.message);
        res.status(500).json({ message: 'Lỗi khi từ chối hoàn tiền', error: error.message });
    }
};

// @desc    Hoàn tiền đơn hàng (Admin)
// @route   PUT /api/orders/:id/refund
// @access  Private/Admin
export const refundOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }

        const { reason, cancelOrder: shouldCancel, refundBankAccount, refundBankName, refundBankBank, refundTransferImage } = req.body || {};
        const result = await executeOrderRefund(order, {
            reason,
            shouldCancel,
            refundedBy: req.user.name || req.user.email,
            manualRefundData: { refundBankAccount, refundBankName, refundBankBank, refundTransferImage },
            req,
        });

        if (!result.success) {
            return res.status(result.status || 400).json({
                message: result.message,
                code: result.code,
            });
        }

        res.json({
            message: 'Hoàn tiền thành công',
            order: result.order,
        });
    } catch (error) {
        console.error('[Refund Error]:', error.message);
        res.status(500).json({ message: 'Lỗi khi hoàn tiền', error: error.message });
    }
};

// @desc    Xử lý IPN từ VNPay (server-to-server)
// @route   GET /api/orders/vnpay_ipn
// @access  Public
export const vnpayIpn = async (req, res) => {
    try {
        const vnpay = getVnpayClient();
        const verify = vnpay.verifyIpnCall(req.query);

        if (!verify.isVerified) {
            return res.status(200).send('RspCode=97&Message=Invalid Checksum');
        }

        if (!verify.isSuccess) {
            return res.status(200).send('RspCode=00&Message=Confirm Success');
        }

        const orderId = parseOrderIdFromTxnRef(verify.vnp_TxnRef);
        const order = await Order.findById(orderId);
        if (!order) {
            return res.status(200).send('RspCode=01&Message=Order not found');
        }

        const result = await markOrderPaidFromVnpay(order, verify);
        return res.status(200).send(`RspCode=${result.rspCode}&Message=${result.message}`);
    } catch (error) {
        console.error('[VNPay IPN Error]:', error.message);
        return res.status(200).send('RspCode=99&Message=Unknown error');
    }
};