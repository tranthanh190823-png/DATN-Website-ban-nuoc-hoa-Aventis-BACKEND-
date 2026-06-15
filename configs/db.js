import mongoose from 'mongoose';
import dns from 'dns';

// Fix Node.js DNS resolution issues with MongoDB Atlas
dns.setServers(['8.8.8.8', '1.1.1.1']);

const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/perfume_store');
        console.log(`MongoDB Connected: ${conn.connection.host}`);
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

export default connectDB;
