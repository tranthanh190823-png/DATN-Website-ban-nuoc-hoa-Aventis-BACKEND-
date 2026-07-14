import mongoose from 'mongoose';

const conversationSchema = new mongoose.Schema(
  {
    participantId: {
      type: String,
      required: true,
      unique: true, // This can be a user's ID or a unique session string for guests
    },
    participantName: {
      type: String,
      default: 'Guest',
    },
    lastMessage: {
      type: String,
      default: '',
    },
    unreadByAdmin: {
      type: Number,
      default: 0,
    },
    unreadByUser: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

const Conversation = mongoose.model('Conversation', conversationSchema);

export default Conversation;
