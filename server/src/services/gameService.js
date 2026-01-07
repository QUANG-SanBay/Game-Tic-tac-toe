import crypto from "crypto";

// In-memory room store
const rooms = {};
const playerRoom = {};

const hasTwoPlayers = (room) => room.players.X && room.players.O;
const getOpponentId = (room, socketId) => {
  if (!room) return null;
  return room.players.X === socketId ? room.players.O : room.players.X;
};

export const gameService = {
  joinGame: (socketId) => {
    const waitingRoomId = Object.keys(rooms).find(
      (id) => !rooms[id].players.O || !rooms[id].players.X
    );

    if (!waitingRoomId) {
      const roomId = crypto.randomUUID().slice(0, 6);
      rooms[roomId] = {
        id: roomId,
        board: Array(9).fill(null),
        players: { X: socketId, O: null },
        turn: "X",
        isGameOver: false,
        waiting: true,
      };
      playerRoom[socketId] = roomId;
      return {
        roomId,
        board: rooms[roomId].board,
        turn: rooms[roomId].turn,
        symbol: "X",
        waiting: true,
      };
    }

    const room = rooms[waitingRoomId];
    if (!room.players.X) {
      room.players.X = socketId;
      room.turn = "X";
    } else {
      room.players.O = socketId;
    }
    room.waiting = !hasTwoPlayers(room);
    playerRoom[socketId] = waitingRoomId;

    return {
      roomId: waitingRoomId,
      board: room.board,
      turn: room.turn,
      symbol: room.players.X === socketId ? "X" : "O",
      waiting: room.waiting,
    };
  },

  makeMove: (socketId, index) => {
    const roomId = playerRoom[socketId];
    const room = rooms[roomId];

    if (!room) {
      return { ok: false, error: "Bạn chưa tham gia phòng nào" };
    }

    if (!hasTwoPlayers(room)) {
      return { ok: false, error: "Đang chờ đối thủ" };
    }

    if (room.isGameOver) {
      return { ok: false, error: "Ván đấu đã kết thúc" };
    }

    if (typeof index !== "number" || index < 0 || index > 8) {
      return { ok: false, error: "Nước đi không hợp lệ" };
    }

    const player = room.players.X === socketId ? "X" : room.players.O === socketId ? "O" : null;
    if (!player) {
      return { ok: false, error: "Bạn không thuộc phòng này" };
    }

    if (room.turn !== player) {
      return { ok: false, error: "Chưa tới lượt bạn" };
    }

    if (room.board[index] !== null) {
      return { ok: false, error: "Ô này đã được đánh" };
    }

    room.board[index] = player;
    const result = checkWinner(room.board);

    if (result) {
      room.isGameOver = true;
      room.waiting = false;
      return {
        ok: true,
        state: "gameover",
        roomId,
        board: room.board,
        result,
        players: { ...room.players },
      };
    }

    room.turn = room.turn === "X" ? "O" : "X";
    return {
      ok: true,
      state: "playing",
      roomId,
      board: room.board,
      turn: room.turn,
    };
  },

  forfeit: (socketId) => {
    const roomId = playerRoom[socketId];
    const room = rooms[roomId];
    if (!room) return { ok: false, error: "Không tìm thấy phòng" };
    const opponentId = getOpponentId(room, socketId);
    if (!opponentId) return { ok: false, error: "Không có đối thủ" };

    const loserSymbol = room.players.X === socketId ? "X" : "O";
    const winnerSymbol = loserSymbol === "X" ? "O" : "X";
    room.isGameOver = true;
    room.waiting = false;

    return {
      ok: true,
      roomId,
      board: room.board,
      result: { status: "win", winner: winnerSymbol, loser: loserSymbol },
      players: { ...room.players },
    };
  },

  requestRematch: (socketId) => {
    const roomId = playerRoom[socketId];
    const room = rooms[roomId];
    if (!room) return { ok: false, error: "Không tìm thấy phòng" };
    const opponentId = getOpponentId(room, socketId);
    if (!opponentId) return { ok: false, error: "Không có đối thủ" };
    return { ok: true, opponentId, roomId };
  },

  respondRematch: (socketId, accepted) => {
    const roomId = playerRoom[socketId];
    const room = rooms[roomId];
    if (!room) return { ok: false, error: "Không tìm thấy phòng" };
    const opponentId = getOpponentId(room, socketId);
    if (!opponentId) return { ok: false, error: "Không có đối thủ" };

    if (!accepted) {
      return { ok: true, declined: true, opponentId };
    }

    room.board = Array(9).fill(null);
    room.turn = "X";
    room.isGameOver = false;
    room.waiting = false;

    return {
      ok: true,
      declined: false,
      roomId,
      opponentId,
      board: room.board,
      turn: room.turn,
    };
  },

  leaveRoom: (socketId) => {
    const roomId = playerRoom[socketId];
    if (!roomId) return null;

    const room = rooms[roomId];
    delete playerRoom[socketId];
    if (!room) return null;

    if (room.players.X === socketId) room.players.X = null;
    if (room.players.O === socketId) room.players.O = null;

    const opponentId = getOpponentId(room, socketId);

    if (!room.players.X && !room.players.O) {
      delete rooms[roomId];
      return { roomId, deleted: true };
    }

    room.board = Array(9).fill(null);
    room.turn = "X";
    room.isGameOver = false;
    room.waiting = true;

    return { roomId, deleted: false, opponentId };
  },
};

export function checkWinner(board) {
  const winPatterns = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6],
  ];

  for (const [a, b, c] of winPatterns) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { status: "win", winner: board[a] };
    }
  }

  if (board.every((cell) => cell !== null)) {
    return { status: "draw" };
  }

  return null;
}
