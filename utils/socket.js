import { Server } from 'socket.io';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

let io;
const connectedAdmins = new Set();
const connectedClients = new Map(); // socket.id -> participantId

export const initSocket = (server) => {
  io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST", "PUT", "DELETE"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

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
      let conversation = await Conversation.findOne({ participantId });
      if (!conversation) {
        conversation = await Conversation.create({ participantId });
        // Notify admin about new conversation
        io.to('admin_room').emit('new_conversation', conversation);
      }
    });

    // --- Gửi tin nhắn ---
    socket.on('send_message', async (data) => {
      try {
        const { participantId, sender, text } = data; // sender: 'User' | 'Admin'
        
        let conversation = await Conversation.findOne({ participantId });
        if (!conversation) {
          conversation = await Conversation.create({ participantId });
          io.to('admin_room').emit('new_conversation', conversation);
        }

        const message = await Message.create({
          conversationId: conversation._id,
          sender,
          text
        });

        conversation.lastMessage = text;
        if (sender === 'User') {
          conversation.unreadByAdmin += 1;
        } else {
          conversation.unreadByUser += 1;
        }
        await conversation.save();

        // Broadcast to customer room and admin room
        io.to(participantId).emit('receive_message', message);
        io.to('admin_room').emit('receive_message', { ...message.toObject(), participantId });
        io.to('admin_room').emit('update_conversation', conversation);

      } catch (error) {
        console.error('Error saving message:', error);
      }
    });

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
      }
    });
  });

  return io;
};

export const getIO = () => {
    if (!io) {
        throw new Error('Socket.io not initialized!');
    }
    return io;
};
