import mongoose from 'mongoose';
import dotenv from 'dotenv';
import connectDB from './configs/db.js';
import User from './models/User.js';
import Product from './models/Product.js';
import Order from './models/Order.js';
import products from './data/products.js';

dotenv.config();
connectDB();

const sampleUsers = [
    {
        firstName: 'Admin',
        lastName: 'NuocHoa',
        email: 'admin@nuochoa.vn',
        phone: '0901234567',
        password: 'Admin@2026',
        isAdmin: true
    },
    {
        firstName: 'Nguyen',
        lastName: 'Van An',
        email: 'nguyenvanan@gmail.com',
        phone: '0912345678',
        password: 'User@2026',
        isAdmin: false
    },
    {
        firstName: 'Tran',
        lastName: 'Thi Bich',
        email: 'tranbich@gmail.com',
        phone: '0923456789',
        password: 'User@2026',
        isAdmin: false
    }
];

const importData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();

        console.log('Da xoa toan bo du lieu cu...');

        const createdUsers = await User.create(sampleUsers);
        const adminUser = createdUsers[0]._id;

        console.log(`Da tao ${createdUsers.length} nguoi dung.`);

        const sampleProducts = products.map(p => ({ ...p, user: adminUser }));
        await Product.insertMany(sampleProducts);

        console.log(`Da tao ${sampleProducts.length} san pham.`);
        console.log('=== SEED THANH CONG! ===');
        console.log('Admin: admin@nuochoa.vn / Admin@2026');
        process.exit();
    } catch (error) {
        console.error(`Loi: ${error.message}`);
        process.exit(1);
    }
};

const destroyData = async () => {
    try {
        await Order.deleteMany();
        await Product.deleteMany();
        await User.deleteMany();
        console.log('Da xoa toan bo du lieu!');
        process.exit();
    } catch (error) {
        console.error(`Loi: ${error.message}`);
        process.exit(1);
    }
};

if (process.argv[2] === '-d') {
    destroyData();
} else {
    importData();
}
