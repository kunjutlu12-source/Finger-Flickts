const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
cors: { origin: "*" }
});

const rooms = {};

io.on('connection', (socket) => {
console.log('Bir oyuncu bağlandı:', socket.id);

socket.on('create_room', (data) => {
const roomCode = Math.floor(100000 + Math.random() * 900000).toString();
rooms[roomCode] = {
code: roomCode,
creatorId: socket.id,
players: [{
id: socket.id,
name: data.name,
ball: data.ball,
x: 325,
y: 800,
vx: 0,
vy: 0,
health: 100,
maxHealth: 100,
coins: 0,
isCreator: true
}],
coins: [
{x: 200, y: 400}, {x: 450, y: 400}, {x: 325, y: 300}, {x: 150, y: 600}, {x: 500, y: 600}
 ],
gameStarted: false
};
socket.join(roomCode);
socket.emit('room_created', rooms[roomCode]);
});

socket.on('join_room', (data) => {
let room = rooms[data.code];
if (!room || room.gameStarted) {
socket.emit('error_msg', "Oda bulunamadı veya maç zaten başlamış!");
return;
}
socket.join(data.code);
room.players.push({
id: socket.id,
name: data.name,
ball: data.ball,
x: 325 + (Math.random() * 100 - 50),
y: 800,
vx: 0,
vy: 0,
health: 100,
maxHealth: 100,
coins: 0,
isCreator: false
});
io.to(data.code).emit('update_room', room);
});

socket.on('start_match', (code) => {
if (rooms[code]) {
rooms[code].gameStarted = true;
io.to(code).emit('match_started', rooms[code]);
}
});

socket.on('player_move', (data) => {
let room = rooms[data.code];
if (room) {
let p = room.players.find(pl => pl.id === socket.id);
if (p) {
p.x = data.x;
p.y = data.y;
p.vx = data.vx;
p.vy = data.vy;
p.health = data.health;
p.coins = data.coins;
}
io.to(data.code).emit('room_update_sync', room);
}
});

socket.on('disconnect', () => {
for (let code in rooms) {
let room = rooms[code];
room.players = room.players.filter(p => p.id !== socket.id);
if (room.players.length === 0 || room.creatorId === socket.id) {
io.to(code).emit('room_closed');
delete rooms[code]; // Maç bitince / oda boşalınca anında hafızadan siliniyor, yer kaplamıyor!
} else {
io.to(code).emit('update_room', room);
}
}
console.log('Oyuncu ayrıldı:', socket.id);
});
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
console.log(Socket.io sunucusu ${PORT} portunda çalışıyor!);
});