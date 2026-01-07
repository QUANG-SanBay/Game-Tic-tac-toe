import { useEffect, useState } from "react";
import socket from "./socket";
import { checkWinner } from "./utils/checkWinner";
import "./App.css";

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
      setStatus(data.waiting ? "Đang chờ đối thủ..." : "");
    };

    const handleUpdate = (data) => {
      setBoard(data.board);
      setTurn(data.turn);
      setStatus("");
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

  const isGameOver = status.toLowerCase().includes("thắng") || status.toLowerCase().includes("hòa") || status.toLowerCase().includes("draw");

  if (!mode) {
    return (
      <div className="page">
        <div className="glass-card menu-card">
          <p className="eyebrow">multiplayer / offline</p>
          <h1 className="title">Tic <span>Tac</span> Toe</h1>
          <p className="subtitle">Chọn chế độ chơi và bắt đầu ván mới</p>
          <div className="menu-actions">
            <button className="btn btn-primary" onClick={() => setMode("online")}>
              Chơi Online
            </button>
            <button className="btn btn-secondary" onClick={() => setMode("single")}>
              Chơi 1 người
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page">
      <div className="glass-card game-shell">
        <div className="game-header">
          <div>
            <p className="eyebrow">trận đấu</p>
            <h2 className="game-title">Tic Toe</h2>
          </div>
          {status && <div className="pill">{status}</div>}
        </div>

        <div className="status-bar">
          <div className="pill">
            Bạn là: <strong>{symbol || (mode === "single" ? "X" : "...")}</strong>
          </div>
          <div className="pill turn">
            Lượt chơi: <strong>{turn}</strong>
          </div>
        </div>

        <div className="board-shell">
          <div className="board">
            {board.map((cell, i) => (
              <button
                key={i}
                className={`cell ${cell === "X" ? "x" : cell === "O" ? "o" : ""}`}
                onClick={() => (mode === "single" ? handleSingleClick(i) : handleOnlineClick(i))}
              >
                {cell}
              </button>
            ))}
          </div>
        </div>

        <div className="footer-actions">
          {isGameOver && (
            <button className="btn btn-primary" onClick={resetGame}>
              Chơi lại
            </button>
          )}
          <button className="btn btn-ghost" onClick={() => setMode(null)}>
            Quay về menu
          </button>
        </div>
      </div>
    </div>
  );
}
