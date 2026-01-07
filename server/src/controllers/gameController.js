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
      if (move.result.status === "draw") {
        io.to(move.roomId).emit("gameOver", {
          board: move.board,
          result: { status: "draw", winner: null },
        });
        return;
      }

      const winnerSymbol = move.result.winner;
      const loserSymbol = winnerSymbol === "X" ? "O" : "X";
      const winnerId = move.players?.[winnerSymbol];
      const loserId = move.players?.[loserSymbol];

      if (winnerId) {
        io.to(winnerId).emit("gameOver", {
          board: move.board,
          result: { status: "win", winner: winnerSymbol },
        });
      }

      if (loserId) {
        io.to(loserId).emit("gameOver", {
          board: move.board,
          result: { status: "lose", winner: winnerSymbol },
        });
      }
      return;
    }

    io.to(move.roomId).emit("update", {
      board: move.board,
      turn: move.turn,
    });
  });

  socket.on("forfeit", () => {
    const result = gameService.forfeit(socket.id);
    if (!result.ok) {
      socket.emit("errorMessage", result.error);
      return;
    }

    if (result.result.status === "draw") {
      io.to(result.roomId).emit("gameOver", {
        board: result.board,
        result: { status: "draw", winner: null },
      });
      return;
    }

    const winnerSymbol = result.result.winner;
    const loserSymbol = result.result.loser || (winnerSymbol === "X" ? "O" : "X");
    const winnerId = result.players?.[winnerSymbol];
    const loserId = result.players?.[loserSymbol];

    if (winnerId) {
      io.to(winnerId).emit("gameOver", {
        board: result.board,
        result: { status: "win", winner: winnerSymbol },
      });
    }

    if (loserId) {
      io.to(loserId).emit("gameOver", {
        board: result.board,
        result: { status: "lose", winner: winnerSymbol },
      });
    }
  });

  socket.on("requestRematch", () => {
    const offer = gameService.requestRematch(socket.id);
    if (!offer.ok) {
      socket.emit("errorMessage", offer.error);
      return;
    }
    io.to(offer.opponentId).emit("rematchOffer", { from: socket.id, roomId: offer.roomId });
  });

  socket.on("respondRematch", (accepted) => {
    const response = gameService.respondRematch(socket.id, accepted);
    if (!response.ok) {
      socket.emit("errorMessage", response.error);
      return;
    }

    if (response.declined) {
      io.to(response.opponentId).emit("rematchDeclined");
      return;
    }

    io.to(response.roomId).emit("rematchStart", {
      board: response.board,
      turn: response.turn,
    });
  });

  socket.on("leaveRoom", () => {
    const left = gameService.leaveRoom(socket.id);
    if (!left) return;

    if (left.deleted) {
      socket.emit("roomClosed");
      return;
    }

    if (left.opponentId) {
      io.to(left.opponentId).emit("opponentLeft", { roomId: left.roomId });
    }
    socket.emit("roomClosed");
  });

  socket.on("disconnect", () => {
    const left = gameService.leaveRoom(socket.id);
    if (left && left.opponentId) {
      io.to(left.opponentId).emit("opponentLeft", { roomId: left.roomId });
    }
  });
};