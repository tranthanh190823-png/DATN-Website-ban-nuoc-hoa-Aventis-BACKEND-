import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // 1. Đếm tổng các thực thể
        const totalOrders = await Order.countDocuments();
        const totalUsers = await User.countDocuments({ isAdmin: false });
        const totalProducts = await Product.countDocuments({ isActive: true });

        const pendingOrders = await Order.countDocuments({ isCancelled: false, isDelivered: false });
        const deliveredOrders = await Order.countDocuments({ isDelivered: true });
        const cancelledOrders = await Order.countDocuments({ isCancelled: true });

        // 2. Tổng doanh thu (đơn đã giao)
        const salesData = await Order.aggregate([
            { $match: { isDelivered: true } },
            { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
        ]);
        const totalSales = salesData[0]?.totalSales || 0;

        // 3. Doanh thu theo từng tháng trong năm nay
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(`${currentYear}-01-01`);
        const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

        const salesByMonth = await Order.aggregate([
            { $match: { isDelivered: true, createdAt: { $gte: startOfYear, $lte: endOfYear } } },
            { $group: { _id: { $month: '$createdAt' }, totalSales: { $sum: '$totalPrice' }, orders: { $sum: 1 } } },
            { $sort: { _id: 1 } }
        ]);

        const formattedSalesByMonth = Array.from({ length: 12 }, (_, i) => {
            const found = salesByMonth.find(item => item._id === i + 1);
            return { month: i + 1, totalSales: found?.totalSales || 0, orders: found?.orders || 0 };
        });

        // 4. 5 Đơn hàng gần nhất
        const recentOrders = await Order.find({})
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 5. Sản phẩm tồn kho thấp (stock < 5)
        const lowStockProducts = await Product.find({ stock: { $lt: 5 }, isActive: true })
            .select('name stock brand')
            .limit(10)
            .lean();

        // 6. Doanh thu theo thương hiệu
        const revenueByBrand = await Order.aggregate([
            { $match: { isDelivered: true } },
            { $unwind: '$orderItems' },
            {
                $lookup: {
                    from: 'products',
                    localField: 'orderItems.product',
                    foreignField: '_id',
                    as: 'productInfo'
                }
            },
            { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
            {
                $group: {
                    _id: { $ifNull: ['$productInfo.brand', 'Khác'] },
                    revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } },
                    count: { $sum: '$orderItems.qty' }
                }
            },
            { $sort: { revenue: -1 } },
            { $limit: 6 }
        ]);

        res.json({
            summary: {
                totalOrders,
                totalUsers,
                totalProducts,
                totalSales,
                pendingOrders,
                deliveredOrders,
                cancelledOrders
            },
            salesByMonth: formattedSalesByMonth,
            recentOrders,
            lowStockProducts,
            revenueByBrand
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu thống kê', error: error.message });
    }
};

export { getDashboardStats };
