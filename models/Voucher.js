import mongoose from 'mongoose';

const voucherSchema = mongoose.Schema({
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    discountPercentage: {
        type: Number,
        required: true,
        min: 0,
        max: 100
    },
    maxDiscountAmount: {
        type: Number,
        required: true,
        default: 0 // 0 nghĩa là không giới hạn số tiền giảm
    },
    minOrderValue: {
        type: Number,
        required: true,
        default: 0
    },
    expirationDate: {
        type: Date,
        required: true
    },
    usageLimit: {
        type: Number,
        required: true,
        default: 1
    },
    usedCount: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, {
    timestamps: true
});

const Voucher = mongoose.model('Voucher', voucherSchema);
export default Voucher;
