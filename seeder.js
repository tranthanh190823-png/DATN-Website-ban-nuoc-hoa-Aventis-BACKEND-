import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './configs/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import products from './data/products.js';

dotenv.config();
connectDB();

const importData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        // Admin User
        const createdUsers = await User.create([
            {
                name: 'Admin User',
                email: 'admin@example.com',
                password: 'password123',
                isAdmin: true
            }
        ]);

        const adminUser = createdUsers[0]._id;

        const sampleProducts = products.map(product => {
            return { ...product, user: adminUser };
        });

        await Product.insertMany(sampleProducts);

        console.log('Dữ liệu đã được chèn vào MongoDB!');
        process.exit();
    } catch (error) {
        console.error(`Lỗi: ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        console.log('Đã xóa toàn bộ dữ liệu!');
        process.exit();
    } catch (error) {
        console.error(`Lỗi: ${error.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
