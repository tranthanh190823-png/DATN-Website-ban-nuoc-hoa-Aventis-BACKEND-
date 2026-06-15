import mongoose from 'mongoose';

const flashSaleSchema = new mongoose.Schema({
    name: { type: String, required: true },
    startTime: { type: Date, required: true },
    endTime: { type: Date, required: true },
    status: { type: String, enum: ['UPCOMING', 'ACTIVE', 'ENDED', 'DISABLED'], default: 'UPCOMING' },
    productIds: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Product'
    }]
}, { timestamps: true });

export default mongoose.model('FlashSale', flashSaleSchema);
