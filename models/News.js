import mongoose from 'mongoose';

const newsSchema = new mongoose.Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    imageUrl: { type: String },
    status: { type: String, enum: ['ACTIVE', 'ARCHIVED'], default: 'ACTIVE' }
}, { timestamps: true });

export default mongoose.model('News', newsSchema);
