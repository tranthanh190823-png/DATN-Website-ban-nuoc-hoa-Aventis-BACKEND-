import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';

dotenv.config();

const debugOrder = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        const order = await Order.findOne({ refundRequestStatus: 'pending' });
        console.log("Order found:", order);
        process.exit();
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
};

debugOrder();
