import { Server } from "socket.io";
import { checkWinner } from "./gameLogic.js";

const rooms = {};

export default function setupSocket(server) {
  const io = new Server(server, {
    cors: { origin: "*" }
  });

  io.on("connection", (socket) => {
    console.log("🔌 Client connected:", socket.id);

    // Tạo phòng
    socket.on("createRoom", (roomId) => {
      rooms[roomId] = {
        board: ["", "", "", "", "", "", "", "", ""],
        players: { X: socket.id },
        turn: "X",
        isGameOver: false
      };

      socket.join(roomId);
      socket.emit("roomCreated", roomId);
      console.log(`🏠 Room ${roomId} created`);
    });

    // Tham gia phòng
    socket.on("joinRoom", (roomId) => {
      const room = rooms[roomId];

      if (!room) {
        socket.emit("error", "Room không tồn tại");
        return;
      }

      if (room.players.O) {
        socket.emit("error", "Room đã đủ người");
        return;
      }

      room.players.O = socket.id;
      socket.join(roomId);

      io.to(roomId).emit("startGame", room);
      console.log(`👥 Player joined room ${roomId}`);
    });

    // Đánh cờ
    socket.on("makeMove", ({ roomId, index }) => {
      const room = rooms[roomId];
      if (!room || room.isGameOver) return;

      const player =
        room.players.X === socket.id ? "X" :
        room.players.O === socket.id ? "O" : null;

      if (!player) return;
      if (player !== room.turn) return;
      if (room.board[index] !== "") return;

      room.board[index] = player;

      const result = checkWinner(room.board);

      if (result) {
        room.isGameOver = true;
        io.to(roomId).emit("gameOver", {
          result,
          board: room.board
        });
        console.log(`🎉 Game over in room ${roomId}`, result);
      } else {
        room.turn = room.turn === "X" ? "O" : "X";
        io.to(roomId).emit("updateGame", room);
      }
    });

    // Ngắt kết nối
    socket.on("disconnect", () => {
      console.log("❌ Client disconnected:", socket.id);
    });
  });
}
