import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

const getDateRange = (period, isPrevious = false) => {
    const now = new Date();
    let startDate, endDate;
    
    if (period === 'day') {
        if (isPrevious) {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1, 23, 59, 59, 999);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
        }
    } else if (period === 'week') {
        const firstDay = now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1);
        if (isPrevious) {
            startDate = new Date(now.getFullYear(), now.getMonth(), firstDay - 7, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), firstDay - 1, 23, 59, 59, 999);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), firstDay, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), firstDay + 6, 23, 59, 59, 999);
        }
    } else if (period === 'month') {
        if (isPrevious) {
            startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        } else {
            startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        }
    } else if (period === 'year') {
        if (isPrevious) {
            startDate = new Date(now.getFullYear() - 1, 0, 1, 0, 0, 0);
            endDate = new Date(now.getFullYear() - 1, 11, 31, 23, 59, 59, 999);
        } else {
            startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
            endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59, 999);
        }
    }
    return { startDate, endDate };
};

const getDashboardStats = async (req, res) => {
    try {
        const { period = 'month' } = req.query; // 'day', 'week', 'month', 'year', 'all'
        const now = new Date();
        
        const { startDate, endDate } = getDateRange(period, false);
        const { startDate: prevStartDate, endDate: prevEndDate } = getDateRange(period, true);
        
        const dateFilter = period !== 'all' && startDate ? { createdAt: { $gte: startDate, $lte: endDate } } : {};
        const prevDateFilter = period !== 'all' && prevStartDate ? { createdAt: { $gte: prevStartDate, $lte: prevEndDate } } : {};
        
        const deliveredDateFilter = period !== 'all' && startDate ? { status: 'Đã giao', createdAt: { $gte: startDate, $lte: endDate } } : { status: 'Đã giao' };
        const prevDeliveredDateFilter = period !== 'all' && prevStartDate ? { status: 'Đã giao', createdAt: { $gte: prevStartDate, $lte: prevEndDate } } : { status: 'Đã giao' };

        // 1. Current Stats
        const totalOrders = await Order.countDocuments(dateFilter);
        const totalUsers = await User.countDocuments({ isAdmin: false, ...dateFilter });
        const totalProducts = await Product.countDocuments({ isActive: true });
        
        const pendingOrders = await Order.countDocuments({ status: 'Chờ xử lý', ...dateFilter });
        const processedOrders = await Order.countDocuments({ status: 'Đã xử lý', ...dateFilter });
        const shippingOrders = await Order.countDocuments({ status: 'Đang giao', ...dateFilter });
        const deliveredOrders = await Order.countDocuments({ status: 'Đã giao', ...dateFilter });
        const cancelledOrders = await Order.countDocuments({ status: 'Đã hủy', ...dateFilter });

        const salesData = await Order.aggregate([
            { $match: deliveredDateFilter },
            { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
        ]);
        const totalSales = salesData[0]?.totalSales || 0;

        // 2. Previous Stats for Trends
        const prevTotalOrders = await Order.countDocuments(prevDateFilter);
        const prevTotalUsers = await User.countDocuments({ isAdmin: false, ...prevDateFilter });
        const prevSalesData = await Order.aggregate([
            { $match: prevDeliveredDateFilter },
            { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
        ]);
        const prevTotalSales = prevSalesData[0]?.totalSales || 0;

        const calculateTrend = (current, previous) => {
            if (previous === 0) return current > 0 ? 100 : 0;
            return Math.round(((current - previous) / previous) * 100);
        };

        const trends = {
            sales: calculateTrend(totalSales, prevTotalSales),
            orders: calculateTrend(totalOrders, prevTotalOrders),
            users: calculateTrend(totalUsers, prevTotalUsers),
        };

        // 3. Chart Data (Revenue over time)
        let chartData = [];
        const revenueDateFilter = deliveredDateFilter;
        if (period === 'day') {
            const salesByHour = await Order.aggregate([
                { $match: revenueDateFilter },
                { $group: { _id: { $hour: { date: '$createdAt', timezone: '+07:00' } }, totalSales: { $sum: '$totalPrice' }, ordersCount: { $sum: 1 } } },
                { $sort: { _id: 1 } }
            ]);
            chartData = Array.from({ length: 24 }, (_, i) => {
                const found = salesByHour.find(item => item._id === i);
                return { label: `${i}h`, totalSales: found?.totalSales || 0, ordersCount: found?.ordersCount || 0 };
            });
        } else if (period === 'week') {
            const salesByDayOfWeek = await Order.aggregate([
                { $match: revenueDateFilter },
                { $group: { _id: { $dayOfWeek: { date: '$createdAt', timezone: '+07:00' } }, totalSales: { $sum: '$totalPrice' }, ordersCount: { $sum: 1 } } }
            ]);
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            chartData = [2, 3, 4, 5, 6, 7, 1].map(dayIdx => {
                const found = salesByDayOfWeek.find(item => item._id === dayIdx);
                return { label: days[dayIdx - 1], totalSales: found?.totalSales || 0, ordersCount: found?.ordersCount || 0 };
            });
        } else if (period === 'month') {
            const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
            const salesByDay = await Order.aggregate([
                { $match: revenueDateFilter },
                { $group: { _id: { $dayOfMonth: { date: '$createdAt', timezone: '+07:00' } }, totalSales: { $sum: '$totalPrice' }, ordersCount: { $sum: 1 } } }
            ]);
            chartData = Array.from({ length: daysInMonth }, (_, i) => {
                const found = salesByDay.find(item => item._id === i + 1);
                return { label: `${i + 1}`, totalSales: found?.totalSales || 0, ordersCount: found?.ordersCount || 0 };
            });
        } else {
            let yearFilter = revenueDateFilter;
            if (period === 'all') {
                const currentYear = new Date().getFullYear();
                yearFilter = { status: 'Đã giao', createdAt: { $gte: new Date(`${currentYear}-01-01`), $lte: new Date(`${currentYear}-12-31T23:59:59.999Z`) } };
            }
            const salesByMonth = await Order.aggregate([
                { $match: yearFilter },
                { $group: { _id: { $month: { date: '$createdAt', timezone: '+07:00' } }, totalSales: { $sum: '$totalPrice' }, ordersCount: { $sum: 1 } } },
            ]);
            chartData = Array.from({ length: 12 }, (_, i) => {
                const found = salesByMonth.find(item => item._id === i + 1);
                return { label: `T${i + 1}`, totalSales: found?.totalSales || 0, ordersCount: found?.ordersCount || 0 };
            });
        }

        // 4. Other stats lists
        const recentOrders = await Order.find(dateFilter)
            .populate('user', 'name email')
            .sort({ createdAt: -1 })
            .limit(5)
            .lean();

        const lowStockProducts = await Product.find({ stock: { $lt: 5 }, isActive: true })
            .select('name stock brand image')
            .limit(5)
            .lean();

        const revenueByBrand = await Order.aggregate([
            { $match: revenueDateFilter },
            { $unwind: '$orderItems' },
            { $lookup: { from: 'products', localField: 'orderItems.product', foreignField: '_id', as: 'productInfo' } },
            { $unwind: { path: '$productInfo', preserveNullAndEmptyArrays: true } },
            { $group: { _id: { $ifNull: ['$productInfo.brand', 'Khác'] }, revenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } } } },
            { $sort: { revenue: -1 } },
            { $limit: 5 }
        ]);

        const topCustomers = await Order.aggregate([
            { $match: { status: 'Đã giao' } },
            { $group: { _id: '$user', totalSpent: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } },
            { $sort: { totalSpent: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'userInfo' } },
            { $unwind: '$userInfo' },
            { $project: { _id: 1, totalSpent: 1, orderCount: 1, name: '$userInfo.name', email: '$userInfo.email', avatar: '$userInfo.avatar' } }
        ]);

        const orderStatusData = await Order.aggregate([
            { $match: dateFilter },
            { $group: { _id: '$status', count: { $sum: 1 } } }
        ]);
        const orderStatusCounts = orderStatusData.map(item => ({ name: item._id, value: item.count }));

        const topProducts = await Order.aggregate([
            { $match: { status: 'Đã giao' } },
            { $unwind: '$orderItems' },
            { $group: { _id: '$orderItems.product', totalSold: { $sum: '$orderItems.qty' }, totalRevenue: { $sum: { $multiply: ['$orderItems.price', '$orderItems.qty'] } } } },
            { $sort: { totalSold: -1 } },
            { $limit: 5 },
            { $lookup: { from: 'products', localField: '_id', foreignField: '_id', as: 'productInfo' } },
            { $unwind: '$productInfo' },
            { $project: { _id: 1, name: '$productInfo.name', image: { $arrayElemAt: ['$productInfo.images', 0] }, totalSold: 1, totalRevenue: 1, price: '$productInfo.price' } }
        ]);

        res.json({
            summary: {
                totalOrders, totalUsers, totalProducts, totalSales,
                pendingOrders, processedOrders, shippingOrders, deliveredOrders, cancelledOrders
            },
            trends,
            chartData,
            recentOrders,
            lowStockProducts,
            revenueByBrand,
            topCustomers,
            orderStatusCounts,
            topProducts
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu thống kê', error: error.message });
    }
};

export { getDashboardStats };
