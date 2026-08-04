import mongoose from 'mongoose';

const orderSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    orderItems: [{
        name: { type: String, required: true },
        qty: { type: Number, required: true },
        image: { type: String, required: true },
        price: { type: Number, required: true },
        volume: { type: Number }, // Lưu dung tích đã chọn (ml) để trừ kho
        product: {
            type: mongoose.Schema.Types.ObjectId,
            required: true,
            ref: 'Product'
        }
    }],
    shippingAddress: {
        fullName: { type: String },
        phone: { type: String },
        address: { type: String, required: true },
        city: { type: String, required: true },
        postalCode: { type: String, required: true },
        country: { type: String, required: true }
    },
    paymentMethod: {
        type: String,
        required: true,
        default: 'COD'
    },
    itemsPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    shippingPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    totalPrice: {
        type: Number,
        required: true,
        default: 0.0
    },
    voucherCode: {
        type: String
    },
    discountPrice: {
        type: Number,
        default: 0.0
    },
    isPaid: {
        type: Boolean,
        required: true,
        default: false
    },
    paidAt: {
        type: Date
    },
    paymentResult: {
        id: { type: String },
        status: { type: String },
        update_time: { type: String },
        email_address: { type: String }
    },
    vnpTxnRef: {
        type: String
    },
    isRefunded: {
        type: Boolean,
        default: false
    },
    refundedAt: {
        type: Date
    },
    refundAmount: {
        type: Number,
        default: 0
    },
    refundReason: {
        type: String,
        default: ''
    },
    refundResult: {
        id: { type: String },
        status: { type: String },
        responseCode: { type: String },
        message: { type: String },
        refundedBy: { type: String }
    },
    refundBankAccount: {
        type: String,
        default: ''
    },
    refundBankName: {
        type: String,
        default: ''
    },
    refundBankBank: {
        type: String,
        default: ''
    },
    refundTransferImage: {
        type: String,
        default: ''
    },
    refundRequestStatus: {
        type: String,
        enum: ['none', 'pending', 'approved', 'rejected'],
        default: 'none'
    },
    refundRequestReason: {
        type: String,
        default: ''
    },
    refundRequestedAt: {
        type: Date
    },
    refundRequestNote: {
        type: String,
        default: ''
    },
    isDelivered: {
        type: Boolean,
        required: true,
        default: false
    },
    deliveredAt: {
        type: Date
    },
    isCancelled: {
        type: Boolean,
        required: true,
        default: false
    },
    cancelledAt: {
        type: Date
    },
    cancelReason: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['Chờ xử lý', 'Đã xử lý', 'Đang giao', 'Đã giao', 'Đã hủy'],
        default: 'Chờ xử lý'
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);
export default Order;
