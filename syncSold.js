import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import Product from './models/Product.js';

dotenv.config();

const fixSoldCount = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('MongoDB Connected');

        // Reset all products' sold count to 0 first
        await Product.updateMany({}, { $set: { sold: 0 } });
        console.log('Reset all sold counts to 0');

        // Find all non-cancelled orders
        const orders = await Order.find({ isCancelled: false, status: { $ne: 'Đã hủy' } });
        
        console.log(`Found ${orders.length} valid orders`);
        
        let totalSoldFixed = 0;

        for (const order of orders) {
            if (order.orderItems && order.orderItems.length > 0) {
                for (const item of order.orderItems) {
                    if (item.product && item.qty) {
                        await Product.findByIdAndUpdate(
                            item.product,
                            { $inc: { sold: item.qty } }
                        ).catch(e => console.error(e.message));
                        totalSoldFixed += item.qty;
                    }
                }
            }
        }

        console.log(`Success! Total items sold calculated: ${totalSoldFixed}`);
        process.exit();
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixSoldCount();
