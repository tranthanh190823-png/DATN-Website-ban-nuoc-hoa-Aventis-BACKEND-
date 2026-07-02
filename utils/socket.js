import { Server } from 'socket.io';

let io;
const connectedAdmins = new Set();
const connectedClients = new Map(); // socket.id -> userId

export const initSocket = (server) => {
    io = new Server(server, {
        cors: {
            origin: "*",
            methods: ["GET", "POST", "PUT", "DELETE"]
        }
    });

    io.on('connection', (socket) => {
        console.log('A user connected:', socket.id);

        // Khi một thiết bị tham gia (Admin hoặc Client)
        socket.on('join', (data) => {
            const { role, userId } = data; // role: 'admin' | 'client'
            
            if (role === 'admin') {
                connectedAdmins.add(socket.id);
                socket.join('admins');
                console.log('Admin joined:', socket.id);
                // Báo cho tất cả clients biết Admin đang online
                io.emit('admin_status', { isOnline: true });
            } else if (userId) {
                connectedClients.set(socket.id, userId);
                // Client tham gia phòng riêng dựa trên userId
                socket.join(`room_${userId}`);
                console.log(`Client joined room_${userId}:`, socket.id);
                
                // Báo cho client này biết trạng thái của Admin
                socket.emit('admin_status', { isOnline: connectedAdmins.size > 0 });
                // Báo cho Admin biết client này online
                io.to('admins').emit('client_status', { userId, isOnline: true });
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
                const userId = connectedClients.get(socket.id);
                connectedClients.delete(socket.id);
                // Kiểm tra xem user này còn tab nào khác mở không
                const isStillOnline = Array.from(connectedClients.values()).includes(userId);
                if (!isStillOnline) {
                    io.to('admins').emit('client_status', { userId, isOnline: false, lastActive: new Date() });
                }
            }
        });
        
        // --- Xử lý Tin nhắn ---
        socket.on('send_message', (data) => {
            const { senderRole, receiverId, userId } = data;
            
            if (senderRole === 'admin') {
                // Admin gửi cho Client cụ thể
                io.to(`room_${receiverId}`).emit('receive_message', data);
            } else {
                // Client gửi lên cho Admin
                io.to('admins').emit('receive_message', data);
            }
        });

        // --- Xử lý Trạng thái đang gõ (Typing) ---
        socket.on('typing', (data) => {
            const { senderRole, receiverId, userId } = data;
            if (senderRole === 'admin') {
                io.to(`room_${receiverId}`).emit('admin_typing', data);
            } else {
                io.to('admins').emit('client_typing', data);
            }
        });

        socket.on('stop_typing', (data) => {
            const { senderRole, receiverId, userId } = data;
            if (senderRole === 'admin') {
                io.to(`room_${receiverId}`).emit('admin_stop_typing', data);
            } else {
                io.to('admins').emit('client_stop_typing', data);
            }
        });

        // --- Xử lý Trạng thái Đã xem (Seen) ---
        socket.on('mark_seen', (data) => {
            const { senderRole, receiverId, userId, messageId } = data;
            if (senderRole === 'admin') {
                io.to(`room_${receiverId}`).emit('message_seen', data);
            } else {
                io.to('admins').emit('message_seen', data);
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
