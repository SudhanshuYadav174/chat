const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const socket = io("https://chat-2utk.onrender.com");
const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.use(express.static('public'));

const users = {};

io.on('connection', socket => {
  socket.on('new-user', name => {
    users[socket.id] = name;
    socket.broadcast.emit('user-connected', name);
  });

  socket.on('send-chat-message', message => {
    socket.broadcast.emit('chat-message', {
      message: message,
      name: users[socket.id]
    });
  });

  socket.on('typing', () => {
    socket.broadcast.emit('typing', users[socket.id]);
  });

  socket.on('disconnect', () => {
    if (users[socket.id]) {
      socket.broadcast.emit('user-disconnected', users[socket.id]);
      delete users[socket.id];
    }
  });
});

server.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
