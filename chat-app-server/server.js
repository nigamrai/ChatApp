const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const authRoutes = require('./routes/auth');
const messageRoutes = require('./routes/message');
const videoRoutes = require('./routes/video');
const cloudinary = require('cloudinary');
const http = require('http');
const socketIo = require('socket.io');
const Message = require('./models/Message');

const app = express();
const PORT = process.env.PORT || 5000;

cloudinary.config({ 
  cloud_name: 'dacafjeag', 
  api_key: '574477448174444',  
  api_secret: 'yngLYLzcTwiXqVirsqR0rBKr-GM'
});

// Middleware
app.use(cors({
  origin: '*',
}));
app.use(bodyParser.json());
app.use(express.json());

// Connect to MongoDB
const mongoURI = 'mongodb+srv://khanalbk18:TMWHlbtPsx7caK6Z@cluster0.fnhsl.mongodb.net/chat-app';

mongoose.connect(mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/messages', messageRoutes);
app.use('/video', videoRoutes);

// Create HTTP server and integrate socket.io
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Enhanced Socket.io implementation
const callRooms = {};
const userSocketMap = {}; // userId -> socket.id

io.on('connection', (socket) => {
  console.log(`New client connected: ${socket.id}`);

  // Join user's personal room
  socket.on('join', (userId) => {
    socket.join(userId);
    console.log(`User ${userId} joined their room`);
  });

  // Handle incoming messages
  socket.on('message', async (data) => {
    try {
      // Create and save message to database
      const message = new Message({
        senderId: data.senderId,
        recipientId: data.recipientId,
        message: data.message,
        messageType: data.messageType || 'text'
      });
      
      const savedMessage = await message.save();

      // Send to recipient
      io.to(data.recipientId).emit('message', savedMessage);

    } catch (err) {
      console.error('Message handling error:', err);
      socket.emit('messageError', {
        error: 'Failed to deliver message'
      });
    }
  });

  // --- Register user for direct signaling ---
  socket.on('register', (userId) => {
    userSocketMap[userId] = socket.id;
    socket.userId = userId;
    console.log(`User registered: ${userId} -> ${socket.id}`);
  });

  // --- Call signaling events ---
  socket.on('join:room', ({ roomId, userId }) => {
    socket.join(roomId);
    if (!callRooms[roomId]) callRooms[roomId] = [];
    callRooms[roomId].push({ socketId: socket.id, userId });
    console.log(`User ${userId} joined call room ${roomId}`);
  });

  socket.on('call:offer', ({ roomId, sdp, to }) => {
    // Forward offer to all in room except sender
    socket.to(roomId).emit('call:offer', { sdp, from: socket.userId });
    console.log(`Offer from ${socket.userId} to room ${roomId}`);
  });

  socket.on('call:answer', ({ roomId, sdp, to }) => {
    socket.to(roomId).emit('call:answer', { sdp, from: socket.userId });
    console.log(`Answer from ${socket.userId} to room ${roomId}`);
  });

  socket.on('call:ice-candidate', ({ roomId, candidate, to }) => {
    socket.to(roomId).emit('call:ice-candidate', { candidate, from: socket.userId });
    console.log(`ICE candidate from ${socket.userId} to room ${roomId}`);
  });

  socket.on('call:end', ({ roomId, to }) => {
    socket.to(roomId).emit('call:end', { from: socket.userId });
    if (callRooms[roomId]) delete callRooms[roomId];
    console.log(`Call ended in room ${roomId}`);
  });

  // --- CALL REQUEST/ACCEPT/REJECT SIGNALING ---
  socket.on('call:request', ({ from, to, callType, roomId }) => {
    const toSocketId = userSocketMap[to];
    if (toSocketId) {
      io.to(toSocketId).emit('call:request', { from, callType, roomId });
      console.log(`Call request from ${from} to ${to} [${callType}]`);
    }
  });
  socket.on('call:accepted', ({ to, from, roomId, callType }) => {
    const toSocketId = userSocketMap[to];
    if (toSocketId) {
      io.to(toSocketId).emit('call:accepted', { from, roomId, callType });
      console.log(`Call accepted by ${from} for ${to} [${callType}]`);
    }
  });
  socket.on('call:rejected', ({ to, from }) => {
    const toSocketId = userSocketMap[to];
    if (toSocketId) {
      io.to(toSocketId).emit('call:rejected', { from });
      console.log(`Call rejected by ${from} for ${to}`);
    }
  });

  // Clean up on disconnect
  socket.on('disconnect', () => {
    for (const roomId in callRooms) {
      callRooms[roomId] = callRooms[roomId].filter(u => u.socketId !== socket.id);
      if (callRooms[roomId].length === 0) delete callRooms[roomId];
    }
    if (socket.userId) delete userSocketMap[socket.userId];
    console.log(`Client disconnected: ${socket.id}`);
  });
});

// Start the server
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
