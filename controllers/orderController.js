import Order from '../models/Order.js';

// Helper for status sorting
const statusWeight = {
    'Chờ xử lý': 1,
    'Đã xử lý': 2,
    'Đang giao': 3,
    'Đã giao': 4,
    'Đã hủy': 5
};

// @desc    Get all orders
// @route   GET /api/orders
// @access  Private/Admin
const getOrders = async (req, res) => {
    try {
        let orders = await Order.find({}).populate('user', 'id name email');
        
        orders.sort((a, b) => {
            const aStatus = a.status || (a.isDelivered ? 'Đã giao' : (a.isCancelled ? 'Đã hủy' : 'Chờ xử lý'));
            const bStatus = b.status || (b.isDelivered ? 'Đã giao' : (b.isCancelled ? 'Đã hủy' : 'Chờ xử lý'));

            const aCompleted = aStatus === 'Đã giao' || aStatus === 'Đã hủy';
            const bCompleted = bStatus === 'Đã giao' || bStatus === 'Đã hủy';

            // Đẩy các đơn chưa hoàn thành lên trên, đơn đã giao/hủy xuống cuối
            if (!aCompleted && bCompleted) return -1;
            if (aCompleted && !bCompleted) return 1;

            // Trong nhóm chưa hoàn thành, đơn mới mua sẽ nằm cuối (cũ nhất lên trên)
            if (!aCompleted && !bCompleted) {
                return new Date(a.createdAt) - new Date(b.createdAt);
            }

            // Trong nhóm đã hoàn thành, đơn mới nhất lên trên
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng' });
    }
};

// @desc    Get order by ID
// @route   GET /api/orders/:id
// @access  Private
const getOrderById = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email');
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy chi tiết đơn hàng' });
    }
};

// @desc    Update order to processed
// @route   PUT /api/orders/:id/process
// @access  Private/Admin
const updateOrderToProcessed = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            if (order.status !== 'Chờ xử lý') {
                return res.status(400).json({ message: 'Chỉ có thể xử lý đơn hàng ở trạng thái Chờ xử lý' });
            }
            order.status = 'Đã xử lý';
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái' });
    }
};

// @desc    Update order to shipping
// @route   PUT /api/orders/:id/ship
// @access  Private/Admin
const updateOrderToShipping = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            if (order.status !== 'Đã xử lý') {
                return res.status(400).json({ message: 'Đơn hàng phải được xác nhận (Đã xử lý) trước khi giao' });
            }
            order.status = 'Đang giao';
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái' });
    }
};

// @desc    Update order to delivered
// @route   PUT /api/orders/:id/deliver
// @access  Private/Admin
const updateOrderToDelivered = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            if (order.status !== 'Đang giao') {
                return res.status(400).json({ message: 'Chỉ có thể hoàn thành đơn hàng đang giao' });
            }
            order.status = 'Đã giao';
            order.isDelivered = true;
            order.deliveredAt = Date.now();
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái giao hàng' });
    }
};

// @desc    Update order to paid
// @route   PUT /api/orders/:id/pay
// @access  Private
const updateOrderToPaid = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            order.isPaid = true;
            order.paidAt = Date.now();
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi cập nhật trạng thái thanh toán' });
    }
};

// @desc    Cancel order
// @route   PUT /api/orders/:id/cancel
// @access  Private
const cancelOrder = async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);
        if (order) {
            if (order.status !== 'Chờ xử lý') {
                return res.status(400).json({ message: 'Chỉ có thể hủy đơn hàng khi chưa xác nhận (Chờ xử lý)' });
            }
            order.status = 'Đã hủy';
            order.isCancelled = true;
            order.cancelledAt = Date.now();
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi hủy đơn hàng' });
    }
};

// @desc    Create new order
// @route   POST /api/orders
// @access  Private
const addOrderItems = async (req, res) => {
    try {
        const {
            orderItems,
            shippingAddress,
            paymentMethod,
            itemsPrice,
            shippingPrice,
            totalPrice,
            voucherCode,
            discountPrice
        } = req.body;

        if (orderItems && orderItems.length === 0) {
            return res.status(400).json({ message: 'Không có sản phẩm trong đơn hàng' });
        } else {
            const order = new Order({
                orderItems,
                user: req.user._id,
                shippingAddress,
                paymentMethod,
                itemsPrice,
                shippingPrice,
                totalPrice,
                voucherCode,
                discountPrice,
                status: 'Chờ xử lý'
            });

            const createdOrder = await order.save();
            res.status(201).json(createdOrder);
        }
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi tạo đơn hàng' });
    }
};

// @desc    Get logged in user orders
// @route   GET /api/orders/myorders
// @access  Private
const getMyOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy danh sách đơn hàng' });
    }
};

export {
    addOrderItems,
    getOrderById,
    updateOrderToPaid,
    updateOrderToProcessed,
    updateOrderToShipping,
    updateOrderToDelivered,
    getMyOrders,
    getOrders,
    cancelOrder
};
