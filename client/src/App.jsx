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
  const [roomId, setRoomId] = useState(null);
  const [waiting, setWaiting] = useState(false);
  const [showRematchModal, setShowRematchModal] = useState(false);
  const [showResultModal, setShowResultModal] = useState(false);
  const [resultType, setResultType] = useState(null); // win | lose | draw
  const [resultMessage, setResultMessage] = useState("");
  const [gameEnded, setGameEnded] = useState(false);

  const setResultState = (type, message) => {
    setResultType(type);
    setResultMessage(message);
    setStatus(message);
    setGameEnded(true);
    setShowResultModal(true);
  };

  useEffect(() => {
    if (mode !== "online") return;

    if (!socket.connected) {
      socket.connect();
    }

    const handleInit = (data) => {
      setBoard(data.board);
      setTurn(data.turn);
      setSymbol(data.symbol);
      setRoomId(data.roomId);
      setWaiting(data.waiting);
      setStatus(data.waiting ? "Đang chờ đối thủ..." : "");
    };

    const handleUpdate = (data) => {
      setBoard(data.board);
      setTurn(data.turn);
      setWaiting(false);
      setStatus("");
    };

    const handleGameOver = (data) => {
      setBoard(data.board);
      const { status: resultStatus } = data.result;

      if (resultStatus === "draw") {
        setResultState("draw", "Ván đấu kết thúc: Hòa");
        return;
      }

      if (resultStatus === "win") {
        setResultState("win", "Bạn đã thắng!");
        return;
      }

      if (resultStatus === "lose") {
        setResultState("lose", "Bạn đã thua!");
        return;
      }

      setResultState("draw", "Ván đấu kết thúc");
    };

    const handleError = (msg) => {
      setStatus(msg);
    };

    socket.on("init", handleInit);
    socket.on("update", handleUpdate);
    socket.on("gameOver", handleGameOver);
    socket.on("errorMessage", handleError);
    socket.on("opponentLeft", () => {
      setWaiting(true);
      setStatus("Đối thủ đã rời phòng, đang chờ người mới...");
      setBoard(Array(9).fill(null));
      setTurn("X");
    });
    socket.on("roomClosed", () => {
      resetToMenu();
    });
    socket.on("rematchOffer", () => {
      setShowRematchModal(true);
    });
    socket.on("rematchDeclined", () => {
      setStatus("Đối thủ từ chối chơi lại");
    });
    socket.on("rematchStart", (data) => {
      setBoard(data.board);
      setTurn(data.turn);
      setStatus("");
      setWaiting(false);
      setShowRematchModal(false);
      setGameEnded(false);
    });

    socket.emit("joinGame");

    return () => {
      socket.off("init", handleInit);
      socket.off("update", handleUpdate);
      socket.off("gameOver", handleGameOver);
      socket.off("errorMessage", handleError);
      socket.off("opponentLeft");
      socket.off("roomClosed");
      socket.off("rematchOffer");
      socket.off("rematchDeclined");
      socket.off("rematchStart");
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
      if (result === "draw") {
        setResultState("draw", "Ván đấu kết thúc: Hòa");
      } else {
        setResultState("win", "Bạn đã thắng!");
      }
      return;
    }

    machineMove(newBoard);
    result = checkWinner(newBoard);

    if (result) {
      if (result === "draw") {
        setResultState("draw", "Ván đấu kết thúc: Hòa");
      } else {
        setResultState("lose", "Bạn đã thua!");
      }
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
    setRoomId(null);
    setWaiting(false);
    setShowRematchModal(false);
    setShowResultModal(false);
    setResultType(null);
    setResultMessage("");
    setGameEnded(false);
  };

  const resetToMenu = () => {
    resetGame();
    setMode(null);
  };

  const isGameOver = gameEnded;

  const handleLeaveRoom = () => {
    if (mode === "online" && roomId) {
      socket.emit("leaveRoom");
    }
    resetToMenu();
  };

  const handleForfeit = () => {
    socket.emit("forfeit");
  };

  const requestRematch = () => {
    socket.emit("requestRematch");
  };

  const respondRematch = (accept) => {
    socket.emit("respondRematch", accept);
    setShowRematchModal(false);
  };

  const closeResultModal = () => {
    setShowResultModal(false);
  };

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
            <h2 className="game-title">Tic Tac Toe</h2>
          </div>
          <div className="pill">Phòng: <strong>{roomId || "..."}</strong></div>
        </div>

        <div className="status-bar">
          <div className="pill">
            Bạn là: <strong>{symbol || (mode === "single" ? "X" : "...")}</strong>
          </div>
          {status && <div className="pill">{status}</div>}
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
          {waiting && (
            <button className="btn btn-ghost" onClick={handleLeaveRoom}>
              Quay về menu
            </button>
          )}
          {!waiting && !isGameOver && (
            <button className="btn btn-secondary" onClick={handleForfeit}>
              Đầu hàng
            </button>
          )}
          {isGameOver && !waiting && (
            <button className="btn btn-primary" onClick={requestRematch}>
              Chơi lại
            </button>
          )}
          <button className="btn btn-ghost" onClick={handleLeaveRoom}>
            Thoát menu
          </button>
        </div>
      </div>

      {showResultModal && (
        <div className="modal-backdrop">
          <div className={`modal result-modal ${resultType}`}>
            <h3>{resultType === "win" ? "Bạn đã thắng" : resultType === "lose" ? "Bạn đã thua" : "Hòa"}</h3>
            <p>{resultMessage || "Ván đấu kết thúc"}</p>
            <div className="modal-actions">
              <button className="btn btn-primary" onClick={closeResultModal}>OK</button>
            </div>
          </div>
        </div>
      )}

      {showRematchModal && (
        <div className="modal-backdrop">
          <div className="modal">
            <h3>Đối thủ mời chơi lại</h3>
            <p>Bạn có muốn tiếp tục ván mới trong phòng hiện tại?</p>
            <div className="modal-actions">
              <button className="btn btn-secondary" onClick={() => respondRematch(false)}>
                Từ chối
              </button>
              <button className="btn btn-primary" onClick={() => respondRematch(true)}>
                Chấp nhận
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
