import { gameService } from "../services/gameService.js";

export const gameController = (io, socket) => {
  socket.on("joinGame", () => {
    const joined = gameService.joinGame(socket.id);

    socket.join(joined.roomId);
    socket.emit("init", {
      roomId: joined.roomId,
      board: joined.board,
      turn: joined.turn,
      symbol: joined.symbol,
      waiting: joined.waiting,
    });

    if (!joined.waiting) {
      io.to(joined.roomId).emit("update", {
        board: joined.board,
        turn: joined.turn,
      });
    }
  });

  socket.on("makeMove", (index) => {
    const move = gameService.makeMove(socket.id, index);

    if (!move.ok) {
      socket.emit("errorMessage", move.error);
      return;
    }

    if (move.state === "gameover") {
      io.to(move.roomId).emit("gameOver", {
        board: move.board,
        result: move.result,
      });
      return;
    }

    io.to(move.roomId).emit("update", {
      board: move.board,
      turn: move.turn,
    });
  });

  socket.on("disconnect", () => {
    const left = gameService.removePlayer(socket.id);
    if (left) {
      io.to(left.roomId).emit("errorMessage", "Đối thủ đã rời phòng");
    }
  });
};