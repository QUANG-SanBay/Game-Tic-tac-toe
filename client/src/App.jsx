import { useEffect, useState } from "react";
import socket from "./socket";
import { checkWinner } from "./utils/checkWinner";

const emptyBoard = Array(9).fill(null);

export default function App() {
  const [mode, setMode] = useState(null); // single | online
  const [board, setBoard] = useState(emptyBoard);
  const [turn, setTurn] = useState("X");
  const [status, setStatus] = useState("");
  const [symbol, setSymbol] = useState(null);

  useEffect(() => {
    if (mode !== "online") return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleInit = (data) => {
      setBoard(data.board);
      setTurn(data.turn);
      setSymbol(data.symbol);
      setStatus(data.waiting ? "Đang chờ đối thủ..." : `Bạn là ${data.symbol}`);
    };

    const handleUpdate = (data) => {
      setBoard(data.board);
      setTurn(data.turn);
      setStatus(`Lượt chơi: ${data.turn}`);
    };

    const handleGameOver = (data) => {
      setBoard(data.board);
      const { status: resultStatus, winner } = data.result;
      const message = resultStatus === "draw" ? "Hòa!" : `${winner} thắng!`;
      setStatus(message);
    };

    const handleError = (msg) => {
      setStatus(msg);
    };

    socket.on("init", handleInit);
    socket.on("update", handleUpdate);
    socket.on("gameOver", handleGameOver);
    socket.on("errorMessage", handleError);

    socket.emit("joinGame");

    return () => {
      socket.off("init", handleInit);
      socket.off("update", handleUpdate);
      socket.off("gameOver", handleGameOver);
      socket.off("errorMessage", handleError);
    };
  }, [mode]);

  // Single-player helpers
  const machineMove = (boardCopy) => {
    const empty = boardCopy
      .map((v, i) => (v === null ? i : null))
      .filter((v) => v !== null);

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

  const handleOnlineClick = (index) => {
    if (board[index]) return;
    socket.emit("makeMove", index);
  };

  const resetGame = () => {
    setBoard(emptyBoard);
    setTurn("X");
    setStatus("");
    setSymbol(null);
  };

  if (!mode) {
    return (
      <div style={{ padding: 30 }}>
        <h2>🎮 Tic Tac Toe</h2>
        <button onClick={() => setMode("single")}>Chơi 1 người</button>
        <br />
        <br />
        <button onClick={() => setMode("online")}>Chơi Online</button>
      </div>
    );
  }

  return (
    <div style={{ padding: 30 }}>
      <h2>🎮 Tic Tac Toe</h2>
      {symbol && <p>Bạn là: {symbol}</p>}
      <p>{status || `Lượt chơi: ${turn}`}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 80px)" }}>
        {board.map((cell, i) => (
          <button
            key={i}
            onClick={() => (mode === "single" ? handleSingleClick(i) : handleOnlineClick(i))}
            style={{ width: 80, height: 80, fontSize: 32 }}
          >
            {cell}
          </button>
        ))}
      </div>

      <br />
      <button onClick={resetGame}>Chơi lại</button>

      <br />
      <br />
      <button onClick={() => setMode(null)}>Quay lại menu</button>
    </div>
  );
}
