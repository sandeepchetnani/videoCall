const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { v4: uuidv4 } = require("uuid");

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {}; // { participants, screenSharer: socketId | null }

app.get("/health", (req, res) => {
  res.json({ status: "ok", rooms: Object.keys(rooms).length });
});

app.post("/create-room", (req, res) => {
  const roomId = uuidv4().slice(0, 8).toUpperCase();
  rooms[roomId] = { participants: [] };
  res.json({ roomId });
});

app.get("/room/:roomId", (req, res) => {
  const { roomId } = req.params;
  if (rooms[roomId]) {
    res.json({ exists: true, participants: rooms[roomId].participants.length });
  } else {
    res.json({ exists: false });
  }
});

io.on("connection", (socket) => {
  console.log(`[+] Socket connected: ${socket.id}`);

  socket.on("join-room", ({ roomId, userName }) => {
    if (!rooms[roomId]) {
      rooms[roomId] = { participants: [], screenSharer: null };
    }

    const room = rooms[roomId];
    const existingParticipants = room.participants.map((p) => ({
      socketId: p.socketId,
      userName: p.userName,
    }));

    socket.emit("room-joined", {
      roomId,
      socketId: socket.id,
      participants: existingParticipants,
    });

    socket.to(roomId).emit("user-joined", {
      socketId: socket.id,
      userName,
    });

    room.participants.push({ socketId: socket.id, userName });
    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.userName = userName;

    console.log(`[Room ${roomId}] ${userName} joined. Total: ${room.participants.length}`);
  });

  socket.on("offer", ({ to, offer }) => {
    socket.to(to).emit("offer", { from: socket.id, offer });
  });

  socket.on("answer", ({ to, answer }) => {
    socket.to(to).emit("answer", { from: socket.id, answer });
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    socket.to(to).emit("ice-candidate", { from: socket.id, candidate });
  });

  socket.on("toggle-audio", ({ roomId, enabled }) => {
    socket.to(roomId).emit("user-toggle-audio", { socketId: socket.id, enabled });
  });

  socket.on("toggle-video", ({ roomId, enabled }) => {
    socket.to(roomId).emit("user-toggle-video", { socketId: socket.id, enabled });
  });

  socket.on("screen-share-start", ({ roomId }) => {
    if (!rooms[roomId]) return;
    const current = rooms[roomId].screenSharer;
    if (current && current !== socket.id) {
      io.to(current).emit("force-stop-screen-share");
    }
    rooms[roomId].screenSharer = socket.id;
    socket.to(roomId).emit("user-screen-share-start", { socketId: socket.id });
    console.log(`[Room ${roomId}] ${socket.data.userName} started screen share`);
  });

  socket.on("screen-share-stop", ({ roomId }) => {
    if (!rooms[roomId]) return;
    if (rooms[roomId].screenSharer === socket.id) {
      rooms[roomId].screenSharer = null;
    }
    socket.to(roomId).emit("user-screen-share-stop", { socketId: socket.id });
    console.log(`[Room ${roomId}] ${socket.data.userName} stopped screen share`);
  });

  socket.on("disconnect", () => {
    const { roomId, userName } = socket.data;
    if (roomId && rooms[roomId]) {
      rooms[roomId].participants = rooms[roomId].participants.filter(
        (p) => p.socketId !== socket.id
      );
      if (rooms[roomId].screenSharer === socket.id) {
        rooms[roomId].screenSharer = null;
        socket.to(roomId).emit("user-screen-share-stop", { socketId: socket.id });
      }
      socket.to(roomId).emit("user-left", { socketId: socket.id, userName });
      console.log(`[-] ${userName} left room ${roomId}. Remaining: ${rooms[roomId].participants.length}`);
      if (rooms[roomId].participants.length === 0) {
        delete rooms[roomId];
        console.log(`[Room ${roomId}] deleted (empty)`);
      }
    }
  });
});

const PORT = process.env.PORT || 5001;
server.listen(PORT, () => {
  console.log(`Signaling server running on http://localhost:${PORT}`);
});
