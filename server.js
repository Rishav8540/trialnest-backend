const express    = require('express');
const mongoose   = require('mongoose');
const cors       = require('cors');
const path       = require('path');
const http       = require('http');
const { Server } = require('socket.io');
const jwt        = require('jsonwebtoken');
require('dotenv').config();

const app    = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

// Middleware
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth',     require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/requests', require('./routes/requests'));
app.use('/api/orders',   require('./routes/orders'));
app.use('/api/cart',     require('./routes/cart'));
app.use('/api/notifs',   require('./routes/notifs'));
app.use('/api/chat',     require('./routes/chat'));

// ─── Socket.io ───────────────────────────────────────────────────────────────
const Message      = require('./models/Message');
const Conversation = require('./models/Conversation');

// Auth middleware for socket connections
io.use((socket, next) => {
  const token = socket.handshake.auth?.token;
  if (!token) return next(new Error('No token'));
  try {
    const decoded   = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId   = decoded.id;
    next();
  } catch {
    next(new Error('Invalid token'));
  }
});

// Track online users: userId -> Set of socketIds
const onlineUsers = new Map();

io.on('connection', (socket) => {
  const userId = socket.userId;
  console.log(`🔌 Socket connected: ${socket.id} (user: ${userId})`);

  // Track online status
  if (!onlineUsers.has(userId)) onlineUsers.set(userId, new Set());
  onlineUsers.get(userId).add(socket.id);

  // Broadcast online status to all
  io.emit('user_online', { userId, online: true });

  // Join a conversation room
  socket.on('join_conversation', (conversationId) => {
    socket.join(conversationId);
    console.log(`📥 ${userId} joined room: ${conversationId}`);
  });

  // Leave a conversation room
  socket.on('leave_conversation', (conversationId) => {
    socket.leave(conversationId);
  });

  // Send a message
  socket.on('send_message', async (data) => {
    try {
      const { conversationId, text, senderName, senderRole, buyerId, sellerId, productId, productName, productEmoji } = data;
      if (!text?.trim()) return;

      // Save message to DB
      const message = await Message.create({
        conversationId,
        senderId:   userId,
        senderName,
        senderRole,
        text:       text.trim(),
      });

      // Update or create conversation
      const isSellerSending = senderRole === 'seller';
      await Conversation.findOneAndUpdate(
        { conversationId },
        {
          conversationId,
          buyerId,   buyerName:   isSellerSending ? data.buyerName  : senderName,
          sellerId,  sellerName:  isSellerSending ? senderName       : data.sellerName,
          productId, productName, productEmoji: productEmoji || '📦',
          lastMessage:   text.trim().substring(0, 80),
          lastMessageAt: new Date(),
          $inc: {
            unreadBuyer:  isSellerSending ? 1 : 0,
            unreadSeller: isSellerSending ? 0 : 1,
          },
        },
        { upsert: true, new: true }
      );

      // Emit to everyone in the room (including sender)
      io.to(conversationId).emit('new_message', {
        _id:            message._id,
        conversationId: message.conversationId,
        senderId:       userId,
        senderName:     message.senderName,
        senderRole:     message.senderRole,
        text:           message.text,
        createdAt:      message.createdAt,
        read:           false,
      });

      // Notify the other party if they are NOT in the room
      const otherUserId = isSellerSending ? buyerId : sellerId;
      const otherSockets = onlineUsers.get(String(otherUserId));
      if (otherSockets && otherSockets.size > 0) {
        otherSockets.forEach(sid => {
          const s = io.sockets.sockets.get(sid);
          if (s && !s.rooms.has(conversationId)) {
            s.emit('chat_notification', {
              conversationId,
              senderName,
              productName,
              text: text.trim().substring(0, 60),
            });
          }
        });
      }
    } catch (err) {
      console.error('Socket send_message error:', err);
      socket.emit('message_error', { error: 'Failed to send message' });
    }
  });

  // Mark messages as read
  socket.on('mark_read', async ({ conversationId, role }) => {
    try {
      await Message.updateMany(
        { conversationId, senderRole: { $ne: role }, read: false },
        { read: true }
      );
      const update = role === 'buyer'
        ? { unreadBuyer: 0 }
        : { unreadSeller: 0 };
      await Conversation.findOneAndUpdate({ conversationId }, update);
      io.to(conversationId).emit('messages_read', { conversationId, role });
    } catch (err) {
      console.error('mark_read error:', err);
    }
  });

  // Typing indicator
  socket.on('typing', ({ conversationId, senderName, isTyping }) => {
    socket.to(conversationId).emit('typing', { senderName, isTyping });
  });

  // Disconnect
  socket.on('disconnect', () => {
    const sockets = onlineUsers.get(userId);
    if (sockets) {
      sockets.delete(socket.id);
      if (sockets.size === 0) {
        onlineUsers.delete(userId);
        io.emit('user_online', { userId, online: false });
      }
    }
    console.log(`🔌 Socket disconnected: ${socket.id}`);
  });
});

// MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB connected');
    server.listen(process.env.PORT, () =>
      console.log(`🚀 Server running on http://localhost:${process.env.PORT}`)
    );
  })
  .catch(err => { console.error('❌ MongoDB error:', err); process.exit(1); });
