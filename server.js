const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const mongoose = require('mongoose');
require('dotenv').config();

// MongoDB Connection
const MONGODB_URI = process.env.MONGODB_URI;
mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Map of sessionId -> { hostSocketId, viewerSocketIds: [], status: 'waiting'|'active' }
const sessions = new Map();

const Chat = require('./models/Chat');
const Message = require('./models/Message');

// API Routes
app.get('/api/chats', async (req, res) => {
  try {
    const chats = await Chat.find().sort({ updatedAt: -1 });
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/chats', async (req, res) => {
  try {
    const chat = new Chat(req.body);
    await chat.save();
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/chats/:chatId/messages', async (req, res) => {
  try {
    const messages = await Message.find({ chatId: req.params.chatId }).sort({ createdAt: 1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/messages', async (req, res) => {
  try {
    const message = new Message(req.body);
    await message.save();
    
    // Update chat timestamp
    await Chat.findByIdAndUpdate(req.body.chatId, { updatedAt: Date.now() });
    
    res.json(message);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    await Message.deleteMany({ chatId });
    await Chat.findByIdAndDelete(chatId);
    res.json({ success: true, message: 'Chat and messages deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.patch('/api/chats/:chatId', async (req, res) => {
  try {
    const { chatId } = req.params;
    const { title } = req.body;
    const chat = await Chat.findByIdAndUpdate(chatId, { title, updatedAt: Date.now() }, { new: true });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // Host: Create a new session
  socket.on('create-session', (sessionId) => {
    sessions.set(sessionId, {
      hostSocketId: socket.id,
      viewerSocketIds: [],
      status: 'waiting'
    });
    console.log(`Session created: ${sessionId} by host ${socket.id}`);
  });

  // Viewer: Request to join a session
  socket.on('join-session', (sessionId) => {
    const session = sessions.get(sessionId);
    if (!session) {
      socket.emit('error', 'Session not found');
      return;
    }

    // Request permission from host
    io.to(session.hostSocketId).emit('connection-request', {
      viewerId: socket.id
    });
    console.log(`Viewer ${socket.id} requested to join session ${sessionId}`);
  });

  // Host: Approve/Deny connection request
  socket.on('approve-request', ({ sessionId, viewerId, approved }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    if (approved) {
      session.viewerSocketIds.push(viewerId);
      io.to(viewerId).emit('request-approved', { hostId: socket.id });
      console.log(`Host ${socket.id} approved viewer ${viewerId}`);
    } else {
      io.to(viewerId).emit('request-denied');
      console.log(`Host ${socket.id} denied viewer ${viewerId}`);
    }
  });

  // Relay WebRTC signaling: Offer, Answer, ICE Candidates
  socket.on('signal', ({ sessionId, signal }) => {
    const session = sessions.get(sessionId);
    if (!session) return;

    // If host sends, relay to all viewers; if viewer sends, relay to host
    if (socket.id === session.hostSocketId) {
      session.viewerSocketIds.forEach(vid => {
        io.to(vid).emit('signal', { from: socket.id, signal });
      });
    } else {
      io.to(session.hostSocketId).emit('signal', { from: socket.id, signal });
    }
  });

  // Control commands relay
  socket.on('control-command', ({ sessionId, command }) => {
    const session = sessions.get(sessionId);
    if (!session || socket.id === session.hostSocketId) return;

    // Relay viewer command to host
    io.to(session.hostSocketId).emit('control-command', {
      from: socket.id,
      command
    });
  });

  socket.on('disconnect', () => {
    // Cleanup sessions if host disconnects
    for (const [sessionId, session] of sessions.entries()) {
      if (session.hostSocketId === socket.id) {
        session.viewerSocketIds.forEach(vid => {
          io.to(vid).emit('session-ended');
        });
        sessions.delete(sessionId);
        console.log(`Session ${sessionId} terminated (host disconnected)`);
      } else if (session.viewerSocketIds.includes(socket.id)) {
        session.viewerSocketIds = session.viewerSocketIds.filter(id => id !== socket.id);
        io.to(session.hostSocketId).emit('viewer-disconnected', socket.id);
        console.log(`Viewer ${socket.id} left session ${sessionId}`);
      }
    }
    console.log('User disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Signaling server running on port ${PORT}`);
});
