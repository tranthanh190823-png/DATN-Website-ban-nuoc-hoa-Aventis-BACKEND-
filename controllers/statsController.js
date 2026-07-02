import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        const { period } = req.query; // 'day', 'week', 'month', 'year', 'all'
        
        let startDate, endDate;
        const now = new Date();
        
        if (period === 'day') {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        } else if (period === 'week') {
            const firstDay = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1); // Monday
            startDate = new Date(now.getFullYear(), now.getMonth(), firstDay, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), firstDay + 6, 23, 59, 59, 999);
        } else if (period === 'month') {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        } else if (period === 'year') {
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        }

        const dateFilter = startDate && endDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {};
        const deliveredDateFilter = startDate && endDate ? { isDelivered: true, createdAt: { $gte: startDate, $lte: endDate } } : { isDelivered: true };

        // 1. Đếm tổng các thực thể
        const totalOrders = await Order.countDocuments(dateFilter);
        const totalUsers = await User.countDocuments({ isAdmin: false, ...dateFilter });
        const totalProducts = await Product.countDocuments({ isActive: true });

        const pendingOrders = await Order.countDocuments({ isCancelled: false, isDelivered: false, ...dateFilter });
        const deliveredOrders = await Order.countDocuments(deliveredDateFilter);
        const cancelledOrders = await Order.countDocuments({ isCancelled: true, ...dateFilter });

        // 2. Tổng doanh thu (đơn đã giao)
        const salesData = await Order.aggregate([
            { $match: deliveredDateFilter },
            { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
        ]);
        const totalSales = salesData[0]?.totalSales || 0;

        // 3. Biểu đồ doanh thu
        let chartData = [];
        if (period === 'day') {
            const salesByHour = await Order.aggregate([
                { $match: deliveredDateFilter },
                { $group: { _id: { $hour: { date: '$createdAt', timezone: '+07:00' } }, totalSales: { $sum: '$totalPrice' } } },
                { $sort: { _id: 1 } }
            ]);
            chartData = Array.from({ length: 24 }, (_, i) => {
                const found = salesByHour.find(item => item._id === i);
                return { label: `${i}h`, totalSales: found?.totalSales || 0 };
            });
        } else if (period === 'week') {
            const salesByDayOfWeek = await Order.aggregate([
                { $match: deliveredDateFilter },
                { $group: { _id: { $dayOfWeek: { date: '$createdAt', timezone: '+07:00' } }, totalSales: { $sum: '$totalPrice' } } }
            ]);
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            chartData = [2, 3, 4, 5, 6, 7, 1].map(dayIdx => {
                const found = salesByDayOfWeek.find(item => item._id === dayIdx);
                return { label: days[dayIdx - 1], totalSales: found?.totalSales || 0 };
            });
        } else if (period === 'month') {
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const salesByDay = await Order.aggregate([
                { $match: deliveredDateFilter },
                { $group: { _id: { $dayOfMonth: { date: '$createdAt', timezone: '+07:00' } }, totalSales: { $sum: '$totalPrice' } } }
            ]);
            chartData = Array.from({ length: daysInMonth }, (_, i) => {
                const found = salesByDay.find(item => item._id === i + 1);
                return { label: `${i + 1}`, totalSales: found?.totalSales || 0 };
            });
        } else {
            // year or all
            let yearFilter = deliveredDateFilter;
            if (period === 'all') {
                const currentYear = new Date().getFullYear();
                yearFilter = { isDelivered: true, createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`) } };
            }
            const salesByMonth = await Order.aggregate([
                { $match: yearFilter },
                { $group: { _id: { $month: { date: '$createdAt', timezone: '+07:00' } }, totalSales: { $sum: '$totalPrice' } } },
            ]);
            chartData = Array.from({ length: 12 }, (_, i) => {
                const found = salesByMonth.find(item => item._id === i + 1);
                return { label: `T${i + 1}`, totalSales: found?.totalSales || 0 };
            });
        }

        // 4. 5 Đơn hàng gần nhất
        const recentOrders = await Order.find(dateFilter)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        // 5. Sản phẩm tồn kho thấp
        const lowStockProducts = await Product.find({ stock: { $lt: 5 }, isActive: true })
            .select('name stock brand')
            .limit(10)
            .lean();

        // 6. Doanh thu theo thương hiệu
        const revenueByBrand = await Order.aggregate([
            { $match: deliveredDateFilter },
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
                totalOrders, totalUsers, totalProducts, totalSales,
                pendingOrders, deliveredOrders, cancelledOrders
            },
            chartData,
            recentOrders,
            lowStockProducts,
            revenueByBrand
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu thống kê', error: error.message });
    }
};

export { getDashboardStats };
