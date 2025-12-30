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
