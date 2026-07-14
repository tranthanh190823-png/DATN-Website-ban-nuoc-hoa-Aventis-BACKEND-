import mongoose from 'mongoose';

const productCardSchema = new mongoose.Schema(
  {
    _id: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    brand: String,
    images: [String],
    price: Number,
    originalPrice: Number,
  },
  { _id: false }
);

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Conversation',
      required: true,
    },
    sender: {
      type: String,
      enum: ['User', 'Admin', 'AI'],
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    products: {
      type: [productCardSchema],
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

const Message = mongoose.model('Message', messageSchema);

export default Message;