import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';

// @desc    Get dashboard statistics
// @route   GET /api/stats/dashboard
// @access  Private/Admin
const getDashboardStats = async (req, res) => {
    try {
        // 1. Tổng số đơn hàng
        const totalOrders = await Order.countDocuments();

        // 2. Tổng doanh thu (chỉ tính những đơn đã thanh toán)
        const salesData = await Order.aggregate([
            { $match: { isPaid: true } },
            { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } }
        ]);
        const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;

        // 3. Tổng số lượng khách hàng (trừ Admin)
        const totalUsers = await User.countDocuments({ isAdmin: false });

        // 4. Sản phẩm sắp hết hàng (stock < 10)
        const lowStockProducts = await Product.find({ stock: { $lt: 10 } })
            .select('name stock price')
            .limit(5);

        // 5. Doanh thu theo từng tháng trong năm nay
        const currentYear = new Date().getFullYear();
        const startOfYear = new Date(`${currentYear}-01-01`);
        const endOfYear = new Date(`${currentYear}-12-31T23:59:59.999Z`);

        const salesByMonth = await Order.aggregate([
            {
                $match: {
                    isPaid: true,
                    createdAt: { $gte: startOfYear, $lte: endOfYear }
                }
            },
            {
                $group: {
                    _id: { $month: '$createdAt' },
                    totalSales: { $sum: '$totalPrice' }
                }
            },
            {
                $sort: { _id: 1 } // Sắp xếp theo tháng tăng dần
            }
        ]);

        // Định dạng lại mảng doanh thu theo tháng cho dễ đọc với frontend
        const formattedSalesByMonth = Array.from({ length: 12 }, (_, i) => {
            const monthData = salesByMonth.find(item => item._id === i + 1);
            return {
                month: i + 1,
                totalSales: monthData ? monthData.totalSales : 0
            };
        });

        res.json({
            totalOrders,
            totalSales,
            totalUsers,
            lowStockProducts,
            salesByMonth: formattedSalesByMonth
        });

    } catch (error) {
        res.status(500).json({ message: 'Lỗi server khi lấy dữ liệu thống kê' });
    }
};

export { getDashboardStats };
