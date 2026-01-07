import { useEffect, useState } from "react";
import socket from "./socket";

const emptyBoard = Array(9).fill(null);

// kiểm tra thắng / hòa
function checkWinner(board) {
  const lines = [
    [0,1,2],[3,4,5],[6,7,8],
    [0,3,6],[1,4,7],[2,5,8],
    [0,4,8],[2,4,6],
  ];

  for (let [a,b,c] of lines) {
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return board[a];
    }
  }
  return board.includes(null) ? null : "draw";
}

export default function App() {
  const [mode, setMode] = useState(null); // single | online
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState("X");
  const [status, setStatus] = useState("");

  /* ===== ONLINE MODE ===== */
  useEffect(() => {
    if (mode !== "online") return;

    socket.emit("joinGame");

    socket.on("init", (data) => {
      setBoard(data.board);
      setTurn(data.turn);
      setStatus(`Bạn là ${data.symbol}`);
    });

    socket.on("update", (data) => {
      setBoard(data.board);
      setTurn(data.turn);
    });

    socket.on("gameOver", (data) => {
      setBoard(data.board);
      setStatus(data.result);
    });

    socket.on("errorMessage", (msg) => alert(msg));

    return () => socket.disconnect();
  }, [mode]);

  /* ===== SINGLE PLAYER ===== */
  const machineMove = (boardCopy) => {
    const empty = boardCopy
      .map((v, i) => (v === null ? i : null))
      .filter(v => v !== null);

    if (empty.length === 0) return;

    const index = empty[Math.floor(Math.random() * empty.length)];
    boardCopy[index] = "O";
  };

  const handleSingleClick = (index) => {
    if (board[index] || turn !== "X") return;

    const newBoard = [...board];
    newBoard[index] = "X";

    let result = checkWinner(newBoard);
    if (result) {
      setBoard(newBoard);
      setStatus(result === "draw" ? "Hòa!" : "Bạn thắng!");
      return;
    }

    machineMove(newBoard);
    result = checkWinner(newBoard);

    if (result) {
      setStatus(result === "draw" ? "Hòa!" : "Máy thắng!");
    }

    setBoard(newBoard);
  };

  /* ===== ONLINE CLICK ===== */
  const handleOnlineClick = (index) => {
    if (board[index]) return;
    socket.emit("makeMove", index);
  };

  /* ===== MENU ===== */
  if (!mode) {
    return (
      <div style={{ padding: 30 }}>
        <h2>🎮 Tic Tac Toe</h2>
        <button onClick={() => setMode("single")}>
          Chơi 1 người
        </button>
        <br /><br />
        <button onClick={() => setMode("online")}>
          Chơi Online
        </button>
      </div>
    );
  }

  /* ===== GAME UI ===== */
  return (
    <div style={{ padding: 30 }}>
      <h2>🎮 Tic Tac Toe</h2>
      <p>{status}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 80px)" }}>
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() =>
              mode === "single"
                ? handleSingleClick(i)
                : handleOnlineClick(i)
            }
            style={{
              width: 80,
              height: 80,
              fontSize: 32,
            }}
          >
            {cell}
          </button>
        ))}
      </div>

      <br />
      <button
        onClick={() => {
          setBoard(emptyBoard);
          setTurn("X");
          setStatus("");
        }}
      >
        Chơi lại
      </button>
    </div>
  );
}
