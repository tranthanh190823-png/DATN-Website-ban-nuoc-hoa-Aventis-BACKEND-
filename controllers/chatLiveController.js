import Conversation from '../models/Conversation.js';
import Message from '../models/Message.js';

// @desc    Get all conversations for admin
// @route   GET /api/chat-live/conversations
// @access  Private/Admin
export const getConversations = async (req, res) => {
  try {
    const conversations = await Conversation.find().sort({ updatedAt: -1 });
    res.json(conversations);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// @desc    Get messages for a specific conversation
// @route   GET /api/chat-live/messages/:participantId
// @access  Public
export const getMessages = async (req, res) => {
  try {
    const conversation = await Conversation.findOne({ participantId: req.params.participantId });
    if (!conversation) {
      return res.json([]);
    }
    const messages = await Message.find({ conversationId: conversation._id }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
