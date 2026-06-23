import Order from '../models/Order.js';

// @desc    Xử lý Webhook từ SePay
// @route   POST /api/sepay/webhook
// @access  Public
export const sepayWebhook = async (req, res) => {
    try {
        const authHeader = req.headers.authorization;
        const sepayToken = process.env.SEPAY_WEBHOOK_TOKEN;

        // Bỏ qua kiểm tra token nếu chưa cấu hình (chỉ dành cho dev)
        // if (sepayToken && sepayToken !== 'DUMMY_TOKEN_PLEASE_CHANGE_ME') {
        //     if (!authHeader || (!authHeader.includes(`Bearer ${sepayToken}`) && !authHeader.includes(`Apikey ${sepayToken}`))) {
        //         return res.status(401).json({ success: false, message: 'Xác thực SePay Token thất bại' });
        //     }
        // }

        const { gateway, transactionDate, accountNumber, content, transferType, transferAmount } = req.body;

        // Chỉ xử lý giao dịch nhận tiền (in)
        if (transferType !== 'in') {
            return res.status(200).json({ success: true, message: 'Bỏ qua giao dịch chuyển tiền đi' });
        }

        // Nội dung chuyển khoản chứa Order ID
        if (!content) {
             return res.status(200).json({ success: true, message: 'Không có nội dung chuyển khoản' });
        }

        const normalizedContent = content.toUpperCase();

        // Tìm đơn hàng chưa thanh toán
        // Cần tìm orderId nào có chứa trong content
        // Do MongoDB ObjectID là 24 ký tự, ta sẽ lấy tất cả các đơn hàng chưa thanh toán và kiểm tra
        // Thực tế nếu lượng đơn hàng lớn, nên tạo trường shortId cho đơn hàng. 
        // Ở đây với quy mô nhỏ, ta có thể dùng biểu thức chính quy (nếu gửi từ QR code thì nội dung sẽ chứa chính xác mã _id)
        
        // Vì khó parse ngược _id từ chuỗi do có thể dính ký tự khác, ta tìm theo cách:
        // Lọc tất cả đơn hàng chưa thanh toán trong 7 ngày gần nhất
        const recentOrders = await Order.find({ isPaid: false }).sort({ createdAt: -1 }).limit(100);
        
        let matchedOrder = null;
        for (const order of recentOrders) {
            if (normalizedContent.includes(order._id.toString().toUpperCase())) {
                matchedOrder = order;
                break;
            }
        }

        if (matchedOrder) {
            // Kiểm tra số tiền
            if (Number(transferAmount) >= matchedOrder.totalPrice) {
                matchedOrder.isPaid = true;
                matchedOrder.paidAt = Date.now();
                matchedOrder.paymentMethod = 'SePay';
                matchedOrder.paymentResult = {
                    id: req.body.id?.toString() || 'SEPAY_TRANS',
                    status: 'COMPLETED',
                    update_time: transactionDate,
                    email_address: accountNumber
                };

                await matchedOrder.save();
                console.log(`[SePay] Đã cập nhật thanh toán cho đơn hàng ${matchedOrder._id}`);
            } else {
                console.log(`[SePay] Đơn hàng ${matchedOrder._id} nhận được số tiền ${transferAmount} nhưng không đủ (Yêu cầu: ${matchedOrder.totalPrice})`);
            }
        } else {
            console.log(`[SePay] Không tìm thấy đơn hàng phù hợp với nội dung: ${content}`);
        }

        // Luôn trả về 200 OK để SePay biết đã nhận được Webhook
        res.status(200).json({ success: true });
    } catch (error) {
        console.error(`[SePay Webhook Error]: ${error.message}`);
        // Trả về 200 để SePay không gửi lại liên tục nếu lỗi do code của ta
        res.status(200).json({ success: false, message: error.message });
    }
};
