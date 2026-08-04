import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import Product from './models/Product.js';

dotenv.config();

const clearOrders = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Xóa toàn bộ đơn hàng
        const deleteResult = await Order.deleteMany({});
        console.log(`Đã xóa ${deleteResult.deletedCount} đơn hàng.`);

        // Đưa lượt bán (sold) về 0
        const productUpdateResult = await Product.updateMany({}, { $set: { sold: 0 } });
        console.log(`Đã reset lượt bán về 0 cho ${productUpdateResult.modifiedCount} sản phẩm.`);

        console.log('Hoàn tất!');
        process.exit(0);
    } catch (error) {
        console.error('Lỗi:', error);
        process.exit(1);
    }
};

clearOrders();
