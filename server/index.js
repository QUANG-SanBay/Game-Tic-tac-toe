const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");

// ========================
// WebSocket Server
// ========================
const wss = new WebSocket.Server({ port: 3001 });

// roomId -> [player1, player2]
const rooms = {};

// playerId -> roomId
const playerRoom = {};

console.log("[INFO] WebSocket Server running at ws://localhost:8080");

// ========================
// Client connect
// ========================
wss.on("connection", (ws) => {
  const playerId = uuidv4().slice(0, 8);
  console.log(`[CONNECT] Player ${playerId} connected`);

  ws.playerId = playerId;

  ws.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "join") {
      joinRoom(ws);
    }

    if (data.type === "sync") {
      syncState(ws, data.state);
    }
  });

  // ========================
  // Client disconnect
  // ========================
  ws.on("close", () => {
    handleDisconnect(ws);
  });
});

// ========================
// Join room
// ========================
function joinRoom(ws) {
  for (const roomId in rooms) {
    if (rooms[roomId].length < 2) {
      rooms[roomId].push(ws);
      playerRoom[ws.playerId] = roomId;

      console.log(`[ROOM] Player ${ws.playerId} joined Room ${roomId}`);

      ws.send(JSON.stringify({ type: "joined", roomId }));

      if (rooms[roomId].length === 2) {
        console.log(`[GAME] Room ${roomId} ready (2 players)`);
        rooms[roomId].forEach((c) =>
          c.send(JSON.stringify({ type: "start" }))
        );
      }
      return;
    }
  }

  // create new room
  const roomId = uuidv4().slice(0, 4);
  rooms[roomId] = [ws];
  playerRoom[ws.playerId] = roomId;

  console.log(`[ROOM] Room ${roomId} created`);

  ws.send(
    JSON.stringify({
      type: "waiting",
      message: "Đang chờ người chơi khác...",
    })
  );
}

// ========================
// Sync state giữa 2 client
// ========================
function syncState(ws, state) {
  const roomId = playerRoom[ws.playerId];
  if (!roomId) return;

  console.log(`[SYNC] from Player ${ws.playerId}`);

  rooms[roomId].forEach((client) => {
    if (client !== ws) {
      client.send(
        JSON.stringify({
          type: "sync",
          from: ws.playerId,
          state,
        })
      );
    }
  });
}

// ========================
// Handle disconnect & error
// ========================
function handleDisconnect(ws) {
  const playerId = ws.playerId;
  console.log(`[DISCONNECT] Player ${playerId} disconnected`);

  const roomId = playerRoom[playerId];
  if (!roomId) return;

  rooms[roomId] = rooms[roomId].filter((c) => c !== ws);

  // thông báo cho player còn lại
  rooms[roomId].forEach((c) => {
    c.send(
      JSON.stringify({
        type: "opponent_left",
        message: "Đối thủ đã thoát",
      })
    );
  });

  // nếu phòng trống → xóa
  if (rooms[roomId].length === 0) {
    delete rooms[roomId];
    console.log(`[ROOM] Room ${roomId} deleted`);
  }

  delete playerRoom[playerId];
}
