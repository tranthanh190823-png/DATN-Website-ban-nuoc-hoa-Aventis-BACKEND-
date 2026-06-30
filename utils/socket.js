import { Server } from 'socket.io';
import Message from '../models/Message.js';
import Conversation from '../models/Conversation.js';

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*", // Or specify the frontend URL e.g. http://localhost:5173
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    // Admin joins a specific room
    socket.on('join_admin', () => {
      socket.join('admin_room');
      console.log('Admin joined admin_room');
    });

    // Customer joins their own room based on participantId
    socket.on('join_conversation', async (participantId) => {
      socket.join(participantId);
      console.log(`User joined conversation room: ${participantId}`);
      
      // Ensure conversation exists
      let conversation = await Conversation.findOne({ participantId });
      if (!conversation) {
        conversation = await Conversation.create({ participantId });
        // Notify admin about new conversation
        io.to('admin_room').emit('new_conversation', conversation);
      }
    });

    // Handle new message
    socket.on('send_message', async (data) => {
      try {
        const { participantId, sender, text } = data;
        
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

    // Handle marking as read
    socket.on('mark_as_read', async ({ participantId, readBy }) => {
      try {
        const conversation = await Conversation.findOne({ participantId });
        if (conversation) {
          if (readBy === 'Admin') {
            conversation.unreadByAdmin = 0;
          } else if (readBy === 'User') {
            conversation.unreadByUser = 0;
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
    });
  });

  return io;
};
