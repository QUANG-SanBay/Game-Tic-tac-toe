// Quản lý dữ liệu tạm thời (In-memory DB)
const rooms = {};

export const gameService = {
  createRoom: (roomId, socketId) => {
    rooms[roomId] = {
      board: Array(9).fill(""),
      players: { X: socketId },
      turn: "X",
      isGameOver: false
    };
    return rooms[roomId];
  },

  joinRoom: (roomId, socketId) => {
    const room = rooms[roomId];
    if (!room) throw new Error("Room không tồn tại");
    if (room.players.O) throw new Error("Room đã đủ người");
    
    room.players.O = socketId;
    return room;
  },

  makeMove: (roomId, index, socketId) => {
    const room = rooms[roomId];
    if (!room || room.isGameOver) return null;

    const player = room.players.X === socketId ? "X" : room.players.O === socketId ? "O" : null;
    if (!player || player !== room.turn || room.board[index] !== "") return null;

    room.board[index] = player;
    const result = checkWinner(room.board);

    if (result) {
      room.isGameOver = true;
      return { type: "GAME_OVER", result, board: room.board };
    } else {
      room.turn = room.turn === "X" ? "O" : "X";
      return { type: "UPDATE_GAME", room };
    }
  }
};


export function checkWinner(board) {
  const winPatterns = [
    [0,1,2], [3,4,5], [6,7,8],
    [0,3,6], [1,4,7], [2,5,8],
    [0,4,8], [2,4,6]
  ];

  for (const [a, b, c] of winPatterns) {
    if (
      board[a] !== "" &&
      board[a] === board[b] &&
      board[a] === board[c]
    ) {
      return {
        status: "win",
        winner: board[a]
      };
    }
  }

  // Hòa
  if (board.every(cell => cell !== "")) {
    return {
      status: "draw"
    };
  }

  // Chưa kết thúc
  return null;
}
