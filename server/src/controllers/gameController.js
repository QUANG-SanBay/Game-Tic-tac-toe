import { gameService } from "../services/gameService.js";

export const gameController = (io, socket) => {
  // Xử lý tạo phòng
  socket.on("createRoom", (roomId) => {
    const room = gameService.createRoom(roomId, socket.id);
    socket.join(roomId);
    socket.emit("roomCreated", roomId);
  });

  // Xử lý tham gia phòng
  socket.on("joinRoom", (roomId) => {
    try {
      const room = gameService.joinRoom(roomId, socket.id);
      socket.join(roomId);
      io.to(roomId).emit("startGame", room);
    } catch (error) {
      socket.emit("error", error.message);
    }
  });

  // Xử lý đánh cờ
  socket.on("makeMove", ({ roomId, index }) => {
    const moveResult = gameService.makeMove(roomId, index, socket.id);
    if (!moveResult) return;

    if (moveResult.type === "GAME_OVER") {
      io.to(roomId).emit("gameOver", { result: moveResult.result, board: moveResult.board });
    } else {
      io.to(roomId).emit("updateGame", moveResult.room);
    }
  });
};