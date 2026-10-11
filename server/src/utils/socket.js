const { Server } = require("socket.io");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

let io = null;

// Rooms: user:<id> (personal), role:<role>, faculty:<dept> (faculty of a department)
function initSocket(httpServer) {
  io = new Server(httpServer, { cors: { origin: true, credentials: true } });

  io.use(async (socket, next) => {
    try {
      const { id } = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
      const user = await User.findById(id);
      if (!user || !user.isActive) return next(new Error("unauthorized"));
      socket.user = user;
      next();
    } catch {
      next(new Error("unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    const u = socket.user;
    socket.join(`user:${u._id}`);
    socket.join(`role:${u.role}`);
    if (u.role === "faculty") socket.join(`faculty:${u.department}`);
  });
  return io;
}

// Safe helpers (do nothing when sockets aren't running, e.g. during seeding)
const emit = {
  toUser: (id, event, data) => io && io.to(`user:${id}`).emit(event, data),
  toRole: (role, event, data) => io && io.to(`role:${role}`).emit(event, data),
  toFacultyDept: (dept, event, data) => io && io.to(`faculty:${dept}`).emit(event, data),
  toAll: (event, data) => io && io.emit(event, data),
};

module.exports = { initSocket, emit };
