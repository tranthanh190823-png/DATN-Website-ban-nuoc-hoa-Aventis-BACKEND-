import moment from 'moment';
import crypto from 'crypto';
import qs from 'qs';
import Order from '../models/Order.js';

function sortObject(obj) {
    let sorted = {};
    let str = [];
    let key;
    for (key in obj) {
        if (obj.hasOwnProperty(key)) {
            str.push(encodeURIComponent(key));
        }
    }
    str.sort();
    for (key = 0; key < str.length; key++) {
        sorted[str[key]] = encodeURIComponent(obj[str[key]]).replace(/%20/g, "+");
    }
    return sorted;
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

        const ipAddr = req.headers['x-forwarded-for'] || 
                       req.connection.remoteAddress || 
                       req.socket.remoteAddress || 
                       req.connection.socket.remoteAddress || '127.0.0.1';

        const tmnCode = process.env.VNP_TMN_CODE;
        const secretKey = process.env.VNP_HASH_SECRET;
        let vnpUrl = process.env.VNP_URL;
        const returnUrl = process.env.VNP_RETURN_URL;

        const date = new Date();
        const createDate = moment(date).format('YYYYMMDDHHmmss');
        const expireDate = moment(date).add(15, 'minutes').format('YYYYMMDDHHmmss');

        // Số tiền thanh toán (VNPay yêu cầu nhân 100)
        const amount = order.totalPrice * 100;
        const bankCode = req.body.bankCode || '';

        let vnp_Params = {};
        vnp_Params['vnp_Version'] = '2.1.0';
        vnp_Params['vnp_Command'] = 'pay';
        vnp_Params['vnp_TmnCode'] = tmnCode;
        vnp_Params['vnp_Locale'] = 'vn';
        vnp_Params['vnp_CurrCode'] = 'VND';
        vnp_Params['vnp_TxnRef'] = orderId;
        vnp_Params['vnp_OrderInfo'] = 'Thanh toan cho ma GD:' + orderId;
        vnp_Params['vnp_OrderType'] = 'other';
        vnp_Params['vnp_Amount'] = amount;
        vnp_Params['vnp_ReturnUrl'] = returnUrl;
        vnp_Params['vnp_IpAddr'] = ipAddr;
        vnp_Params['vnp_CreateDate'] = createDate;
        vnp_Params['vnp_ExpireDate'] = expireDate;
        if(bankCode) {
            vnp_Params['vnp_BankCode'] = bankCode;
        }

        vnp_Params = sortObject(vnp_Params);

        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");
        vnp_Params['vnp_SecureHash'] = signed;
        
        vnpUrl += '?' + qs.stringify(vnp_Params, { encode: false });

        res.status(200).json({ url: vnpUrl });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi khi tạo url thanh toán VNPay', error: error.message });
    }
};

// @desc    Xử lý kết quả trả về từ VNPay
// @route   POST /api/orders/vnpay_return
// @access  Public
export const vnpayReturn = async (req, res) => {
    try {
        let vnp_Params = req.body; // Thường Frontend sẽ chuyển tiếp kết quả này từ query parameters

        const secureHash = vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHash'];
        delete vnp_Params['vnp_SecureHashType'];

        vnp_Params = sortObject(vnp_Params);
        const secretKey = process.env.VNP_HASH_SECRET;

        const signData = qs.stringify(vnp_Params, { encode: false });
        const hmac = crypto.createHmac("sha512", secretKey);
        const signed = hmac.update(Buffer.from(signData, 'utf-8')).digest("hex");

        if (secureHash === signed) {
            const orderId = vnp_Params['vnp_TxnRef'];
            const responseCode = vnp_Params['vnp_ResponseCode'];
            
            if (responseCode === '00') {
                const order = await Order.findById(orderId);
                if (order) {
                    order.isPaid = true;
                    order.paidAt = Date.now();
                    order.paymentResult = {
                        id: vnp_Params['vnp_TransactionNo'],
                        status: 'VNPAY_SUCCESS',
                        update_time: vnp_Params['vnp_PayDate'],
                        email_address: '' // VNPay không có email
                    };
                    await order.save();
                    res.status(200).json({ message: 'Thanh toán thành công', code: '00' });
                } else {
                    res.status(404).json({ message: 'Không tìm thấy đơn hàng', code: '99' });
                }
            } else {
                res.status(400).json({ message: 'Thanh toán VNPay thất bại', code: responseCode });
            }
        } else {
            res.status(400).json({ message: 'Sai chữ ký bảo mật', code: '97' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi xử lý VNPay', error: error.message });
    }
};
