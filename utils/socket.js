import { Server } from 'socket.io';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';
import { generateAIResponse } from './aiChatService.js';

const broadcastAdminStatus = (io, isOnline) => {
  io.emit('admin_status', { isOnline });
};

const broadcastClientStatus = (io, participantId, isOnline) => {
  io.to('admin_room').emit('client_status', {
    participantId,
    isOnline,
    lastActive: isOnline ? undefined : new Date(),
  });
};

const toAIMessages = (messages) =>
  messages.map((m) => ({
    role: m.sender === 'User' ? 'user' : 'assistant',
    content: m.text,
  }));

let io;
const connectedAdmins = new Set();
const connectedClients = new Map(); // socket.id -> participantId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
<<<<<<< HEAD
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
=======
      origin: '*',
      methods: ['GET', 'POST'],
    },
>>>>>>> 979a660d30a26733f6942d7dea7841b39c9b7b90
  });

  const adminSockets = new Set();
  const clientSockets = new Map();

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

<<<<<<< HEAD
    // --- Join Admin ---
    socket.on('join_admin', () => {
      connectedAdmins.add(socket.id);
      socket.join('admin_room');
      console.log('Admin joined admin_room:', socket.id);
      // Phát tín hiệu admin online cho tất cả client
      io.emit('admin_status', { isOnline: true });
    });

    // --- Join Customer ---
    socket.on('join_conversation', async (participantId) => {
      connectedClients.set(socket.id, participantId);
      socket.join(participantId);
      console.log(`User joined conversation room: ${participantId}`);
      
      // Cho user biết admin có online không
      socket.emit('admin_status', { isOnline: connectedAdmins.size > 0 });
      // Báo cho admin biết user này online
      io.to('admin_room').emit('client_status', { participantId, isOnline: true });
      
      // Ensure conversation exists
=======
    socket.on('join_admin', () => {
      socket.data.role = 'admin';
      adminSockets.add(socket.id);
      socket.join('admin_room');
      broadcastAdminStatus(io, true);
      console.log('Admin joined admin_room');
    });

    socket.on('join_conversation', async (participantId) => {
      socket.data.role = 'client';
      socket.data.participantId = participantId;
      clientSockets.set(participantId, socket.id);
      socket.join(participantId);
      console.log(`User joined conversation room: ${participantId}`);

      socket.emit('admin_status', { isOnline: adminSockets.size > 0 });
      broadcastClientStatus(io, participantId, true);

>>>>>>> 979a660d30a26733f6942d7dea7841b39c9b7b90
      let conversation = await Conversation.findOne({ participantId });
      if (!conversation) {
        conversation = await Conversation.create({ participantId });
        io.to('admin_room').emit('new_conversation', conversation);
      }
    });

<<<<<<< HEAD
    // --- Gửi tin nhắn ---
    socket.on('send_message', async (data) => {
      try {
        const { participantId, sender, text } = data; // sender: 'User' | 'Admin'
        
=======
    socket.on('typing', ({ senderRole, participantId }) => {
      if (senderRole === 'User' && participantId) {
        io.to('admin_room').emit('client_typing', { participantId });
      } else if (senderRole === 'Admin' && participantId) {
        io.to(participantId).emit('admin_typing');
      }
    });

    socket.on('stop_typing', ({ senderRole, participantId }) => {
      if (senderRole === 'User' && participantId) {
        io.to('admin_room').emit('client_stop_typing', { participantId });
      } else if (senderRole === 'Admin' && participantId) {
        io.to(participantId).emit('admin_stop_typing');
      }
    });

    socket.on('send_message', async (data) => {
      try {
        const { participantId, sender, text } = data;

>>>>>>> 979a660d30a26733f6942d7dea7841b39c9b7b90
        let conversation = await Conversation.findOne({ participantId });
        if (!conversation) {
          conversation = await Conversation.create({ participantId });
          io.to('admin_room').emit('new_conversation', conversation);
        }

        const message = await Message.create({
          conversationId: conversation._id,
          sender,
          text,
        });

        conversation.lastMessage = text;
        if (sender === 'User') {
          conversation.unreadByAdmin += 1;
        } else if (sender === 'Admin') {
          conversation.unreadByUser += 1;
        }
        await conversation.save();

        io.to(participantId).emit('receive_message', message);
        io.to('admin_room').emit('receive_message', { ...message.toObject(), participantId });
        io.to('admin_room').emit('update_conversation', conversation);

        if (sender === 'User' && adminSockets.size === 0) {
          io.to(participantId).emit('ai_typing', true);

          try {
            const history = await Message.find({ conversationId: conversation._id })
              .sort({ createdAt: 1 })
              .limit(12);

            const { text: aiText, products } = await generateAIResponse(toAIMessages(history));

            if (adminSockets.size > 0) {
              console.log('Admin came online during AI processing, skipping AI reply');
              return;
            }

            const aiMessage = await Message.create({
              conversationId: conversation._id,
              sender: 'AI',
              text: aiText,
              products: products.length > 0 ? products : undefined,
            });

            conversation.lastMessage = aiText;
            await conversation.save();

            io.to(participantId).emit('receive_message', aiMessage);
            io.to('admin_room').emit('receive_message', {
              ...aiMessage.toObject(),
              participantId,
            });
            io.to('admin_room').emit('update_conversation', conversation);
          } catch (aiError) {
            console.error('AI auto-reply error:', aiError);
          } finally {
            io.to(participantId).emit('ai_typing', false);
          }
        }
      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

<<<<<<< HEAD
    // --- Typing Events ---
    socket.on('typing', (data) => {
      const { senderRole, participantId } = data; // senderRole: 'Admin' | 'User'
      if (senderRole === 'Admin') {
        io.to(participantId).emit('admin_typing', data);
      } else {
        io.to('admin_room').emit('client_typing', data);
      }
    });

    socket.on('stop_typing', (data) => {
      const { senderRole, participantId } = data;
      if (senderRole === 'Admin') {
        io.to(participantId).emit('admin_stop_typing', data);
      } else {
        io.to('admin_room').emit('client_stop_typing', data);
      }
    });

    // --- Đánh dấu đã đọc ---
=======
>>>>>>> 979a660d30a26733f6942d7dea7841b39c9b7b90
    socket.on('mark_as_read', async ({ participantId, readBy }) => {
      try {
        const conversation = await Conversation.findOne({ participantId });
        if (conversation) {
          if (readBy === 'Admin') {
            conversation.unreadByAdmin = 0;
            // Báo cho User biết Admin đã xem
            io.to(participantId).emit('message_seen', { readBy: 'Admin', participantId });
          } else if (readBy === 'User') {
            conversation.unreadByUser = 0;
            io.to('admin_room').emit('message_seen', { readBy: 'User', participantId });
          }
          await conversation.save();
          io.to('admin_room').emit('update_conversation', conversation);
        }
      } catch (error) {
        console.error('Error marking as read:', error);
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
<<<<<<< HEAD
      if (connectedAdmins.has(socket.id)) {
          connectedAdmins.delete(socket.id);
          if (connectedAdmins.size === 0) {
              io.emit('admin_status', { isOnline: false, lastActive: new Date() });
          }
      } else if (connectedClients.has(socket.id)) {
          const participantId = connectedClients.get(socket.id);
          connectedClients.delete(socket.id);
          
          // Kiểm tra xem participantId này còn tab nào khác mở không
          const isStillOnline = Array.from(connectedClients.values()).includes(participantId);
          if (!isStillOnline) {
              io.to('admin_room').emit('client_status', { participantId, isOnline: false, lastActive: new Date() });
          }
=======

      if (socket.data.role === 'admin') {
        adminSockets.delete(socket.id);
        if (adminSockets.size === 0) {
          broadcastAdminStatus(io, false);
        }
      }

      if (socket.data.role === 'client' && socket.data.participantId) {
        const { participantId } = socket.data;
        if (clientSockets.get(participantId) === socket.id) {
          clientSockets.delete(participantId);
          broadcastClientStatus(io, participantId, false);
        }
>>>>>>> 979a660d30a26733f6942d7dea7841b39c9b7b90
      }
    });
  });

  return io;
<<<<<<< HEAD
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
=======
};
>>>>>>> 979a660d30a26733f6942d7dea7841b39c9b7b90
