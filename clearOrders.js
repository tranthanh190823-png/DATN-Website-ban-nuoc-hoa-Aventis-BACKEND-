import mongoose from 'mongoose';
import dotenv from 'dotenv';
import Order from './models/Order.js';
import dns from 'dns';

dns.setServers(['8.8.8.8', '1.1.1.1']);
dotenv.config();

const MONGO_URI = process.env.MONGO_URI;

async function clearOrders() {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('✅ Kết nối MongoDB thành công');

    const result = await Order.deleteMany({});
    console.log(`🗑️ Đã xóa thành công ${result.deletedCount} đơn hàng.`);

  } catch (error) {
    console.error('❌ Lỗi:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Đã ngắt kết nối MongoDB');
    process.exit(0);
  }
}

clearOrders();
