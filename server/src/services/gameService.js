import crypto from "crypto";

// In-memory room store
const rooms = {};
const playerRoom = {};

export const gameService = {
  joinGame: (socketId) => {
    // tìm phòng còn trống, nếu không có thì tạo mới
    const waitingRoomId = Object.keys(rooms).find((id) => !rooms[id].players.O);

    if (!waitingRoomId) {
      const roomId = crypto.randomUUID().slice(0, 6);
      rooms[roomId] = {
        id: roomId,
        board: Array(9).fill(null),
        players: { X: socketId, O: null },
        turn: "X",
        isGameOver: false,
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
    room.players.O = socketId;
    playerRoom[socketId] = waitingRoomId;

    return {
      roomId: waitingRoomId,
      board: room.board,
      turn: room.turn,
      symbol: "O",
      waiting: false,
    };
  },

  makeMove: (socketId, index) => {
    const roomId = playerRoom[socketId];
    const room = rooms[roomId];

    if (!room) {
      return { ok: false, error: "Bạn chưa tham gia phòng nào" };
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
      return {
        ok: true,
        state: "gameover",
        roomId,
        board: room.board,
        result,
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

  removePlayer: (socketId) => {
    const roomId = playerRoom[socketId];
    if (!roomId) return null;

    const room = rooms[roomId];
    delete playerRoom[socketId];

    if (!room) return null;

    if (room.players.X === socketId) room.players.X = null;
    if (room.players.O === socketId) room.players.O = null;

    // phòng trống thì xóa
    if (!room.players.X && !room.players.O) {
      delete rooms[roomId];
      return { roomId, deleted: true };
    }

    room.isGameOver = true;
    return { roomId, deleted: false };
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
